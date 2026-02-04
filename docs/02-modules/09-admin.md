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

**Development:** Done (38 admin routes, 41 page files)
**Data Seeding:** Done (uses platform-core, system_settings, app_config seeds)

### Admin Pages — Detailed Status

Legend:
- **Data**: How the page gets its data (Supabase query, edge function, static/hardcoded)
- **CRUD**: Whether it has create/update/delete mutations (not just read)
- **Backend**: Database tables or edge functions backing this page
- **Status**: `Full CRUD` | `Read + Action` | `Read-only` | `Static UI`

#### Dashboard

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| Admin Dashboard | `/admin` | Static summary cards | No | — | Static UI |
| ImplementationStatus | `/admin/implementation-status` | Hardcoded JSON | No | `implementationStatus.ts` | Static UI |

#### Users & Access

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| UserManagement | `/admin/users` | Supabase query | Yes | `profiles`, `user_roles` | Full CRUD |
| RoleManagement | `/admin/roles` | useRoles hook | Yes | `roles`, `role_permissions` | Full CRUD |
| ActivityLogs | `/admin/logs` | Supabase query (demo fallback) | No | `activity_logs`, `profiles` | Read-only (demo fallback) |

#### Team & Resources

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| EmployeeManagement | `/admin/team/employees` | useEmployeeProfiles | No | `employee_profiles` | Read-only |
| EmployeeProjection | `/admin/team/employee_projection` | Supabase query | No | `employee_profiles`, `departments`, `pods` | Read-only |
| DepartmentManagement | `/admin/team/departments` | useDepartments | No | `departments` | Read-only |

#### EOS Administration

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| AdminEOS | `/admin/eos` | EOS hooks | No | `eos_pods`, `eos_issues` | Read-only (hub) |
| VTOAdmin | `/admin/eos/vto` | useVTO | Yes | `eos_vto` | Full CRUD |
| ScorecardWorkspace | `/admin/eos/scorecards` | Supabase query | Yes | `eos_scorecards`, `eos_scorecard_metrics` | Full CRUD |
| AdminEOSAccountability | `/admin/eos/accountability` | Supabase query | Yes | `accountability_charts`, `gwc_assessments` | Full CRUD |

#### Settings

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| SystemSettings | `/admin/settings` | useAppConfig | Yes | `app_config` + `seed-template-data` edge fn | Full CRUD |
| ProjectStatusSettings | `/admin/settings/project-statuses` | useProjectStatuses | Yes | `project_statuses` | Full CRUD |
| WorkTypesSettings | `/admin/settings/work-types` | useWorkTypes | Yes | `work_types` | Full CRUD |
| ProjectModules | `/admin/settings/project-modules` | useProjectModuleSettings | Yes | `system_settings` | Full CRUD |
| SSOSettings | `/admin/sso-settings` | useSSOConfigurations | Yes | `sso_configurations`, `sso_domain_allowlist` | Full CRUD |

#### Integrations

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| Integrations | `/admin/integrations` | useProvidersGroupedByCategory | No | `integration_providers`, `integration_services` | Read-only |
| ProviderDetail | `/admin/integrations/:slug` | useIntegrationProvider | Yes | `integration_providers` | Full CRUD |
| OAuthCallback | `/admin/integrations/oauth/callback` | Edge function | No | `oauth-exchange-token` edge fn | Read + Action |
| IntegrationAnalytics | `/admin/integrations/analytics` | Supabase query | No | `integration_providers` | Read-only |
| ZoomIntegration | `/admin/integrations/zoom` | Zoom hooks | No | `user_oauth_tokens` | Read-only |
| ZoomMeetings | `/admin/integrations/zoom/meetings` | useMeetings + useSyncZoom | No | `meetings`, `sync-zoom-files` edge fn | Read + Action |
| MicrosoftTeamsIntegration | `/admin/integrations/microsoft-teams` | Teams hooks | No | `user_oauth_tokens` | Read-only |
| TeamsMeetings | `/admin/integrations/microsoft-teams/meetings` | useMeetings + useSyncTeamsMeetings | No | `meetings` | Read + Action |

