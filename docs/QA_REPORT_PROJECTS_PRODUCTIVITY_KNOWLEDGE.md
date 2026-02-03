# QA Report: Projects, Productivity & Knowledge Base Modules

**Date:** 2026-02-03  
**Scope:** Projects, Productivity, and Knowledge Base modules vs Control Tower main patterns  
**Goal:** Assess UI, business logic, architecture, and modularity direction.

---

## Executive Summary

The three modules follow the Control Tower’s module pattern (routes, hooks, types, `ModuleRoute`) and are in good shape for a modular product. Gaps are mostly consistency (shared components location, feature flags, duplicate routes), one fixed data bug (project detail status/owner), and a few UX/performance tweaks. **Verdict: You are heading in the right direction for a modular solution;** addressing the items below will make the base more consistent and client-ready.

---

## 1. Projects Module

### 1.1 Architecture vs Control Tower

| Aspect | Control Tower pattern | Projects | Status |
|--------|------------------------|---------|--------|
| Route gating | `ModuleRoute` with `module="projects"` | Used | OK |
| Feature flag | Some modules use `requiresFeatureFlag` | Not used (module only) | Inconsistent |
| Routes in `App.tsx` | Mounted with other module routes | Yes | OK |
| Nav | `mainNavigation` + `module: "projects"` | Yes | OK |
| Module index | Export routes (and often hooks/types) | Exports routes + types only | Hooks not re-exported |
| Hooks location | Module-owned under `modules/<name>/hooks/` | Yes | OK |
| Shared UI | Some in `components/` (e.g. meetings) | Tabs live in `@/components/projects/` | Split ownership |

### 1.2 UI Issues

1. **Projects list – Owner column**  
   Header shows "Owner:" but value is hardcoded as "—" (`Owner: {/* owner name not joined */} —`). List does not resolve owner from `owner_id`. **Recommendation:** Use `useProjectStatuses`-style resolution: either join owner in list query or maintain a small `profiles` lookup (e.g. by `owner_id`) and show name.
2. **Project detail – Status/Owner (fixed)**  
   Detail page used `project.status` and `project.owner` while `useProject(slug)` did not join `project_statuses` or resolve owner. **Fixed:** `useProject` now joins `project_statuses` and maps to `status`; owner is resolved in the page via a separate `profiles` query by `project.owner_id`.
3. **Backup / Restore**  
   "Backup all" and "Restore all" are powerful actions with minimal confirmation (e.g. no "Type project name to confirm"). Consider a confirmation step for restore.
4. **Empty / loading**  
   Empty and loading states are clear and consistent with the rest of the app.

### 1.3 Business Logic

1. **Projects list query**  
   Uses `select("*")` with no join; status and client are resolved via `useProjectStatuses()` and `useClients()` and looked up by id. Consistent with list-only needs.
2. **Project slug**  
   Create uses `slug-${Date.now().toString(36)}`; detail uses `:slug` and `useProject(slug)`. No collision issues.
3. **Tab visibility**  
   `useEnabledProjectModules()` drives which tabs show. Settings keys (e.g. `finance`, `risks`) are aliased to tab keys (`billing`, `issues`) where needed. Tabs like "milestones" and "members" have no setting key and are always visible; consider adding toggles if you want full configurability.
4. **Cross-module**  
   Project detail correctly uses `useProjectMeetings(project.id)` from the meetings module; clean cross-module usage.

### 1.4 Recommendations (Projects)

- Resolve and display **owner** on the list page (join or profile lookup).
- Optionally add `requiresFeatureFlag` for projects if you want runtime toggling like meetings/knowledge.
- Consider moving tab components from `@/components/projects/` into `src/modules/projects/components/` for full module ownership (or document that shared components stay in `components/`).
- Re-export commonly used hooks from `modules/projects/index.ts` (e.g. `useProjects`, `useProject`) for consistency with the knowledge module.

---

## 2. Productivity Module

### 2.1 Architecture vs Control Tower

| Aspect | Control Tower pattern | Productivity | Status |
|--------|------------------------|---------------|--------|
| Route gating | `ModuleRoute` with `module="productivity"` | Used | OK |
| Feature flag | Optional | Not used | OK (module-only is acceptable) |
| Routes | Under `/productivity` and `/process` | Yes | OK |
| Nav | "Productivity" and "Processes" both `module: "productivity"` | Yes | OK |
| Module index | Export routes (and sometimes hooks) | Exports routes only | Minimal surface |
| Hooks | In `modules/productivity/hooks/` | Yes | OK |
| Types | In `modules/productivity/types/` | Yes | OK |

