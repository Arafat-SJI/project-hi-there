# SJ Control Tower — Launch Lab (Hackathon 2026)

Full-stack business management platform (**SJ Innovation Framework V1**) with **Launch Lab**: an AI-guided workflow that takes users from rough pitch → launch canvas → command center → shareable handoff.

**Hackathon submission:** SJ Innovation AI Hackathon June 2026  
**Primary route:** `/launch-lab` (sidebar → AI Agents → Launch Lab)

---

## What Launch Lab Does

| Step | Name | Description |
|------|------|-------------|
| 1 | **Idea Coach** | Score and refine a pitch with Gemini (objections, practice Q&A, improved rewrite) |
| 2 | **Idea Canvas** | Auto-generate problem/idea/risk clusters, KPIs, milestones, and checklist |
| 3 | **Launch Command** | Visual flow board, social banners, executive brief |
| 4 | **Complete & Share** | Mark complete; share read-only access with teammates |

Sessions persist in Supabase (`launch_lab_sessions`). Owners can share projects via a team user picker; collaborators see shared projects in a **Shared** sidebar section and browse all steps read-only.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack React Query |
| **Backend** | Supabase (PostgreSQL + RLS, Auth, Edge Functions) |
| **AI** | Google Gemini (`gemini-2.5-flash`) via `launch-lab-agent` Edge Function |
| **Dev server** | Port **8080** (`vite.config.ts`) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA)                                            │
│  Sidebar → /launch-lab/:projectId                               │
│    LaunchLabPage (4-step stepper)                               │
│      ├── PitchCoachStep      → useAnalyzePitch()                │
│      ├── IdeaCanvasStep      → useGenerateCanvas()              │
│      ├── LaunchCommandStep   → flow board, banners, brief       │
│      └── LaunchCompleteStep  → useLaunchLabSharing()            │
│                                                                 │
│  useLaunchLabSession() ──► loadLaunchLabWorkspace()             │
│    • Own sessions + shared sessions (RLS)                       │
│    • Auto-save to launch_lab_sessions                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ invokeEdgeFunction('launch-lab-agent')
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Edge Function: launch-lab-agent                       │
│    mode: "pitch"       → scores, improved pitch, objections     │
│    mode: "canvas"      → clusters, KPIs, milestones, plan       │
│    mode: "social-post" → platform-specific post copy            │
│  Secret: GOOGLE_AI_API_KEY                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
                    Google Gemini API
```

### Key directories

| Path | Purpose |
|------|---------|
| `src/modules/launch-lab/` | Launch Lab UI, hooks, types, session persistence |
| `supabase/functions/launch-lab-agent/` | Gemini agent (pitch / canvas / social-post) |
| `supabase/migrations/` | `launch_lab_sessions`, sharing, RLS policies |
| `hackathon-feature.md` | Detailed handoff doc, demo script, checklist |

### Data model (Launch Lab)

- **`launch_lab_sessions`** — pitch, analysis, canvas, board, banners, step, completion state
- **`launch_lab_preferences`** — active session, sidebar visibility per user
- **`launch_lab_session_shares`** — owner → collaborator read-only access (RLS + SECURITY DEFINER helpers)

### Platform context

Launch Lab is a **standalone module** on the SJ Control Tower framework. It reuses platform auth, routing, sidebar layout, and Edge Function patterns without depending on CRM, meetings, or EOS tables.

For full platform architecture, see [docs/01-architecture/](./docs/01-architecture/) and [CLAUDE.md](./CLAUDE.md).

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase CLI** (`npx supabase` or global install)
- A **Supabase project** (personal hackathon instance)
- **Google AI API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd project-hi-there
npm install
```

### 2. Configure frontend environment

Copy the example env file and fill in your Supabase project values:

```bash
cp .env.example .env
```

Required variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_MODULE_LAUNCH_LAB=true
```

Get URL and anon key from: Supabase Dashboard → **Project Settings** → **API**.

### 3. Apply database migrations

```bash
npm run migrations:run
```

Or push to a linked remote project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Launch Lab requires migrations for `launch_lab_sessions`, preferences, sharing, and RLS fixes (see `supabase/migrations/20260703*`).

### 4. Deploy the AI agent (required for Launch Lab)

Set the Gemini API key as a Supabase secret:

```bash
npx supabase secrets set GOOGLE_AI_API_KEY=your-key-here
```

Deploy the Edge Function:

```bash
npm run launch-lab:deploy
# or: npx supabase functions deploy launch-lab-agent
```

**Health check** (optional):

```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/launch-lab-agent" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expect a JSON response with `ok` and `configured` fields.

### 5. Run the dev server

```bash
npm run dev
```

Open **http://localhost:8080/launch-lab**, sign in, and start a new Launch Lab session.

The UI shows a deploy alert until `launch-lab-agent` is deployed and `GOOGLE_AI_API_KEY` is set.

### 6. Verify build (before commit)

```bash
npm run lint
npm run build:dev
```

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run migrations:run` | Apply pending DB migrations |
| `npm run launch-lab:deploy` | Deploy `launch-lab-agent` Edge Function |
| `npm run launch-lab:secret` | Prompt to set `GOOGLE_AI_API_KEY` (run with value via Supabase CLI) |

---

## Demo Flow (2 minutes)

1. Sidebar → **AI Agents** → **Launch Lab**
2. Paste or load a sample pitch → **Analyze with Gemini**
3. Review scores and objections → continue to **Idea Canvas**
4. Explore clusters, KPIs, checklist → **Launch Command**
5. View flow board and banners → **Complete launch**
6. Share with a teammate from the team user list

---

## Documentation

| Resource | Description |
|----------|-------------|
| [hackathon-feature.md](./hackathon-feature.md) | Launch Lab handoff, API contract, demo script |
| [docs/README.md](./docs/README.md) | Full platform documentation |
| [docs/00-getting-started/](./docs/00-getting-started/) | Lovable and self-host quickstarts |
| [CLAUDE.md](./CLAUDE.md) | Developer conventions and module registry |

---

## License

MIT License — see [LICENSE](./LICENSE).