#### Knowledge Admin

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| KnowledgeAnalytics | `/admin/knowledge/analytics` | Knowledge hooks | No | `knowledge_entries`, `knowledge_embeddings` | Read-only |
| KnowledgeCategories | `/admin/knowledge/categories` | useCategoryTree | Yes | `knowledge_categories` | Full CRUD |
| EmbeddingsExplorer | `/admin/knowledge/embeddings` | useQuery + useMutation | Yes | `embedding_queue`, `knowledge_embeddings` + edge fn | Full CRUD |

#### AI & Automation

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| AIModelManagement | `/admin/ai-models` | Supabase query | Yes | `ai_models`, `ai_providers` | Full CRUD |
| AIUsageAnalytics | `/admin/ai-usage` | Supabase query | No | `ai_usage_logs`, `ai_models`, `profiles` | Read-only |
| MCPServers | `/admin/mcp-servers` | Supabase query | Yes | `mcp_servers` + `execute-mcp-tool`, `verify-mcp-server` edge fns | Full CRUD |

#### Content & Feedback

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| FeedbackManagement | `/admin/feedback` | Supabase query | No | `feedback` | Read-only |
| ProductRoadmap | `/admin/roadmap` | Hardcoded JSON | No | `implementationStatus.ts` | Static UI |

#### Reports

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| ProjectReports | `/admin/reports/projects` | useProjectReports | No | `projects`, `project_statuses`, `project_milestones`, `project_risks` | Read-only |
| ResourceUtilizationReports | `/admin/reports/resource-utilization` | useProductivityRecords | No | `productivity_records`, `departments` | Read-only |
| MeetingAnalytics | `/admin/meeting-analytics` | Supabase query | No | `meetings` | Read-only |

#### System & Deployment

| Page | Route | Data | CRUD | Backend | Status |
|------|-------|------|------|---------|--------|
| DeploymentStatus | `/admin/deployment` | Supabase query | No | `check-environment` edge fn | Read-only |
| EnvironmentValidator | `/admin/environment` | Edge function | No | `check-environment` edge fn | Read-only |
| OnboardingWizard | `/admin/onboarding` | Edge functions | Yes | `promote-first-admin`, `seed-template-data` edge fns | Full CRUD |
| DeploymentChecklist | `/admin/checklist` | Deployment hooks | No | — | Read-only |
| SeedRunner | `/admin/roadmap/seed` | Edge function | No | `run-seed` edge fn | Read + Action |

---

### Summary Counts

| Category | Count |
|----------|-------|
| Total admin routes | 38 |
| Total admin page files | 41 |
| Pages with Full CRUD | 16 |
| Pages with Read + Action | 4 |
| Pages Read-only | 16 |
| Pages Static UI / Placeholder | 2 |

### Pages Needing Fixes

| Page | Issue |
|------|-------|
| ActivityLogs | Uses `@/lib/supabase` import + `(supabase as any)` cast + demo data fallback — table is typed, just needs cleanup |
| AIUsageAnalytics | Uses `@/lib/supabase` import — needs canonical import path |
| Admin Dashboard | Static cards — could pull real counts from modules |
| ProductRoadmap | Hardcoded JSON from shared file |

---

## Full Platform Status (All Modules)

### Per-Module: Frontend + Backend + Edge Functions

#### Platform Core
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 15 pages, 100+ shared components, 42 hooks |
| Database | Done | 87 typed tables + 5 untyped (`sso_configurations`, `sso_domain_allowlist`, `work_types`, `user_agent_personalizations`, `user_knowledge_sources`) |
| Edge Functions | Done | 33 invoked from frontend (of 64 total deployed) |
| Known Issues | — | 8 `(supabase as any)` casts in useAuthConfig |

#### EOS
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 17 user pages + 4 admin, 33 components, 11 hooks |
| Database | Done | 12 tables (okrs, eos_issues, eos_scorecards, eos_vto, etc.) |
| Edge Functions | Done | 3 deployed (extract-meeting-issues, eos-triage-assistant, suggest-okrs) |
| Known Issues | — | 7 `(supabase as any)` casts, 5 AI suggestion components scaffolded but not rendered |

#### Meetings
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 4 pages, 13 components, 10 hooks |
| Database | Done | 9 tables (meetings, meeting_agenda_items, meeting_takeaways, etc.) |
| Edge Functions | Done | 2 invoked (generate-meeting-summary, categorize-meeting) |
| Known Issues | — | 20 `(supabase as any)` casts |

