# Admin — Module Blueprint

## Overview
The Admin module provides the administrative control panel for the entire platform. It centralizes user management, role/permission management, integration configuration, data sync operations, knowledge base management, AI features, reports, notifications, system settings, and module-specific administration. Admin routes are protected by the `AdminRoute` guard and use the `AdminLayout`.

## Module Name
Admin routes are not gated by `app_modules` — they require the admin role directly via `AdminRoute`.

## Routes Owned
All `/admin/*` routes. Key groups:

```
Core Admin:
/admin                               → Redirect to /admin/dashboard
/admin/dashboard                     → Admin dashboard
/admin/user-management               → User management
/admin/settings                      → Admin settings
/admin/announcements                 → Announcements

Team & Resources:
/admin/team/employees                → Employee management
/admin/team/employees/:email         → Employee detail
/admin/team/pods                     → POD management
/admin/team/employee_projection      → RP team settings
/admin/data-sync/pod-management      → POD management (alias)
/admin/data-sync/skill-management    → Skill management
/admin/data-sync/departments         → Department management

Integrations:
/admin/integrations                  → All integrations
/admin/integrations/activecollab     → ActiveCollab
/admin/integrations/hubspot          → HubSpot
/admin/integrations/googledrive      → Google Drive
/admin/integrations/sendgrid         → SendGrid
/admin/integrations/n8n              → N8N
/admin/integrations/zoom             → Zoom
/admin/integrations/openai           → OpenAI
/admin/integrations/anthropic        → Anthropic
/admin/integrations/gemini           → Gemini
/admin/integrations/perplexity       → Perplexity
/admin/integrations/gmail            → Gmail
/admin/integrations/google           → Google (umbrella)
/admin/integrations/google-calendar  → Google Calendar
/admin/integrations/audit-logs       → Integration audit logs
/admin/integrations/health           → Integration health

Data Sync:
/admin/data-sync                     → Data sync overview
/admin/data-sync/hr-data             → HR data sync
/admin/data-sync/hubspot             → HubSpot sync
/admin/data-sync/hubspot/progress/:queueId → Sync progress
/admin/data-sync/hubspot/matching    → Deal matching
/admin/data-sync/hubspot/cleanup     → Client cleanup
/admin/data-sync/scheduled-cron      → Scheduled jobs
/admin/data-sync/meeting-rules       → Meeting rules
/admin/productivity-import           → Productivity CSV import

EOS Admin:
/admin/eos                           → EOS admin hub
/admin/eos/vto                       → VTO admin
/admin/eos/accountability            → Accountability admin
/admin/eos/scorecards                → Scorecard workspace
/admin/eos/meetings                  → EOS meetings config
/admin/eos/system                    → EOS system config
/admin/eos/email-templates           → EOS email templates
/admin/import-anonymous-issues       → Import anonymous issues

Settings:
/admin/settings/project-statuses     → Project statuses
/admin/settings/work-types           → Work types
/admin/settings/project-modules      → Project module tabs
/admin/settings/task-creation        → Task creation
/admin/task-streams                  → Task streams
/admin/tasks/streams                 → Stream settings
/admin/email-templates               → Email templates
/admin/test-email                    → Test email

Knowledge & AI:
/admin/knowledge                     → Knowledge dashboard
/admin/knowledge/queue               → Processing queue
/admin/knowledge/sources             → Sources
/admin/knowledge/categories          → Categories
/admin/knowledge/batch               → Batch upload
/admin/knowledge/files               → Files
/admin/knowledge/sync                → Sync status
/admin/knowledge/gemini              → Gemini RAG
/admin/knowledge/common              → Common knowledge
/admin/ai                            → AI dashboard
/admin/ai/semantic-search            → Semantic search
/admin/ai/embeddings                 → Embeddings
/admin/ai/embeddings-explorer        → Embeddings explorer
/admin/ai/agents                     → AI agents
/admin/ai/agents/management          → Agent management
/admin/ai/agents/:slug/run           → Run agent
/admin/ai/agents/run/:runId          → Run detail
/admin/ai/agents/analytics           → Agent analytics
/admin/ai/agent-categories           → Agent categories
/admin/ai/prompt-templates           → Prompt templates

Memory & Agents:
/admin/memory/dashboard              → Memory dashboard
/admin/memory/user-stats             → User memory stats
/admin/memory/embeddings             → Embedding pipeline
/admin/memory/search                 → Search analytics
/admin/memory/learning               → Team learning
/admin/agents/dashboard              → Agent dashboard
/admin/agents/email-drafting         → Email drafting perf
/admin/agents/deal-coaching          → Deal coaching analytics
/admin/agents/productivity-digest    → Productivity digest

Reports:
/admin/reports                       → Reports dashboard
/admin/reports/projects              → Project reports
/admin/reports/resource-utilization  → Resource utilization
/admin/reports/financial             → Financial reports
/admin/reports/export                → Data export
/admin/reports/usage-analytics       → Usage analytics

Notifications:
/admin/notifications                 → Notifications dashboard
/admin/notifications/settings        → Settings
/admin/notifications/history         → History
/admin/notifications/test            → Test notification

System:
/admin/system                        → System dashboard
/admin/system/api-keys               → API keys
/admin/system/api-settings           → API settings
/admin/system/api-docs               → API documentation
/admin/system/audit-logs             → Audit logs
/admin/system/data-cleanup           → Data cleanup
/admin/system/cache-management       → Cache management

Feedback:
/admin/feedback/bugs                 → Bug reports
/admin/feedback/features             → Feature requests
/admin/feedback/closed               → Closed feedback

Other:
/admin/docs                          → Documentation
/admin/technical-documentation       → Technical docs
/admin/github-activity               → GitHub activity
/adminpanel/github-activity          → GitHub activity (alias)
```

