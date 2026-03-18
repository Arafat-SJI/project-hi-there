

# Role-Specific AI Teams on All Dashboards

## What Changes

The current `AITeamsDashboardCard` shows all 4 agent teams to every user. We'll make it role-aware so each dashboard shows only the teams relevant to that role, and add the card to the PM and IC dashboards (which currently don't have it).

### Role-to-Team Mapping

| Role | Teams Shown | Rationale |
|------|------------|-----------|
| **Owner/CEO** | All 4 teams (Sales, Meetings, Strategy, Projects) | Owners oversee everything |
| **PM** | Projects, Meetings | PMs manage projects and attend meetings |
| **IC/Employee** | Projects, Meetings | ICs work on tasks, attend meetings |

### Changes to `AITeamsDashboardCard.tsx`

- Add an optional `agencyRole` prop
- Filter `allTeams` based on role mapping before rendering
- Adjust subtitle text to reflect filtered count
- When no role is passed, show all teams (backward compatible)

### Add to PM Dashboard (`PMDashboard.tsx`)

- Import `AITeamsDashboardCard`
- Place it after `QuickActionsCard`, pass `agencyRole="pm"`

### Add to IC Dashboard (`ICDashboard.tsx`)

- Import `AITeamsDashboardCard`
- Place it after `QuickActionsCard`, pass `agencyRole="ic"`

### Update Owner Dashboards

- Pass `agencyRole="owner"` to existing `<AITeamsDashboardCard />` in both `OwnerDashboard.tsx` and `OwnerDashboardWithEOS.tsx`

### Files

| File | Action |
|------|--------|
| `src/components/dashboards/AITeamsDashboardCard.tsx` | **Edit** — add role filtering |
| `src/pages/dashboards/PMDashboard.tsx` | **Edit** — add card |
| `src/pages/dashboards/ICDashboard.tsx` | **Edit** — add card |
| `src/pages/dashboards/OwnerDashboard.tsx` | **Edit** — pass role prop |
| `src/pages/dashboards/OwnerDashboardWithEOS.tsx` | **Edit** — pass role prop |

No database changes. No new files.

