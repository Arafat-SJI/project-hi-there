

## Plan

### Part 1: Fix Build Error in `useProjectTasks.ts`

The Supabase `PostgrestFilterBuilder` is not a `Promise` — it's a thenable but TypeScript doesn't accept it as `Promise<any>`. The fix: wrap each query builder in an immediately-invoked `.then()` or use `await` per query, or simply cast. The cleanest approach is to call `.then(r => r)` on each query to convert it to a real Promise, or restructure to use sequential awaits.

**File:** `src/modules/projects/hooks/useProjectTasks.ts`
- Lines 50-57 and 62-71: Append `.then(res => res)` to each query push to convert the PostgREST builder into a real Promise.

---

### Part 2: AI Agents Suggestions Document

I'll create `docs/ai-agent-suggestions.md` — a product-manager-grade analysis of all 50+ agents from the SJ Innovation catalog, mapped against this project's existing infrastructure.

**Assessment criteria for each agent:**

| Factor | What exists here |
|--------|-----------------|
| **Edge Functions** | `run-ai-agent` (generic), plus ~15 specialized ones (deal-coach, eos-triage-assistant, extract-meeting-issues, etc.) |
| **Database tables** | `clients`, `contacts`, `deals`, `deal_activities`, `deal_comments`, `projects`, `project_milestones`, `project_billing`, `project_risks`, `eos_issues`, `eos_pods`, `okrs`, `accountability_charts`, `employee_profiles`, `pods`, `zoom_files`, `knowledge_entries` |
| **Missing tables** | `meetings_v2` (uses `meetings`), `activecollab_tasks`, `activecollab_time_records`, `quarterly_rocks`, `key_results`, `client_research`, `lead_follow_up_contacts`, `user_knowledge`, `common_knowledge_files`, `client_documents`, `ai_insights`, `task_ai_cache`, `invoices`, `expenses`, `company_goals`, `project_weekly_updates`, `pod_weekly_ai_summaries`, `eos_issue_comments`, `meeting_takeaways_v2` |
| **Existing agents (25)** | deal-coach, email-draft-generator, eos-coach, knowledge-search, operations-advisor, project-analyst, 8 meeting agents, financial-analyst, tax-advisor, contract-analyzer, etc. |
| **AI provider** | OpenAI only (via `run-ai-agent`); no Gemini/Perplexity/Anthropic wired in edge functions |
| **`run-ai-agent` limitations** | No data source fetching — just passes user input + system prompt to OpenAI. No context enrichment. |

**Document structure:**

1. **Executive Summary** — what can be done now vs. what needs infrastructure
2. **Tier 1: Implement Now** — agents that work with existing tables + `run-ai-agent` (just seed rows in `ai_agents`). These are agents whose data sources already exist and that use the generic `run-ai-agent` pattern.
3. **Tier 2: Implement with Minor Work** — agents needing a new specialized edge function but whose data tables exist
4. **Tier 3: Requires New Tables** — agents whose data sources don't exist in this project
5. **Tier 4: Not Applicable** — agents tied to external services not present (HubSpot, ActiveCollab-specific sync, etc.)
6. **Infrastructure Recommendations** — what upgrades to `run-ai-agent` would unlock the most agents
7. **Per-agent detail table** with slug, category, verdict, what's needed, and priority

**Key findings preview:**

- **~12 agents** can be seeded immediately (deal-coach variants, EOS agents, project analyzer, meeting agents — most already exist or map directly)
- **~8 agents** need a new edge function but data is available (SOW generator, weekly update, bug/feature planner)
- **~15 agents** need missing tables created first (task AI suite, productivity agents, knowledge agents)
- **~10 agents** are integration-specific (HubSpot, ActiveCollab sync) and not applicable without those integrations
- The single biggest unlock: enhancing `run-ai-agent` to fetch data sources from the DB based on the agent's `data_sources` config

