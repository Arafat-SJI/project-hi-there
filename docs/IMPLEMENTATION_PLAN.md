# Control Tower Framework — Implementation Plan

## Chief Architect Review & Decisions

### Context

Ten architecture blueprint documents describe a mature monolithic application (the original "Control Tower") being decomposed into 9 independent modules. The current framework repo is a **new codebase** at an early stage that will implement these modules in a modular, open-source-friendly way.

### Gap Analysis

| Metric | Documented (Target) | Current Codebase | Gap |
|--------|---------------------|------------------|-----|
| Database tables | ~115 | ~80 | ~35 tables remaining |
| Edge functions | ~225 (54 consolidated) | 54 | Consolidation complete |
| Routes | ~300 | ~120 | ~180 routes remaining |
| Pages | ~247 | ~100 | ~147 pages remaining |
| Components | ~533 | ~200 | ~333 components remaining |
| Hooks | ~296 | ~90 | ~206 hooks remaining |

### Current Codebase Strengths (Keep)

These exist in the current codebase but are NOT in the blueprint docs. They represent newer features that should be preserved:

- **AI Agent Framework** — agent builder, runs, conversations, streaming (`ai_agents`, `ai_agent_runs`)
- **AI Model Management** — provider registry, model management, usage analytics (`ai_models`, `ai_providers`)
- **MCP Server Integration** — Model Context Protocol server management
- **Integration Hub** — generic provider/service/category architecture (`integration_providers`, `integration_services`)
- **Microsoft Teams** — Graph webhooks, channels integration
- **Azure AD / MSAL Authentication** — enterprise SSO
- **Onboarding Wizard** — first-run setup flow
- **Environment Validator** — deployment health checks
- **Deployment Status** — deployment monitoring

---

## Architectural Decisions

### Decision 1: Module Structure

**Choice:** Adopt the `src/modules/` directory structure from Doc 00.

Each module gets its own folder with `routes.tsx`, `pages/`, `components/`, `hooks/`, and `types/`. Shared code lives in `src/shared/` (renamed from current flat `src/` structure).

```
src/
├── modules/
│   ├── platform/     ← Auth, layouts, UI, config (extracted from current src/)
│   ├── eos/          ← NEW
│   ├── meetings/     ← Extend current basic meetings
│   ├── projects/     ← NEW
│   ├── actions/      ← Extend current basic tasks
│   ├── business-dev/ ← NEW
│   ├── knowledge/    ← Extend current basic knowledge
│   ├── productivity/ ← NEW
│   └── admin/        ← Extend current admin
├── shared/
│   ├── components/ui/  ← shadcn/ui (already exists)
│   ├── components/common/ ← shared components
│   ├── contexts/       ← AuthContext, BrandingContext
│   ├── hooks/          ← shared hooks
│   ├── lib/            ← utilities
│   ├── integrations/   ← Supabase client
│   ├── config/         ← NEW: env.ts, modules.ts, api.ts
│   ├── types/          ← shared types
│   └── constants/      ← routes, timezones
├── App.tsx             ← Module route assembler
└── main.tsx
```

### Decision 2: Module Enable/Disable System

**Choice:** Hybrid approach — merge the current `app_config` system with the documented `app_modules` system.

| Layer | Purpose | Source |
|-------|---------|--------|
| `app_config` (existing) | Global feature flags, branding, email, system settings | Keep as-is |
| `app_modules` (new table) | Module registry — which modules are installed/active | Add from docs |
| `user_module_permissions` (new table) | Per-user module access | Add from docs |
| `VITE_MODULE_*` env vars | Build-time module toggles for open-source deployments | Add from docs |

**Runtime flow:**
1. Env vars determine which modules are bundled (build-time)
2. `app_modules` determines which modules are active (runtime, admin-configurable)
3. `user_module_permissions` determines per-user access (runtime)
4. `app_config.features.*` controls granular feature flags within modules (runtime)

