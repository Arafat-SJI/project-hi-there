import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export type MemoryType =
  | "summary"
  | "context"
  | "pattern"
  | "fact"
  | "decision"
  | "preference";

export interface AgentMemory {
  id: string;
  agent_id: string;
  user_id: string;
  memory_type: MemoryType;
  content: string;
  source_conversation_id: string | null;
  source_message_id: string | null;
  relevance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  is_active: boolean;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MatchedMemory {
  id: string;
  content: string;
  memory_type: MemoryType;
  similarity: number;
  relevance_score: number;
  source_conversation_id: string | null;
  created_at: string;
}

export interface CreateMemoryData {
  agent_id: string;
  memory_type: MemoryType;
  content: string;
  source_conversation_id?: string;
  source_message_id?: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

// Query keys for memory
const memoryKeys = {
  all: ["agent", "memory"] as const,
  agent: (agentId: string) => [...memoryKeys.all, agentId] as const,
  byType: (agentId: string, type: MemoryType) =>
    [...memoryKeys.agent(agentId), type] as const,
  matched: (agentId: string, query: string) =>
    [...memoryKeys.agent(agentId), "matched", query] as const,
};

// Fetch all memories for an agent (for current user)
export function useAgentMemories(agentId: string | null, memoryType?: MemoryType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: memoryType
      ? memoryKeys.byType(agentId || "", memoryType)
      : memoryKeys.agent(agentId || ""),
    queryFn: async () => {
      let query = supabase
        .from("agent_memory")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("relevance_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (memoryType) {
        query = query.eq("memory_type", memoryType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentMemory[];
    },
    enabled: !!agentId && !!user,
  });
}

// Search memories by semantic similarity
export function useMatchMemories(
  agentId: string | null,
  query: string,
  options?: {
    threshold?: number;
    limit?: number;
    enabled?: boolean;
  }
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: memoryKeys.matched(agentId || "", query),
    queryFn: async () => {
      // First generate embedding for query
      const { data: embeddingData, error: embeddingError } =
        await supabase.functions.invoke("generate-embeddings", {
          body: { text: query, user_id: user?.id },
        });

      if (embeddingError || !embeddingData?.embedding) {
        throw new Error("Failed to generate embedding");
      }

      // Then search memories
      const { data, error } = await supabase.rpc("match_agent_memories", {
        query_embedding: embeddingData.embedding,
        p_agent_id: agentId,
        p_user_id: user?.id,
        match_count: options?.limit || 5,
        match_threshold: options?.threshold || 0.7,
      });

      if (error) throw error;

      // Update access stats for matched memories
      if (data && data.length > 0) {
        const memoryIds = data.map((m: MatchedMemory) => m.id);
        await supabase.rpc("update_memory_access", { p_memory_ids: memoryIds });
      }

      return (data || []) as MatchedMemory[];
    },
    enabled: !!agentId && !!user && !!query && (options?.enabled !== false),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Get recent memories without semantic search
export function useRecentMemories(
  agentId: string | null,
  memoryType?: MemoryType,
  limit: number = 10
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...memoryKeys.agent(agentId || ""), "recent", memoryType, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_recent_memories", {
        p_agent_id: agentId,
        p_user_id: user?.id,
        p_memory_type: memoryType || null,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as Pick<
        AgentMemory,
        "id" | "content" | "memory_type" | "relevance_score" | "created_at"
      >[];
    },
    enabled: !!agentId && !!user,
  });
}

