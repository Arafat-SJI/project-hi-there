

## Create Assignable Task for Tier 1 AI Agent Implementation

### What We'll Do

Insert a single task into the `tasks` table via Supabase with a detailed description listing all 14 Tier 1 agents, implementation steps, and a reference path to the analysis document. This task will be assignable from the Tasks UI.

### Task Content

**Title:** Implement 14 Tier 1 AI Agents — Seed into `ai_agents` table

**Description** (will include):
- Reference to `docs/ai-agent-suggestions.md` for full context
- The 14 agents listed with slug, category, and priority
- Step-by-step implementation instructions (INSERT SQL pattern, system prompt crafting, testing via AI Hub)
- Acceptance criteria (all 14 agents visible in AI Hub, runnable via Run Agent modal)

### The 14 Tier 1 Agents to List

| # | Slug | Category | Priority |
|---|------|----------|----------|
| 1 | `deal-ai-chat` | Sales & CRM | High |
| 2 | `deal-daily-briefing` | Sales & CRM | Medium |
| 3 | `quick-deal-email` | Sales & CRM | High |
| 4 | `lovable-prototype-builder` | Sales & CRM | Medium |
| 5 | `client-call-analyzer` | Meetings | High |
| 6 | `client-communication-coach` | Meetings | Medium |
| 7 | `meeting-efficiency-analyzer` | Meetings | High |
| 8 | `eos-pattern-detective` | EOS | Medium |
| 9 | `eos-pod-health` | EOS | Medium |
| 10 | `eos-quarterly-digest` | EOS | High |
| 11 | `bug-feature-planner` | Project Mgmt | High |
| 12 | `code-review-generator` | Project Mgmt | Medium |
| 13 | `technical-plan-generator` | Project Mgmt | High |
| 14 | `project-analyzer` | Project Mgmt | Medium |

### Technical Approach

Use `supabase--read_query` to insert a task row directly:

```sql
INSERT INTO tasks (title, description, status, priority, created_by)
VALUES (
  'Implement 14 Tier 1 AI Agents...',
  '## Overview\n\nReview docs/ai-agent-suggestions.md...\n\n## Agents to Implement\n...',
  'todo',
  'high',
  (current user ID)
);
```

The task will appear in the Tasks section of the app. You can then assign it to someone via the UI by editing the task and setting `assigned_to`.

### Files Changed

None — this is a database insert only.

