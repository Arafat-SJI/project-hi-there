# CLAUDE.md — SJ Control Tower Framework

## Project Overview

Full-stack business management platform (also called **SJ Innovation Framework V1**) built as a reusable, modular framework for enterprise applications. Provides authentication, CRM, meetings, knowledge base, AI agents, project management, EOS, and productivity tracking.

- **Stack**: React 18 + TypeScript + Vite + Supabase + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno-based serverless), PostgreSQL with RLS
- **Dev server**: port 8080 (configured in `vite.config.ts`)

## Quick Commands

```bash
npm run dev              # Start dev server on port 8080
npm run build            # Production build
npm run build:dev        # Development build
npm run lint             # ESLint (typescript-eslint + react-hooks + react-refresh)
npm run preview          # Preview production build
npm run migrations:run   # Apply pending database migrations
npm run migrations:repair # Fix migration history
```

**No test runner is configured.** There are no test files, no Jest/Vitest, and no test scripts.

## Project Structure

```
/
├── src/                           # Frontend source code
│   ├── App.tsx                    # Root component — all route definitions
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── auth/                  # ProtectedRoute, AdminRoute
│   │   ├── layout/                # DashboardLayout, AdminLayout, AppSidebar, TopNav
│   │   ├── ui/                    # 51 shadcn/ui components
│   │   ├── admin/                 # Admin panel components
│   │   ├── ai/                    # AI chat and assistant components
│   │   ├── agent/                 # AI agent UI
│   │   ├── meetings/              # Meeting management UI
│   │   ├── integrations/          # OAuth, Teams, Google Drive UI
│   │   ├── client-portal/         # Client-facing portal
│   │   ├── mcp/                   # Model Context Protocol components
│   │   ├── followup/              # Lead follow-up components
│   │   ├── user-knowledge/        # Personal knowledge management
│   │   ├── settings/              # User settings
│   │   ├── routing/               # ModuleRoute and routing utilities
│   │   └── common/                # Shared components
│   ├── contexts/                  # AuthContext, BrandingContext
│   ├── hooks/                     # 30+ custom React hooks (useClients, useMeetings, etc.)
│   ├── integrations/              # Supabase client setup and utilities
│   ├── lib/                       # Utilities: validation, cache, activity-logger, sanitize
│   ├── modules/                   # 10 feature modules (each with index.ts + routes.tsx)
│   │   ├── platform/              # Core: auth, dashboard, profile, settings
│   │   ├── meetings/              # Meeting management
│   │   ├── actions/               # Task management
│   │   ├── knowledge/             # Knowledge base
│   │   ├── business-dev/          # CRM, deals, contacts
│   │   ├── eos/                   # V/TO, OKRs, issues, scorecards
│   │   ├── projects/              # Project lifecycle, milestones, billing
│   │   ├── productivity/          # Team metrics, analytics
│   │   └── admin/                 # Admin panel
│   ├── pages/                     # 25+ route page components
│   ├── shared/config/             # env.ts, modules.ts, api.ts, navigationStructure.ts
│   └── types/                     # TypeScript type definitions
│
├── supabase/
│   ├── functions/                 # 89 Edge Functions (Deno runtime)
│   ├── migrations/                # 105 database migrations
│   ├── seed/                      # Database seeding scripts
│   ├── auth-middleware.ts         # Edge function auth utilities
│   ├── cors.ts                    # CORS headers
│   └── config.toml                # Function-level JWT verification config
│
├── docs/                          # Comprehensive documentation
│   ├── 00-getting-started/        # Setup guides
│   ├── 01-architecture/           # System design and data flow
│   ├── 02-modules/                # Per-module documentation
│   ├── 03-development/            # Developer guides and release process
│   ├── 04-deployment/             # Deployment guides
│   ├── 05-integrations/           # External service integrations
│   ├── 06-ai-features/            # AI capabilities documentation
│   ├── 07-admin/                  # Admin panel and feature flags
│   └── 08-edge-functions/         # Edge function catalog and deployment
│
├── scripts/                       # Shell scripts for migrations and setup
└── public/                        # Static assets
```