### Decision 3: Authentication

**Choice:** Keep multi-auth, make enterprise auth optional.

- **Core:** Supabase Auth (email/password + social providers) — always available
- **Optional:** Azure AD / MSAL — enabled via `VITE_MICROSOFT_CLIENT_ID` env var
- **Future:** Generic OIDC adapter for other identity providers

### Decision 4: Data Source Strategy

**Choice:** Supabase is the core database. External integrations use an adapter pattern.

- Supabase (PostgreSQL + Edge Functions + Auth + Storage) is mandatory
- Each company gets their own Supabase project
- Third-party integrations (HubSpot, ActiveCollab, Zoom, etc.) are optional adapters
- Integration adapter interface allows swapping vendors:
  - `CRMAdapter` → HubSpot (built-in) or Salesforce (community)
  - `ProjectManagementAdapter` → ActiveCollab (built-in) or Jira (community)
  - `VideoAdapter` → Zoom (built-in) or Teams (built-in)
  - `EmailAdapter` → SendGrid (built-in) or SMTP (community)
  - `DriveAdapter` → Google Drive (built-in) or OneDrive (community)

### Decision 5: Edge Function Architecture

**Choice:** Consolidate into RESTful module-scoped functions.

Instead of 225 individual functions, consolidate into ~30-40 module-scoped functions:

```
supabase/functions/
├── _shared/                    ← Shared utilities (keep)
├── api-v1-auth/                ← Auth operations
├── api-v1-eos/                 ← EOS: goals, rocks, issues, scorecards, VTO
├── api-v1-meetings/            ← Meetings: CRUD, series, participants
├── api-v1-projects/            ← Projects: CRUD, members, milestones
├── api-v1-tasks/               ← Tasks/Actions: CRUD, streams, comments
├── api-v1-deals/               ← Deals: CRUD, pipeline, activities
├── api-v1-clients/             ← Clients: CRUD, contacts, documents
├── api-v1-knowledge/           ← Knowledge: CRUD, categories, files
├── api-v1-productivity/        ← Productivity: metrics, records
├── api-v1-admin/               ← Admin operations
├── integration-hubspot/        ← HubSpot sync adapter
├── integration-activecollab/   ← ActiveCollab sync adapter
├── integration-zoom/           ← Zoom sync adapter
├── integration-google-drive/   ← Google Drive adapter
├── integration-gmail/          ← Gmail adapter
├── ai-chat/                    ← AI chat (keep)
├── ai-embeddings/              ← Embedding generation
├── ai-search/                  ← Semantic search
├── ai-agents/                  ← Agent execution (keep)
├── webhooks/                   ← Incoming webhooks
├── cron/                       ← Scheduled jobs
└── notifications/              ← Email/push notifications
```

### Decision 6: Open Source Packaging

**Choice:** Single repo, all modules included, toggle via config.

Installation:
1. Clone repo
2. Create Supabase project
3. Run `supabase db push` (all migrations)
4. Set env vars (Supabase URL, keys, module toggles)
5. `npm run dev`
6. Log in → Admin panel → configure modules

---

## Implementation Phases

### Phase 0: Foundation Restructure (Current → Modular)

Restructure the existing codebase without adding new features. This is the most critical phase — it establishes the modular architecture that everything else builds on.

#### 0.1 — Create Module Directory Structure
- Create `src/modules/` and `src/shared/` directories
- Move shared components: `src/components/ui/` → `src/shared/components/ui/`
- Move shared components: `src/components/common/` → `src/shared/components/common/`
- Move contexts: `src/contexts/` → `src/shared/contexts/`
- Move shared hooks: `src/hooks/useAppConfig.ts`, `useFeatureFlags.ts` → `src/shared/hooks/`
- Move integrations: `src/integrations/` → `src/shared/integrations/`
- Move lib: `src/lib/` → `src/shared/lib/`
- Move types: `src/types/` → `src/shared/types/`
- Move constants: `src/constants/` → `src/shared/constants/`
- Update all import paths (the `@/` alias helps here)

