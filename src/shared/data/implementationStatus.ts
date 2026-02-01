/**
 * Implementation Tracker — Single source of truth for all module status.
 *
 * Updated by developers after each batch of work.
 * Rendered at /admin/implementation-status for the whole team.
 *
 * Status values:
 *   "done"       — Built, code-reviewed, merged
 *   "qa-ready"   — Built and pushed, ready for QA testing
 *   "in-progress" — Currently being worked on
 *   "planned"    — Scoped and assigned, not started
 *   "blocked"    — Waiting on a dependency
 *   "not-started" — Not yet scoped
 *
 * Pipeline (4-phase delivery):
 *   Development → QA (via Lovable QA module) → Data Seeding → Sign-off (Jairaj)
 */

export type ItemStatus = "done" | "qa-ready" | "in-progress" | "planned" | "blocked" | "not-started";

export type PipelineStatus = "not-started" | "in-progress" | "done" | "blocked";

export interface PipelinePhase {
  status: PipelineStatus;
  owner?: string;
  notes?: string;
}

export interface Pipeline {
  development: PipelinePhase;
  qa: PipelinePhase;
  dataSeeding: PipelinePhase;
  signOff: PipelinePhase;
}

export interface TeamMember {
  id: string;
  name: string;
  modules: string[];
}

export interface StatusItem {
  name: string;
  status: ItemStatus;
  notes?: string;
}

export interface DocReference {
  title: string;
  path: string;
  description: string;
}

export interface ModuleStatus {
  id: string;
  name: string;
  phase: number;
  owner: string;
  summary: string;
  docs: DocReference[];
  pipeline: Pipeline;
  database: { tables: number; status: ItemStatus; notes?: string };
  types: { status: ItemStatus };
  routes: { status: ItemStatus };
  navigation: { status: ItemStatus };
  pages: StatusItem[];
  hooks: StatusItem[];
  components: StatusItem[];
  edgeFunctions: StatusItem[];
  qaChecklist: { description: string; tested: boolean; approvedBy?: string }[];
  nextSteps: string[];
  blockers?: string[];
}

// ─── Team ──────────────────────────────────────────────────────────────────────

export const TEAM: TeamMember[] = [
  { id: "shahed", name: "Shahed", modules: ["platform", "knowledge", "admin", "ai-agents"] },
  { id: "abesh", name: "Abesh", modules: ["actions", "eos", "meetings"] },
  { id: "zia", name: "Zia", modules: ["projects", "business-dev", "productivity"] },
];

export const SIGN_OFF_OWNER = "Jairaj";

// ─── Last updated: 2026-02-01 ─────────────────────────────────────────────────