## Architecture & Key Patterns

### Module System

Modules are the primary organizational unit. Defined in `src/shared/config/modules.ts`:

| Module | Category | Core? | Dependencies | Feature Flags |
|--------|----------|-------|--------------|---------------|
| platform | core | yes | — | — |
| admin | core | yes | platform | — |
| eos | business | no | platform | — |
| meetings | operations | no | platform | enableMeetings |
| knowledge | intelligence | no | platform | enableKnowledgeBase, enablePersonalKnowledge, enableSemanticSearch |
| projects | business | no | platform | — |
| actions | operations | no | platform | enableTasks |
| business-dev | business | no | platform | enableClients |
| lead-followup | business | no | platform, business-dev | — |
| productivity | operations | no | platform | — |

**Three-layer resolution:**
1. **Build-time**: `VITE_MODULE_*` env vars control code bundling
2. **Runtime**: `app_modules` DB table toggles modules (admin UI)
3. **Per-user**: `user_module_permissions` table controls access

### Routing (src/App.tsx)

```
Public routes          → Login, Signup, AuthCallback (no auth)
Client portal routes   → Token-based access, no layout
Protected routes       → ProtectedRoute → DashboardLayout → module routes
Admin routes           → ProtectedRoute → AdminRoute → AdminLayout → admin routes
```

Each module exports its routes from `src/modules/<name>/routes.tsx` using `<ModuleRoute>` for runtime access checks.

### Data Fetching

All data fetching uses **TanStack React Query** with centralized cache keys in `src/lib/cache.ts`:

```typescript
// Query key factories
queryKeys.clients.list(filters)
queryKeys.meetings.detail(id)
queryKeys.knowledge.semanticSearch(query, opts)

// Cache invalidation helpers
invalidateKeys.clients(queryClient)
invalidateKeys.meetings(queryClient)

// Stale time presets
cacheConfig.staleTime.short   // 1 min
cacheConfig.staleTime.medium  // 5 min
cacheConfig.staleTime.long    // 30 min
cacheConfig.staleTime.veryLong // 1 hour
```

Custom hooks encapsulate all business logic (e.g., `useClients`, `useMeetings`, `useKnowledge`). Never fetch data directly in components — use or create a hook.

### Authentication

- **AuthContext** (`src/contexts/AuthContext.tsx`) manages user state
- **ProtectedRoute** checks authentication
- **AdminRoute** checks admin role
- Supports: Email/password, Google OAuth, Microsoft Azure AD
- Profiles auto-created on first login
- Roles stored in `user_roles` table (admin, moderator, user)

### Forms

All forms use **React Hook Form + Zod**:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```
Validation schemas live in `src/lib/validation.ts`.

### Edge Functions

89 Deno-based serverless functions in `supabase/functions/`. Standard pattern:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Function logic...
});
```

JWT verification is configured per-function in `supabase/config.toml`. Functions that validate auth in-code have `verify_jwt = false`.

## Naming Conventions

| Context | Convention | Examples |
|---------|-----------|----------|
| React components | PascalCase files and exports | `Dashboard.tsx`, `ClientForm.tsx` |
| Custom hooks | `use` prefix, camelCase | `useClients.ts`, `useMeetings.ts` |
| Utility files | camelCase | `validation.ts`, `cache.ts`, `activity-logger.ts` |
| Types/Interfaces | PascalCase | `Client`, `Meeting`, `ModuleDefinition` |
| Type suffixes | `Type` suffix for context types | `AuthContextType` |
| Constants | UPPER_SNAKE_CASE for registries | `MODULE_REGISTRY` |
| Database tables | snake_case | `user_roles`, `knowledge_entries`, `ai_agents` |
| Database columns | snake_case | `created_at`, `user_id`, `full_name` |
| Edge functions | kebab-case directories | `ai-chat-assistant/`, `semantic-search/` |
| Env vars (client) | `VITE_` prefix | `VITE_SUPABASE_URL` |

