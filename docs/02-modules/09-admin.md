# Admin — Module Blueprint

## Overview
The Admin module provides the administrative control panel for the entire platform. It centralizes user management, role/permission management, integration configuration, knowledge base management, AI features, EOS administration, reports, system settings, and module-specific administration. Admin routes are protected by the `AdminRoute` guard and use the `AdminLayout`.

## Module Name
Admin routes are not gated by `app_modules` — they require the admin role directly via `AdminRoute`.

## Routes Owned (40 routes)
All `/admin/*` routes. Defined in `src/modules/admin/routes.tsx`:

```
Dashboard:
/admin                               → Admin dashboard overview
/admin/implementation-status         → Module tracker with progress bars & QA

Users & Access:
/admin/users                         → User invite, activation, role assignment
/admin/roles                         → Role CRUD with permission matrix
/admin/logs                          → Activity audit trail with filters & export

Team & Resources:
/admin/team/employees                → Employee list with search/filter
/admin/team/employee_projection      → Resource allocation, dept distribution, pods
/admin/team/departments              → Department overview

EOS Administration:
/admin/eos                           → EOS admin hub (links to VTO, Scorecard, Accountability)
/admin/eos/vto                       → VTO section management (edit, reset, preview)
/admin/eos/scorecards                → Scorecard + metrics full CRUD
/admin/eos/accountability            → Chart versions, role CRUD, timeline, GWC assessments

Settings:
/admin/settings                      → System settings, seed options, feature toggles
/admin/settings/project-statuses     → Project status CRUD with color picker, reorder
/admin/settings/work-types           → Work type CRUD with billable flag, rates, reorder
/admin/settings/project-modules      → Toggle project detail tabs

Integrations:
/admin/integrations                  → Category-based integration hub with search
/admin/integrations/oauth/callback   → OAuth callback handler
/admin/integrations/analytics        → Integration usage & sync stats
/admin/integrations/zoom             → Zoom OAuth setup + user connection management
/admin/integrations/zoom/meetings    → Synced Zoom meetings list
/admin/integrations/microsoft-teams  → Teams OAuth setup
/admin/integrations/microsoft-teams/meetings → Synced Teams meetings list
/admin/integrations/:slug            → Generic integration detail page

Knowledge Admin:
/admin/knowledge/analytics           → Knowledge usage analytics
/admin/knowledge/categories          → Knowledge category CRUD
/admin/knowledge/embeddings          → Embedding queue, coverage stats, search logs

AI & Automation:
/admin/ai-models                     → AI provider/model config, cost tracking
/admin/ai-usage                      → AI usage dashboard with cost breakdown
/admin/mcp-servers                   → MCP server management

Content & Feedback:
/admin/feedback                      → Feedback queue with severity/type filtering

Reports:
/admin/reports/projects              → Project summary cards + real Supabase aggregates
/admin/reports/resource-utilization  → Utilization dashboard, dept chart, employee table

System & Deployment:
/admin/deployment                    → Deployment checklist, edge function status
/admin/environment                   → Edge function deployment status, env vars check
/admin/onboarding                    → Initial setup wizard (first admin promotion)
/admin/checklist                     → Deployment setup checklist
/admin/sso-settings                  → SSO domain validation
/admin/meeting-analytics             → Meeting efficiency scoring, monthly trends
/admin/roadmap                       → Vision statement, module status, feature roadmap
/admin/roadmap/seed                  → Execute seed SQL files against database
```

## File Inventory

### Pages (37 files in `src/pages/admin/`)

Core Admin:
- `Admin.tsx` — Main admin dashboard overview
- `UserManagement.tsx` — User invite, activation, role assignment, deactivation
- `RoleManagement.tsx` — Role CRUD with permission matrix
- `ActivityLogs.tsx` — Activity audit trail with filters and export
- `SystemSettings.tsx` — App config, seed options, feature toggles
- `FeedbackManagement.tsx` — User feedback queue with severity/type filtering
- `ProductRoadmap.tsx` — Vision statement, module status tabs, feature roadmap

Team & Resources:
- `EmployeeManagement.tsx` — Employee list, search, active/inactive stats
- `DepartmentManagement.tsx` — Department overview
- `EmployeeProjection.tsx` — Resource allocation, dept distribution, pods, roster

