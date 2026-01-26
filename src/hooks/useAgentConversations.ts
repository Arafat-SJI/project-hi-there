import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";

// Types
export interface AgentConversation {
  id: string;
  agent_id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  message_count: number;
  last_message_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined agent data
  ai_agents?: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
    description: string | null;
  };
}

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model_used: string | null;
  provider_used: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  latency_ms: number | null;
  tool_calls: unknown | null;
  tool_results: unknown | null;
  citations: unknown[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateConversationData {
  agent_id: string;
  title?: string;
}

export interface SendMessageData {
  conversation_id: string;
  content: string;
  agent_id: string;
  model_id?: string;
}

// Fetch all conversations for current user (optionally filtered by agent)
export function useAgentConversations(agentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: agentId
      ? queryKeys.ai.conversations(agentId)
      : queryKeys.ai.allConversations,
    queryFn: async () => {
      let query = supabase
        .from("agent_conversations")
        .select(`
          *,
          ai_agents (
            id,
            name,
            slug,
            avatar,
            description
          )
        `)
        .eq("user_id", user?.id)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentConversation[];
    },
    enabled: !!user,
  });
}

// Fetch single conversation
export function useAgentConversation(conversationId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.ai.conversation(conversationId || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_conversations")
        .select(`
          *,
          ai_agents (
            id,
            name,
            slug,
            avatar,
            description,
            system_prompt,
            welcome_message,
            conversation_starters
          )
        `)
        .eq("id", conversationId)
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data as AgentConversation;
    },
    enabled: !!conversationId && !!user,
  });
}

// Fetch messages for a conversation
export function useAgentMessages(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.ai.messages(conversationId || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as AgentMessage[];
    },
    enabled: !!conversationId,
  });
}

// Fetch messages with infinite loading (for long conversations)
export function useAgentMessagesInfinite(conversationId: string | null, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.ai.messages(conversationId || ""), "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;
      return {
        messages: (data || []).reverse() as AgentMessage[],
        nextCursor: data && data.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    enabled: !!conversationId,
  });
}

// Create a new conversation
export function useCreateConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConversationData) => {
      if (!user) throw new Error("User not authenticated");

      const { data: conversation, error } = await supabase
        .from("agent_conversations")
        .insert({
          agent_id: data.agent_id,
          user_id: user.id,
          title: data.title || null,
        })
        .select(`
          *,
          ai_agents (
            id,
            name,
            slug,
            avatar,
            description,
            welcome_message,
            conversation_starters
          )
        `)
        .single();

      if (error) throw error;
      return conversation as AgentConversation;
    },
    onSuccess: (data) => {
      invalidateKeys.conversations(queryClient, data.agent_id);
    },
    onError: (error: Error) => {
      console.error("Error creating conversation:", error);
      toast.error(error.message || "Failed to create conversation");
    },
  });
}

// Send a message in a conversation
export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageData) => {
      if (!user) throw new Error("User not authenticated");

      // 1. Insert user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from("agent_messages")
        .insert({
          conversation_id: data.conversation_id,
          role: "user",
          content: data.content,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // 2. Call AI edge function
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        "agent-conversation-chat",
        {
          body: {
            conversation_id: data.conversation_id,
            agent_id: data.agent_id,
            message: data.content,
            user_id: user.id,
            model_id: data.model_id,
          },
        }
      );

      if (aiError) throw aiError;

      // 3. Insert AI response message
      const { data: assistantMessage, error: assistantMsgError } = await supabase
        .from("agent_messages")
        .insert({
          conversation_id: data.conversation_id,
          role: "assistant",
          content: aiResponse.response,
          model_used: aiResponse.model_used,
          provider_used: aiResponse.provider_used,
          tokens_input: aiResponse.tokens_input,
          tokens_output: aiResponse.tokens_output,
          latency_ms: aiResponse.latency_ms,
          citations: aiResponse.citations || [],
          metadata: aiResponse.metadata || {},
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      return {
        userMessage: userMessage as AgentMessage,
        assistantMessage: assistantMessage as AgentMessage,
      };
    },
    onSuccess: (_, variables) => {
      invalidateKeys.messages(queryClient, variables.conversation_id);
      invalidateKeys.conversations(queryClient);
    },
    onError: (error: Error) => {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    },
  });
}

// Update conversation (title, archive, pin)
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<AgentConversation, "title" | "is_archived" | "is_pinned">>;
    }) => {
      const { data: conversation, error } = await supabase
        .from("agent_conversations")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return conversation as AgentConversation;
    },
    onSuccess: (data) => {
      invalidateKeys.conversations(queryClient, data.agent_id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.ai.conversation(data.id),
      });
    },
    onError: (error: Error) => {
      console.error("Error updating conversation:", error);
      toast.error(error.message || "Failed to update conversation");
    },
  });
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { error } = await supabase
        .from("agent_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, agentId };
    },
    onSuccess: ({ agentId }) => {
      invalidateKeys.conversations(queryClient, agentId);
      toast.success("Conversation deleted");
    },
    onError: (error: Error) => {
      console.error("Error deleting conversation:", error);
      toast.error(error.message || "Failed to delete conversation");
    },
  });
}

// Archive conversation
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { data, error } = await supabase
        .from("agent_conversations")
        .update({ is_archived: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, agentId } as AgentConversation & { agentId: string };
    },
    onSuccess: ({ agentId }) => {
      invalidateKeys.conversations(queryClient, agentId);
      toast.success("Conversation archived");
    },
    onError: (error: Error) => {
      console.error("Error archiving conversation:", error);
      toast.error(error.message || "Failed to archive conversation");
    },
  });
}

// Toggle pin conversation
export function useTogglePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      agentId,
      isPinned,
    }: {
      id: string;
      agentId: string;
      isPinned: boolean;
    }) => {
      const { data, error } = await supabase
        .from("agent_conversations")
        .update({ is_pinned: !isPinned })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, agentId } as AgentConversation & { agentId: string };
    },
    onSuccess: ({ agentId, is_pinned }) => {
      invalidateKeys.conversations(queryClient, agentId);
      toast.success(is_pinned ? "Conversation pinned" : "Conversation unpinned");
    },
    onError: (error: Error) => {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update conversation");
    },
  });
}

// Fetch archived conversations
export function useArchivedConversations(agentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ai", "archivedConversations", agentId],
    queryFn: async () => {
      let query = supabase
        .from("agent_conversations")
        .select(`
          *,
          ai_agents (
            id,
            name,
            slug,
            avatar
          )
        `)
        .eq("user_id", user?.id)
        .eq("is_archived", true)
        .order("updated_at", { ascending: false });

      if (agentId) {
        query = query.eq("agent_id", agentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentConversation[];
    },
    enabled: !!user,
  });
}

// Restore archived conversation
export function useRestoreConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string }) => {
      const { data, error } = await supabase
        .from("agent_conversations")
        .update({ is_archived: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, agentId } as AgentConversation & { agentId: string };
    },
    onSuccess: ({ agentId }) => {
      invalidateKeys.conversations(queryClient, agentId);
      queryClient.invalidateQueries({
        queryKey: ["ai", "archivedConversations"],
      });
      toast.success("Conversation restored");
    },
    onError: (error: Error) => {
      console.error("Error restoring conversation:", error);
      toast.error(error.message || "Failed to restore conversation");
    },
  });
}
