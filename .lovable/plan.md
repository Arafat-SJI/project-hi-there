## Status Review

After auditing the codebase, almost everything from the restructure spec is **already done**:

✅ All pages physically removed (SkillManagement, EmployeeProjection, Employees, ProductivityImport, Environment, Deployment, Roadmap, LLMConfig, Gemini, BatchUpload)
✅ DepartmentManagement page at `/admin/department` with redirect from `/admin/team/departments`
✅ Sidebar has INTELLIGENCE & AI group with AI Hub subgroup; GENERAL group with Feedback + Meeting Analytics; SYSTEM group with MCP Servers
✅ All redirects in place: `/admin/ai-usage` → `/admin/ai/analytics`, semantic-search/embeddings → AI Hub knowledge-search, memory pages → `/admin/ai-hub/memory`, knowledge analytics/common/sync-status/sources/gemini → `/admin/knowledge/dashboard`
✅ KnowledgeDashboard already a **single unified scrolling page** (Health → Analytics → Usage → Sync → Sources → Parser)
✅ Per-category Primary Integration UI already built (`CategoryPrimarySourceCard`, `usePrimaryByCategorySettings`, `savePrimaryByCategory`, `getPrimaryFor`, `getActiveSourcesFor`)
✅ `integration_settings.primary_by_category` JSONB column exists

## Remaining work — 2 items

### 1. Fix "Denied access" flash on admin navigation

**Root cause** — pages `UserInvitations.tsx` and `PermissionMatrix.tsx` check granular permissions (`users.create`, `settings.admin`/`users.admin`) **without** the admin/moderator role fallback that `AdminRoute` uses. So admins who lack the explicit granular permission see PermissionDenied flash when landing on those pages.

**Fix:**
- Update both pages to mirror AdminRoute's fallback: also allow `profile?.role === 'admin' || profile?.role === 'moderator'`
- Update `usePermissions` hook to expose `isSuccess` consistently and have both pages gate render on `permLoading || !isSuccess` to avoid evaluating `hasPermission` before query resolves

Files:
- `src/pages/admin/PermissionMatrix.tsx`
- `src/pages/admin/UserInvitations.tsx`

### 2. DB cleanup — drop orphaned tables

Migration with `DROP TABLE IF EXISTS ... CASCADE` for tables backing removed pages (only the ones that actually exist). I'll first grep to confirm no remaining frontend or edge-function references, then drop:

- `skills`, `user_skills` (if present)
- `productivity_alerts`, `productivity_records` (if no longer referenced anywhere; otherwise keep — the productivity module is still in use)
- `roadmap_items` (if present)

I'll only drop tables that exist AND have zero remaining code references. Anything in active use (e.g., `productivity_records` still used by `/productivity` module) stays.

### 3. Verification

- `npm run lint` + `npm run build:dev`
- Click through `/admin/users/invitations`, `/admin/roles/permissions` as admin — confirm no PermissionDenied flash
- Confirm `/admin/integrations` shows the per-category Primary Sources card

Approve to switch to build mode and execute.