EOS Admin (`eos/` subdirectory):
- `eos/AdminEOS.tsx` — EOS admin hub linking to VTO, Scorecard, Accountability
- `eos/VTOAdmin.tsx` — VTO section management (edit titles, reset to template)
- `eos/ScorecardWorkspace.tsx` — Scorecard and metrics full CRUD
- `eos/AdminEOSAccountability.tsx` — Chart versions, role CRUD, timeline, GWC

Integration Pages:
- `Integrations.tsx` — Category-based integration hub with search
- `integrations/ZoomIntegration.tsx` — Zoom OAuth setup
- `integrations/ZoomMeetings.tsx` — Synced Zoom meetings list
- `integrations/MicrosoftTeamsIntegration.tsx` — Teams OAuth setup
- `integrations/TeamsMeetings.tsx` — Synced Teams meetings list
- `ProviderDetail.tsx` — Generic integration detail page
- `OAuthCallback.tsx` — OAuth callback handler
- `IntegrationAnalytics.tsx` — Integration usage and sync stats

Knowledge & AI:
- `KnowledgeAnalytics.tsx` — Knowledge usage analytics
- `KnowledgeCategories.tsx` — Knowledge category CRUD
- `EmbeddingsExplorer.tsx` — Embedding queue, coverage, search logs
- `AIModelManagement.tsx` — AI provider/model config, enable/disable, cost tracking
- `AIUsageAnalytics.tsx` — AI usage dashboard with cost breakdown
- `MCPServers.tsx` — MCP server management

Settings:
- `ProjectStatusSettings.tsx` — Project status CRUD with color picker, reorder
- `WorkTypesSettings.tsx` — Work type CRUD with billable flag, rates, reorder
- `ProjectModules.tsx` — Toggle project detail tabs

Reports:
- `ProjectReports.tsx` — Project summary cards with Supabase aggregates
- `ResourceUtilizationReports.tsx` — Utilization dashboard, dept chart, employee table

System:
- `ImplementationStatus.tsx` — Full module tracker dashboard
- `DeploymentStatus.tsx` — Deployment checklist, edge function monitor
- `EnvironmentValidator.tsx` — Env vars check, edge function deployment status
- `OnboardingWizard.tsx` — Initial setup wizard
- `DeploymentChecklist.tsx` — Deployment setup checklist
- `SSOSettings.tsx` — SSO domain validation
- `MeetingAnalytics.tsx` — Meeting efficiency scoring, monthly trends
- `SeedRunner.tsx` — Seed SQL execution UI

### Layout Components
- `src/components/layout/AdminLayout.tsx` — Admin layout wrapper
- `src/components/layout/AdminSidebar.tsx` — Admin sidebar navigation
- `src/components/auth/AdminRoute.tsx` — Admin route guard

### Key Hooks
| Hook | File | Notes |
|------|------|-------|
| useProjectStatuses | `src/hooks/useProjectStatuses.ts` | CRUD + reorder for `project_statuses` |
| useWorkTypes | `src/hooks/useWorkTypes.ts` | CRUD + reorder for `work_types` |
| useProjectModuleSettings | `src/hooks/useProjectModuleSettings.ts` | `system_settings` persistence |
| useMeetingEfficiency | `src/modules/meetings/hooks/useMeetingEfficiency.ts` | Composite efficiency scoring |
| useSaveGWCAssessment | `src/pages/admin/eos/AdminEOSAccountability.tsx` | GWC assessment upsert |

### Edge Functions (Admin-specific)
| Function | Purpose |
|----------|---------|
| `promote-to-admin` | Promote a user to admin role |
| `promote-first-admin` | First-user admin promotion |
| `check-environment` | Verify env configuration & API keys |
| `run-seed` | Execute seed SQL files |
| `knowledge-base` | Admin CRUD for knowledge categories/sources/files |
| `log-activity` | Activity logging to `activity_logs` |

### Navigation (22 items in `adminNavigation`)
Defined in `src/shared/data/navigationStructure.ts`:

| Group | Items |
|-------|-------|
| Dashboard | Overview |
| Users & Access | User Management, Role Management, Activity Logs |
| Team & Resources | Employees, Departments, Meeting Analytics |
| EOS | EOS Admin, VTO Config, Scorecards, Accountability |
| Knowledge | Knowledge Analytics, Knowledge Categories, Embeddings Explorer |
| Content & Feedback | Feedback Management |
| AI & Automation | AI Models, AI Usage Analytics, MCP Servers |
| System | System Settings, Integrations, Vision & Roadmap, Seed Data Runner, Deployment Status, Environment Check |