#### 0.2 — Create Platform Module
- Create `src/modules/platform/` with `routes.tsx`, `index.ts`
- Move auth pages: Login, Signup, AuthCallback → `src/modules/platform/pages/`
- Move layout components → `src/modules/platform/components/`
- Move auth components → `src/modules/platform/components/auth/`
- Move dashboard page → `src/modules/platform/pages/`
- Move profile, settings, feedback pages → `src/modules/platform/pages/`
- Export `platformRoutes` from `src/modules/platform/routes.tsx`

#### 0.3 — Create Config System
- Create `src/shared/config/env.ts` — environment variable abstraction
- Create `src/shared/config/modules.ts` — module registry with `isModuleEnabled()`
- Create `src/shared/config/api.ts` — API endpoint definitions
- Update `ModuleRoute.tsx` to check both feature flags AND module registry

#### 0.4 — Refactor App.tsx to Module Router
- Replace monolithic route imports with module route imports
- Implement conditional route loading based on `isModuleEnabled()`
- Each module exports its routes from `routes.tsx`

#### 0.5 — Database: Add Module Tables
- Migration: Create `app_modules` table (name, slug, description, is_active, category, icon, sort_order)
- Migration: Create `user_module_permissions` table (user_id, module_id, granted_by)
- Migration: Create `system_settings` table (category, key, value, description)
- Migration: Seed default module entries
- RPC: Create `get_user_modules` function

#### 0.6 — Create Navigation Data File
- Create `src/shared/data/navigationStructure.ts`
- Define `mainNavigation` array with `moduleName` field for permission filtering
- Define `adminNavigation` array
- Update `AppSidebar.tsx` and `AdminSidebar.tsx` to use this data file
- Navigation items filter automatically based on enabled modules

**Exit Criteria:** Existing functionality works identically. Code is organized into modules. Module toggle system works. No new features yet.

> **STATUS: COMPLETE** — Config system (`env.ts`, `modules.ts`), module routes, `App.tsx` refactored as module assembler, `navigationStructure.ts` as single navigation source, `app_modules` + `user_module_permissions` + `system_settings` tables created. All existing functionality preserved.

---

### Phase 1: Actions Module (Simplest Standalone Module)

The Actions module (standalone tasks) is the simplest module with no cross-module dependencies. Building it first validates the modular architecture pattern.

#### 1.1 — Database Schema
```sql
-- tasks_v2: standalone tasks
CREATE TABLE tasks_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assignee_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  stream_id UUID REFERENCES task_streams(id),
  parent_id UUID REFERENCES tasks_v2(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- task_comments_v2: threaded comments
CREATE TABLE task_comments_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks_v2(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES task_comments_v2(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- task_streams: workspace organization
CREATE TABLE task_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- task_stream_members: stream membership
CREATE TABLE task_stream_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES task_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- task_categories, task_attachments, task_contributors
```

#### 1.2 — Module Structure
```
src/modules/actions/
├── index.ts
├── routes.tsx
├── pages/
│   ├── TasksPage.tsx        (Today, This Week, Overdue, Delegated, All)
│   ├── TaskDetailPage.tsx   (detail with comments, subtasks)
│   ├── StreamsPage.tsx      (stream listing)
│   └── StreamTasksPage.tsx  (tasks by stream)
├── components/
│   ├── TasksTable.tsx
│   ├── CreateTaskDialog.tsx
│   ├── EditTaskDialog.tsx
│   ├── SubTasksList.tsx
│   ├── TaskAIAssistant.tsx
│   ├── comments/
│   └── streams/
├── hooks/
│   ├── useTasksV2.ts
│   ├── useTaskCommentsV2.ts
│   ├── useAccessibleStreams.ts
│   └── useTaskAI.ts
└── types/
    └── tasks.ts
```

