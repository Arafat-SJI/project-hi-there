
# AI Agents & AI Configuration — Deep Dive Deliverable

Produce a full technical write-up (in chat) plus a downloadable PDF covering the agent/config surface area across the listed admin and user routes.

## Scope of pages covered

Admin:
- `/admin/ai/agents` — All Agents catalog & lifecycle
- `/admin/ai/agent-categories` — Category taxonomy
- `/admin/ai/prompt-templates` — Shared prompt library
- `/admin/ai-hub/memory` — Org-wide agent memory inspector
- `/admin/ai-models` — Provider & model registry

User:
- `/ai-agents` — Agent browse / launch surface

## What the deliverable will contain

1. **Intent & Purpose** — one paragraph per page explaining the product role.
2. **Per-page breakdown** — for each route:
   - Page component path
   - Hooks / React Query keys used
   - Admin actions exposed (CRUD, toggles, re-embed, export, etc.)
   - DB tables read/written
   - Edge functions invoked
   - RLS / permission gating
3. **Schema reference (full depth)** — column-level for:
   - `ai_agents`, `ai_agent_categories`, `ai_models`, `ai_providers`
   - `prompt_templates`
   - `agent_memories`, `agent_conversations`, `agent_messages`, `agent_learning_events`, `agent_reasoning_traces`
   - `agent_execution_plans`, `agent_execution_steps`
   - `mcp_servers`, `mcp_tools`, `mcp_tool_executions`
   - `ai_usage_logs`, `ai_chat_history`, `ai_agent_runs`
4. **Memory lifecycle** — short-term → long-term consolidation, pruning, importance boost, pgvector retrieval (`get_relevant_memories`, `consolidate_short_term_memories`, `prune_short_term_memories`, `boost_memory_importance`).
5. **Tool orchestration** — execution plan/step state machine, `update_plan_metrics_on_step_completion`, `update_plan_status_if_all_steps_done`, MCP tool stats trigger.
6. **Edge function contracts** — request/response shape & purpose for the AI-tier functions (ai-chat, execute-mcp-tool, retrieve-agent-memories, extract-agent-memories, model-router, openai-embeddings-proxy, etc.).
7. **Admin → user reflection** — table mapping what an admin change here surfaces on `/ai-agents` and downstream agent runs.
8. **Tech stack** — React 18 + TS + Vite, TanStack Query, shadcn/ui, Supabase (PostgreSQL + pgvector + RLS), Deno edge functions, Lovable AI Gateway / OpenAI / Gemini multi-provider routing, MCP orchestration layer.
9. **Security model** — RLS policies on agent_memories / prompt_templates / ai_agents, `has_role`, `has_permission`, admin SECURITY DEFINER functions (`admin_list_user_memories`, `admin_export_user_memories`).

## Investigation steps (before writing)

1. Read `src/pages/admin/ai/*` and `src/pages/admin/memory/*` and `src/pages/admin/AIModels*` (or equivalent) to capture exact component names, hooks, and mutations.
2. Read `src/pages/AgentsBrowse.tsx` and `src/components/ai/*` for the user surface.
3. Read `src/hooks/usePromptTemplates.ts`, `src/hooks/useModelSync.ts`, agent-related hooks under `src/hooks/`.
4. Read `supabase/functions/ai-chat/index.ts` plus sibling functions (`execute-mcp-tool`, `retrieve-agent-memories`, `extract-agent-memories`, model router, embeddings proxy) to document contracts.
5. Run targeted `supabase--read_query` to confirm column lists and RLS policies on the agent/prompt/memory tables.
6. Cross-reference `docs/AGENTIC_QUICK_REFERENCE.md`, `docs/06-ai-features/`, and `docs/implemented-ai-agents.md`.

## Output

- Full markdown answer in chat (organized by the sections above).
- PDF saved to `/mnt/documents/ai-agents-and-configuration.pdf`, styled to match the earlier `control-tower-navigation-map.pdf` (ReportLab Platypus, section headings + tables for schema/contract rows), surfaced via `<presentation-artifact>`.
- Visual QA: render PDF pages to images, inspect every page for overflow/clipping, fix and re-render until clean; report what was checked.

## Out of scope

- No code changes, no migrations, no edge-function edits.
- No new docs committed to the repo (PDF only, plus chat response).
