# Supabase project migration guide

Migrate from **hvonjbgyszponjlynpos** (old) → **boxjziuuzlgalhndlllk** (new).

## Current status

| Step | Repo | Remote (new project) |
|------|------|----------------------|
| `.env` updated | ✅ You set `boxjziuuzlgalhndlllk` | — |
| `supabase/config.toml` `project_id` | ✅ Updated | — |
| Deploy alert project ref | ✅ Updated | — |
| `launch-lab-agent` in essential deploy list | ✅ Added | — |
| Migration + deploy scripts | ✅ Added | — |
| **234 migrations applied** | — | ⏳ **Blocked** — see below |
| **Edge function secrets** | — | ⏳ **Blocked** |
| **~191 edge functions deployed** | — | ⏳ **Blocked** |

### Why remote steps are blocked

The Supabase CLI on this machine is logged in as an account that **owns** `hvonjbgyszponjlynpos` but **does not list** `boxjziuuzlgalhndlllk` in `npx supabase projects list`.

Your new anon key works against `https://boxjziuuzlgalhndlllk.supabase.co` (project exists), but CLI management requires logging in as the **owner** of the new project.

---

## One-command migration (after correct login)

```powershell
# 1. Log in as the account that OWNS boxjziuuzlgalhndlllk
npx supabase login

# 2. Confirm the project appears
npx supabase projects list
# Look for: boxjziuuzlgalhndlllk

# 3. Run full migration (link + 234 migrations + secrets + all edge functions)
npm run supabase:migrate
```

Dry run (no changes):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/migrate-to-new-supabase.ps1 -DryRun
```

Deploy functions only (after link + migrations):

```powershell
npm run supabase:deploy-functions
```

---

## What `npm run supabase:migrate` does

1. **Link** — `npx supabase link --project-ref boxjziuuzlgalhndlllk` (uses `SUPABASE_PASSWORD` from `.env`)
2. **Schema** — `npx supabase db push --yes` (all files in `supabase/migrations/`)
3. **Secrets** — sets from `.env` if present:
   - `GOOGLE_AI_API_KEY` (required for Launch Lab)
   - `OPENAI_API_KEY`, `SENDGRID_API_KEY`, `ENCRYPTION_KEY` (if in `.env`)
4. **Edge functions** — deploys every folder under `supabase/functions/` except `_shared` (~191 functions)

> **Free tier note:** Supabase may cap edge functions (~100 on free tier). If deploy fails partway, use `scripts/deploy-essential-edge-functions.ps1` first, then `scripts/edge-functions-integrations.txt` via a second manifest.

---

## Manual fallback (Dashboard)

If CLI link still fails:

### A. Database schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/boxjziuuzlgalhndlllk/sql/new)
2. Run `supabase/all_migrations_combined.sql` in the SQL editor (large file — may need to split if timeout)
3. Or run migrations in smaller batches from `supabase/migrations/` in filename order

### B. Edge function secrets

Dashboard → **Project Settings** → **Edge Functions** → **Secrets**

Minimum for Launch Lab:

```
GOOGLE_AI_API_KEY=<your-gemini-key>
```

Add others from `.env.example` as you use integrations.

### C. Edge functions

After `npx supabase login` with the correct account:

```powershell
npm run supabase:deploy-functions
```

Or essential subset only:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-essential-edge-functions.ps1
```

---

## Verify migration

```powershell
# Health check — should return ok: true, configured: true
curl.exe "https://boxjziuuzlgalhndlllk.supabase.co/functions/v1/launch-lab-agent" `
  -H "Authorization: Bearer YOUR_ANON_KEY"

# App
npm run dev
# Open http://localhost:8080/launch-lab — no yellow deploy alert
```

---

## Files updated for new project

| File | Change |
|------|--------|
| `supabase/config.toml` | `project_id = "boxjziuuzlgalhndlllk"` |
| `src/modules/launch-lab/components/LaunchLabDeployAlert.tsx` | New project ref in instructions |
| `scripts/migrate-to-new-supabase.ps1` | Full migration orchestrator |
| `scripts/deploy-all-edge-functions.ps1` | Deploy all function folders |
| `scripts/edge-functions-essential.txt` | Added `launch-lab-agent` |
| `package.json` | `supabase:migrate`, `supabase:deploy-functions` |

---

## After migration

1. Restart dev server: `npm run dev`
2. Create first admin if needed: deploy `promote-first-admin` and invoke once, or sign up + run promote SQL
3. Optional: run `npm run migrations:mark-applied` if you used combined SQL and history is out of sync