#### 1.3 — Edge Functions
- `api-v1-tasks` — RESTful CRUD for tasks, comments, streams
- `task-ai-assistant` — AI-powered task suggestions

#### 1.4 — Admin Integration
- Add task stream management to admin panel
- Add task creation settings page

**Exit Criteria:** Users can create/edit/complete tasks, organize by streams, view Today/Week/Overdue/Delegated, add comments and subtasks.

> **STATUS: COMPLETE (UI)** — 4 pages, 8 components, 3 hooks, 6 DB tables. All CRUD functional. **PENDING:** Edge functions (task API, AI assistant, ActiveCollab sync), task categories UI, subtask creation UI.

---

### Phase 2: EOS Module

#### 2.1 — Database Schema (12 tables)
- `eos_goals`, `eos_rocks` (legacy)
- `okrs`, `okr_key_results`, `okr_check_ins`
- `eos_issues`, `eos_issue_suggestions`
- `eos_scorecards`, `eos_scorecard_metrics`
- `accountability_charts`, `accountability_responsibilities`, `gwc_assessments`
- `eos_vto`

#### 2.2 — Module Structure
```
src/modules/eos/
├── index.ts
├── routes.tsx
├── pages/           (24 pages)
│   ├── EOSHub.tsx
│   ├── VTO.tsx
│   ├── OKRs.tsx
│   ├── Scorecard.tsx
│   ├── Accountability.tsx
│   └── issues/      (8 issue pages)
├── components/
│   ├── okrs/        (16 components)
│   ├── issues/      (24 components including AI)
│   ├── accountability/ (14 components)
│   └── scorecard/   (2 components)
├── hooks/           (15 hooks)
└── types/           (3 type files)
```

#### 2.3 — Edge Functions (12)
- `api-v1-eos` — EOS goals, rocks, issues, scorecards, VTO
- `api-v1-okrs` — OKR CRUD and key results
- AI functions: triage assistant, pod health analyzer, pattern detective, quarterly digest

#### 2.4 — Admin Integration
- EOS admin hub, VTO admin, accountability admin, scorecard workspace
- EOS system config, email templates

**Exit Criteria:** V/TO working, OKRs with key results and check-ins, issues with pod organization and AI triage, scorecard with metrics, accountability chart with GWC assessments.

> **STATUS: COMPLETE (UI)** — 9 pages, 12 components, 6 hooks, 12 DB tables. V/TO, OKRs, Issues, Scorecard, Accountability all functional. **PENDING:** Edge functions (12), AI triage/suggestions, admin EOS config pages.

---

### Phase 3: Meetings Module

#### 3.1 — Database Schema (9 tables)
- `meetings_v2`, `meeting_agenda_items`, `meeting_takeaways`
- `meeting_participants`, `meeting_transcripts`, `meeting_series`
- `meeting_categorizations`, `meeting_files`, `meeting_assignments`

#### 3.2 — Module Structure
```
src/modules/meetings/
├── index.ts
├── routes.tsx
├── pages/           (7 pages)
├── components/
│   ├── meetings-v2/ (30 components)
│   ├── meeting/     (12 components)
│   └── transcripts/
├── hooks/           (30 hooks)
└── types/
    └── meetings.ts
```

#### 3.3 — Edge Functions (~15 consolidated from 33)
- `api-v1-meetings` — Meeting CRUD, agenda, takeaways, participants
- `api-v1-transcripts` — Transcript management
- `integration-zoom` — Zoom sync, recordings, transcripts
- AI: summarize, extract tasks, categorize, efficiency analysis

#### 3.4 — Cross-Module Hooks
- `useConvertTakeawayToTask` → connects to Actions module (optional)
- `useProjectMeetings` → connects to Projects module (optional)

**Exit Criteria:** Create/edit meetings, recurring series, agendas with takeaways, transcript processing, AI summaries, Zoom integration (optional).

