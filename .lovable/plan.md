

# Migration Execution Plan

## Current Situation

Your codebase has **60 migration files** in `supabase/migrations/`, but only the **foundation schema** has been applied to your database. The new module tables required by the frontend code don't exist yet.

### Build Errors Root Cause

The TypeScript errors like `"task_comments" is not assignable to parameter of type 'never'` happen because:
1. Supabase generates `src/integrations/supabase/types.ts` from your **current database schema**
2. The new tables (`task_streams`, `task_comments`, `contacts`, `deals`, etc.) don't exist in the database yet
3. The frontend hooks reference these non-existent tables

---

## What Needs to Be Applied

### Already Applied (Foundation)
- `profiles`, `roles`, `user_roles`
- `clients`, `meetings`, `tasks` (basic)
- `ai_agents`, `ai_models`, `ai_providers`
- `knowledge_entries`, `embeddings`
- `integration_*` tables
- `notifications`, `feedback`

### Needs to Be Applied (8 New Module Migrations)

| Migration File | Tables Created | Table Count |
|---------------|---------------|-------------|
| `20260201_app_modules.sql` | `app_modules`, `user_module_permissions`, `system_settings` | 3 |
| `20260201_actions_module.sql` | `task_streams`, `task_stream_members`, `task_categories`, `task_comments`, `task_attachments`, `task_contributors` + ALTER tasks | 6 + ALTER |
| `20260201_eos_module.sql` | `vto`, `okrs`, `key_results`, `eos_issues`, etc. | ~12 |
| `20260201_meetings_v2.sql` | `meeting_series`, `meeting_agenda_items`, `meeting_participants`, etc. | ~7 |
| `20260201_knowledge_module.sql` | `knowledge_articles`, `article_versions`, etc. | ~7 |
| `20260201_projects_module.sql` | `projects`, `project_phases`, `project_tasks`, etc. | ~10 |
| `20260201_business_dev_module.sql` | `deals`, `contacts`, `lead_followup_contacts`, `deal_activities`, etc. | 7 |
| `20260201_productivity_module.sql` | `employees`, `time_entries`, `productivity_metrics`, etc. | ~10 |

**Total: ~60+ new tables and columns**

---

## Recommended Execution Path

### Option A: Run All 8 Module Migrations via Supabase SQL Editor (Recommended)

**Step 1:** Open Supabase SQL Editor
- URL: https://supabase.com/dashboard/project/tjkqvbxtziheggurtvcz/sql/new

**Step 2:** Run migrations in this order:
```text
1. 20260201_app_modules.sql          (FIRST - creates module registry)
2. 20260201_actions_module.sql       (extends tasks table)
3. 20260201_eos_module.sql
4. 20260201_meetings_v2.sql
5. 20260201_knowledge_module.sql
6. 20260201_projects_module.sql
7. 20260201_business_dev_module.sql
8. 20260201_productivity_module.sql
```

**Step 3:** After all migrations complete, regenerate TypeScript types:
- In Lovable, the types will auto-regenerate when the database schema changes
- This will resolve all the build errors

### Option B: Run Combined File in Batches

If you prefer using `supabase/all_migrations_combined.sql`:
1. Search for `FILE: 20260201_app_modules.sql` (around line 7500+)
2. Copy from there to the end of the file
3. Paste into SQL Editor and run

---

## Post-Migration Verification

After running migrations, verify by querying:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'app_modules',
  'task_streams', 
  'task_comments',
  'contacts', 
  'deals',
  'okrs',
  'projects'
);
```

---

## What Happens Next

After migrations are applied:
1. **TypeScript types auto-update** - Supabase types regenerate
2. **Build errors resolve** - Tables now exist in type definitions
3. **New features work** - Actions, EOS, Business Dev modules become functional

---

## Quick Reference: Migration Files Location

```text
supabase/migrations/
├── 20260201_app_modules.sql           ← Run 1st
├── 20260201_actions_module.sql        ← Run 2nd
├── 20260201_eos_module.sql            ← Run 3rd
├── 20260201_meetings_v2.sql           ← Run 4th
├── 20260201_knowledge_module.sql      ← Run 5th
├── 20260201_projects_module.sql       ← Run 6th
├── 20260201_business_dev_module.sql   ← Run 7th
└── 20260201_productivity_module.sql   ← Run 8th
```