#### Projects
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 5 module pages + 1 client portal, 6 components, 9 hooks |
| Database | Done | 13 tables (projects, project_members, project_milestones, etc.) |
| Edge Functions | Done | 4 deployed (create-client-access, client-dashboard-api, sync-projects-activecollab, sync-projects-jira) |
| Known Issues | — | 3 `(supabase as any)` casts, 2 orphaned backup components |
| Pending | — | Billing/invoicing UI, resource projection charts |

#### Actions
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 4 pages, 8 components, 4 hooks |
| Database | Done | 6 tables (tasks, task_comments, task_streams, etc.) |
| Edge Functions | Partial | 1 deployed (api-v1-tasks) — no AI assistant yet |
| Known Issues | — | Clean module, no type casts |

#### Business Development
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 8 pages (5 module + 3 legacy), 0 module components, 2 hooks (17 exports) |
| Database | Done | 6 tables (deals, deal_activities, deal_comments, contacts, lead_followup_contacts, clients) |
| Edge Functions | None | No edge functions used by this module |
| Known Issues | — | Clean module, no type casts. Client pages in legacy `src/pages/` |
| Pending | — | HubSpot sync, email automation, deal scoring AI |

#### Knowledge Base
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 7 pages, 2 components, 6 hooks |
| Database | Done | 10 tables (knowledge_entries, knowledge_embeddings, unified_documents, etc.) |
| Edge Functions | Done | 5 invoked (knowledge-base, user-knowledge-upload, user-knowledge-process, user-knowledge-drive-sync, unified-knowledge-search) |
| Known Issues | — | 19 `(supabase as any)` casts, 3 orphaned hooks |
| Pending | — | Google Drive file picker testing, Gemini RAG production setup |

#### Productivity
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 4 pages, 0 module components (inline), 3 hooks (14 exports) |
| Database | Done | 7 tables (productivity_records, employee_profiles, departments, pods, pod_members, process_documents, process_categories) |
| Edge Functions | None | No edge functions used by this module |
| Known Issues | — | 1 unused hook (useEmployeeProfiles) |
| Pending | — | CSV import, AI insights, historical trends |

#### Admin
| Layer | Status | Details |
|-------|--------|---------|
| Frontend | Done | 38 routes, 41 page files. 16 Full CRUD, 14 Read-only, 4 Static |
| Database | — | Operates on tables from all other modules |
| Edge Functions | Done | 6 admin-specific (promote-to-admin, promote-first-admin, check-environment, run-seed, seed-template-data, log-activity) |
| Known Issues | — | 2 pages have no backend data (Admin Dashboard, ProductRoadmap). 2 pages use non-standard imports (ActivityLogs, AIUsageAnalytics) |

---

### Backend Totals

| Metric | Count | Status |
|--------|-------|--------|
| Database tables (typed) | 87 | All generated |
| Database tables (untyped) | 5 | `(supabase as any)` casts |
| Database tables (total) | 119 | Includes RLS policies, views |
| Edge functions deployed | 64 | All implemented (no stubs) |
| Edge functions invoked from frontend | 33 | Remaining 31 are API endpoints, webhooks, auto-triggers |

### Deferred to Post-MVP
- Data sync dashboards (HR, HubSpot, ActiveCollab)
- Notification management admin page
- Admin Dashboard real data widgets (replace static cards with live counts)

---

## Developer Task: Shahed — 4-Hour Sprint

**Assigned to:** Shahed
**Modules owned:** Platform Core, Knowledge Base, Admin, AI Agents
**Goal:** Fix import inconsistencies, eliminate `(supabase as any)` casts, clean up orphaned code

### Task 1: Fix non-standard Supabase imports (30 min)

Several admin pages import from `@/lib/supabase` instead of the canonical `@/integrations/supabase/client`. Fix all occurrences:

| File | Line | Current Import | Fix |
|------|------|----------------|-----|
| `src/pages/admin/ActivityLogs.tsx` | 31 | `@/lib/supabase` | `@/integrations/supabase/client` |
| `src/pages/admin/AIUsageAnalytics.tsx` | 30 | `@/lib/supabase` | `@/integrations/supabase/client` |

Also search for any other files using `@/lib/supabase` and fix them.