> **STATUS: COMPLETE (UI + Zoom Integration)** — 3 new V2 pages, 5 components, 4 hooks, 7 new DB tables. Agenda, takeaways, participants, recurring series all functional. Zoom integration admin page (org-level config), sync-zoom-files and zoom-transcript-processing edge functions deployed. **PENDING:** Edge functions (AI summarization, categorization, task extraction), transcript upload UI.

---

### Phase 4: Knowledge Base Module

#### 4.1 — Database Schema (9 tables)
- `knowledge_categories`, `knowledge_sources`, `knowledge_files`
- `knowledge_embeddings`, `user_knowledge_files`, `user_knowledge_embeddings`
- `embedding_queue`, `common_knowledge`, `vector_search_logs`

#### 4.2 — Module Structure
```
src/modules/knowledge/
├── index.ts
├── routes.tsx
├── pages/           (20 pages)
├── components/
│   ├── knowledge/   (14 components)
│   └── user-knowledge/ (3 components)
├── hooks/           (20 hooks)
└── types/
    └── knowledgeBase.ts
```

#### 4.3 — Edge Functions (~10 consolidated from 22)
- `api-v1-knowledge` — Knowledge CRUD, categories, files
- `ai-embeddings` — Generate embeddings, process queue
- `ai-search` — Semantic search, unified knowledge search
- `integration-google-drive` — Google Drive sync (optional)

**Exit Criteria:** Upload/manage knowledge files, categories, vector embeddings for semantic search, RAG queries, personal knowledge, Google Drive integration (optional).

> **STATUS: COMPLETE** — 10 DB tables, 20+ hooks, 7 pages (list, upload, detail, category, personal, semantic search, form), Semantic Search page with vector/text toggle, Embeddings Explorer admin page, 10+ edge functions (knowledge-base, api-v1-documents, user-knowledge-upload/process/drive-sync, semantic-search, unified-knowledge-search, generate-embeddings, auto-embed-*, gemini-rag-query). Personal Knowledge wired to real Supabase queries. **PENDING:** Google Drive file picker integration testing, Gemini RAG production setup.

---

### Phase 5: Projects Module

#### 5.1 — Database Schema (15 tables)
- `projects`, `project_statuses`, `project_favorites`, `project_backups`
- `project_members`, `project_comments`, `project_milestones`
- `project_invoices`, `project_billing`, `project_files`
- `project_risks`, `project_checklists`
- `resource_projections`, `rp_teams`

#### 5.2 — Module Structure
```
src/modules/projects/
├── index.ts
├── routes.tsx
├── pages/                (11 pages)
├── components/
│   ├── projects/         (65+ components)
│   ├── resourceProjection/ (31 components)
│   └── client-portal/    (6 components)
├── hooks/                (48 hooks)
├── api/                  (7 API files)
└── types/
```

#### 5.3 — Edge Functions (~12 consolidated from 45)
- `api-v1-projects` — Project CRUD, members, milestones, billing
- `integration-activecollab` — ActiveCollab sync (optional adapter)
- AI: project analysis, issue extraction, weekly reports
- Resource: sync, utilization

#### 5.4 — Cross-Module Integration
- Meetings tab → uses meetings module (optional)
- Knowledge tab → uses knowledge module (optional)
- Client data → uses business-dev module (optional)

**Exit Criteria:** Project CRUD with tab-based detail, milestones, billing, file management, resource projection, client portal.

> **STATUS: COMPLETE (UI + Integrations + Real Data)** — 4 pages (list, form, detail, client portal), 8 hooks all wired to real Supabase, 13 DB tables. Full CRUD with create/edit/delete, milestones, members, risks, comments. Client portal with PBKDF2 auth (ClientPortalDashboard, 6 components). ActiveCollab and Jira sync edge functions deployed. **IntegrationsTab** wired to real `organization_integrations` + `integration_providers` (connection badges, logos, sync times). **TasksTab** wired to real `tasks` via project→client_id lookup (priority badges, assigned users). Admin pages: ProjectModules, WorkTypes, EmployeeProjection, ProjectReports, ResourceUtilization. **PENDING:** File upload, billing/invoicing UI, resource projection charts, ProjectKnowledgePage.

