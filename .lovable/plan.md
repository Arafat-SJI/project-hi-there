

# Make the Dashboard Feel AI-First

## Problem
The current dashboard feels like a standard business tool -- stat cards, quick actions, and an activity feed. There's nothing that communicates "AI is here to help you." For a product where AI adoption is the goal, every screen should subtly (and sometimes boldly) remind users that intelligent assistance is available.

## What Changes

### 1. AI Welcome Banner on Dashboard
Replace the plain "Good morning, [Name]" greeting with a visually distinct AI-powered welcome section that includes:
- A greeting with an AI orb indicator (using existing `ai-orb` CSS)
- A dynamic one-liner like "Your AI team processed 12 tasks today" or "3 AI agents are standing by"
- A prominent "Ask AI" button linking to `/ai-chat`

### 2. "Your AI Team" Section (New Dashboard Card)
Add a new card below the stats grid showing active AI agents as a horizontal row of "team member" cards -- each with a name, status dot, and what they do. This makes AI agents feel like coworkers, not features. Links to `/ai-agents` for details.
- Fetches from the existing `ai_agents` table (enabled agents only)
- Shows agent name, description, and an active status indicator
- Empty state: "No AI agents configured yet -- Set up your first AI teammate"

### 3. AI-Enhanced Stat Cards
Give the "AI Agents" stat card the `ai-card` treatment (gradient top border, glow on hover) so it visually stands out from the other three stat cards. Add the existing `AIIndicator` dot to signal "this is AI-powered."

### 4. AI Quick Action Upgrade
Update the "AI Agents" quick action to say "Chat with AI" (pointing to `/ai-chat`) since that's the primary AI interaction. Restyle it with the `ai-gradient` background to make it pop visually compared to the other quick actions.

### 5. Persistent AI Chat Shortcut in TopNav
Add a small "AI" button (using Sparkles icon + `ai-pulse` animation) in the top navigation bar next to the notifications bell. Clicking it navigates to `/ai-chat`. This ensures AI is one click away from every page, not buried in the sidebar.

## Files to Modify

### `src/pages/Dashboard.tsx`
- Import `AIIndicator`, `Sparkles` icon, and `useQuery` for fetching AI agents
- Replace greeting section with AI welcome banner (ai-gradient background, orb, dynamic stats)
- Wrap the AI Agents stat card with `ai-card` class and add `AIIndicator` dot
- Add new "Your AI Team" card section after stats grid showing enabled agents
- Update the "AI Agents" quick action to "Chat with AI" with ai-gradient styling

### `src/components/layout/TopNav.tsx`
- Add an AI chat shortcut button (Sparkles icon with `ai-pulse` class) between the search bar and notifications bell
- Links to `/ai-chat`

### `src/hooks/useDashboard.ts`
- Add a new `useAITeamSummary` hook that fetches enabled AI agents (name, description, slug) limited to 6 for the dashboard cards

## Visual Hierarchy (Top to Bottom)
```text
+--------------------------------------------------+
| [AI Orb] Good morning, Sam                       |
| Your AI team ran 5 tasks today. 3 agents ready.  |
|                              [Ask AI ->]         |
+--------------------------------------------------+
| [Clients] [Meetings] [AI Agents*] [Knowledge]    |
|                       (* = ai-card styling)       |
+--------------------------------------------------+
| Your AI Team                                      |
| [Meeting Bot] [Deal Coach] [Email Drafter] ...    |
+--------------------------------------------------+
| Quick Actions          | Recent Activity          |
| (Chat with AI = glow)  |                          |
+--------------------------------------------------+
```

## What This Does NOT Change
- No new dependencies
- No database changes
- No new routes or pages
- All existing functionality remains untouched
- Uses only existing CSS classes (`ai-card`, `ai-orb`, `ai-gradient`, `ai-pulse`, `badge-ai`) and components (`AIIndicator`)

