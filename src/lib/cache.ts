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
    stats: (clientIds: string[]) => ["clients", "stats", clientIds] as const,
  },

  // Meetings
  meetings: {
    all: ["meetings"] as const,
    list: (filters?: Record<string, any>) => ["meetings", "list", filters] as const,
    detail: (id: string) => ["meetings", "detail", id] as const,
    zoom: (meetingId: string) => ["meetings", "zoom", meetingId] as const,
    // Participants & External Participants
    participants: (meetingId: string) => ["meetings", "participants", meetingId] as const,
    externalParticipants: (meetingId: string) => ["meetings", "externalParticipants", meetingId] as const,
    // Agenda & Takeaways
    agenda: (meetingId: string) => ["meetings", "agenda", meetingId] as const,
    takeaways: (meetingId: string) => ["meetings", "takeaways", meetingId] as const,
    // Action Items
    actionItems: (meetingId: string) => ["meetings", "actionItems", meetingId] as const,
    // Series
    series: (seriesId: string) => ["meetings", "series", seriesId] as const,
    seriesList: ["meetings", "seriesList"] as const,
    // Transcripts & Files
    transcripts: (filters?: Record<string, any>) => ["meetings", "transcripts", filters] as const,
    files: (meetingId: string) => ["meetings", "files", meetingId] as const,
    fileSummary: (fileId: string) => ["meetings", "fileSummary", fileId] as const,
    transcriptSummary: (meetingId: string) => ["meetings", "transcriptSummary", meetingId] as const,
    // Categorizations & AI
    categorizations: (meetingId: string) => ["meetings", "categorizations", meetingId] as const,
    categorizationStatus: ["meetings", "categorizationStatus"] as const,
    // Assignments & Suggestions
    assignments: (meetingId: string) => ["meetings", "assignments", meetingId] as const,
    assignmentSuggestions: (meetingId: string) => ["meetings", "assignmentSuggestions", meetingId] as const,
    pendingAssignments: (filters?: Record<string, any>) => ["meetings", "pendingAssignments", filters] as const,
    pendingAssignmentCount: ["meetings", "pendingAssignmentCount"] as const,
    // Search & Calendar
    search: (query: string, filters?: Record<string, any>) => ["meetings", "search", query, filters] as const,
    calendar: (dateRange: { start: string; end: string }) => ["meetings", "calendar", dateRange] as const,
    // Efficiency
    efficiency: (meetingId: string) => ["meetings", "efficiency", meetingId] as const,
    // Entity-based views
    clientMeetings: (clientId: string) => ["meetings", "client", clientId] as const,
    projectMeetings: (projectId: string) => ["meetings", "project", projectId] as const,
    dealMeetings: (dealId: string) => ["meetings", "deal", dealId] as const,
    contactMeetings: (contactId: string) => ["meetings", "contact", contactId] as const,
    entityMeetings: (entityType: string, entityId: string) => ["meetings", "entity", entityType, entityId] as const,
    // Knowledge base integration
    knowledgeMeetings: (filters?: Record<string, any>) => ["meetings", "knowledge", filters] as const,
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

  // Deals
  deals: {
    all: ["deals"] as const,
    list: (filters?: Record<string, any>) => ["deals", "list", filters] as const,
    detail: (slug: string) => ["deals", "detail", slug] as const,
    pipelineStats: ["deals", "pipeline-stats"] as const,
    analytics: ["deals", "analytics"] as const,
    revenueProjection: (year?: number) => ["deals", "revenue-projection", year ?? new Date().getFullYear()] as const,
    overviewExtra: ["deals", "overview-extra"] as const,
    activities: (dealId: string) => ["deals", "activities", dealId] as const,
    comments: (dealId: string) => ["deals", "comments", dealId] as const,
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
    dashboardStats: ["ai", "dashboardStats"] as const,
    agentAnalytics: (days: number) => ["ai", "agentAnalytics", days] as const,
    agentAnalyticsDetail: (agentId: string, days: number) =>
      ["ai", "agentAnalyticsDetail", agentId, days] as const,
    chat: (sessionId: string) => ["ai", "chat", sessionId] as const,
    embeddings: (sourceId: string) => ["ai", "embeddings", sourceId] as const,
    // Conversation threading
    conversations: (agentId: string) => ["ai", "conversations", agentId] as const,
    conversation: (conversationId: string) => ["ai", "conversation", conversationId] as const,
    messages: (conversationId: string) => ["ai", "messages", conversationId] as const,
    allConversations: ["ai", "allConversations"] as const,
    promptTemplates: ["ai", "promptTemplates"] as const,
    promptTemplate: (id: string) => ["ai", "promptTemplate", id] as const,
  },

  // Admin
  admin: {
    users: ["admin", "users"] as const,
    user: (id: string) => ["admin", "user", id] as const,
    roles: ["admin", "roles"] as const,
    permissions: ["admin", "permissions"] as const,
  },

  // SendGrid
  sendgrid: {
    config: ["sendgrid", "config"] as const,
    integration: ["sendgrid", "integration"] as const,
    trackingEvents: (days?: number) => ["sendgrid", "trackingEvents", days] as const,
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
  meetingDetail: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.participants(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.externalParticipants(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.agenda(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.takeaways(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.assignments(meetingId) });
  },
  meetingParticipants: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.participants(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.externalParticipants(meetingId) });
  },
  meetingAgenda: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.agenda(meetingId) });
  },
  meetingTakeaways: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.takeaways(meetingId) });
  },
  meetingActionItems: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.actionItems(meetingId) });
  },
  meetingAssignments: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.assignments(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.assignmentSuggestions(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.pendingAssignmentCount });
  },
  meetingCategorizations: (queryClient: any, meetingId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.categorizations(meetingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.categorizationStatus });
  },
  meetingSeries: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.meetings.seriesList });
  },
  knowledge: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.knowledge.all });
  },
  deals: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.deals.all });
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
  promptTemplates: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ai.promptTemplates });
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
  sendgrid: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sendgrid.config });
    queryClient.invalidateQueries({ queryKey: queryKeys.sendgrid.integration });
    queryClient.invalidateQueries({ queryKey: queryKeys.sendgrid.trackingEvents() });
  },
};
