# Hackathon Feature: Launch Lab

> **Handoff doc** — Read this file on any machine to continue work. Updated as implementation progresses.

**Feature:** Standalone two-step wizard — **Pitch Coach** → **Idea Canvas**  
**Sidebar:** Launch Lab (`/launch-lab`)  
**AI Provider:** Google Gemini `gemini-2.5-flash` via `GOOGLE_AI_API_KEY` (Supabase Edge secret)  
**Hackathon:** SJ Innovation AI Hackathon June 2026

---

## Goal

Build a **separate** hackathon feature (not mixed into CRM/meetings/EOS):

1. **Step 1 — Pitch Coach:** User pastes a pitch → AI scores it + suggests improvements + polished pitch.
2. **Step 2 — Idea Canvas:** User continues with polished pitch → AI generates sticky-note clusters + launch plan.

One sidebar entry, stepper UI (step 2 unlocked after pitch analysis).

---

## Architecture

```
Sidebar (AI Agents group) → /launch-lab
  └── LaunchLabPage (stepper shell)
        ├── Step 1: PitchCoachStep
        └── Step 2: IdeaCanvasStep (auto-generates canvas on enter)

useAnalyzePitch / useGenerateCanvas
  └── invokeEdgeFunction('launch-lab-agent')

supabase/functions/launch-lab-agent
  └── Direct Gemini API + GOOGLE_AI_API_KEY
  └── mode: 'pitch' | 'canvas'
```

**Module ID:** `launch-lab`  
**No dependency** on clients, meetings, deals, or EOS tables.

---

## Implementation checklist

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Register `launch-lab` in `modules.ts` + `env.ts` | ✅ Done | `VITE_MODULE_LAUNCH_LAB=true` default on |
| 2 | Create `supabase/functions/launch-lab-agent` | ✅ Done | Gemini JSON modes |
| 3 | Add `[functions.launch-lab-agent]` to `config.toml` | ✅ Done | `verify_jwt = false` |
| 4 | Create `src/modules/launch-lab/*` | ✅ Done | Pages, components, hooks |
| 5 | Wire `AppRoutes.tsx` | ✅ Done | `launchLabRoutes` |
| 6 | Add sidebar nav item | ✅ Done | AI Agents group, Rocket icon, "New" badge |
| 7 | Update `.env.example` | ✅ Done | `GOOGLE_AI_API_KEY`, `VITE_MODULE_LAUNCH_LAB` |
| 8 | Lint + build verify | ✅ Done | `npm run build:dev` passes |
| 9 | Deploy edge function to hackathon Supabase | ⏳ **YOU** | See setup below |
| 10 | Set `GOOGLE_AI_API_KEY` secret | ⏳ **YOU** | Required for AI to work |
| 11 | Record demo video | ⏳ Pending | Use script below |
| 12 | UI polish + rich features | ✅ Done | See "UI enhancements" below |

---

## Setup (your hackathon Supabase)

```bash
# 1. Set API key (get from https://aistudio.google.com/app/apikey)
supabase secrets set GOOGLE_AI_API_KEY=your-key-here

# 2. Link project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy edge function
supabase functions deploy launch-lab-agent

# 4. Health check (optional)
curl "https://YOUR_PROJECT.supabase.co/functions/v1/launch-lab-agent" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Frontend** — only needs existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`.

**Local dev:** `npm run dev` → open http://localhost:8080/launch-lab

---

## Files created