## Path Aliases

`@` maps to `./src` (configured in `vite.config.ts` and `tsconfig.json`):
```typescript
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
```

## Database

- **PostgreSQL** via Supabase with **Row Level Security (RLS)** on all tables
- **No ORM** — direct Supabase client queries (`supabase.from("table").select(...)`)
- Types auto-generated in `src/integrations/supabase/types.ts`
- 105 migrations in `supabase/migrations/` (apply with `npm run migrations:run`)
- Vector extension enabled for embedding-based semantic search

### Core Tables
- `profiles`, `user_roles`, `roles` — Auth & access
- `clients` — CRM/contacts
- `meetings`, `meeting_transcripts`, `zoom_files` — Meeting management
- `knowledge_entries`, `knowledge_files`, `knowledge_categories`, `knowledge_sources` — Knowledge base
- `embeddings` — Vector embeddings for semantic search
- `ai_agents`, `ai_agent_runs`, `ai_chat_history` — AI features
- `tasks`, `projects`, `project_milestones` — Project/task management
- `app_config`, `app_modules`, `user_module_permissions` — Configuration
- `notifications`, `feedback`, `activity_logs` — Operations

## Environment Variables

Required (see `.env.example`):

```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
```

Edge function secrets:
```
OPENAI_API_KEY             # AI features
GOOGLE_CLIENT_ID / SECRET  # Google OAuth + Drive
ZOOM_CLIENT_ID / SECRET    # Zoom integration
SENDGRID_API_KEY           # Email
SLACK_WEBHOOK_URL          # Slack notifications
```

Module toggles (build-time):
```
VITE_MODULE_EOS=true
VITE_MODULE_MEETINGS=true
VITE_MODULE_PROJECTS=true
VITE_MODULE_ACTIONS=true
VITE_MODULE_BUSINESS_DEV=true
VITE_MODULE_KNOWLEDGE=true
VITE_MODULE_PRODUCTIVITY=true
```

## ESLint Configuration

- TypeScript ESLint recommended rules
- React hooks plugin (recommended rules)
- React refresh plugin (warns on non-component exports)
- `@typescript-eslint/no-unused-vars` is **off**
- TypeScript `strict: false` in tsconfig

## Security Practices

1. **RLS on all tables** — never bypass Row Level Security
2. **Input validation** — Zod schemas for all forms (`src/lib/validation.ts`)
3. **XSS protection** — DOMPurify for user-generated content (`src/lib/sanitize.ts`)
4. **Activity logging** — `logCrud()`, `logLogin()`, `logLogout()` from `src/lib/activity-logger.ts`
5. **Auth middleware** — `supabase/auth-middleware.ts` for edge functions
6. **No secrets in client code** — all sensitive keys are edge function secrets
7. **CORS** — centralized in `supabase/cors.ts`

## Common Tasks

### Adding a new page
1. Create page component in `src/pages/`
2. Add route in the appropriate module's `routes.tsx`
3. Add navigation item in `src/components/layout/AppSidebar.tsx`
4. Wrap with `<ModuleRoute>` if module-specific

### Adding a new hook
1. Create in `src/hooks/` following `use*` naming
2. Use `queryKeys` from `src/lib/cache.ts` for cache keys
3. Use `invalidateKeys` for cache invalidation after mutations
4. Show errors via toast notifications (sonner)

### Creating a new edge function
1. Create folder in `supabase/functions/<function-name>/`
2. Use CORS headers from the standard pattern
3. Use `auth-middleware.ts` for auth validation
4. Add JWT config to `supabase/config.toml`
5. Deploy: `supabase functions deploy <function-name>`