### 2.2 UI Issues

1. **Process routes**  
   Process pages live under `/process` (and `/process/:category`, etc.) while the nav item is "Processes". Sidebar links to "/process"; no conflict.
2. **Employee detail**  
   List links to `/productivity/employee/${encodeURIComponent(r.employee_email)}`. Using email in the URL is fine but assumes email is unique; document or enforce uniqueness.
3. **Week selector**  
   "Latest Week" vs specific week is clear; week list limited to 12. Good.
4. **Charts**  
   Recharts + `ChartContainer` / `ChartTooltipContent` match the rest of the app. No issues.
5. **AI insights**  
   Section only renders when `insights.length > 0`; empty state is implicit. Consider an explicit "No insights yet" when filters are applied.

### 2.3 Business Logic

1. **Summary computation**  
   `useProductivitySummary` loads all records for the chosen (or latest) week and aggregates in the client. Fine for moderate data; for large datasets consider a DB view or RPC.
2. **Pod productivity**  
   Uses pod/department data; depends on `productivity_records` and pod/department setup. Clear.
3. **Data source**  
   Copy says "Import productivity data via CSV or HR sync" (admin Productivity Import). Clear dependency on admin flow.

### 2.4 Recommendations (Productivity)

- Keep module index minimal unless other modules need to call productivity hooks; then export them.
- Consider a short empty state for AI insights when the list is empty (e.g. "No insights for this week/department").
- Document that employee detail is keyed by email and that emails should be unique for the productivity context.

---

## 3. Knowledge Base Module

### 3.1 Architecture vs Control Tower

| Aspect | Control Tower pattern | Knowledge | Status |
|--------|------------------------|-----------|--------|
| Route gating | `ModuleRoute` + optional feature flag | `module="knowledge"` and `requiresFeatureFlag="enableKnowledgeBase"` | OK |
| Routes | Under `/knowledge` | Yes, plus `/personal-knowledge` | Duplicate path (see below) |
| Nav | "Knowledge Base", "Semantic Search", "Personal Knowledge" | All present | OK |
| Module index | Export routes + hooks | Exports routes and several hooks | Good |
| Hooks | In module | Yes; some shared (e.g. cache keys) | OK |
| Types | In hooks (e.g. useKnowledge) | Yes | OK |

### 3.2 UI Issues

1. **Hero and layout**  
   Knowledge landing has a distinct hero, search, and category grid. Matches a “content hub” feel and is consistent with the design system.
2. **Duplicate route: `/personal-knowledge`**  
   - In **platform** `coreProtectedRoutes`: `<Route path="/personal-knowledge" element={<PersonalKnowledge />} />`  
   - In **knowledge** `knowledgeRoutes`: `<Route path="/personal-knowledge" element={<PersonalKnowledge />} />`  
   So the same path is declared twice. React Router will match the first (core), so when the knowledge module is disabled, personal knowledge remains available—which may be intentional. If so, remove the duplicate from `knowledge/routes.tsx` and document that personal knowledge is always available. If not, keep it only in the knowledge module and remove from platform.
3. **Personal vs Knowledge**  
   `/knowledge/personal` and `/personal-knowledge` both render `PersonalKnowledge`. Nav points to `/personal-knowledge`. Having two URLs for the same page is redundant; pick one canonical URL and use it everywhere.
4. **Search/filter**  
   Single input drives both "search" and category filter; "All Entries" / "Search Results" / "Filtered Entries" headers are clear.

### 3.3 Business Logic & Performance

1. **Triple fetch on Knowledge landing**  
   - `useKnowledgeEntries({})` for `allEntries`  
   - `useKnowledgeEntries({})` again for `recentEntries`  
   - `useKnowledgeEntries({ search, category_id })` for filtered list  
   The first two are the same query (same key). **Recommendation:** Use one `useKnowledgeEntries({})` and derive `recentEntries` and `popularEntries` in the client (sort/slice). That removes a duplicate network request and keeps the UI the same.
2. **Categories and entries**  
   Categories and entry counts are used correctly; `knowledge_categories` join is consistent.