| Path | Purpose |
|------|---------|
| `hackathon-feature.md` | This handoff doc |
| `supabase/functions/launch-lab-agent/index.ts` | Gemini agent (pitch + canvas) |
| `src/modules/launch-lab/index.ts` | Module export |
| `src/modules/launch-lab/routes.tsx` | `/launch-lab` route |
| `src/modules/launch-lab/types.ts` | TypeScript types |
| `src/modules/launch-lab/constants.ts` | Sample pitches, cluster colors |
| `src/modules/launch-lab/hooks/useLaunchLabSession.ts` | Wizard state |
| `src/modules/launch-lab/hooks/useLaunchLabAgent.ts` | Edge function mutations |
| `src/modules/launch-lab/pages/LaunchLabPage.tsx` | Main page + step orchestration |
| `src/modules/launch-lab/components/LaunchLabStepper.tsx` | Step 1 / 2 header |
| `src/modules/launch-lab/components/PitchCoachStep.tsx` | Pitch UI |
| `src/modules/launch-lab/components/IdeaCanvasStep.tsx` | Canvas UI |
| `src/modules/launch-lab/components/PitchScoreGauges.tsx` | Recharts radial scores |
| `src/modules/launch-lab/components/StickyCluster.tsx` | Sticky note columns |
| `src/modules/launch-lab/components/LaunchPlanCard.tsx` | Markdown launch plan |
| `src/modules/launch-lab/components/LaunchLabHero.tsx` | Gradient hero + live stats |
| `src/modules/launch-lab/components/PitchContextPanel.tsx` | Pitch type / audience / industry |
| `src/modules/launch-lab/components/PitchStatsBar.tsx` | Word count + read time |
| `src/modules/launch-lab/components/PitchTimer.tsx` | 30–120s practice timer |
| `src/modules/launch-lab/components/PitchHeadlineCard.tsx` | AI headline + tagline |
| `src/modules/launch-lab/components/PitchBeforeAfter.tsx` | Side-by-side rewrite |
| `src/modules/launch-lab/components/WeakMomentsPanel.tsx` | Excerpt-level fixes |
| `src/modules/launch-lab/components/StrengthsCard.tsx` | What's working |
| `src/modules/launch-lab/components/PracticeQuestionsCard.tsx` | Q&A prep |
| `src/modules/launch-lab/components/ObjectionFlashcards.tsx` | Flip-card objection drill |
| `src/modules/launch-lab/components/AnalyzeLoadingOverlay.tsx` | Full-screen AI loading |
| `src/modules/launch-lab/components/LaunchChecklist.tsx` | Interactive next-steps checklist |
| `src/modules/launch-lab/components/LaunchKpiCards.tsx` | KPI targets grid |
| `src/modules/launch-lab/components/LaunchMilestonesTimeline.tsx` | 30-day timeline |
| `src/modules/launch-lab/components/ElevatorHooksCard.tsx` | Copy-ready hooks |
| `src/modules/launch-lab/components/CanvasOverviewStats.tsx` | Canvas summary stats |
| `src/modules/launch-lab/components/LaunchLabToolbar.tsx` | Export / history / reset |
| `src/modules/launch-lab/components/SessionHistorySheet.tsx` | Saved sessions drawer |
| `src/modules/launch-lab/lib/pitch-metrics.ts` | Word count, grades |
| `src/modules/launch-lab/lib/export-launch-lab.ts` | Markdown export |

## Files modified

| Path | Change |
|------|--------|
| `src/shared/config/modules.ts` | Added `launch-lab` module |
| `src/shared/config/env.ts` | Added `VITE_MODULE_LAUNCH_LAB` |
| `src/components/routing/AppRoutes.tsx` | Registered routes |
| `src/shared/data/navigationStructure.ts` | Sidebar item under AI Agents |
| `src/components/layout/AppSidebar.tsx` | `Rocket` icon in iconMap |
| `supabase/config.toml` | JWT config for function |
| `.env.example` | Documented secrets |

---

## API contract: `launch-lab-agent`

### Health

`GET /functions/v1/launch-lab-agent` → `{ ok, configured, provider, model }`

### Pitch mode

```json
POST {
  "mode": "pitch",
  "pitch": "...",
  "pitch_type": "investor",
  "audience": "investors",
  "industry": "saas",
  "product_name": "FlowStack"
}
```

Response: `scores`, `overall`, `ready_for_planning`, `improved_pitch`, `fixes`, `objections`, `weak_moments`, `headline`, `tagline`, `one_liner`, `strengths`, `practice_questions`, `target_audience_fit`

### Canvas mode

```json
POST {
  "mode": "canvas",
  "improved_pitch": "...",
  "pitch_type": "investor",
  "audience": "investors",
  "industry": "saas",
  "product_name": "FlowStack"
}
```

Response: `clusters` (problems, ideas, risks, next_steps), `synthesis` (markdown), `kpis`, `milestones`, `elevator_hooks`

---

## User flow

1. Sidebar → **Launch Lab**
2. Set **pitch context** (product name, type, audience, industry)
3. Paste pitch or load sample → use **timer** / **read aloud** → **Analyze with Gemini**
4. Explore tabs: **Scores**, **Improve** (before/after + weak moments), **Objections** (flashcards), **Practice** (Q&A)
5. **Continue to Idea Canvas**
6. Canvas auto-generates — explore tabs: **Canvas**, **Launch plan**, **Checklist**, **KPIs**, **Timeline**
7. **Save session** / **Export Markdown** / **History** for later
8. Check off launch checklist items → celebration when complete

**Pitch ready gate:** `overall >= 60` OR `ready_for_planning` OR non-empty `improved_pitch`

---

## UI enhancements (2026-07-02)

- Gradient **hero banner** with live score + step indicator
- **Pitch context panel** — AI tailors feedback to audience/industry
- **Pitch stats** — word count, read time, character count
- **Practice timer** — 30/60/90/120s presets with progress bar
- **Text-to-speech** — listen to draft or polished pitch
- **Tabbed results** — scores, improve, objections, practice
- **Objection flashcards** — flip to reveal suggested answers
- **Before/after** pitch comparison with copy
- **Weak moments** panel with severity + fix suggestions
- **Strengths** + **practice Q&A** cards
- **Full-screen loading overlay** during AI calls
- **Canvas tabs** — board, plan, checklist, KPIs, 30-day timeline
- **Elevator hooks** — copy-ready one-liners
- **Interactive checklist** with progress bar + completion celebration
- **Session persistence** — auto-save to localStorage + manual history (12 sessions)
- **Markdown export** toolbar
- Enhanced sticky notes with emoji + gradient columns

