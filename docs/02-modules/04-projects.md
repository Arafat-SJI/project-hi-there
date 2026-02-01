# Projects — Module Blueprint

## Overview
The Projects module is the largest module in the system. It handles project lifecycle management including project listing with filters, detailed project views with multiple tabs (overview, tasks, meetings, billing, issues, files, integrations, client portal), milestones, backup/restore, resource projection, and ActiveCollab integration for task synchronization.

## Module Name
`Projects` (in app_modules and navigation)
Related module: `Resource Projection`

## Routes Owned
```
/projects                              → Projects listing
/projects/:slug                        → Project detail
/projects/:slug/:tab                   → Project detail with specific tab
/projects/:slug/knowledge              → Project knowledge
/projects/:slug/issues/ai/analyze      → Project AI issue analysis
/projects/:slug/client-portal/:token   → Enhanced client dashboard
/client/project/:token                 → Client project dashboard (public)
/resources                             → Resources page
/resource-projection                   → Resource projection table
/resource-projection/dashboard         → Resource projection dashboard
/reports                               → Reports

Admin routes:
/admin/settings/project-statuses       → Project status management
/admin/settings/project-modules        → Project detail tab toggles
/admin/settings/work-types             → Work type settings
/admin/reports/projects                → Project reports
/admin/reports/resource-utilization    → Resource utilization
/admin/team/employee_projection        → RP team settings
```

## File Inventory

### Pages (11 files)
- src/pages/Projects.tsx — Project listing with filters and toolbar
- src/pages/projects/ProjectDetail.tsx — Project detail (tab-based)
- src/pages/projects/ProjectKnowledge.tsx — Project knowledge base
- src/pages/projects/Performance.tsx — Project performance
- src/pages/ProjectIssuesAIAnalyzePage.tsx — AI issue analysis
- src/pages/client/ProjectDashboard.tsx — Client-facing dashboard
- src/pages/client/EnhancedClientDashboard.tsx — Enhanced client dashboard
- src/pages/resourceProjection/Index.tsx — Resource projection main
- src/pages/resourceProjection/Dashboard.tsx — Resource projection dashboard
- src/pages/admin/ProjectStatusSettings.tsx — Admin status config
- src/pages/admin/settings/ProjectModules.tsx — Admin tab toggles
- src/pages/admin/reports/ProjectReports.tsx — Project reports

### Components — projects/ (65+ files)
Core:
- OverviewTab.tsx, TasksTab.tsx, ProjectEditDialog.tsx
- QuickEditProjectDialog.tsx, CreateProjectDialog.tsx
- ProjectSummaryCard.tsx, ProjectOverviewCard.tsx
- ProjectMembersDialog.tsx, ClientAccessManagement.tsx
- ProjectsToolbar.tsx, ProjectsFiltersPanel.tsx, ProjectsPagination.tsx

Notes & Comments:
- ProjectNotes.tsx, NotesEditor.tsx, ProjectComments.tsx
- QuickCommentsSection.tsx, QuickNotesSection.tsx, PMClientComments.tsx

Tasks (project-scoped):
- ActiveCollabTasks.tsx, ActiveCollabTasksList.tsx, TaskDetailModal.tsx
- TaskComments.tsx, TaskFiltersPanel.tsx, TaskListVisibilityManager.tsx
- TaskStatsDashboard.tsx, ProjectMeetingTasksExtractor.tsx
- ExtractedTaskCard.tsx, SyncTaskListsModal.tsx

Milestones:
- MilestoneManagement.tsx, MilestoneHistoryTimeline.tsx

Billing (7+ files in billing/):
- BillingNotes.tsx, BillingComments.tsx, BillingSummaryCards.tsx
- PaymentSchedule.tsx, ProjectInvoices.tsx
- billing/BillingInformationCard.tsx, billing/SetupBillingModal.tsx
- billing/InvoiceListing.tsx, billing/InvoiceHistoryModal.tsx
- billing/EditInvoiceModal.tsx, billing/CreateInvoiceDropdown.tsx
- billing/MonthlyInvoiceModal.tsx, billing/PayPerTaskInvoiceModal.tsx

Backup:
- ProjectsBackupStatus.tsx, ProjectsRestoreBackupDialog.tsx

