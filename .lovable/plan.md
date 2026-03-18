

# Remove Run Buttons + Add Animated AI Indicators on Section Pages

## Changes

### 1. Remove "Run" buttons everywhere, replace with section navigation

**`AgentTeamCard.tsx`** — Change "Try Agent →" button to "Learn More →" linking to `/agents/{slug}` detail page.

**`AgentsBrowse.tsx`** — Remove the "Run →" button from `AgentBrowseCard`. Keep only "Details" button (or make entire card clickable to detail page).

**`AgentDetail.tsx`** — Remove the "Run Agent" CTA button (both desktop and mobile). Replace with a "Go to {section}" button that navigates to `whereToFind.path` (e.g., `/deals`, `/meetings/transcripts`). For agents without `whereToFind`, show a "Browse in AI Hub" link to `/ai-agents`.

### 2. Add animated AI agent indicators on section pages

**New component: `src/components/ai/AIAgentPresenceIndicator.tsx`**
A small, eye-catching animated indicator that sits on section pages showing which AI agents are available there. Features:
- A pulsing/glowing Sparkles icon with `animate-pulse` 
- Agent name text with a subtle gradient shimmer
- Clicking it navigates to the agent's detail page (`/agents/{slug}`)
- Compact pill-shaped design with gradient border glow

**Integration on section pages:**
- `DealsPage.tsx` — Show indicators for Deal Coach, Quick Deal Email (near the AgentTeamBanner)
- `MeetingsSchedulePage.tsx` — Show indicators for Meeting Summarizer, Action Extractor
- `EOSHubPage.tsx` — Show indicator for EOS Coach
- `Projects.tsx` — Show indicator for Project Analyst

Each indicator will use the team's gradient colors and display with a fade-in animation (`animate-fade-in`) plus a pulsing dot to draw attention.

### Files

| File | Action |
|---|---|
| `src/components/ai/AIAgentPresenceIndicator.tsx` | **Create** — animated pill indicator |
| `src/components/ai/AgentTeamCard.tsx` | **Edit** — change button to detail page link |
| `src/pages/AgentsBrowse.tsx` | **Edit** — remove Run button |
| `src/pages/AgentDetail.tsx` | **Edit** — replace Run CTA with section navigation |
| `src/modules/business-dev/pages/DealsPage.tsx` | **Edit** — add presence indicators |
| `src/modules/meetings/pages/MeetingsSchedulePage.tsx` | **Edit** — add presence indicators |
| `src/modules/eos/pages/EOSHubPage.tsx` | **Edit** — add presence indicators |
| `src/pages/Projects.tsx` | **Edit** — add presence indicators |

No new dependencies. No database changes.

