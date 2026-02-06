/**
 * Agent Memory System Hooks
 *
 * React hooks for managing agent memories, preferences, and learning events.
 * Supports semantic search, memory retrieval, and preference tracking.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";

export interface AgentMemory {
  id: string;
  agent_id: string;
  user_id: string;
  memory_type: string; // 'short_term', 'long_term', 'episodic', 'semantic'
  memory_category: string | null; // 'preference', 'fact', 'skill', 'goal', etc.
  content: string;
  summary: string | null;
  embedding: number[] | null;
  source_type: string | null;
  source_id: string | null;
  importance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  consolidated: boolean;
  superseded_by: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface RetrieveMemoriesParams {
  agent_id: string;
  query: string;
  memory_types?: string[];
  memory_categories?: string[];
  limit?: number;
  similarity_threshold?: number;
  include_recent?: boolean;
  recent_days?: number;
}

/**
 * Fetch agent memories with optional filters
 */
export function useAgentMemories(filters?: {
  agent_id?: string;
  memory_type?: string;
  memory_category?: string;
  is_active?: boolean;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["agent-memories", filters],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("agent_memories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.agent_id) {
        query = query.eq("agent_id", filters.agent_id);
      }

      if (filters?.memory_type) {
        query = query.eq("memory_type", filters.memory_type);
      }

      if (filters?.memory_category) {
        query = query.eq("memory_category", filters.memory_category);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentMemory[];
    },
    enabled: !!user,
  });
}

/**
 * Retrieve relevant memories using semantic search
 */
export function useRetrieveMemories() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: RetrieveMemoriesParams) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke("retrieve-agent-memories", {
        body: {
          agent_id: params.agent_id,
          user_id: user.id,
          query: params.query,
          memory_types: params.memory_types || ['short_term', 'long_term', 'episodic'],
          memory_categories: params.memory_categories,
          limit: params.limit || 10,
          similarity_threshold: params.similarity_threshold || 0.7,
          include_recent: params.include_recent ?? true,
          recent_days: params.recent_days || 7,
        },
      });

      if (error) throw error;
      return data;
    },
    onError: (error: unknown) => {
      console.error("Memory retrieval error:", error);
      toast.error((error as Error).message || "Failed to retrieve memories");
    },
  });
}

/**
 * Extract and store memories from a conversation
 */
export function useExtractMemories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      agent_id: string;
      conversation_id: string;
      auto_extract?: boolean;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase.functions.invoke("extract-agent-memories", {
        body: {
          agent_id: params.agent_id,
          user_id: user.id,
          conversation_id: params.conversation_id,
          auto_extract: params.auto_extract ?? true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      invalidateKeys.ai(queryClient);
      if (data.stored_count > 0) {
        toast.success(\`Stored \${data.stored_count} memories\`);
      }
    },
    onError: (error: unknown) => {
      console.error("Memory extraction error:", error);
      toast.error((error as Error).message || "Failed to extract memories");
    },
  });
}

