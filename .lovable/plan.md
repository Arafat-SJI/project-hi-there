

# Create AI Agent Browse System Documentation

## What This Is

A comprehensive `.md` file documenting the entire AI Agent browsing experience — the Browse page (`/agents`), Agent Detail pages (`/agents/:slug`), the Dashboard card, contextual banners, and presence indicators. Written so another developer can replicate the design and functionality on a different site.

## File

| File | Action |
|------|--------|
| `docs/02-modules/ai-agents-browse-system.md` | **Create** — full documentation |

## Document Contents

1. **Overview** — What the system does, page flow, route map
2. **Data Architecture** — `AgentTeamDef` and `AgentTeamAgent` TypeScript interfaces, the static config structure (`agentTeamConfig.ts`), how DB agents supplement static config
3. **Browse Page (`/agents`)** — Layout breakdown: Team Cards grid (2-col), Team Detail Sections with individual Agent Cards (4-col), "More Agents" grid for DB-only agents
4. **Agent Detail Page (`/agents/:slug`)** — Hero with gradient banner, icon overlay, capabilities accordion, how-to-use steps, sidebar with team info and related agents, mobile CTA
5. **Dashboard Card (`AITeamsDashboardCard`)** — Role filtering logic, mini-card design, horizontal scroll
6. **Contextual Banner (`AgentTeamBanner`)** — Collapsible banner with overlapping icons, placement on section pages
7. **Presence Indicator (`AIAgentPresenceIndicator`)** — Animated pulsing pill, placement strategy
8. **Design System** — All gradient HSL values per team (Sales: purple-pink, Meetings: cyan-blue, Strategy: orange-amber, Projects: green-emerald), card anatomy (rounded-2xl, border-b-4 accent, shadow-md hover:shadow-xl), icon circles (overlapping with ring-background, z-index stacking), typography (font-bold headings, text-muted-foreground descriptions)
9. **Component Tree** — ASCII diagram showing how components compose
10. **Color Reference Table** — Every team's gradientFrom, gradientTo, accentColor, category badge classes
11. **Replication Guide** — Step-by-step for another developer: define team config, build browse page, build detail page, wire routes

No code changes. Documentation only.

