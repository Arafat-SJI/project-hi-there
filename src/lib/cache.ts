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
  },

  // AI
  ai: {
    agents: ["ai", "agents"] as const,
    agent: (id: string) => ["ai", "agent", id] as const,
    runs: (agentId: string) => ["ai", "runs", agentId] as const,
    chat: (sessionId: string) => ["ai", "chat", sessionId] as const,
    embeddings: (sourceId: string) => ["ai", "embeddings", sourceId] as const,
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
  ai: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.agents });
  },
  notifications: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  },
};