---

## Next steps (office PC — start here)

### Priority 1 — Make it work end-to-end
1. Pull latest code from git
2. Run `supabase secrets set GOOGLE_AI_API_KEY=...`
3. Run `supabase functions deploy launch-lab-agent`
4. Test `/launch-lab` with each sample pitch

### Priority 2 — Polish for judging (optional)
- [x] Rich UI + demo-ready interactions (see UI enhancements)
- [x] localStorage session + history persistence
- [x] Markdown export
- [ ] Persist sessions to DB table `launch_lab_sessions` (user_id, jsonb payload)
- [ ] PDF export of launch plan (`jspdf` already in project)
- [ ] Error state UI if Gemini returns malformed JSON (retry button)

### Priority 3 — Submission package
- [ ] Deploy frontend to Vercel (hackathon URL)
- [ ] Record 2-min demo video
- [ ] Write business value summary (time saved: pitch review + launch planning)
- [ ] Architecture screenshot (this doc's diagram)

---

## Demo script (2 minutes)

1. **0:00** — Click **Launch Lab** in sidebar (under AI Agents)
2. **0:15** — Load "SaaS productivity" sample → **Analyze pitch**
3. **0:45** — Show score gauges + objections → **Continue to Idea Canvas**
4. **1:00** — Watch board populate + launch plan appear
5. **1:30** — Click **View launch plan** → **Copy** plan
6. **1:50** — *"From rough pitch to launch plan in under two minutes — one workflow, two AI agent modes, powered by Gemini."*

---

## Session log

### 2026-07-02 — Home PC (initial implementation) ✅

**Completed:**
- Full `launch-lab` module with Pitch Coach + Idea Canvas stepper
- Edge function `launch-lab-agent` using `GOOGLE_AI_API_KEY` + `gemini-2.5-flash`
- Sidebar entry with Rocket icon and "New" badge
- Sample pitches for quick demo
- Recharts radial gauges for pitch scores
- Sticky-note canvas columns with fade-in animation
- Markdown launch plan card with copy button
- `npm run build:dev` verified green

**Not done yet (your office session):**
- Deploy function to your Supabase project
- Set `GOOGLE_AI_API_KEY` in Supabase secrets
- Live end-to-end test against real Gemini API
- Demo video + submission docs

**Known limitations:**
- Session history is browser-local (not synced across devices); auto-save restores on refresh in same browser

### 2026-07-02 — Fix sidebar + redirect bug ✅

**Problem:** Page flashed then redirected to `/dashboard`; sidebar item missing.

**Cause:** `launch-lab` was not in `app_modules`. `get_user_modules` returned other modules, and `hasModule('launch-lab')` returned `false` for any slug not in that list.

**Fix applied:**
1. `useModuleAccess.ts` — fall through when slug missing from RPC (new modules work before DB seed)
2. `launch-lab` routes use `<ModuleRoute />` without module gate (auth only)
3. Sidebar item no longer requires `module: "launch-lab"`
4. Migration `20260702120000_register_launch_lab_module.sql` — run on Supabase when convenient

**After pull:** Restart dev server (`npm run dev`). No migration required for UI to work.

### 2026-07-02 — UI enhancement pass ✅

**Completed:**
- 18+ new UI components (hero, context, timer, flashcards, tabs, KPIs, timeline, etc.)
- Pitch context sent to Gemini (type, audience, industry, product name)
- Richer AI response fields (headline, strengths, practice questions, KPIs, milestones, hooks)
- localStorage auto-save + session history (save/load/delete, up to 12 entries)
- Markdown export from toolbar
- Tabbed Pitch Coach + Idea Canvas experiences
- `npm run build:dev` verified green

**Known limitations (updated):**
- Session history is browser-local (not synced across devices)
- TTS uses browser `speechSynthesis` (quality varies by browser)
- Gemini `system` role in shared routing is ignored; Launch Lab uses direct API with `systemInstruction` instead

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `GOOGLE_AI_API_KEY is not configured` | Set secret in Supabase Dashboard → Edge Functions → Secrets |
| CORS / non-2xx on invoke | Deploy function; check `config.toml` has `launch-lab-agent` |
| Sidebar item missing | Restart dev server after pull; item is under **AI Agents** → **Launch Lab** (no module gate) |
| Page flashes then redirects to dashboard | Fixed in `useModuleAccess` + routes; pull latest and restart dev server |
| Empty canvas | Check function logs in Supabase; verify pitch text length |
| Build errors | Run `npm install` then `npm run build:dev` |

---

## Git commit suggestion (when ready)

```
feat(launch-lab): add hackathon Pitch Coach + Idea Canvas wizard

Standalone /launch-lab module with Gemini edge function for SJ hackathon 2026.
```