ActiveCollab:
- ActiveCollabConnection.tsx, ActiveCollabConnectionFlow.tsx
- ActiveCollabConnectionCard.tsx, ACProjectMatcher.tsx
- IntegrationBadges.tsx, IntegrationsTab.tsx

Integrations (6 files):
- integrations/ActiveCollabReportCard.tsx, integrations/SlackConfigCard.tsx
- integrations/GoogleCalendarConfig.tsx, integrations/WeeklyUpdateComposer.tsx
- integrations/WeeklyEmailUpdateCard.tsx, integrations/AIWeeklyUpdateCard.tsx

Meetings & Insights:
- ProjectMeetingsManager.tsx, ProjectMeetingInsights.tsx
- LinkMeetingDialog.tsx, MeetingTranscriptPreview.tsx
- SuggestedMeetingsCard.tsx, SprintUpdateNotes.tsx

Issues:
- ProjectIssuesTab.tsx, ProjectRisks.tsx, ProjectConcerns.tsx
- issues-ai/PMDataSourcesStep.tsx, issues-ai/PMAnalysisProgressStep.tsx, issues-ai/PMResultsReviewStep.tsx

Files:
- ProjectDrivePanel.tsx, ProjectDriveFilePicker.tsx
- FilePreviewModal.tsx, LocalFileUploadModal.tsx
- GoogleDriveFolderConfig.tsx, ProjectChecklistPanel.tsx

Client Portal:
- ClientPortalTab.tsx, ClientFeedbackView.tsx
- SourceDealCard.tsx, TechStackEditor.tsx
- SyncMonitoringDashboard.tsx, SyncTestButton.tsx, GitHubTabContent.tsx

### Components — resourceProjection/ (31 files)
- ResourceProjectionTable.tsx, ProjectManagement.tsx, ProjectModal.tsx
- AddRowDialog.tsx, AddMemberDialog.tsx, EmployeeModal.tsx
- EditTeamDialog.tsx, ResourceRankingList.tsx
- EditableResourceDropdown.tsx, EditableCell.tsx
- TableFilters.tsx, SearchableCombobox.tsx, DeleteConfirmationDialog.tsx
- TeamDetailsDialog.tsx, WorkloadDistributionChart.tsx
- WeeklyTrendChart.tsx, DashboardMetricsOverview.tsx
- BackupStatus.tsx, RestoreBackupDialog.tsx, SyncInfoBar.tsx
- ScrollToButton.tsx, DuplicateBadge.tsx, DatabaseNote.tsx
Dashboard:
- dashboard/EnhancedDashboardTabs.tsx, dashboard/DashboardControls.tsx
- dashboard/ResourceDetailedSummary.tsx, dashboard/EnhancedKPICard.tsx
- dashboard/ResourceCapacityTab.tsx, dashboard/PeopleCentricTab.tsx
- dashboard/TrendsForcastingTab.tsx, dashboard/InfoTooltip.tsx

### Components — client-portal/ (6 files)
- ClientDeadlineCountdown.tsx, ClientInvoiceSummary.tsx
- ClientMilestoneTimeline.tsx, ClientProgressRing.tsx
- ClientRisksTimeline.tsx, ClientSprintTimeline.tsx

### Hooks (48 files)
Project:
- useProjects.ts, useProjectStatuses.ts, useProjectComments.ts
- useProjectMembers.ts, useProjectMeetings.ts, useProjectMeetingSearch.ts
- useProjectModuleSettings.ts, useProjectDriveFiles.ts
- useProjectIntegrations.ts, useProjectAIIssues.ts, useProjectAIWeeklyUpdate.ts
Milestones:
- useProjectMilestones.ts, useMilestoneHistory.ts
Billing:
- useProjectBillingSetup.ts, useBillingComments.ts
Allocations:
- useProjectAllocations.ts
Backup:
- projects/useProjectsBackup.ts
Resources:
- useResources.ts, useResourceSync.ts
ActiveCollab:
- useActiveCollabTasks.ts, useActiveCollabBudgetDetails.ts
- useActiveCollabExpenses.ts, useActiveCollabLookups.ts, useActiveCollabTimeRecords.ts
Resource Allocation (4 files):
- resourceAllocation/useAllocations.ts, useProjectsForAllocation.ts
- useResourcesForAllocation.ts, useTeamsForAllocation.ts
Resource Projection (13 files):
- resourceProjection/useProjections.ts, useProjects.ts, useTeams.ts
- useProjectionRows.ts, useProjectionState.ts, useAvailableWeeks.ts
- useBulkSelection.ts, useDashboardMetrics.ts, useProjectionBackup.ts
- useResourceProjectionSync.ts, useSendProjectionEmails.ts
- useTeamResources.ts, useTeamMemberCounts.ts

