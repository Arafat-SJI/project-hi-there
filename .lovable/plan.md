

# Agent Teams & Browse Page — Bold Design Overhaul

## What You Want (My Understanding)

Two things inspired by the Agent.ai screenshots:

1. **Contextual "Agent Team" banners** — when a user lands on a section (e.g., Sales Hub, Meetings), they see a bold, visually striking banner at the top showing the "team" of agents relevant to that section (like the "Sales Prospecting Team" card in your screenshot). This surfaces agents where they matter without requiring users to go to `/ai-agents`.

2. **A dedicated `/agents` browse page** — a public-facing or logged-in page where users can browse all agents, grouped into teams and individually, with bold gradient cards, Lucide icons (not emojis), and a "Try it" or "Run Agent" CTA. Similar to Agent.ai's "Featured Agents" grid.

---

## Design: Two New Pieces

### Piece 1: `AgentTeamBanner` — Reusable Section Header Component

A bold, full-width banner component that drops into the top of any section page (Deals, Meetings, EOS, Projects, Knowledge). It shows:

- **Team name** (e.g., "Sales Intelligence Team", "Meeting AI Team")
- **One-line description**
- **3-4 agent cards** in a horizontal scrollable row (carousel on mobile)
- Each agent card has: a **gradient background header** (using CSS gradients, not images), a **Lucide icon** in a dark circle, agent name, short description, and a "Try Agent" button
- A colored bottom border accent per team (red for Sales, blue for Meetings, green for EOS, etc.)

**Where it gets placed:**
| Section Page | Team Name | Agents Shown |
|---|---|---|
| `DealsPage.tsx` | Sales Intelligence Team | Deal Coach, Deal Daily Briefing, Quick Deal Email, Deal AI Chat |
| `MeetingsSchedulePage.tsx` / `MeetingTranscriptsPage.tsx` | Meeting AI Team | Meeting Summarizer, Action Item Extractor, Meeting Efficiency Analyzer, Client Call Analyzer |
| EOS Hub (`EOSHubPage.tsx`) | Strategy AI Team | EOS Coach, EOS Pattern Detective, EOS Pod Health, EOS Quarterly Digest |
| Projects (`Projects.tsx`) | Project AI Team | Project Analyst, Bug Feature Planner, Technical Plan Generator, Code Review Generator |

**Data source:** Static config array in the component (same pattern as `AITeamShowcase`). Each entry maps to an `ai_agents` slug. The "Try Agent" button navigates to `/ai-agents?run=<slug>` or opens a run dialog.

### Piece 2: `/agents` Browse Page

A new page at `/agents` (added to routes) with:

**Section A: Agent Teams** (top)
- 3-4 team cards in a grid, styled like Agent.ai's team cards:
  - Overlapping Lucide icons (4 icons in dark circles, slightly overlapping)
  - Bold team name + description
  - "Explore Team" button → scrolls down or navigates to a team detail section
  - Colored bottom border accent per team

**Section B: Featured Agents** (below)
- Full grid of all available agents (fetched from `ai_agents` table via `useAIAgents`)
- Each card:
  - Gradient header area (CSS gradient — different hue per category)
  - Lucide icon in dark rounded circle overlapping header/body
  - Agent name, "By CollabAi" subtitle
  - Category badge (e.g., "Sales", "Meetings")
  - Short description
  - "Try for free" / "Run Agent" CTA button

**Visual style notes (bolder than current):**
- Gradient card headers using tailwind `bg-gradient-to-br` with saturated colors (purple-pink for sales, teal-green for meetings, amber-orange for EOS, blue-indigo for projects)
- Larger font sizes: team names at `text-2xl font-bold`, agent names at `text-lg font-semibold`
- Rounded corners `rounded-2xl`, stronger shadows `shadow-lg`
- Active status dots using existing `AIIndicator`
- Bottom color accents (4px colored bar at card bottom)

---

## Technical Approach

### New Files
| File | Purpose |
|---|---|
| `src/components/ai/AgentTeamBanner.tsx` | Reusable banner component accepting team config |
| `src/components/ai/AgentTeamCard.tsx` | Individual agent card with gradient + icon |
| `src/components/ai/agentTeamConfig.ts` | Static team/agent mapping with Lucide icon names, gradients, descriptions |
| `src/pages/AgentsBrowse.tsx` | The `/agents` browse page |

### Modified Files
| File | Change |
|---|---|
| `src/modules/business-dev/pages/DealsPage.tsx` | Add `<AgentTeamBanner team="sales" />` at top |
| `src/modules/meetings/pages/MeetingsSchedulePage.tsx` | Add `<AgentTeamBanner team="meetings" />` at top |
| `src/modules/eos/pages/EOSHubPage.tsx` | Add `<AgentTeamBanner team="eos" />` at top |
| `src/pages/Projects.tsx` | Add `<AgentTeamBanner team="projects" />` at top |
| App router file | Add `/agents` route |
| `src/shared/data/navigationStructure.ts` | Add "Browse Agents" link |

### No database changes. No new dependencies.

Uses existing `useAIAgents` hook for the browse page. Static config for the team banners (so they work even before agents are seeded in DB).

---

## Visual Reference (ASCII)

**Agent Team Banner (inside Deals page):**
```text
┌──────────────────────────────────────────────────────────────┐
│  🔵🟣🔴🟡  Sales Intelligence Team                          │
│  AI agents that help you close deals faster.                 │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │▓▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓▓│       │
│  │  ◉ icon  │  │  ◉ icon  │  │  ◉ icon  │  │  ◉ icon  │       │
│  │Deal Coach│  │Briefing  │  │Quick Mail│  │AI Chat   │       │
│  │ desc...  │  │ desc...  │  │ desc...  │  │ desc...  │       │
│  │[Try Agent]│ │[Try Agent]│ │[Try Agent]│ │[Try Agent]│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│  ← colored accent
└──────────────────────────────────────────────────────────────┘
```

**Browse Page Team Card:**
```text
┌───────────────────────────┐
│  ◉◉◉◉  (overlapping)     │
│                           │
│  Sales Intelligence Team  │
│  Close deals with AI...   │
│                           │
│  [ Explore Team → ]       │
│▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄│ ← red accent
└───────────────────────────┘
```