## File Inventory

### Pages (95+ files across admin/ directory)
The admin module has the most pages. Key files:
- src/pages/admin/Dashboard.tsx
- src/pages/admin/AdminSettings.tsx
- src/pages/admin/UserManagement.tsx
- src/pages/admin/EmployeeManagement.tsx, EmployeeDetail.tsx
- src/pages/admin/PODManagement.tsx, SkillManagement.tsx, DepartmentManagement.tsx
- src/pages/admin/RPTeamSettings.tsx
- src/pages/admin/Integrations.tsx, IntegrationHealthDashboard.tsx, IntegrationAuditLogs.tsx
- src/pages/admin/integrations/*.tsx (13 integration pages)
- src/pages/admin/AdminEOS.tsx, AdminEOSSystem.tsx, AdminEOSAccountability.tsx
- src/pages/admin/ScorecardWorkspace.tsx, ImportAnonymousIssues.tsx
- src/pages/admin/eos/VTOAdmin.tsx
- src/pages/admin/HubSpotSync.tsx, HubSpotSyncProgress.tsx, HubSpotDealMatching.tsx
- src/pages/admin/HRDataSync.tsx, DataSync.tsx
- src/pages/admin/data-sync/*.tsx
- src/pages/admin/ProjectStatusSettings.tsx, WorkTypeSettings.tsx
- src/pages/admin/settings/*.tsx (ProjectModules, TaskCreationSettings, TaskStreams)
- src/pages/admin/KnowledgeBase.tsx, KnowledgeDashboard.tsx, KnowledgeSources.tsx, etc.
- src/pages/admin/knowledge/*.tsx
- src/pages/admin/ai/*.tsx (11 AI pages)
- src/pages/admin/memory/*.tsx (5 memory pages)
- src/pages/admin/agents/*.tsx (4 agent pages)
- src/pages/admin/reports/*.tsx (5 report pages)
- src/pages/admin/notifications/*.tsx (4 notification pages)
- src/pages/admin/system/*.tsx (6 system pages)
- src/pages/admin/feedback/*.tsx (3 feedback pages)
- src/pages/admin/Announcements.tsx
- src/pages/admin/EmailTemplates.tsx, TestEmail.tsx
- src/pages/admin/Documentation.tsx, TechnicalDocumentation.tsx
- src/pages/admin/ProductivityImport.tsx
- src/pages/admin/GitHubActivity.tsx, UsageAnalytics.tsx
- src/pages/admin/GeminiRAG.tsx, EmbeddingsExplorer.tsx, ProcessingQueue.tsx
- src/pages/admin/NotificationSettings.tsx, TaskStreams.tsx

### Components — admin/ (60+ files)
Core:
- AdminErrorBoundary.tsx, BackendSelector.tsx
- EmployeeTable.tsx, EmployeeListDialog.tsx, EmployeeQuickStats.tsx
- InactiveUsersWidget.tsx, UserDeletionDialog.tsx
- UserRoleHistory.tsx, UsersPagination.tsx

Roles:
- RoleManagement.tsx, RoleDetailView.tsx, RolePermissionsMatrix.tsx
- RoleImportExport.tsx, BulkRoleAssignment.tsx, GrantAdminRoleButton.tsx

PODs:
- PODsTable.tsx, PODManagementDialog.tsx, PODMembersViewer.tsx
- ReportingStructure.tsx

RP Settings:
- ResourceProjectionTab.tsx
- rpSettings/CreateTeamDialog.tsx, EditTeamDialog.tsx
- rpSettings/AllocationWarningDialog.tsx, RPTeamTable.tsx, TeamMemberSelector.tsx

Skills & Secrets:
- SkillDialog.tsx, AddSecretModal.tsx, SecretStatusBadge.tsx, DocumentViewerModal.tsx

Integrations:
- integrations/SyncActivityHistory.tsx
- integrations/shared/ApiKeyConfig.tsx, ConnectionTest.tsx, IntegrationLayout.tsx, OAuthConnect.tsx, index.ts

HubSpot (11 files):
- hubspot/BulkDealSyncCard.tsx, FullSyncCard.tsx, ImportDealByUrlCard.tsx, etc.

Gemini:
- GeminiCorporaList.tsx, GeminiQueryTester.tsx, GeminiSyncLogs.tsx

Announcements:
- announcements/AnnouncementForm.tsx, AnnouncementTable.tsx, index.ts

Agents:
- agents/WeeklyProductivityDigestCard.tsx, MeetingEfficiencyAgentCard.tsx

Employee Tabs:
- employee-tabs/OverviewTab.tsx, ProjectsTab.tsx, TasksTab.tsx, LeadsTab.tsx, OKRsTab.tsx, MoreTab.tsx

Feedback:
- feedback/FeedbackFormDialog.tsx, FeedbackDetailDialog.tsx, AnalysisReport.tsx

Zoom:
- zoom/ZoomAccountCard.tsx, ZoomAccountDialog.tsx

### Layout Components
- src/components/layout/AdminLayout.tsx — Admin layout
- src/components/layout/AdminSidebar.tsx — Admin sidebar
- src/components/auth/AdminRoute.tsx — Admin route guard

### Hooks (40+ files)
Admin-specific:
- admin/useRPTeamSettings.ts
- useScorecardAdmin.ts, useVTOAdmin.ts
- useRoles.ts, usePermissions.ts
- useDeleteUser.ts, useInactiveUserAlerts.ts

Employee/Profile:
- useEmployees.ts, useEmployeeDirectory.ts, useEmployeeProfile.ts
- useEmployeeFullProfile.ts, useUpdateProfile.ts
- useUserRole.ts, useEmployeePods.ts, usePods.ts

Integration & Sync:
- useIntegrations.ts, useIntegrationSync.ts
- useHubSpot.ts, useHubSpotQueue.ts, useHubSpotDealsQueue.ts
- useHubSpotContactsQueue.ts, useHubSpotSyncLogs.ts
- useHubSpotFullSync.ts, useHubSpotDataHealth.ts
- useGeminiCorpora.ts, useGeminiBulkSync.ts
- useHRDataSync.ts, useN8nSync.ts
- useResourceSync.ts, useDepartmentSync.ts
- useSyncActivities.ts, useSyncHubSpotActivities.ts, useSyncAllDeals.ts

Announcements & Notifications:
- useAnnouncements.ts, useNotifications.ts, useNotificationsV2.ts
- useNotificationPreferences.ts, useUserNotifications.ts

Settings:
- useSettings.ts, useEmailTemplates.ts, useScheduledJobs.ts

Reporting:
- useFeedback.ts, useReports.ts, useBugFeatureAnalysis.ts

Other:
- useEdgeFunction.ts, useLastSyncInfo.ts, useQueueManagement.ts

### Edge Functions (Admin-triggered)
User Management:
- admin-delete-user, admin-users

Integration Testing:
- check-integration-secrets, test-integration
- hubspot-test-connection, ac-test-connection, test-activecollab-connection

System:
- cleanup-old-data, run-ai-agent, agent-orchestrator
- send-notification, send-email

## Database Tables (Admin-specific)
- `user_roles` — Role assignments
- `role_permissions` — Permission definitions
- `app_modules` — Module definitions
- `system_settings` — System-wide settings
- `integration_secrets` — Integration credentials (encrypted)
- `sync_logs` — Integration sync logs
- `scheduled_jobs` — Cron job definitions
- `audit_logs` — System audit trail
- `announcements` — System announcements
- `feedback` — User feedback records
- `api_keys` — API key management

## Cross-Module Dependencies
**Depends on:** Platform Core
**Imports admin settings for:** ALL other modules (EOS, Projects, Knowledge Base, etc.)

## Implementation Notes
- All admin routes wrap with `<ProtectedRoute><AdminRoute><AdminLayout>...</AdminLayout></AdminRoute></ProtectedRoute>`
- AdminRoute checks for admin role via AuthContext
- AdminLayout provides admin-specific sidebar navigation
- Navigation defined in `adminNavigation` array in navigationStructure.ts
- Integration configuration stored in `integration_secrets` table
- Many admin pages delegate to module-specific admin components
- The Admin module is the "configuration brain" of the platform
- System settings use a key-value pattern (category, key, value)
- Data sync operations are queue-based with progress monitoring