---

### Phase 6: Business Development Module

#### 6.1 — Database Schema (16 tables)
- `deals`, `deal_activities`, `deal_comments`, `deal_documents`, `deal_engagements`, `deal_checklists`
- `clients`, `client_contacts`, `client_documents`
- `contacts`, `contact_communications`
- `lead_followup_contacts`, `scheduled_emails`, `email_rules`
- `hubspot_sync_queue`, `hubspot_sync_logs`

#### 6.2 — Module Structure
```
src/modules/business-dev/
├── index.ts
├── routes.tsx
├── pages/                (42 pages)
├── components/           (134+ components across 10 dirs)
├── hooks/                (68 hooks)
├── api/
└── types/
```

#### 6.3 — Edge Functions (~15 consolidated from 75)
- `api-v1-deals` — Deal CRUD, pipeline, activities
- `api-v1-clients` — Client CRUD, contacts, documents
- `api-v1-contacts` — Contact management
- `api-v1-leads` — Lead follow-up
- `integration-hubspot` — HubSpot sync adapter (optional)
- `integration-gmail` — Gmail ingestion (optional)
- AI: deal scoring, deal coaching, email drafting, client research

**Exit Criteria:** Deal pipeline (Lead→Won/Lost), client management, contacts, lead follow-up, email integration, HubSpot sync (optional).

> **STATUS: COMPLETE (UI)** — 4 pages (pipeline, form, detail, contacts), 2 hooks (deals CRUD + contacts CRUD), 7 DB tables. Full deal CRUD with pipeline view, stage transitions, edit/delete. Contact creation + listing. Legacy client pages routed. **PENDING:** Contact detail/edit page, HubSpot sync, email automation, lead scoring AI.

---

### Phase 7: Productivity Module

#### 7.1 — Database Schema (10 tables)
- `productivity_records`, `employee_profiles`, `departments`
- `pods`, `pod_members`, `leave_events`
- `process_documents`, `process_categories`
- `productivity_alerts`, `ai_productivity_insights`

#### 7.2 — Module Structure
```
src/modules/productivity/
├── index.ts
├── routes.tsx
├── pages/            (13 pages)
├── components/
│   ├── productivity/ (25 components)
│   ├── employee/     (13 components)
│   └── process/      (2 components)
├── hooks/            (19 hooks)
└── types/
```

#### 7.3 — Edge Functions (~6)
- `api-v1-productivity` — Productivity metrics, records
- `api-v1-employees` — Employee management
- AI: productivity insights, weekly digest
- Import: CSV import, HR sync

**Exit Criteria:** Productivity dashboard with department/pod views, employee detail, process documentation, CSV import, AI insights.

> **STATUS: COMPLETE (UI)** — 3 pages (dashboard, employee detail, process docs), 3 hooks, 10 DB tables + 6 seeded process categories. **PENDING:** Process doc create/edit form, CSV import, charts (dept trends, heatmap), pod breakdown, edge functions (HR sync, AI insights, weekly digest).

---

### Phase 8: Admin Module (Iterative — grows with each phase)

The Admin module is built incrementally. Each phase adds the admin pages for its module.

| Phase | Admin Features Added |
|-------|---------------------|
| Phase 0 | Module management, user management (already exists) |
| Phase 1 | Task streams, task creation settings |
| Phase 2 | EOS admin hub, VTO, accountability, scorecard workspace |
| Phase 3 | Meeting rules, meeting analytics |
| Phase 4 | Knowledge dashboard, processing queue, embedding management |
| Phase 5 | Project statuses, work types, project modules, reports |
| Phase 6 | HubSpot sync, deal matching, email templates |
| Phase 7 | Employee management, productivity import |
| Final | Full admin: integrations hub, system settings, audit logs, notifications |

