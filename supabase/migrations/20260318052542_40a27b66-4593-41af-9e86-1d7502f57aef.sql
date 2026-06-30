INSERT INTO tasks (title, description, status, priority, created_by)
SELECT
  'Implement 14 Tier 1 AI Agents - Seed into ai_agents table',
  $task_desc$Seed Tier 1 AI agents per docs/ai-agent-suggestions.md. See migration 20260401091500_seed_ai_agents_tier1_tier2.sql for agent definitions.$task_desc$,
  'todo',
  'high',
  p.id
FROM public.profiles p
WHERE EXISTS (SELECT 1 FROM public.profiles)
LIMIT 1;