### Task 2: Fix ActivityLogs — remove `as any` cast and demo fallback (30 min)

`ActivityLogs.tsx` queries the `activity_logs` table using `(supabase as any)` cast, but the table IS in the generated Supabase types. Fix:

1. Change import to `@/integrations/supabase/client`
2. Remove `as any` cast on line 147: `supabase.from("activity_logs" as any)` → `supabase.from("activity_logs")`
3. Remove the `DEMO_LOGS` array and `usingDemoData` state — show empty state instead of fake data
4. Add proper TypeScript types from `Database['public']['Tables']['activity_logs']['Row']`

### Task 3: Regenerate Supabase types for 5 untyped tables (45 min)

5 tables are queried via `(supabase as any)` because they lack generated types. Run `supabase gen types typescript` to regenerate, OR manually add type definitions for:

| Table | Used In | Cast Count |
|-------|---------|------------|
| `sso_configurations` | `useAuthConfig.ts` | 3 |
| `sso_domain_allowlist` | `useAuthConfig.ts` | 2 |
| `work_types` | `useWorkTypes.ts` | 3 |
| `user_agent_personalizations` | Knowledge module hooks | varies |
| `user_knowledge_sources` | Knowledge module hooks | varies |

After regenerating types, update the hooks to remove `(supabase as any)` casts and use proper typed queries.

### Task 4: Fix `(supabase as any)` casts in useAuthConfig (30 min)

`src/hooks/useAuthConfig.ts` has 8 `(supabase as any)` casts for `sso_configurations` and `sso_domain_allowlist`. After Task 3 adds the types:

1. Replace all `(supabase as any).from('sso_configurations')` with `supabase.from('sso_configurations')`
2. Replace all `(supabase as any).from('sso_domain_allowlist')` with `supabase.from('sso_domain_allowlist')`
3. Add proper return types using the generated table types

### Task 5: Clean up orphaned Knowledge hooks (30 min)

3 hooks in the Knowledge module are exported but never imported anywhere:

| Hook | File | Action |
|------|------|--------|
| `useSemanticMemorySearch` | `src/modules/knowledge/hooks/useSemanticMemorySearch.ts` | Remove export or delete file if only export |
| `useGeminiRAG` | `src/modules/knowledge/hooks/useGeminiRAG.ts` | Remove export or delete file if only export |
| `useKnowledgeDocuments` | `src/modules/knowledge/hooks/useKnowledgeDocuments.ts` | Remove export or delete file if only export |

Verify no other file imports these before removing. Run `npx tsc --noEmit` after each removal.

### Task 6: Fix remaining `(supabase as any)` casts in Knowledge module (45 min)

The Knowledge module has 19 `(supabase as any)` casts across its hooks. After Task 3 provides types:

1. Search all files in `src/modules/knowledge/` for `(supabase as any)`
2. Replace with typed `supabase.from(...)` calls
3. Fix any TypeScript errors from the type changes
4. Verify build passes

### Verification

After all tasks, run:
```bash
# Check no @/lib/supabase imports remain
grep -r "@/lib/supabase" src/ --include="*.ts" --include="*.tsx"

# Check remaining (supabase as any) casts (should be ~30 fewer)
grep -rn "(supabase as any)" src/ --include="*.ts" --include="*.tsx" | wc -l

# Verify build
npx tsc --noEmit
```

**Expected outcomes:**
- 0 files importing from `@/lib/supabase`
- ~25 fewer `(supabase as any)` casts (from 57 → ~30)
- ActivityLogs shows real data without demo fallback
- All Knowledge hooks either used or removed
- Clean TypeScript build

---

## Implementation Notes
- All admin routes wrap with `<ProtectedRoute><AdminRoute><AdminLayout>...</AdminLayout></AdminRoute></ProtectedRoute>`
- AdminRoute checks for admin role via AuthContext
- AdminLayout provides admin-specific sidebar navigation
- Navigation defined in `adminNavigation` array in `navigationStructure.ts`
- New tables not in auto-generated Supabase types use `(supabase as any)` cast
- CRUD pages follow: hook with useQuery + useMutation → page with table + dialog + delete confirm
- Reorder uses arrow-based up/down buttons with batch sort_order updates
- System settings use a key-value pattern (category, key, value)
