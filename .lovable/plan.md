## Goal

Replace the current hand-rolled fixed-width sidebars (user `AppSidebar` + `AdminSidebar`) with the **shadcn `Sidebar` primitive UI pattern** used in the ePhysician Control Tower project. Keep this project's existing navigation data, routes, modules, feature flags, and role logic untouched — only the **look, structure, and collapse behavior** are imported.

## What changes (UI only)

- Both sidebars become shadcn `Sidebar collapsible="icon"` shells with `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, `SidebarFooter`, `SidebarRail`.
- Collapsing now mini-collapses to a 3rem icon strip (instead of a 4rem custom strip) with built-in tooltips on hover.
- Layouts switch from `ml-64` fixed margin to `SidebarProvider` + flex shell (`AppSidebar` / `AdminSidebar` as flex siblings of the main column).
- A `SidebarTrigger` button is added to `TopNav` so the user can collapse/expand from the header (replaces the current custom toggle).
- Expandable nav groups use shadcn `Collapsible` + `SidebarMenuSub` / `SidebarMenuSubButton`, matching ePhysician's chevron-rotate pattern. Open/closed state is persisted in `localStorage` (`sidebar-menu-state`), same as ePhysician.
- Active route highlighting via shadcn's `isActive` prop on `SidebarMenuButton` / `SidebarMenuSubButton`.

## What does NOT change

- `src/shared/data/navigationStructure.ts` — kept as the data source. Both sidebars still read `navigationGroups`, `dashboardItem`, and `adminNavigation` from it.
- Module gating (`useModuleAccess`), feature flags (`useFeatureFlags`), agency-role gating (`useAgencyRole`), admin-only filtering — all logic preserved, just rendered through shadcn components.
- All routes in `App.tsx`, `ProtectedRoute`, `AdminRoute`, `AuthContext`, branding.
- `TopNav` content (notifications, profile, search) — only adds a `SidebarTrigger` on the left.
- No nav items from the ePhysician project (Patients, Calendar, HIPAA, etc.) are imported — those are client-specific and don't belong in this framework.

## Files to modify

1. `src/components/layout/AppSidebar.tsx` — rewrite using shadcn `Sidebar` primitives; keep current data filtering helpers and nav item shape; render groups as collapsible sections matching ePhysician's `AppSidebar`.
2. `src/components/layout/AdminSidebar.tsx` — same treatment using `adminNavigation` groups; "Back to Dashboard" entry at top like ePhysician's admin sidebar.
3. `src/components/layout/DashboardLayout.tsx` — wrap with `SidebarProvider`; remove custom `sidebarOpen` state, `SIDEBAR_WIDTH_*` constants, and `ml-64` margin math; use flex shell.
4. `src/components/layout/AdminLayout.tsx` — same `SidebarProvider` + flex shell treatment.
5. `src/components/layout/TopNav.tsx` — drop the existing custom toggle; insert shadcn `SidebarTrigger` at the left of the header. Keep all other header content.

## Technical notes

- shadcn `Sidebar` (`src/components/ui/sidebar.tsx`) is already installed and used elsewhere in the codebase — no new dependencies.
- `collapsible="icon"` keeps icons visible when collapsed (mini variant) and provides built-in tooltips via the `tooltip` prop on `SidebarMenuButton`, matching ePhysician's UX.
- `SidebarRail` adds the thin draggable edge for quick collapse, same as the source.
- Persisted sidebar open/closed state moves from our manual `localStorage("sidebar-open")` to shadcn's built-in cookie-based persistence on `SidebarProvider`. The old localStorage key is no longer read; this is acceptable — first visit will default to expanded.
- No DB, edge function, or auth changes. Pure presentation refactor.

## How to test

1. Log in as a normal user → user sidebar matches ePhysician look: header with brand, grouped sections with collapsible chevrons, footer with profile, mini icon strip when collapsed, tooltips on hover.
2. Click the trigger in the top nav → sidebar collapses to icon-only; click again → expands.
3. Navigate between pages → no flicker, active item highlighted, expanded group of active route stays open.
4. Visit `/admin/*` routes → admin sidebar uses the same shadcn shell, shows "Back to Dashboard" at top, groups for People & Performance, AI Agents, AI Hub, Knowledge Base, Users & Access, etc.
5. Reload mid-session → sidebar collapsed/expanded state persists (via shadcn cookie).
6. Resize to mobile width → sidebar becomes offcanvas sheet (shadcn default behavior).
7. Module flags off (e.g. disable EOS) → corresponding nav group disappears, same as today.