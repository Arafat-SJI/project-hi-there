/**
 * Hooks Index - Centralized export for all application hooks
 *
 * This barrel file organizes all hooks into logical categories for easy discovery.
 * Import any hook like: import { useClients, useTasks } from '@/hooks';
 */

// ============================================
// Core & Configuration
// ============================================
export { useAppConfig } from './useAppConfig';
export { useFeatureFlags } from './useFeatureFlags';
export { useAuthConfig } from './useAuthConfig';
export { usePreferences } from './usePreferences';
export { useDashboard } from './useDashboard';
export { useOnboarding } from './useOnboarding';
export { useRoles } from './useRoles';

// ============================================
// Authentication & Users
// ============================================
export { useUserInvites } from './useUserInvites';
export { useIntegrationStatus } from './useIntegrationStatus';

// ============================================
// Data & CRUD Operations
// ============================================
export { useClients } from './useClients';
export { useTasks } from './useTasks';
export { useMeetings } from './useMeetings';
export { useKnowledge } from './useKnowledge';
export { useKnowledgeAdmin } from './useKnowledgeAdmin';
export { useUserKnowledge } from './useUserKnowledge';
export { useNotifications } from './useNotifications';

// ============================================
// AI Features
// ============================================
export { useAIAgents } from './useAIAgents';
export { useAIChatAssistant } from './useAIChatAssistant';
export { useSemanticSearch } from './useSemanticSearch';
export { useModelSync } from './useModelSync';

// ============================================
// Microsoft Integrations
// ============================================
export { useMicrosoftCalendar } from './useMicrosoftCalendar';
export { useMicrosoftTeams } from './useMicrosoftTeams';
export { useMicrosoftTeamsChannels } from './useMicrosoftTeamsChannels';
export { useMicrosoftTeamsMessages } from './useMicrosoftTeamsMessages';
export { useCreateTeamsMeeting } from './useCreateTeamsMeeting';
export { useSendTeamsChannelMessage } from './useSendTeamsChannelMessage';
export { useSyncTeamsMeetings } from './useSyncTeamsMeetings';
export { useGraphWebhookSubscription } from './useGraphWebhookSubscription';

// ============================================
// External Integrations
// ============================================
export { useIntegrations } from './useIntegrations';
export { useUserIntegrations } from './useUserIntegrations';
export { useSyncZoom } from './useSyncZoom';
export { useZoomFiles } from './useZoomFiles';

// ============================================
// UI Utilities
// ============================================
export { useMobile } from './use-mobile';
export { useToast } from './use-toast';
