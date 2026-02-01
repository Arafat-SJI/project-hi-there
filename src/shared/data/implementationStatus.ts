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
 */

export type ItemStatus = "done" | "qa-ready" | "in-progress" | "planned" | "blocked" | "not-started";

export interface StatusItem {
  name: string;
  status: ItemStatus;
  notes?: string;
}

export interface ModuleStatus {
  id: string;
  name: string;
  phase: number;
  owner?: string;
  summary: string;
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

// ─── Last updated: 2026-02-01 ─────────────────────────────────────────────────

export const implementationStatus: ModuleStatus[] = [
  // ── Phase 0: Foundation ──────────────────────────────────────────────────────
  {
    id: "platform",
    name: "Platform Core",
    phase: 0,
    summary: "Auth, layout, routing, module access system, config, shared UI. Fully complete.",
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
    summary: "Task CRUD, streams, comments, subtasks. Core flows complete.",
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
    summary: "Full EOS framework. Largest module: 9 pages, 12 components, 6 hooks.",
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
    summary: "Extended meetings with agenda, takeaways, participants, recurring series.",
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
    summary: "Database and types ready. UI leverages existing legacy pages. Vector search tables prepared.",
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
    summary: "Full CRUD with milestones, members, risks, billing tables. Form pages for create/edit.",
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
    summary: "Deals pipeline, contacts with lead follow-ups, legacy client management. Full CRUD for deals.",
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
    summary: "Department-level productivity dashboard, employee detail, process documentation library.",
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
    summary: "21 existing admin pages. Added team management and knowledge admin sections.",
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