export const implementationStatus: ModuleStatus[] = [
  // ── Phase 0: Foundation ──────────────────────────────────────────────────────
  {
    id: "platform",
    name: "Platform Core",
    phase: 0,
    owner: "Shahed",
    summary: "Auth, layout, routing, module access system, config, shared UI. Fully complete.",
    pipeline: {
      development: { status: "done", owner: "Shahed" },
      qa: { status: "not-started", owner: "Shahed", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Shahed", notes: "Seed: roles, default settings, sample users" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Platform Core Blueprint", path: "docs/02-modules/01-platform-core.md", description: "Pages, components, hooks, routes, DB tables for platform core" },
      { title: "Architecture Overview", path: "docs/01-architecture/00-architecture-overview.md", description: "V2 architecture: 4-layer framework, component hierarchy, AI, integrations" },
      { title: "Implementation Plan", path: "docs/IMPLEMENTATION_PLAN.md", description: "Chief Architect review: gap analysis, 8 phases, architectural decisions" },
    ],
    database: { tables: 8, status: "done", notes: "profiles, app_modules, user_module_permissions, system_settings, user_roles, announcements, feedback, sessions" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "Dashboard", status: "done" },
      { name: "Profile / Settings", status: "done" },
      { name: "Login / Register / Forgot Password", status: "done" },
    ],
    hooks: [
      { name: "useAuth / useFeatureFlags / useModuleAccess", status: "done" },
      { name: "useBranding / useToast", status: "done" },
    ],
    components: [
      { name: "DashboardLayout / AppSidebar / AdminSidebar", status: "done" },
      { name: "ModuleRoute / ProtectedRoute / AdminRoute", status: "done" },
      { name: "shadcn/ui component library (49 components)", status: "done" },
    ],
    edgeFunctions: [],
    qaChecklist: [
      { description: "Login/logout flow works", tested: true, approvedBy: "—" },
      { description: "Module toggle in app_modules hides/shows sidebar items", tested: false },
      { description: "Feature flags gate routes correctly", tested: false },
      { description: "Admin-only routes reject non-admin users", tested: false },
    ],
    nextSteps: [],
  },

  // ── Phase 1: Actions ─────────────────────────────────────────────────────────
  {
    id: "actions",
    name: "Actions (Tasks & Streams)",
    phase: 1,
    owner: "Abesh",
    summary: "Task CRUD, streams, comments, subtasks. Core flows complete.",
    pipeline: {
      development: { status: "done", owner: "Abesh" },
      qa: { status: "not-started", owner: "Abesh", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Abesh", notes: "Seed: 10 tasks, 3 streams, sample comments" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Actions Blueprint", path: "docs/02-modules/05-actions.md", description: "8 pages, 22 components, 16 hooks, 7 tables, 12 edge functions" },
    ],
    database: { tables: 6, status: "done", notes: "task_streams, task_stream_members, task_categories, task_comments, task_attachments, task_contributors" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "TasksPage — list with filters", status: "qa-ready" },
      { name: "TaskDetailPage — detail with comments", status: "qa-ready" },
      { name: "StreamsPage — stream listing", status: "qa-ready" },
      { name: "StreamTasksPage — tasks within a stream", status: "qa-ready" },
    ],
    hooks: [
      { name: "useTasksV2 — CRUD, filters", status: "done" },
      { name: "useTaskComments — comment thread", status: "done" },
      { name: "useTaskStreams — stream CRUD + members", status: "done" },
    ],
    components: [
      { name: "TasksTable, CreateTaskDialog, TaskFiltersBar, TaskViewTabs", status: "done" },
      { name: "SubTasksList, CommentThread", status: "done" },
      { name: "StreamCard, CreateStreamDialog", status: "done" },
    ],
    edgeFunctions: [
      { name: "Task API (api-v1-tasks)", status: "not-started" },
      { name: "AI task assistant", status: "not-started" },
      { name: "ActiveCollab sync", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Create a task from /tasks, verify it appears in the list", tested: false },
      { description: "Open task detail, add a comment, verify it persists", tested: false },
      { description: "Create a stream, assign tasks to it, verify stream view", tested: false },
      { description: "Filter tasks by status and assignee", tested: false },
      { description: "Delete a task and verify removal", tested: false },
    ],
    nextSteps: [
      "Add task categories CRUD",
      "Add subtask creation UI",
      "Implement task assignment notifications (edge function)",
    ],
  },

  // ── Phase 2: EOS ─────────────────────────────────────────────────────────────
  {
    id: "eos",
    name: "EOS (V/TO, OKRs, Issues, Scorecard, Accountability)",
    phase: 2,
    owner: "Abesh",
    summary: "Full EOS framework. Largest module: 9 pages, 12 components, 6 hooks.",
    pipeline: {
      development: { status: "done", owner: "Abesh" },
      qa: { status: "not-started", owner: "Abesh", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Abesh", notes: "Seed: VTO entries, 5 OKRs, 10 issues, scorecard metrics, org chart" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "EOS Blueprint", path: "docs/02-modules/02-eos.md", description: "24 pages, 40+ components, 15 hooks, 12 tables, 12 edge functions" },
    ],
    database: { tables: 12, status: "done", notes: "eos_pods, eos_vto, okrs, okr_key_results, okr_check_ins, eos_issues, eos_issue_suggestions, eos_scorecards, eos_scorecard_metrics, accountability_charts, accountability_responsibilities, gwc_assessments" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "EOSHubPage — module landing", status: "qa-ready" },
      { name: "VTOPage — vision/traction organizer", status: "qa-ready" },
      { name: "OKRsPage — OKR listing", status: "qa-ready" },
      { name: "OKRDetailDialog — key results + check-ins", status: "qa-ready" },
      { name: "IssuesPage — IDS issue tracker", status: "qa-ready" },
      { name: "IssueDetailPage — issue detail", status: "qa-ready" },
      { name: "ScorecardPage — scorecard metrics", status: "qa-ready" },
      { name: "AccountabilityPage — org chart", status: "qa-ready" },
      { name: "MyAccountabilityPage — personal view", status: "qa-ready" },
    ],
    hooks: [
      { name: "useVTO — vision/traction CRUD", status: "done" },
      { name: "useOKRs — OKR + key results + check-ins", status: "done" },
      { name: "useEOSIssues — issue tracker CRUD", status: "done" },
      { name: "useScorecard — scorecard + metrics", status: "done" },
      { name: "useAccountability — org chart + responsibilities", status: "done" },
      { name: "useEOSPods — pod management", status: "done" },
    ],
    components: [
      { name: "VTOSection", status: "done" },
      { name: "OKRCard, KeyResultProgress, CreateOKRDialog, CheckInDialog", status: "done" },
      { name: "IssuesTable, IssueStatsCards, CreateIssueDialog, IssueFiltersBar", status: "done" },
      { name: "ScorecardMetricsTable", status: "done" },
      { name: "OrgTree, GWCBadge", status: "done" },
    ],
    edgeFunctions: [
      { name: "extract-meeting-issues", status: "not-started" },
      { name: "suggest-okrs", status: "not-started" },
      { name: "eos-triage-assistant", status: "not-started" },
      { name: "quarterly-digest", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Navigate /eos hub and verify all section links work", tested: false },
      { description: "Edit V/TO sections and verify persistence", tested: false },
      { description: "Create an OKR, add key results, record check-ins", tested: false },
      { description: "Create an issue, change priority, resolve it", tested: false },
      { description: "View scorecard metrics table with data", tested: false },
      { description: "View accountability chart and GWC badges", tested: false },
    ],
    nextSteps: [
      "AI issue suggestions from meeting transcripts (needs edge function)",
      "OKR permissions (owner vs viewer)",
      "Admin EOS configuration pages",
    ],
  },

  // ── Phase 3: Meetings ────────────────────────────────────────────────────────
  {
    id: "meetings",
    name: "Meetings V2",
    phase: 3,
    owner: "Abesh",
    summary: "Extended meetings with agenda, takeaways, participants, recurring series.",
    pipeline: {
      development: { status: "done", owner: "Abesh" },
      qa: { status: "not-started", owner: "Abesh", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Abesh", notes: "Seed: 5 meetings, agenda items, recurring series, sample participants" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Meetings Blueprint", path: "docs/02-modules/03-meetings.md", description: "7 pages, 46 components, 30 hooks, 9 tables, 33 edge functions" },
    ],
    database: { tables: 7, status: "done", notes: "meeting_series, meeting_agenda_items, meeting_takeaways, meeting_participants, meeting_transcripts, meeting_categorizations, meeting_assignments" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "MeetingsSchedulePage — list + calendar toggle", status: "qa-ready" },
      { name: "MeetingDetailV2Page — tabbed detail", status: "qa-ready" },
      { name: "MeetingSeriesPage — recurring series", status: "qa-ready" },
    ],
    hooks: [
      { name: "useMeetingAgenda — CRUD + reorder", status: "done" },
      { name: "useMeetingTakeaways — CRUD + toggle", status: "done" },
      { name: "useMeetingParticipants — CRUD + attendance", status: "done" },
      { name: "useRecurringMeetings — series CRUD", status: "done" },
    ],
    components: [
      { name: "AgendaTab, TakeawaysTab, ParticipantsTab", status: "done" },
      { name: "MeetingsCalendar", status: "done" },
      { name: "SeriesCard", status: "done" },
    ],
    edgeFunctions: [
      { name: "Meeting summarization AI", status: "not-started" },
      { name: "Categorization engine", status: "not-started" },
      { name: "Task extraction from transcripts", status: "not-started" },
      { name: "Zoom/Teams sync", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Create a meeting, add agenda items, reorder them", tested: false },
      { description: "Add takeaways and toggle completion", tested: false },
      { description: "Add participants and mark attendance", tested: false },
      { description: "Create a recurring series", tested: false },
      { description: "Switch between list and calendar views", tested: false },
    ],
    nextSteps: [
      "Meeting efficiency scoring (needs edge function)",
      "Transcript upload and AI summarization",
      "Zoom/Teams calendar sync",
    ],
  },

  // ── Phase 4: Knowledge Base ──────────────────────────────────────────────────
  {
    id: "knowledge",
    name: "Knowledge Base",
    phase: 4,
    owner: "Shahed",
    summary: "Database and types ready. UI leverages existing legacy pages. Vector search tables prepared.",
    pipeline: {
      development: { status: "in-progress", owner: "Shahed", notes: "Legacy UI done, semantic search UI pending" },
      qa: { status: "not-started", owner: "Shahed", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Shahed", notes: "Seed: 10 articles, categories, sample embeddings, common knowledge" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Knowledge Base Blueprint", path: "docs/02-modules/07-knowledge-base.md", description: "20 pages, 17+ components, 20 hooks, 9 tables, 22 edge functions" },
    ],
    database: { tables: 7, status: "done", notes: "knowledge_sources, knowledge_files, knowledge_embeddings, user_knowledge_files, embedding_queue, common_knowledge, vector_search_logs" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "Knowledge listing (legacy)", status: "done", notes: "Routed from src/pages/" },
      { name: "Knowledge detail (legacy)", status: "done" },
      { name: "Knowledge form (legacy)", status: "done" },
      { name: "Knowledge upload (legacy)", status: "done" },
      { name: "Semantic search UI", status: "not-started" },
      { name: "Embeddings explorer (admin)", status: "not-started" },
    ],
    hooks: [
      { name: "useKnowledge (legacy)", status: "done" },
      { name: "useKnowledgeAdmin (legacy)", status: "done" },
      { name: "Embedding pipeline hooks", status: "not-started" },
    ],
    components: [],
    edgeFunctions: [
      { name: "auto-embed (embedding pipeline)", status: "not-started" },
      { name: "semantic-search", status: "not-started" },
      { name: "gemini-rag", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Navigate to /knowledge and see listing", tested: false },
      { description: "Create a knowledge article and verify it saves", tested: false },
      { description: "Upload a file to knowledge base", tested: false },
      { description: "Browse by category", tested: false },
    ],
    nextSteps: [
      "Build semantic search UI (needs edge function deployed)",
      "Modularize legacy pages into src/modules/knowledge/",
      "Admin knowledge analytics page",
    ],
  },

  // ── Phase 5: Projects ────────────────────────────────────────────────────────
  {
    id: "projects",
    name: "Projects",
    phase: 5,
    owner: "Zia",
    summary: "Full CRUD with milestones, members, risks, billing tables. Form pages for create/edit.",
    pipeline: {
      development: { status: "done", owner: "Zia" },
      qa: { status: "not-started", owner: "Zia", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Zia", notes: "Seed: 5 projects, milestones, members, risks, sample invoices" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Projects Blueprint", path: "docs/02-modules/04-projects.md", description: "11 pages, 100+ components, 48 hooks, 14 tables, 45+ edge functions" },
    ],
    database: { tables: 10, status: "done", notes: "project_statuses, projects, project_members, project_milestones, project_comments, project_files, project_risks, project_favorites, project_billing, project_invoices" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "ProjectsPage — listing with status cards", status: "qa-ready" },
      { name: "ProjectFormPage — create + edit", status: "qa-ready" },
      { name: "ProjectDetailPage — tabbed (overview/milestones/members/risks)", status: "qa-ready" },
    ],
    hooks: [
      { name: "useProjects — CRUD, statuses, filters", status: "done" },
      { name: "useProjectDetail — members, milestones, comments, risks", status: "done" },
    ],
    components: [],
    edgeFunctions: [
      { name: "ActiveCollab sync", status: "not-started" },
      { name: "Project knowledge sync", status: "not-started" },
      { name: "Resource projection", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Create a project via /projects/new with all fields", tested: false },
      { description: "Edit a project from the detail page Edit button", tested: false },
      { description: "Delete a project via confirmation dialog", tested: false },
      { description: "Add milestones and toggle completion", tested: false },
      { description: "Add comments on overview tab", tested: false },
      { description: "View risks tab", tested: false },
    ],
    nextSteps: [
      "File upload to project_files",
      "Billing/invoicing UI",
      "Project member invitation flow",
    ],
  },

  // ── Phase 6: Business Development ────────────────────────────────────────────
  {
    id: "business-dev",
    name: "Business Development (Deals, Contacts, Clients)",
    phase: 6,
    owner: "Zia",
    summary: "Deals pipeline, contacts with lead follow-ups, legacy client management. Full CRUD for deals.",
    pipeline: {
      development: { status: "done", owner: "Zia" },
      qa: { status: "not-started", owner: "Zia", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Zia", notes: "Seed: 10 deals across stages, 15 contacts, lead follow-ups, sample clients" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Business Dev Blueprint", path: "docs/02-modules/06-business-development.md", description: "42 pages, 134 components, 68 hooks, 15 tables, 75+ edge functions" },
    ],
    database: { tables: 7, status: "done", notes: "deals, deal_activities, deal_comments, contacts, lead_followup_contacts, contact_communications, scheduled_emails" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "DealsPage — pipeline kanban view", status: "qa-ready" },
      { name: "DealFormPage — create + edit deal", status: "qa-ready" },
      { name: "DealDetailPage — tabbed with stage progress, edit/delete", status: "qa-ready" },
      { name: "ContactsPage — listing with create dialog", status: "qa-ready" },
      { name: "Clients (legacy) — client CRUD", status: "done" },
    ],
    hooks: [
      { name: "useDeals — CRUD, pipeline stats, activities, comments", status: "done" },
      { name: "useUpdateDeal — full field updates", status: "done" },
      { name: "useDeleteDeal — with cache invalidation", status: "done" },
      { name: "useContacts — CRUD + lead follow-ups", status: "done" },
      { name: "useClients (legacy) — client CRUD", status: "done" },
    ],
    components: [],
    edgeFunctions: [
      { name: "HubSpot sync", status: "not-started" },
      { name: "Deal coaching AI", status: "not-started" },
      { name: "Email automation", status: "not-started" },
      { name: "Lead scoring", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Create a deal via /deals/new, verify it shows in pipeline", tested: false },
      { description: "Click deal to view detail, change stage via progress bar", tested: false },
      { description: "Edit deal from detail page Edit button", tested: false },
      { description: "Delete deal via confirmation dialog", tested: false },
      { description: "Create a contact via dialog on /contacts", tested: false },
      { description: "Verify lead follow-up status badge renders on contacts", tested: false },
      { description: "Legacy: create/edit/view clients at /clients/*", tested: false },
    ],
    nextSteps: [
      "Contact detail/edit page (/contacts/:id)",
      "useDeleteContact hook + delete button",
      "Deal activity logging on stage changes",
      "HubSpot integration (edge function)",
    ],
  },

  // ── Phase 7: Productivity ────────────────────────────────────────────────────
  {
    id: "productivity",
    name: "Productivity (Metrics, Employees, Process Docs)",
    phase: 7,
    owner: "Zia",
    summary: "Department-level productivity dashboard, employee detail, process documentation library.",
    pipeline: {
      development: { status: "done", owner: "Zia" },
      qa: { status: "not-started", owner: "Zia", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Zia", notes: "Seed: departments, employee profiles, weekly records, process categories + docs" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Productivity Blueprint", path: "docs/02-modules/08-productivity.md", description: "13 pages, 40 components, 19 hooks, 10 tables, 12 edge functions" },
    ],
    database: { tables: 10, status: "done", notes: "departments, pods, pod_members, employee_profiles, productivity_records, leave_events, process_categories, process_documents, productivity_alerts, ai_productivity_insights" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "ProductivityPage — dashboard with dept overview", status: "qa-ready" },
      { name: "EmployeeDetailPage — profile + weekly history", status: "qa-ready" },
      { name: "ProcessPage — index / category / document views", status: "qa-ready" },
    ],
    hooks: [
      { name: "useProductivity — records, summary, departments, weeks", status: "done" },
      { name: "useEmployees — profiles, productivity history", status: "done" },
      { name: "useProcesses — categories, documents, CRUD", status: "done" },
    ],
    components: [],
    edgeFunctions: [
      { name: "Productivity CSV import", status: "not-started" },
      { name: "HR employee sync", status: "not-started" },
      { name: "AI productivity insights", status: "not-started" },
      { name: "Weekly digest email", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Navigate /productivity and see department cards", tested: false },
      { description: "Click an employee to see /productivity/employee/:email", tested: false },
      { description: "Navigate /process and see category cards", tested: false },
      { description: "Click a category to see documents list", tested: false },
      { description: "Click a document to see full content", tested: false },
    ],
    nextSteps: [
      "Process document create/edit form",
      "CSV import page for productivity data",
      "Charts: department trends, heatmap, donut chart",
      "Pod-level productivity breakdown",
    ],
  },

  // ── Phase 8: Admin ───────────────────────────────────────────────────────────
  {
    id: "admin",
    name: "Admin Panel Extensions",
    phase: 8,
    owner: "Shahed",
    summary: "21 existing admin pages. Added team management and knowledge admin sections.",
    pipeline: {
      development: { status: "in-progress", owner: "Shahed", notes: "Core admin done, EOS/data sync admin pages pending" },
      qa: { status: "not-started", owner: "Shahed", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Shahed", notes: "Seed: system settings, feature flags, sample activity logs" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "Admin Blueprint", path: "docs/02-modules/09-admin.md", description: "95+ pages, 60+ components, 40+ hooks, 11 tables" },
      { title: "Admin Guide", path: "docs/07-admin/admin-guide.md", description: "Admin guide for system administration" },
      { title: "Feature Flags", path: "docs/07-admin/feature-flags.md", description: "Feature flags configuration and module toggles" },
    ],
    database: { tables: 0, status: "done", notes: "Uses tables from other modules" },
    types: { status: "done" },
    routes: { status: "done" },
    navigation: { status: "done" },
    pages: [
      { name: "EmployeeManagement — admin employee list", status: "qa-ready" },
      { name: "DepartmentManagement — department overview", status: "qa-ready" },
      { name: "KnowledgeAnalytics (existing, newly routed)", status: "qa-ready" },
      { name: "KnowledgeCategories (existing, newly routed)", status: "qa-ready" },
      { name: "All other admin pages (21 total)", status: "done" },
    ],
    hooks: [],
    components: [],
    edgeFunctions: [],
    qaChecklist: [
      { description: "Navigate /admin/team/employees and see employee list", tested: false },
      { description: "Search and filter employees", tested: false },
      { description: "Navigate /admin/team/departments and see departments", tested: false },
      { description: "Navigate /admin/knowledge/analytics", tested: false },
      { description: "Navigate /admin/knowledge/categories", tested: false },
      { description: "Verify admin sidebar shows Team & Knowledge sections", tested: false },
    ],
    nextSteps: [
      "EOS admin pages (VTO config, scorecard settings)",
      "Data sync dashboard (HR, HubSpot, ActiveCollab)",
      "Reports module (project reports, financial, resource utilization)",
      "Notification management",
    ],
  },
  // ── Phase 9: AI Agents Framework ───────────────────────────────────────────
  {
    id: "ai-agents",
    name: "AI Agents Framework",
    phase: 9,
    owner: "Shahed",
    summary: "AI agent management, chat interface, model configuration, usage analytics, MCP server integration.",
    pipeline: {
      development: { status: "in-progress", owner: "Shahed", notes: "Admin pages done, user-facing agent/chat routes not wired" },
      qa: { status: "not-started", owner: "Shahed", notes: "Test via Lovable QA module" },
      dataSeeding: { status: "not-started", owner: "Shahed", notes: "Seed: AI providers, models, sample agents, demo conversations" },
      signOff: { status: "not-started", owner: "Jairaj" },
    },
    docs: [
      { title: "AI Features Overview", path: "docs/06-ai-features/README.md", description: "AI capabilities, models, RAG pipeline, agent architecture" },
      { title: "AI Agents Implementation", path: "docs/original/new/AI_AGENTS_IMPLEMENTATION_GUIDE.md", description: "Detailed agent implementation patterns and tools" },
      { title: "RAG Framework Guide", path: "docs/original/new/AI_AGENTS_RAG_FRAMEWORK_GUIDE.md", description: "Retrieval-augmented generation framework design" },
    ],
    database: { tables: 5, status: "done", notes: "ai_agents, ai_agent_runs, ai_models, ai_providers, ai_usage_logs" },
    types: { status: "done" },
    routes: { status: "in-progress", notes: "Admin routes wired, user-facing /ai-agents and /ai-chat not yet routed" },
    navigation: { status: "done", notes: "Admin AI & Automation section in sidebar" },
    pages: [
      { name: "AIModelManagement — admin provider/model config", status: "done" },
      { name: "AIUsageAnalytics — admin usage dashboard + cost tracking", status: "done" },
      { name: "MCPServers — MCP server management", status: "done" },
      { name: "AIAgents — agent CRUD + execution (page exists, route not wired)", status: "in-progress" },
      { name: "AIChat — conversational AI interface (page exists, route not wired)", status: "in-progress" },
    ],
    hooks: [
      { name: "useAIAgents — CRUD, toggle, run agent, execution history", status: "done" },
      { name: "useAIChatAssistant — chat functionality", status: "in-progress" },
      { name: "useModelSync — sync models from providers", status: "done" },
    ],
    components: [
      { name: "AIChatInterface — reusable chat UI", status: "done" },
      { name: "SemanticSearch — vector search component", status: "done" },
      { name: "AgentPersonalizationModal — agent customization", status: "done" },
    ],
    edgeFunctions: [
      { name: "run-ai-agent — agent execution runtime", status: "done" },
      { name: "auto-embed — embedding pipeline", status: "not-started" },
      { name: "semantic-search — vector similarity search", status: "not-started" },
      { name: "gemini-rag — RAG with Gemini", status: "not-started" },
    ],
    qaChecklist: [
      { description: "Navigate /admin/ai-models and see provider list", tested: false },
      { description: "Enable/disable an AI model", tested: false },
      { description: "Navigate /admin/ai-usage and see analytics dashboard", tested: false },
      { description: "Navigate /admin/mcp-servers and manage servers", tested: false },
      { description: "Create an AI agent with system prompt", tested: false },
      { description: "Run an agent and verify execution history", tested: false },
      { description: "Open AI chat and send a message", tested: false },
    ],
    nextSteps: [
      "Wire /ai-agents and /ai-chat user-facing routes",
      "Deploy auto-embed edge function for embedding pipeline",
      "Build semantic search UI in Knowledge Base",
      "Agent memory/conversation persistence tables",
    ],
  },
];

// ─── Utility helpers for the status page ─────────────────────────────────────

export function getStatusColor(status: ItemStatus): string {
  switch (status) {
    case "done": return "#22c55e";
    case "qa-ready": return "#3b82f6";
    case "in-progress": return "#f59e0b";
    case "planned": return "#8b5cf6";
    case "blocked": return "#ef4444";
    case "not-started": return "#6b7280";
  }
}

export function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case "done": return "Done";
    case "qa-ready": return "QA Ready";
    case "in-progress": return "In Progress";
    case "planned": return "Planned";
    case "blocked": return "Blocked";
    case "not-started": return "Not Started";
  }
}

