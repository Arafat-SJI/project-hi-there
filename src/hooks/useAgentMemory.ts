// Agent memory hooks - disabled (tables not yet created)
// These hooks will be enabled once agent_memory table exists

import { useQuery, useMutation } from "@tanstack/react-query";

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

// Stub hooks - tables not yet created
export function useAgentMemories(_agentId: string | null, _memoryType?: MemoryType) {
  return useQuery({
    queryKey: ["agent-memories-disabled"],
    queryFn: async () => [] as AgentMemory[],
    enabled: false,
  });
}

export function useMatchMemories(
  _agentId: string | null,
  _query: string,
  _options?: { threshold?: number; limit?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: ["match-memories-disabled"],
    queryFn: async () => [] as MatchedMemory[],
    enabled: false,
  });
}

export function useRecentMemories(
  _agentId: string | null,
  _memoryType?: MemoryType,
  _limit: number = 10
) {
  return useQuery({
    queryKey: ["recent-memories-disabled"],
    queryFn: async () => [] as Pick<AgentMemory, "id" | "content" | "memory_type" | "relevance_score" | "created_at">[],
    enabled: false,
  });
}

export function useCreateMemory() {
  return useMutation({
    mutationFn: async (_data: CreateMemoryData) => {
      console.warn("Agent memory not enabled - database tables not configured");
      throw new Error("Agent memory not enabled");
    },
  });
}

export function useUpdateMemory() {
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      agentId: string;
      data: Partial<Pick<AgentMemory, "relevance_score" | "is_active" | "content">>;
    }) => {
      throw new Error("Agent memory not enabled");
    },
  });
}

export function useDeleteMemory() {
  return useMutation({
    mutationFn: async (_params: { id: string; agentId: string }) => {
      throw new Error("Agent memory not enabled");
    },
  });
}

export function useExtractMemories() {
  return useMutation({
    mutationFn: async (_params: {
      agentId: string;
      conversationId: string;
      memories: Array<{
        memory_type: MemoryType;
        content: string;
        relevance_score?: number;
      }>;
    }) => {
      console.warn("Agent memory extraction not enabled");
      return [] as AgentMemory[];
    },
  });
}

export function useMemoryStats(_agentId: string | null) {
  return useQuery({
    queryKey: ["memory-stats-disabled"],
    queryFn: async () => ({
      total: 0,
      active: 0,
      byType: {} as Record<MemoryType, number>,
    }),
    enabled: false,
  });
}