3. **Semantic search**  
   Separate route and hooks; no issues observed in structure.

### 3.4 Recommendations (Knowledge)

- Resolve **duplicate `/personal-knowledge`**: one definition only (platform or knowledge) and document the decision.
- Prefer a **single canonical URL** for personal knowledge (e.g. `/personal-knowledge`) and redirect or link from the other.
- **Performance:** Use one `useKnowledgeEntries({})` and derive recent/popular in the component to avoid duplicate fetches.
- Keep exporting hooks from the module index; it’s a good pattern for reuse.

---

## 4. Cross-Cutting: Modularity & Consistency

### 4.1 What’s Aligned With a Modular Product

- **Module registry** (`shared/config/modules.ts`): Single list of modules, categories, and feature flags.
- **Build-time toggles:** `VITE_MODULE_*` and `env.modules.*`; `isModuleBundled()` used in `ModuleRoute`.
- **Navigation:** `mainNavigation` filtered by `hasModule(item.module)` and feature flags.
- **Route pattern:** Each module exports a route tree wrapped in `<ModuleRoute module="…" />` (and optionally `requiresFeatureFlag`).
- **Structure:** Per-module `routes.tsx`, `pages/`, `hooks/`, `types/`, and sometimes `components/`.

### 4.2 Inconsistencies to Address

1. **Feature flags**  
   - Knowledge: `module="knowledge"` and `requiresFeatureFlag="enableKnowledgeBase"`.  
   - Meetings / Actions: same pattern.  
   - Projects / Productivity: only `module`; no feature flag.  
   Decide whether every optional module should have a corresponding feature flag for runtime toggling, or document that some are module-only.
2. **Shared components**  
   Projects: tabs and dialogs in `@/components/projects/`. Others (e.g. meetings) keep more inside the module. Either standardize “shared UI in `components/`” or “module UI in `modules/<name>/components/`” and document it.
3. **Module index exports**  
   Knowledge exports routes and many hooks; projects export routes and types; productivity exports only routes. Standardizing (e.g. routes + public hooks + key types) would make consumption and tree-shaking expectations clearer.
4. **Personal knowledge route**  
   Resolve duplication and canonical URL (see Knowledge section).

### 4.3 Direction Verdict

- **Modular solution:** Yes. Modules are isolated, gated by config and (where used) feature flags, and the registry is the single place to see what exists.
- **Client-ready:** Mostly. Fix the project detail status/owner (done), list owner, knowledge duplicate fetch and route duplication, and document owner/email assumptions for productivity. After that, the three modules are in good shape for a modular Control Tower offering.

---

## 5. Issue Summary Table

| # | Module      | Severity | Area        | Issue | Status |
|---|-------------|----------|------------|--------|--------|
| 1 | Projects    | Fixed    | Business   | Project detail status/owner not loaded (useProject now joins status; owner resolved in page). | **Fixed** |
| 2 | Projects    | Medium   | UI         | List page owner column always "—"; resolve owner (e.g. join or profile lookup). | **Fixed** – profile lookup by owner_id |
| 3 | Projects    | Low      | Architecture | Re-export hooks from `modules/projects/index.ts`. | **Fixed** |
| 4 | Projects    | Low      | Architecture | Consider moving tab components into module or document shared location. | **Fixed** – moved to `modules/projects/components/` |
| 5 | Productivity| Low      | UX         | Explicit empty state for AI insights when none. | **Fixed** |
| 6 | Productivity| Low      | Doc        | Document employee keyed by email and uniqueness. | **Fixed** – comments in hook and EmployeeDetailPage |
| 7 | Knowledge   | Medium   | Performance | Single `useKnowledgeEntries({})` and derive recent/popular to avoid duplicate request. | **Fixed** – removed duplicate fetch |
| 8 | Knowledge   | Medium   | Architecture | Single definition and canonical URL for `/personal-knowledge`. | **Fixed** – route only in platform; knowledge has `/knowledge/personal` |
| 9 | All         | Low      | Consistency | Decide feature-flag policy (all optional modules vs module-only). | **Fixed** – documented in `shared/config/modules.ts` |
| 10| All         | Low      | Consistency | Standardize module index exports (routes + public hooks + types). | **Fixed** – projects and productivity export hooks + types |

---

**Report end.** (All issues addressed as of 2026-02-03.)