---

> **STATUS: IN PROGRESS** — 30+ admin routes, 30+ admin pages. Key pages built and functional:
> - **Team:** EmployeeManagement, DepartmentManagement
> - **Knowledge:** KnowledgeAnalytics, KnowledgeCategories, EmbeddingsExplorer
> - **Integrations:** ZoomIntegration, ZoomMeetings
> - **Settings:** ProjectStatusSettings (full CRUD + color picker + reorder), ProjectModules, WorkTypesSettings (full CRUD + category + billable flag + rates + reorder)
> - **Reports:** ProjectReports (summary cards + real Supabase aggregates), ResourceUtilizationReports (dept bar chart, employee table, billable ratio, efficiency, filters)
> - **System:** SeedRunner, ImplementationStatus dashboard
> - **PENDING:** EOS admin config, data sync dashboards, notification management, EmployeeProjection.

---

## Integration Adapter Architecture

For open-source flexibility, external integrations follow an adapter pattern:

```typescript
// src/shared/integrations/adapters/crm.ts
interface CRMAdapter {
  name: string;
  syncDeals(options: SyncOptions): Promise<SyncResult>;
  syncContacts(options: SyncOptions): Promise<SyncResult>;
  syncCompanies(options: SyncOptions): Promise<SyncResult>;
  testConnection(): Promise<boolean>;
}

// src/modules/business-dev/integrations/hubspot.ts
class HubSpotAdapter implements CRMAdapter { ... }

// Community contribution:
// src/modules/business-dev/integrations/salesforce.ts
class SalesforceAdapter implements CRMAdapter { ... }
```

**Adapter interfaces to define:**

| Interface | Built-in | Community |
|-----------|----------|-----------|
| `CRMAdapter` | HubSpot | Salesforce, Pipedrive |
| `ProjectManagementAdapter` | ActiveCollab | Jira, Asana, Linear |
| `VideoConferenceAdapter` | Zoom | Microsoft Teams, Google Meet |
| `EmailSendAdapter` | SendGrid | SMTP, Mailgun, SES |
| `EmailIngestAdapter` | Gmail | Outlook, IMAP |
| `FileStorageAdapter` | Google Drive | OneDrive, Dropbox, S3 |
| `CalendarAdapter` | Google Calendar | Outlook Calendar |
| `HRAdapter` | CSV Import | BambooHR, Workday |
| `AIProviderAdapter` | OpenAI | Anthropic, Gemini, local LLMs |

---

## Database Migration Strategy

Migrations are organized by module and run in dependency order:

```
supabase/migrations/
├── 00_core/
│   ├── 001_profiles.sql          (already exists)
│   ├── 002_app_config.sql        (already exists)
│   ├── 003_app_modules.sql       (new)
│   ├── 004_user_module_permissions.sql (new)
│   └── 005_system_settings.sql   (new)
├── 01_actions/
│   ├── 001_tasks_v2.sql
│   ├── 002_task_comments_v2.sql
│   ├── 003_task_streams.sql
│   └── 004_task_categories.sql
├── 02_eos/
│   ├── 001_okrs.sql
│   ├── 002_eos_issues.sql
│   ├── 003_eos_scorecards.sql
│   ├── 004_accountability.sql
│   └── 005_eos_vto.sql
├── 03_meetings/
│   ├── 001_meetings_v2.sql
│   ├── 002_meeting_agenda.sql
│   └── 003_meeting_series.sql
├── 04_knowledge/
│   ├── 001_knowledge_categories.sql
│   ├── 002_knowledge_files.sql
│   └── 003_knowledge_embeddings.sql
├── 05_projects/
│   ├── 001_projects.sql
│   ├── 002_project_billing.sql
│   └── 003_resource_projections.sql
├── 06_business_dev/
│   ├── 001_deals.sql
│   ├── 002_clients.sql
│   └── 003_contacts.sql
├── 07_productivity/
│   ├── 001_productivity_records.sql
│   ├── 002_employee_profiles.sql
│   └── 003_process_documents.sql
└── 08_admin/
    ├── 001_integration_secrets.sql
    ├── 002_audit_logs.sql
    └── 003_scheduled_jobs.sql
```

