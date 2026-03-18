

# Dashboard AI Agent Showcase + Agent Detail Pages

## What We're Building

**Two things:**

1. **Dashboard Widget** — A bold, gradient-styled "Your AI Team" card on both `OwnerDashboard` and `OwnerDashboardWithEOS` showing all 4 agent teams as a horizontally scrollable row of team mini-cards. Each mini-card shows overlapping icons, team name, agent count, and links to the browse page. This gives a "wow" first impression on login.

2. **Agent Detail Page** (`/agents/:slug`) — A dedicated page for each agent (inspired by the Agent.ai screenshot). Shows: gradient hero header with large icon, agent name, team badge ("Part of Sales Intelligence"), description, a "Run Agent" CTA button, expandable feature sections (what it does, how to use it, where to find it), and a sidebar with tags and navigation link to the relevant section page. We'll build detail content for at least 5 agents: Deal Coach, Meeting Summarizer, EOS Coach, Project Analyst, and Action Extractor.

---

## Design Details

### Dashboard Widget: `AITeamsDashboardCard`

- Full-width card with a subtle gradient border glow
- Title: "Your AI Team" with Sparkles icon
- 4 team mini-cards in a horizontal scroll (same gradient style as `/agents` page)
- Each shows: overlapping agent icons (3-4), team name, "X agents" count, click → `/agents#team-{id}`
- "Browse All Agents →" link at bottom
- Placed after QuickActionsCard on both dashboards

### Agent Detail Page: `/agents/:slug`

Layout (two-column on desktop, stacked on mobile):

**Left column (main):**
- Gradient hero banner (full-width, ~120px) with large Lucide icon in dark circle
- Agent name (`text-3xl font-bold`)
- Badge: "Part of {Team Name}"
- One-line description
- Expandable accordion sections built from `agentTeamConfig` + `AGENT_CONTEXT_MAP` data:
  - "What this agent does" — description + capabilities
  - "How to use it" — step-by-step from `whereToUseMe`
  - "Where to find it" — link to the section page with MapPin icon

**Right column (sidebar):**
- Bold "Run Agent" button (gradient background, like the screenshot)
- "Agent Tags" showing category
- "Part of" team link → `/agents#team-{id}`

**Data source:** Static from `agentTeamConfig` + `AGENT_CONTEXT_MAP`. Falls back to DB agent data via `useAIAgents` for agents not in static config.

---

## Files

| File | Action |
|---|---|
| `src/components/dashboards/AITeamsDashboardCard.tsx` | **Create** — dashboard widget |
| `src/pages/AgentDetail.tsx` | **Create** — `/agents/:slug` detail page |
| `src/pages/dashboards/OwnerDashboard.tsx` | **Edit** — add `<AITeamsDashboardCard />` |
| `src/pages/dashboards/OwnerDashboardWithEOS.tsx` | **Edit** — add `<AITeamsDashboardCard />` |
| `src/modules/platform/routes.tsx` | **Edit** — add `/agents/:slug` route |
| `src/components/ai/agentTeamConfig.ts` | **Edit** — add `whereToUse` and `howToUse` fields per agent for the detail page content |

No database changes. No new dependencies.

