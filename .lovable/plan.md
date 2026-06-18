## Answers to your 6 questions + proposed actions

### 1. Dashboard Widget Registry — what it is and where it belongs
- **Page**: `src/pages/admin/DashboardWidgets.tsx` (route `/admin/settings/dashboard-widgets`).
- **Currently lives under**: SYSTEM → Settings → **Workspace** hub (not Users & Access).
- **Purpose**: Controls which widgets appear on each role-based dashboard (Owner, PM, BD, IC). Reads from the `dashboard_widgets` DB table; toggling `is_enabled` or changing `sort_order` instantly shows/hides cards on `OwnerDashboard`, `PMDashboard`, `BDDashboard`, `ICDashboard`.
- **Connection**: Tied to **Agency Roles** (Owner/PM/BD/IC) — each widget row lists the roles it appears for. Not tied to DB auth roles (admin/moderator/user).
- **Recommendation**: It is a UI/presentation config, not an access-control feature → keep it under **System → Settings → Workspace** (its current home), not under Users & Access. **No change unless you disagree.**

### 2. Agency Role Assignment vs Role Management — are they duplicates?
They look similar but are **two different concepts**:
| Page | What it manages | Stored in |
|---|---|---|
| `/admin/roles` (Role Management) | DB auth roles + granular permissions (admin / moderator / user, plus permission matrix) | `user_roles`, `roles`, `role_permissions` |
| `/admin/settings/agency-roles` (Agency Roles) | Product/dashboard persona (Owner / PM / BD / IC) + EOS flag | `user_role_preferences` (`agency_role`, `is_eos_user`) |
- **Proposal**: Merge into one page **`/admin/roles`** with two tabs:
  - **Tab 1 — Permissions Matrix** (current Role Management content)
  - **Tab 2 — Agency Role & Dashboard** (current Agency Roles content)
  Remove the standalone Agency Roles entry from Workspace hub. The single page becomes the home for "who can do what + which dashboard they see."

### 3. New "Project Settings" admin section
- Add new sidebar group **PROJECT SETTINGS** with three items:
  - Project Statuses → `/admin/settings/project-statuses`
  - Project Modules → `/admin/settings/project-modules`
  - Task Streams → `/admin/tasks/streams`
- **Remove** the "Task Configuration" wrapper from PEOPLE & PERFORMANCE (it only contained Task Streams).
- Also remove Project Statuses/Modules tiles from the **Workspace hub** so they aren't listed twice.

### 4. Advanced page — are all parts functional?
`src/pages/admin/settings/AdvancedSettings.tsx` currently contains three cards — all wired and working:
- **Feature Flags** — writes to `app_config.features`; read by `useFeatureFlags` and gates 12 modules/features across the app. ✅ Functional.
- **System Configuration** — `maintenanceMode`, `allowSignups`, `requireEmailVerification`, `sessionTimeout`. Writes to `app_config.system`. ✅ Functional, but only `requireEmailVerification` and `sessionTimeout` overlap with Security; the others are platform-wide toggles, not auth/security.
- **Template Data Seeding** — invokes the `seed-template-data` edge function. ✅ Functional.
- **Proposal**:
  - **Keep** Feature Flags on the Advanced page (no good home elsewhere).
  - **Move** "Require Email Verification" + "Session Timeout" rows into **Security** (`/admin/settings/security`) where they belong.
  - **Keep** Maintenance Mode + Allow Signups on Advanced (these are operational, not security).
  - **Split out** Template Data Seeding (see #5).

### 5. Template Data Seeding — separate page
- Create **`/admin/settings/seeding`** (`TemplateSeeding.tsx`) containing the existing seeding UI, and remove that card from Advanced.
- Add it under SYSTEM → Settings as a sibling of Branding / Workspace / Notifications / Advanced.

### 6. Sub-menu icon color inconsistency
- **Root cause**: `src/components/ui/sidebar.tsx` line 599 forces sub-item icons to `text-sidebar-accent-foreground` (`[&>svg]:text-sidebar-accent-foreground`). On themes where `--sidebar-accent-foreground` is near-white, sub-menu icons disappear against the sidebar background.
- **Fix**: Drop the forced `[&>svg]:text-sidebar-accent-foreground` rule so sub-item icons inherit `text-sidebar-foreground` like top-level items, and only switch to accent color on hover/active state (which the surrounding classes already do). Apply to both admin and main sidebars (they share the same primitive).

---

## Implementation plan (after approval)

**Files to edit**
1. `src/components/ui/sidebar.tsx` — remove forced `[&>svg]:text-sidebar-accent-foreground` from `SidebarMenuSubButton` so sub-icons use consistent foreground color (fixes #6).
2. `src/shared/data/navigationStructure.ts`:
   - Add new `PROJECT SETTINGS` group with Project Statuses, Project Modules, Task Streams (#3).
   - Remove `Task Configuration` wrapper (#3).
   - Add `Template Seeding` entry under SYSTEM → Settings (#5).
   - Remove standalone Agency Roles entry from Workspace hub once merged (#2).
3. `src/pages/admin/RoleManagement.tsx` (or new wrapper) — add Tabs: "Permissions" + "Agency Role & Dashboard"; embed `<AgencyRoles />` into the second tab (#2).
4. `src/pages/admin/settings/WorkspaceHub.tsx` — remove Project Statuses, Project Modules, Agency Roles, Dashboard Widgets stays (or move Dashboard Widgets there too — TBD per your call on #1).
5. `src/pages/admin/settings/AdvancedSettings.tsx` — remove Template Data Seeding card; move email-verification + session-timeout fields out (#4).
6. `src/pages/admin/settings/SecuritySettings.tsx` — add "Require Email Verification" and "Session Timeout" controls (#4).
7. `src/pages/admin/settings/TemplateSeeding.tsx` — **new file** containing the seeding card (#5).
8. `src/modules/admin/routes.tsx` — add route `/admin/settings/seeding`; keep `/admin/settings/agency-roles` as redirect to `/admin/roles?tab=agency`.

**No DB migrations required.** All changes are UI/navigation reorganization.

---

## Open questions before I implement
- **Q1 (item #1)**: Leave Dashboard Widget Registry under **Workspace** (recommended), or move it elsewhere?
- **Q2 (item #2)**: Confirm merge into `/admin/roles` with two tabs — Permissions and Agency Role?
- **Q4**: Confirm moving only `requireEmailVerification` + `sessionTimeout` into Security, leaving Maintenance Mode + Allow Signups on Advanced?