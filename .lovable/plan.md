# Fix: Admin Panel missing & admin/user menus mixed

## Root cause

`src/components/routing/AppRoutes.tsx` mounts the admin route tree **only in the legacy branch**:

```tsx
{fourSpaces ? (
  <Route element={<SpaceLayout />}>{globalSpaceRoutes}{spaceRoutes}</Route>
) : (
  <>
    <Route element={<DashboardLayout />}>…</Route>
    <Route element={<AdminRoute />}>
      <Route element={<AdminLayout />}>{adminRoutes}</Route>
    </Route>
  </>
)}
```

The `enableFourSpaces` flag is currently ON, so:

1. **Admin Panel is missing** — `/admin` and all `/admin/*` URLs fall through to the catch-all `NotFound`. The "Admin" link in `TopNav` (line 338) leads nowhere.
2. **Menus look mixed** — `src/shared/data/spaceNavigation.ts` declares admin items (Memory Admin, User Management, Integrations Admin, AI Admin, etc.) inside the per-space groups, gated only by `requiredPermissions: ["...admin"]`. `useSpaceAccess.isNavItemVisible` shows them whenever `isAdmin` is true, so admin entries render right next to user features in the Knowledge / Operations / Sales sidebars.

## Fix

### 1. Mount the Admin route tree in Four Spaces mode

`src/components/routing/AppRoutes.tsx` — add the admin branch as a sibling of `SpaceLayout` (still inside `ProtectedRoute`) so admin routes load with `AdminLayout` (its own `AdminSidebar`), not inside a space:

```tsx
{fourSpaces ? (
  <>
    <Route element={<SpaceLayout />}>
      {globalSpaceRoutes}
      {spaceRoutes}
    </Route>
    <Route element={<AdminRoute />}>
      <Route element={<AdminLayout />}>{adminRoutes}</Route>
    </Route>
  </>
) : (
  /* unchanged legacy branch */
)}
```

This restores `/admin` and every `/admin/*` page, using the dedicated `AdminSidebar`.

### 2. Stop bleeding admin entries into space sidebars

- **`src/shared/data/spaceNavigation.ts`** — tag every admin-targeted item with `adminOnly: true` (alongside existing `requiredPermissions`). Concretely, every item whose `href` starts with `/admin` or whose `requiredPermissions` include `settings.admin` / `users.admin` / `integrations.admin` / `ai.admin` / `knowledge.admin` / `meetings.admin` / `projects.admin`. Also flag admin-only groups (e.g. "Administration", "AI Admin", "Memory Admin") with `adminOnly: true` at the group level.
- **`src/hooks/useSpaceAccess.ts`** — add a `context` option so the hook can be reused for both sidebars:

  ```ts
  useSpaceAccess({ context: "space" | "admin" } = { context: "space" })
  ```

  - `context: "space"` → hide `adminOnly` items unconditionally (even for admins — they live in `AdminLayout`).
  - `context: "admin"` → existing behavior (admins see them).

- **`src/components/layout/SpaceSidebar.tsx`** — call `useSpaceAccess({ context: "space" })`. `AdminSidebar` already doesn't use this hook, so no other caller changes.

### 3. Keep the TopNav entry point

`TopNav` already shows the "Admin" shortcut for admins (line 338) — once step 1 lands the link works. No change needed.

## Files to edit

- `src/components/routing/AppRoutes.tsx` — mount admin tree in fourSpaces branch.
- `src/hooks/useSpaceAccess.ts` — add `context` option; hide `adminOnly` in space context.
- `src/shared/data/spaceNavigation.ts` — mark admin items/groups with `adminOnly: true`.
- `src/components/layout/SpaceSidebar.tsx` — call `useSpaceAccess({ context: "space" })`.

## How to test

1. Sign in as Omkar (admin).
2. Navigate to `/admin` → Admin Panel loads with `AdminSidebar` (no spaces UI).
3. Click through `/admin/users`, `/admin/integrations`, `/admin/memory`, `/admin/ai/*` → all routes resolve (no NotFound).
4. Open `/knowledge/dashboard`, `/sales/...`, `/operations/...` → sidebars show only user-facing items; admin entries no longer appear inside space groups.
5. TopNav "Admin" shortcut navigates to `/admin`.
6. Sign in as a non-admin → `/admin` redirects via `AdminRoute`; space sidebars unchanged.
7. Toggle `enableFourSpaces` OFF → legacy DashboardLayout + admin still works (regression check).

## Out of scope

- Re-categorizing individual admin pages inside `AdminSidebar`.
- Permission catalog changes.
- Visual redesign of either sidebar.
