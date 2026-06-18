## Changes

### 1. Fix "Admin Dashboard" always highlighted
In `src/components/layout/AdminSidebar.tsx`, the `isActive` helper treats `/admin` as a prefix and matches every admin route. Change to require exact match when `path === "/admin"`:
```ts
const isActive = (path: string) =>
  path === "/admin"
    ? location.pathname === "/admin"
    : location.pathname === path || location.pathname.startsWith(path + "/");
```

### 2. Remove standalone "Semantic Search" from user sidebar
In `src/shared/data/navigationStructure.ts` `knowledge` group, remove the "Semantic Search" item. Semantic search remains available inside Knowledge Base and Personal Library pages (no route changes — `/knowledge/search` keeps working if linked from inside those pages).

### 3. Move "AI Agents" group above "Sales Hub"
In `src/shared/data/navigationStructure.ts`, reorder `navigationGroups` so the `ai-browse` group is first, before `business-dev`.

### 4. Merge "Pending Assignments" & "AI Match Results" into Transcripts (tabs)
- Refactor `src/modules/meetings/pages/MeetingTranscriptsPage.tsx` to wrap its content in shadcn `Tabs` with URL sync via `?tab=transcripts|pending|ai-match`:
  - `transcripts` — current transcripts list (default)
  - `pending` — render `<MeetingPendingAssignmentsPage />` body
  - `ai-match` — render `<MeetingAiMatchResultsPage />` body
- In `src/modules/meetings/routes.tsx`, change `/meetings/pending-assignments` and `/meetings/transcripts/ai-match` to `<Navigate>` redirects to `/meetings/transcripts?tab=pending` and `?tab=ai-match`.
- In navigation, remove the standalone "Pending Assignments" and "AI Match" items from the `meetings` group.

### 5. Merge "Series" into "All Meetings" (tabs)
- Refactor `src/modules/meetings/pages/MeetingsSchedulePage.tsx` to use tabs with `?tab=meetings|series`:
  - `meetings` — current schedule list (default)
  - `series` — render `<MeetingSeriesPage />` body
- In `src/modules/meetings/routes.tsx`, redirect `/meetings/series` → `/meetings/schedule?tab=series`.
- Remove standalone "Series" item from the `meetings` nav group.

### Resulting Meetings nav group
- All Meetings (tabs: Meetings | Series)
- Transcripts (tabs: Transcripts | Pending Assignments | AI Match)

## Out of scope
No DB, RLS, or edge function changes. Pure frontend nav/routing.

## Files to change
- `src/components/layout/AdminSidebar.tsx`
- `src/shared/data/navigationStructure.ts`
- `src/modules/meetings/routes.tsx`
- `src/modules/meetings/pages/MeetingTranscriptsPage.tsx`
- `src/modules/meetings/pages/MeetingsSchedulePage.tsx`