## Database Tables Used
The Admin module does not own dedicated tables — it operates on tables from other modules:
- `user_roles`, `role_permissions` (Platform Core)
- `app_modules`, `system_settings`, `app_config` (Platform Core)
- `activity_logs` (Platform Core)
- `feedback` (Platform Core)
- `integration_providers`, `integration_services` (Platform Core)
- `user_oauth_tokens`, `oauth_states` (Platform Core)
- `project_statuses`, `work_types` (Projects)
- `eos_pods`, `eos_vto_sections`, `eos_scorecards` (EOS)
- `knowledge_categories`, `knowledge_files` (Knowledge)
- `ai_models`, `ai_providers`, `ai_usage_logs` (AI Agents)

## Cross-Module Dependencies
**Depends on:** Platform Core (auth, roles, settings)
**Administers:** ALL other modules (EOS, Meetings, Projects, Knowledge, AI Agents, etc.)

## Implementation Status

**Development:** Done
**QA:** Not started (22 test items)
**Data Seeding:** Done (uses platform-core, system_settings, app_config seeds)
**Sign-off:** Pending

### All Pages — Status

| Page | Route | Status |
|------|-------|--------|
| Admin Dashboard | `/admin` | Done |
| UserManagement | `/admin/users` | Done |
| RoleManagement | `/admin/roles` | Done |
| ActivityLogs | `/admin/logs` | Done |
| SystemSettings | `/admin/settings` | Done |
| EmployeeManagement | `/admin/team/employees` | Done |
| DepartmentManagement | `/admin/team/departments` | Done |
| EmployeeProjection | `/admin/team/employee_projection` | Done |
| AdminEOS | `/admin/eos` | Done |
| VTOAdmin | `/admin/eos/vto` | Done |
| ScorecardWorkspace | `/admin/eos/scorecards` | Done |
| AdminEOSAccountability | `/admin/eos/accountability` | Done |
| ProjectStatusSettings | `/admin/settings/project-statuses` | Done |
| WorkTypesSettings | `/admin/settings/work-types` | Done |
| ProjectModules | `/admin/settings/project-modules` | Done |
| Integrations | `/admin/integrations` | Done |
| ZoomIntegration | `/admin/integrations/zoom` | Done |
| ZoomMeetings | `/admin/integrations/zoom/meetings` | Done |
| MicrosoftTeamsIntegration | `/admin/integrations/microsoft-teams` | Done |
| TeamsMeetings | `/admin/integrations/microsoft-teams/meetings` | Done |
| IntegrationAnalytics | `/admin/integrations/analytics` | Done |
| KnowledgeAnalytics | `/admin/knowledge/analytics` | Done |
| KnowledgeCategories | `/admin/knowledge/categories` | Done |
| EmbeddingsExplorer | `/admin/knowledge/embeddings` | Done |
| AIModelManagement | `/admin/ai-models` | Done |
| AIUsageAnalytics | `/admin/ai-usage` | Done |
| MCPServers | `/admin/mcp-servers` | Done |
| FeedbackManagement | `/admin/feedback` | Done |
| ProjectReports | `/admin/reports/projects` | Done |
| ResourceUtilizationReports | `/admin/reports/resource-utilization` | Done |
| DeploymentStatus | `/admin/deployment` | Done |
| EnvironmentValidator | `/admin/environment` | Done |
| OnboardingWizard | `/admin/onboarding` | Done |
| DeploymentChecklist | `/admin/checklist` | Done |
| SSOSettings | `/admin/sso-settings` | Done |
| MeetingAnalytics | `/admin/meeting-analytics` | Done |
| ProductRoadmap | `/admin/roadmap` | Done |
| SeedRunner | `/admin/roadmap/seed` | Done |
| ImplementationStatus | `/admin/implementation-status` | Done |

### Deferred to Post-MVP
- Data sync dashboards (HR, HubSpot, ActiveCollab)
- Notification management admin page

## Implementation Notes
- All admin routes wrap with `<ProtectedRoute><AdminRoute><AdminLayout>...</AdminLayout></AdminRoute></ProtectedRoute>`
- AdminRoute checks for admin role via AuthContext
- AdminLayout provides admin-specific sidebar navigation
- Navigation defined in `adminNavigation` array in `navigationStructure.ts`
- New tables not in auto-generated Supabase types use `(supabase as any)` cast
- CRUD pages follow: hook with useQuery + useMutation → page with table + dialog + delete confirm
- Reorder uses arrow-based up/down buttons with batch sort_order updates
- System settings use a key-value pattern (category, key, value)
