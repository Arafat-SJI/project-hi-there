/**
 * Query key factories for React Query
 * Provides consistent cache keys across the application
 */

export const queryKeys = {
  // Auth
  auth: {
    user: ["auth", "user"] as const,
    session: ["auth", "session"] as const,
  },

  // Clients
  clients: {
    all: ["clients"] as const,
    list: (filters?: Record<string, any>) => ["clients", "list", filters] as const,
    detail: (id: string) => ["clients", "detail", id] as const,
  },

  // Meetings
  meetings: {
    all: ["meetings"] as const,
    list: (filters?: Record<string, any>) => ["meetings", "list", filters] as const,
    detail: (id: string) => ["meetings", "detail", id] as const,
    zoom: (meetingId: string) => ["meetings", "zoom", meetingId] as const,
  },

  // Knowledge Base
  knowledge: {
    all: ["knowledge"] as const,
    entries: (filters?: Record<string, any>) => ["knowledge", "entries", filters] as const,
    entry: (id: string) => ["knowledge", "entry", id] as const,
    categories: ["knowledge", "categories"] as const,
    category: (id: string) => ["knowledge", "category", id] as const,
    search: (query: string) => ["knowledge", "search", query] as const,
    files: (filters?: Record<string, any>) => ["knowledge", "files", filters] as const,
    sources: ["knowledge", "sources"] as const,
    stats: ["knowledge", "stats"] as const,
    unifiedDocuments: (filters?: Record<string, any>) => ["knowledge", "unifiedDocuments", filters] as const,
    semanticSearch: (query: string, opts?: Record<string, any>) => ["knowledge", "semanticSearch", query, opts] as const,
    userKnowledgeStats: (userId: string) => ["knowledge", "userStats", userId] as const,
    agentPersonalizations: (userId: string) => ["knowledge", "agentPersonalizations", userId] as const,
  },

  // Tasks
  tasks: {
    all: ["tasks"] as const,
    list: (filters?: Record<string, any>) => ["tasks", "list", filters] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },

  // AI
  ai: {
    agents: ["ai", "agents"] as const,
    agent: (id: string) => ["ai", "agent", id] as const,
    runs: (agentId: string) => ["ai", "runs", agentId] as const,
    chat: (sessionId: string) => ["ai", "chat", sessionId] as const,
    embeddings: (sourceId: string) => ["ai", "embeddings", sourceId] as const,
    // Conversation threading
    conversations: (agentId: string) => ["ai", "conversations", agentId] as const,
    conversation: (conversationId: string) => ["ai", "conversation", conversationId] as const,
    messages: (conversationId: string) => ["ai", "messages", conversationId] as const,
    allConversations: ["ai", "allConversations"] as const,
  },

  // Admin
  admin: {
    users: ["admin", "users"] as const,
    user: (id: string) => ["admin", "user", id] as const,
    roles: ["admin", "roles"] as const,
    permissions: ["admin", "permissions"] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
    unread: ["notifications", "unread"] as const,
    count: ["notifications", "count"] as const,
  },
};

/**
 * Cache configuration
 */
export const cacheConfig = {
  staleTime: {
    short: 1000 * 60, // 1 minute
    medium: 1000 * 60 * 5, // 5 minutes
    long: 1000 * 60 * 30, // 30 minutes
    veryLong: 1000 * 60 * 60, // 1 hour
  },
  gcTime: {
    short: 1000 * 60 * 5, // 5 minutes
    medium: 1000 * 60 * 10, // 10 minutes
    long: 1000 * 60 * 30, // 30 minutes
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateKeys = {
  clients: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
  },
  meetings: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all });
  },
  knowledge: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.all });
  },
  tasks: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  },
  roles: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles });
  },
  ai: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.agents });
  },
  conversations: (queryClient: any, agentId?: string) => {
    if (agentId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.conversations(agentId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.allConversations });
  },
  messages: (queryClient: any, conversationId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.messages(conversationId) });
  },
  notifications: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },
};