### Adding a new module
1. Create module directory in `src/modules/<name>/` with `index.ts` and `routes.tsx`
2. Register in `src/shared/config/modules.ts` MODULE_REGISTRY
3. Add routes in `src/App.tsx`
4. Create database tables with RLS policies
5. Add env var toggle `VITE_MODULE_<NAME>` if needed

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with all route definitions |
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/contexts/BrandingContext.tsx` | Branding/theming state |
| `src/shared/config/modules.ts` | Module registry (source of truth for modules) |
| `src/shared/config/env.ts` | Centralized environment variable access |
| `src/lib/cache.ts` | React Query key factories and invalidation helpers |
| `src/lib/validation.ts` | Zod validation schemas |
| `src/lib/activity-logger.ts` | Activity tracking utilities |
| `src/lib/sanitize.ts` | Input sanitization |
| `supabase/config.toml` | Edge function JWT verification config |
| `supabase/auth-middleware.ts` | Edge function auth utilities |
| `supabase/cors.ts` | CORS configuration for edge functions |
| `vite.config.ts` | Build config (port 8080, `@` alias) |
| `tailwind.config.ts` | Tailwind with dark mode, custom colors |

## Specialized Subagents

Seven specialized agents are available in `.claude/agents/` for delegating complex tasks. Each agent has deep knowledge of this project's patterns, conventions, and file structure.

| Agent | File | Specialization | Tools |
|-------|------|---------------|-------|
| **react-frontend-dev** | `.claude/agents/react-frontend-dev.md` | Pages, components, hooks, forms, routing, UI/styling | Read, Write, Edit, Bash, Glob, Grep |
| **supabase-backend-dev** | `.claude/agents/supabase-backend-dev.md` | Edge Functions, migrations, RLS policies, auth, DB schema | Read, Write, Edit, Bash, Glob, Grep |
| **code-reviewer** | `.claude/agents/code-reviewer.md` | Code quality, security audit, performance review, convention enforcement | Read, Grep, Glob (read-only) |
| **typescript-strict** | `.claude/agents/typescript-strict.md` | Type safety, `any` elimination, Zod/TS alignment, type guards | Read, Write, Edit, Glob, Grep |
| **documentation-engineer** | `.claude/agents/documentation-engineer.md` | Specs, API docs, module guides, schema docs, setup guides | Read, Write, Edit, Glob, Grep |
| **debugger-detective** | `.claude/agents/debugger-detective.md` | Error analysis, React rendering bugs, Supabase/RLS debugging, perf profiling | Read, Edit, Bash, Glob, Grep |
| **test-automator** | `.claude/agents/test-automator.md` | Unit tests, integration tests, test infrastructure (Vitest + RTL), fixtures | Read, Write, Edit, Bash, Glob, Grep |

### Example Invocations

```
# Build a new page with data fetching
Use the react-frontend-dev agent to create a new Contacts page with list/detail views

# Create an Edge Function with migration
Use the supabase-backend-dev agent to create a new API endpoint for team invitations

# Review code before merge
Use the code-reviewer agent to review the changes in src/hooks/useDeals.ts

# Improve type safety
Use the typescript-strict agent to eliminate all `any` types in src/hooks/useClients.ts

# Write documentation
Use the documentation-engineer agent to document the meetings module API

# Debug an issue
Use the debugger-detective agent to investigate why meetings list returns empty

# Set up tests
Use the test-automator agent to write unit tests for src/lib/validation.ts
```

## Documentation

Comprehensive docs in `/docs/` organized by topic:
- `00-getting-started/` — Setup and quickstart
- `01-architecture/` — System design, data flow, security
- `02-modules/` — Per-module feature documentation
- `03-development/` — Developer guides, release process
- `04-deployment/` — Deployment guides
- `05-integrations/` — External service integrations
- `06-ai-features/` — AI capabilities
- `07-admin/` — Admin panel and feature flags
- `08-edge-functions/` — Edge function catalog and deployment
