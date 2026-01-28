// Agent conversation hooks - disabled (tables not yet created)
// These hooks will be enabled once agent_conversations and agent_messages tables exist

import { useQuery, useMutation } from "@tanstack/react-query";

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

// Stub hooks that return empty/disabled state
export function useAgentConversations(_agentId?: string) {
  return useQuery({
    queryKey: ["agent-conversations-disabled"],
    queryFn: async () => [] as AgentConversation[],
    enabled: false,
  });
}

export function useAgentConversation(_conversationId: string | null) {
  return useQuery({
    queryKey: ["agent-conversation-disabled"],
    queryFn: async () => null as AgentConversation | null,
    enabled: false,
  });
}

export function useAgentMessages(_conversationId: string | null) {
  return useQuery({
    queryKey: ["agent-messages-disabled"],
    queryFn: async () => [] as AgentMessage[],
    enabled: false,
  });
}

export function useAgentMessagesInfinite(_conversationId: string | null, _pageSize = 50) {
  return {
    data: undefined,
    isLoading: false,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: async (_data: CreateConversationData): Promise<AgentConversation | null> => {
      console.warn("Agent conversations not enabled - database tables not configured");
      return null;
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (_data: SendMessageData) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}

export function useUpdateConversation() {
  return useMutation({
    mutationFn: async (_params: { id: string; data: Partial<Pick<AgentConversation, "title" | "is_archived" | "is_pinned">> }) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}

export function useDeleteConversation() {
  return useMutation({
    mutationFn: async (_params: { id: string; agentId: string }) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}

export function useArchiveConversation() {
  return useMutation({
    mutationFn: async (_params: { id: string; agentId: string }) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}

export function useTogglePinConversation() {
  return useMutation({
    mutationFn: async (_params: { id: string; agentId: string; isPinned: boolean }) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}

export function useArchivedConversations(_agentId?: string) {
  return useQuery({
    queryKey: ["archived-conversations-disabled"],
    queryFn: async () => [] as AgentConversation[],
    enabled: false,
  });
}

export function useRestoreConversation() {
  return useMutation({
    mutationFn: async (_params: { id: string; agentId: string }) => {
      throw new Error("Agent conversations not enabled");
    },
  });
}
