

# Fix CEO Dashboard AI Card + Seed Demo Data for PM/IC

## Two Problems

### 1. CEO doesn't see the new AITeamsDashboardCard
The CEO test account has an `admin` DB role. In `Dashboard.tsx` line 84, `if (!isAdmin)` skips all role-specific dashboards for admins — so the CEO falls through to the generic dashboard which has an older, simpler "Your AI Team" section instead of the new `AITeamsDashboardCard`.

**Fix:** Update the routing logic in `Dashboard.tsx` so that users with an `agencyRole` are routed to their role-specific dashboard *even if* they are also admins. The `isAdmin` bypass should only apply when `agencyRole` is null/undefined (i.e., the user hasn't picked an agency role). This way the CEO gets `OwnerDashboard` with the shiny AI card.

### 2. PM and IC dashboards show no data
All seed data (projects, tasks, project_members) is assigned to `u1` (the first `auth.users` row — the CEO). The PM and IC test accounts have no projects or tasks assigned, so their dashboards show "No active projects" and "No tasks assigned."

**Fix:** Create a new seed SQL file `supabase/seed/10-demo-role-data.sql` that:
- Looks up the PM user (`demo@collabai.software`) and IC user (`ic@collabai.software`) by email in `auth.users`
- Assigns the PM as `owner` of 2 existing projects (`techstart-ai-integration`, `enterprise-qbr-prep`) via `project_members` and updates `owner_id`
- Assigns the IC as `member` on 2 projects (`acme-platform-rollout`, `techstart-ai-integration`) via `project_members`
- Reassigns ~6 existing tasks to the PM user and ~6 to the IC user (from the 20 seed tasks), with a mix of statuses
- All operations use `ON CONFLICT DO NOTHING` for idempotency

### Files

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | **Edit** — change routing logic so agencyRole takes priority over isAdmin |
| `supabase/seed/10-demo-role-data.sql` | **Create** — seed data assigning projects/tasks to PM and IC test accounts |

No migrations needed — only data inserts/updates via the seed file, and a frontend routing fix.