### Types (2 files)
- src/types/activecollab.ts — IActiveCollabTask, IActiveCollabProject, ISyncLog
- src/types/resourceAllocation.ts — Allocation types

### API Files (7 files)
- src/api/ProjectsApi.ts — Projects API
- src/api/AllocationApi.ts — Allocation API
- src/api/ResourceApi.ts — Resource API
- src/api/ActiveCollabApi.ts — ActiveCollab API
- src/api/resourcePlanning/EmployeeApi.ts
- src/api/resourcePlanning/TeamsApi.ts
- src/api/resourcePlanning/index.ts

### Edge Functions (45+ functions)
ActiveCollab (27):
- ac-create-project, ac-get-projects, ac-search-projects
- ac-get-project-budget-summary, ac-get-project-budget-details
- ac-get-project-expenses, ac-project-hours
- ac-sync-project-tasks, ac-sync-project-budgets
- ac-sync-tasks, ac-sync-expenses, ac-sync-time-records
- ac-sync-lookup-tables, ac-get-all-tasks, ac-get-task-comments
- ac-test-connection, ac-user-authenticate
- activecollab-integration, activecollab-create-project
- activecollab-create-task, activecollab-sync-projects
- activecollab-sync-tasks, activecollab-comprehensive-sync
- activecollab-test-sync, activecollab-user-auth
- activecollab-webhook-handler, test-activecollab-connection

Project Core:
- projects, api-v1-projects, notify-project-created
- restore-project-backup, sync-external-projects

Analytics:
- ai-analyze-project, extract-project-issues, generate-project-report

Resources:
- generate-resource-utilization, sync-resources, sync-resources-native

Files & Knowledge:
- project-drive-sync-files, sync-project-drive-files
- project-knowledge-sync, index-project-document
- process-pending-project-documents, reindex-project-files

### API Endpoints
```
PROJECTS.BASE: 'api-v1-projects'
PROJECTS.SYNC_EXTERNAL: 'sync-external-projects'
PROJECTS.REPORT: 'generate-project-report'
ACTIVECOLLAB.TEST_CONNECTION: 'ac-test-connection'
ACTIVECOLLAB.SYNC_TASKS: 'ac-sync-tasks'
... (18 total endpoints)
```

## Database Tables
- `projects` — Project records
- `project_statuses` — Status definitions (configurable)
- `project_favorites` — User favorites
- `project_backups` — Backup snapshots
- `project_members` — Team members
- `project_comments` — Comments
- `project_milestones` — Milestone tracking
- `project_invoices` — Billing invoices
- `project_billing` — Billing setup
- `project_files` — File attachments
- `project_risks` — Risk tracking
- `project_checklists` — Checklists
- `resource_projections` — Resource allocation data
- `rp_teams` — Resource projection teams
- `system_settings` (category=project_modules) — Tab toggles

## Cross-Module Dependencies
**Depends on:** Platform Core, Business Dev (client data, source deals), Meetings (project meetings), Knowledge Base (project knowledge)
**Used by:** Admin (project settings), Business Dev (deal→project conversion)

## Configuration
- `system_settings` (category=`project_modules`): tasks_enabled, files_enabled, billing_enabled, etc.
- `project_statuses`: Admin-configurable project lifecycle stages
- ActiveCollab credentials stored as integration secrets

## Implementation Notes
- Project detail uses tab-based navigation (overview, tasks, meetings, billing, files, integrations, issues, client portal)
- Tabs are toggleable via system_settings → project_modules
- ActiveCollab integration syncs tasks, time records, expenses, budgets
- Resource projection provides capacity planning with weekly allocation table
- Client portal uses token-based access (no auth required)
- Backup/restore creates full project snapshots