// Create a new memory
export function useCreateMemory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemoryData) => {
      if (!user) throw new Error("User not authenticated");

      // Generate embedding for the content
      let embedding = null;
      try {
        const { data: embeddingData, error: embeddingError } =
          await supabase.functions.invoke("generate-embeddings", {
            body: { text: data.content, user_id: user.id },
          });

        if (!embeddingError && embeddingData?.embedding) {
          embedding = embeddingData.embedding;
        }
      } catch (error) {
        console.error("Failed to generate embedding for memory:", error);
        // Continue without embedding
      }

      const { data: memory, error } = await supabase
        .from("agent_memory")
        .insert({
          agent_id: data.agent_id,
          user_id: user.id,
          memory_type: data.memory_type,
          content: data.content,
          embedding,
          source_conversation_id: data.source_conversation_id || null,
          source_message_id: data.source_message_id || null,
          relevance_score: data.relevance_score || 0.8,
          metadata: data.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return memory as AgentMemory;
    },
    onSuccess: (memory) => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.agent(memory.agent_id),
      });
    },
    onError: (error: Error) => {
      console.error("Error creating memory:", error);
      toast.error(error.message || "Failed to create memory");
    },
  });
}

// Update memory relevance or deactivate
export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      agentId,
      data,
    }: {
      id: string;
      agentId: string;
      data: Partial<Pick<AgentMemory, "relevance_score" | "is_active" | "content">>;
    }) => {
      const { data: memory, error } = await supabase
        .from("agent_memory")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return memory as AgentMemory;
    },
    onSuccess: (memory) => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.agent(memory.agent_id),
      });
    },
    onError: (error: Error) => {
      console.error("Error updating memory:", error);
      toast.error(error.message || "Failed to update memory");
    },
  });
}

// Delete memory
export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase.from("agent_memory").delete().eq("id", id);

      if (error) throw error;
      return { id, agentId };
    },
    onSuccess: ({ agentId }) => {
      queryClient.invalidateQueries({
        queryKey: memoryKeys.agent(agentId),
      });
      toast.success("Memory deleted");
    },
    onError: (error: Error) => {
      console.error("Error deleting memory:", error);
      toast.error(error.message || "Failed to delete memory");
    },
  });
}

// Bulk create memories (for extraction)
export function useExtractMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      conversationId,
      memories,
    }: {
      agentId: string;
      conversationId: string;
      memories: Array<{
        memory_type: MemoryType;
        content: string;
        relevance_score?: number;
      }>;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Generate embeddings for all memories in parallel
      const memoriesWithEmbeddings = await Promise.all(
        memories.map(async (memory) => {
          let embedding = null;
          try {
            const { data: embeddingData } = await supabase.functions.invoke(
              "generate-embeddings",
              {
                body: { text: memory.content, user_id: user.id },
              }
            );
            embedding = embeddingData?.embedding || null;
          } catch (error) {
            console.error("Failed to generate embedding:", error);
          }

          return {
            agent_id: agentId,
            user_id: user.id,
            memory_type: memory.memory_type,
            content: memory.content,
            embedding,
            source_conversation_id: conversationId,
            relevance_score: memory.relevance_score || 0.8,
          };
        })
      );

      const { data, error } = await supabase
        .from("agent_memory")
        .insert(memoriesWithEmbeddings)
        .select();

      if (error) throw error;
      return (data || []) as AgentMemory[];
    },
    onSuccess: (memories) => {
      if (memories.length > 0) {
        queryClient.invalidateQueries({
          queryKey: memoryKeys.agent(memories[0].agent_id),
        });
        toast.success(`${memories.length} memories extracted`);
      }
    },
    onError: (error: Error) => {
      console.error("Error extracting memories:", error);
      toast.error(error.message || "Failed to extract memories");
    },
  });
}

// Memory stats for an agent
export function useMemoryStats(agentId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...memoryKeys.agent(agentId || ""), "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_memory")
        .select("memory_type, is_active")
        .eq("agent_id", agentId)
        .eq("user_id", user?.id);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        active: data?.filter((m) => m.is_active).length || 0,
        byType: {} as Record<MemoryType, number>,
      };

      for (const memory of data || []) {
        const type = memory.memory_type as MemoryType;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }

      return stats;
    },
    enabled: !!agentId && !!user,
  });
}
