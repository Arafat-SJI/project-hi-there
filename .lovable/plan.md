

# Turn AI Team Cards into Contextual "Where to Use Me" Guides

## Problem
Clicking an AI agent on the dashboard takes users to `/ai-chat` -- a generic chat page. But most agents aren't chat-based; they're embedded as actions inside specific pages (e.g., "Generate Follow-Up Email" button on a meeting detail page). Users see the agent card, click it, land in chat with no context, and bounce. The agents feel decorative instead of useful.

## Solution
Replace the click-to-chat behavior with a **popover/tooltip card** that tells users exactly what the agent does and where to use it -- with a direct link to that location. Think of it as each agent saying: *"Here's what I do. Go here to use me."*

## What Changes

### 1. Agent Context Map (New Data Structure)
Create a mapping that connects each agent slug to its usage context:

| Agent Slug | What It Does (user-friendly) | Where to Use It | Link |
|---|---|---|---|
| `meeting-summarizer` | Summarizes your meetings automatically | Open any meeting with a transcript | `/meetings/transcripts` |
| `meeting-action-extractor` | Pulls action items from transcripts | Meeting detail page, Takeaways tab | `/meetings/transcripts` |
| `meeting-followup-generator` | Drafts follow-up emails after meetings | Meeting detail page | `/meetings/transcripts` |
| `meeting-prep-assistant` | Creates briefing docs before meetings | Meeting schedule, upcoming meetings | `/meetings/schedule` |
| `meeting-categorizer` | Auto-categorizes meeting types | Runs automatically on new meetings | `/meetings/transcripts` |
| `meeting-transcript-analyzer` | Deep analysis of transcript insights | Meeting detail, Transcript tab | `/meetings/transcripts` |
| `meeting-efficiency-coach` | Analyzes meeting time patterns | Meeting schedule overview | `/meetings/schedule` |
| `meeting-client-matcher` | Matches meetings to clients/deals | Pending assignments page | `/meetings/pending-assignments` |
| `deal-coach` | Helps with deal strategy and emails | Deals pipeline | `/deals` |
| `operations-advisor` | Analyzes team productivity | Operations dashboard | `/admin/ai/agents` |
| `knowledge-search` | Searches knowledge base with AI | Knowledge base | `/knowledge` |
| `eos-coach` | Guides EOS processes (L10s, rocks) | Strategy section | `/admin/ai/agents` |
| `project-analyst` | Analyzes project health and risks | Projects section | `/admin/ai/agents` |
| `client-mood-analyzer` | Reads client engagement mood | Lead follow-up, contact detail | `/lead-followup` |
| `email-draft-assistant` | Drafts professional emails | Lead follow-up email workflow | `/lead-followup` |
| `email-draft-generator` | Generates email content | Lead follow-up email workflow | `/lead-followup` |

### 2. Agent Card Popover (New Component)
Replace the current `<Link to="/ai-chat?agent=...">` wrapper on each agent card with a **click-to-open popover** (using the existing Radix `Popover` component) that shows:

- Agent name and active status indicator
- A short "what I do" description (already from `agent.description`)
- A "How to use me" instruction line (from the context map)
- A primary **"Go There"** button linking to the relevant page
- A subtle secondary link: "Or chat with me" linking to `/ai-chat?agent=slug` for agents that support it

### 3. Visual Treatment
- Agent cards on dashboard remain clickable but open the popover instead of navigating
- The popover uses the existing `ai-card` border treatment
- The "Go There" button uses `ai-gradient` styling to stand out
- A small directional icon (e.g., `Navigation` or `MapPin`) reinforces "I'll take you there"

## Files to Create/Modify

### New File: `src/components/dashboard/AIAgentGuidePopover.tsx`
- A reusable component that wraps an agent card
- Accepts `agent: { slug, name, description }` prop
- Looks up the agent's context from an internal mapping
- Renders a `Popover` with the guide content and navigation button
- Falls back gracefully for unknown agents (shows description + link to `/ai-agents`)

### Modified: `src/pages/Dashboard.tsx`
- Import the new `AIAgentGuidePopover` component
- Replace the `<Link to="/ai-chat?agent=...">` wrapper in the AI Team grid with `<AIAgentGuidePopover>`
- The card itself stays visually the same; only the click behavior changes

### Modified: Quick Actions section in `src/pages/Dashboard.tsx`
- Change "Chat with AI" quick action to **"AI Agents Guide"** pointing to `/ai-agents` instead of `/ai-chat`
- Update description to "See what your AI team can do"

## What This Does NOT Change
- No new dependencies (uses existing Radix Popover)
- No database changes
- No route changes
- AI chat page remains accessible from TopNav sparkles button and sidebar
- Agent cards on the `/ai-agents` admin page are unaffected