All migrations run on `supabase db push`. Module-specific tables are created regardless of whether the module is enabled — the cost is negligible, and it simplifies deployment.

---

## Module Dependency Graph

```
Platform Core (Phase 0)
   ↑
   ├── Actions (Phase 1) ─── standalone
   ├── EOS (Phase 2) ─── standalone
   ├── Meetings (Phase 3) ─── standalone
   │      ↑
   ├── Knowledge Base (Phase 4) ─── standalone
   │      ↑                          (optionally embeds meetings)
   ├── Projects (Phase 5) ──────── optional: Meetings, Knowledge, Business Dev
   │      ↑
   ├── Business Development (Phase 6) ── optional: Meetings, Knowledge
   │      ↑
   ├── Productivity (Phase 7) ─── standalone
   │
   └── Admin (Phase 8) ─── imports settings from ALL modules
```

**Cross-module integration rule:** Modules must function independently. Cross-module features (e.g., "project meetings tab") use optional dynamic imports and degrade gracefully when the dependency module is disabled.

```typescript
// Example: Projects module optionally uses Meetings
const MeetingsTab = isModuleEnabled('meetings')
  ? lazy(() => import('@/modules/meetings/components/ProjectMeetingsTab'))
  : () => <EmptyState message="Enable Meetings module to see project meetings" />;
```

---

## Open Source Release Checklist

Before v1.0 release:

- [ ] All module toggles work (enable/disable any module without errors)
- [ ] No hardcoded vendor credentials
- [ ] All integration secrets stored via encrypted `integration_secrets` table
- [ ] `.env.example` documents all variables with descriptions
- [ ] Setup wizard handles first-run configuration
- [ ] Database migrations run cleanly on fresh Supabase project
- [ ] No SJ Innovation-specific branding in codebase (fully configurable)
- [ ] README with installation instructions
- [ ] License file (determine: MIT, Apache 2.0, or AGPL)
- [ ] Contributing guide
- [ ] Docker Compose option for local development
- [ ] All AI features work with OpenAI (primary) and gracefully degrade without it
- [ ] Demo seed data for quick evaluation

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Module refactoring breaks existing features | High | Phase 0 has comprehensive testing before proceeding |
| Import path migration causes regressions | Medium | Use codemod scripts, run TypeScript compiler after each move |
| Cross-module optional deps create complexity | Medium | Strict interface contracts, EmptyState fallbacks |
| 115 database tables is over-engineered | Medium | Review each table during implementation — skip unused ones |
| Edge function cold starts at scale | Low | Consolidate into fewer, larger functions (already planned) |
| Open source contributors need clear guidelines | Medium | Document module creation pattern as a template |

---

## Summary

**Total estimated scope:** 8 phases covering 9 modules, ~97 database tables, ~30 edge functions (consolidated), and ~300 routes.

**Recommended build order:**
1. Phase 0 — Foundation restructure (no new features, validates architecture)
2. Phase 1 — Actions (validates module pattern with simplest module)
3. Phase 2 — EOS (first business-value module)
4. Phase 3 — Meetings (standalone, needed by later phases)
5. Phase 4 — Knowledge Base (intelligence layer, needed by Projects/BD)
6. Phase 5 — Projects (largest module, depends on 3 & 4)
7. Phase 6 — Business Development (second largest, depends on 3 & 4)
8. Phase 7 — Productivity (standalone, lower priority)
9. Phase 8 — Admin (iterative throughout)

**Open-source v1 target:** Phases 0-4 (Platform + Actions + EOS + Meetings + Knowledge Base) — this gives a functional platform with the core business modules that can stand on its own.