export function getModuleProgress(module: ModuleStatus): number {
  const items = [...module.pages, ...module.hooks, ...module.components, ...module.edgeFunctions];
  if (items.length === 0) return 100;
  const doneCount = items.filter((i) => i.status === "done" || i.status === "qa-ready").length;
  return Math.round((doneCount / items.length) * 100);
}

export function getQAProgress(module: ModuleStatus): { tested: number; total: number } {
  return {
    tested: module.qaChecklist.filter((q) => q.tested).length,
    total: module.qaChecklist.length,
  };
}

export function getPipelineColor(status: PipelineStatus): string {
  switch (status) {
    case "done": return "#22c55e";
    case "in-progress": return "#f59e0b";
    case "blocked": return "#ef4444";
    case "not-started": return "#6b7280";
  }
}

export function getPipelineLabel(status: PipelineStatus): string {
  switch (status) {
    case "done": return "Done";
    case "in-progress": return "In Progress";
    case "blocked": return "Blocked";
    case "not-started": return "Not Started";
  }
}

export function getPipelineProgress(module: ModuleStatus): number {
  const phases = [module.pipeline.development, module.pipeline.qa, module.pipeline.dataSeeding, module.pipeline.signOff];
  const doneCount = phases.filter((p) => p.status === "done").length;
  return Math.round((doneCount / 4) * 100);
}

export function getTeamModules(memberId: string): ModuleStatus[] {
  const member = TEAM.find((t) => t.id === memberId);
  if (!member) return [];
  return implementationStatus.filter((m) => member.modules.includes(m.id));
}
