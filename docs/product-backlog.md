# CollabAi Product Backlog

![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4?style=flat-square)
![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square)

> **Version:** 1.0.0  
> **Last Updated:** 2024-12-31  
> **Status:** Active Development

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Development Platform** | [Lovable.dev](https://lovable.dev) | AI-powered IDE, instant preview, one-click publish |
| **Backend Platform** | [Supabase](https://supabase.com) | PostgreSQL, Auth, Storage, Edge Functions |
| **Frontend Framework** | React 18 + Vite + TypeScript | Modern web application |
| **Styling** | Tailwind CSS + shadcn/ui | UI components and styling |

**All development happens in [Lovable.dev](https://lovable.dev) - no local setup required.**

---

## 1. Product Vision & Strategy

### Vision
Transform CollabAi into a **rapidly deployable, configurable multi-tenant SaaS platform** for internal company use. The goal is to minimize code changes per client by adopting a configuration-first approach.

### Strategic Goals
- **Configuration-first:** All client-specific settings managed via Admin Panel
- **Master Supabase Template:** Standardized database schema for rapid deployment
- **Target Deployment Time:** < 4 hours per new client
- **Modular Architecture:** Enable/disable features per client needs

---

## 2. Current State Analysis

### ✅ Completed Features

| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ Complete | Email/password login with role-based access (via Supabase Auth) |
| **Dashboard** | ✅ Complete | Real-time analytics with live stats, recent activity feed, and task overview charts |
| **Clients** | ✅ Complete | CRUD operations for client management |
| **Meetings** | ✅ Complete | Meeting scheduling with Zoom integration fields |
| **Tasks** | ✅ Complete | Task management with assignments, priorities, and status tracking |
| **Knowledge Base** | ✅ Complete | Searchable knowledge entries with categories |
| **AI Chat** | ✅ Complete | AI assistant interface (placeholder) |
| **AI Agents** | ✅ Complete | Full CRUD + agent execution with history tracking and status monitoring |
| **Notifications** | ✅ Complete | Real-time notifications with Supabase subscriptions, unread count, mark as read/delete |
| **Admin Panel** | ✅ Complete | User management, role management, activity logs, system settings, deployment status |
| **System Settings** | ✅ Complete | Platform branding, feature flags, email settings, system configuration |
| **Role Management** | ✅ Complete | Complete role CRUD with 23 permissions across all resources |
| **User Preferences** | ✅ Complete | Database-backed user settings (notifications, appearance, privacy, AI) |
| **Profile Page** | ✅ Complete | Full profile editing with password change and role display |
| **UI/UX** | ✅ Complete | Premium SaaS design with CollabAi branding |

### 📊 Database Schema (15 Tables in Supabase)

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profile information | ✅ |
| `user_roles` | Role assignments (admin, moderator, user) | ✅ |
| `roles` | Role definitions | ✅ |
| `clients` | Client/customer data | ✅ |
| `meetings` | Meeting records with Zoom fields | ✅ |
| `tasks` | Task tracking with assignments and priorities | ✅ |
| `knowledge_entries` | Knowledge base articles | ✅ |
| `knowledge_categories` | Article categorization | ✅ |
| `ai_agents` | AI agent configurations | ✅ |
| `ai_agent_runs` | AI execution logs | ✅ |
| `ai_chat_history` | Chat message history | ✅ |
| `embeddings` | Vector embeddings for RAG | ✅ |
| `feedback` | User feedback collection | ✅ |
| `notifications` | User notifications | ✅ |
| `zoom_files` | Zoom recording files | ✅ |

Manage database in **Supabase Dashboard** → Table Editor.

### 🔧 Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| `demo@collabai.software` | user | (set during creation) |
| `admin@collabai.software` | admin | (set during creation) |

### ⚠️ Known Issues (Fixed in Sprint 1)

1. ~~AI routes accessible to non-admin users~~ ✅ Fixed
2. ~~Sidebar shows admin-only items to all users~~ ✅ Fixed
3. ~~AdminRoute checks for `super_admin` not in enum~~ ✅ Fixed

---

## 3. Product Backlog (Prioritized)

### Sprint 1: Access Control Fixes ✅ COMPLETED

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-001 | Wrap AI routes with AdminRoute | Critical | 0.5h | ✅ Done |
| PB-002 | Dynamic sidebar with role-based visibility | Critical | 1h | ✅ Done |
| PB-003 | Fix AdminRoute role check | Critical | 0.5h | ✅ Done |

---

### Sprint 2: App Configuration System

*Development in [Lovable.dev](https://lovable.dev)*

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-004 | Create `app_config` database table | High | 0.5h | 🔲 Todo |
| PB-005 | Create `useAppConfig()` hook with caching | High | 1h | 🔲 Todo |
| PB-006 | Admin branding settings page (logo, colors, name) | High | 2h | 🔲 Todo |
| PB-007 | Admin feature toggles page | High | 2h | 🔲 Todo |

**Database Migration (via Lovable → Supabase):**
```sql
-- App configuration table for multi-tenant settings
CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  is_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write config
CREATE POLICY "Admins can manage config"
  ON public.app_config
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

---

### Sprint 3: User Management

*Development in [Lovable.dev](https://lovable.dev)*

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-008 | Admin user management page (list, view, edit) | Medium | 3h | 🔲 Todo |
| PB-009 | User invite system with email | Medium | 2h | 🔲 Todo |
| PB-010 | Role assignment dropdown UI | Medium | 1h | 🔲 Todo |
| PB-011 | User deactivation toggle | Medium | 1h | 🔲 Todo |

**Database Migration:**
```sql
-- User invitations table
CREATE TABLE public.user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text DEFAULT 'user',
  invited_by uuid REFERENCES public.profiles(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invites
CREATE POLICY "Admins can manage invites"
  ON public.user_invites
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

---

### Sprint 4: Integration Management

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-012 | Admin integration settings page | Medium | 2h | 🔲 Todo |
| PB-013 | Secure API key storage (via Supabase Edge Function Secrets) | Medium | 1h | 🔲 Todo |
| PB-014 | Connection test buttons (Zoom, OpenAI, etc.) | Medium | 2h | 🔲 Todo |
| PB-015 | Integration status indicators | Medium | 1h | 🔲 Todo |

---

### Sprint 5: Edge Functions Deployment

*Deploy via Lovable → auto-deployed to Supabase*

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-016 | Deploy `ai-chat` edge function | Medium | 2h | 🔲 Todo |
| PB-017 | Deploy `meeting-processor` edge function | Medium | 2h | 🔲 Todo |
| PB-018 | Deploy `knowledge-search` edge function | Medium | 2h | 🔲 Todo |
| PB-019 | Deploy `email-sender` edge function | Low | 1h | 🔲 Todo |
| PB-020 | Deploy `webhook-handler` edge function | Low | 1h | 🔲 Todo |

---

### Sprint 6: Onboarding & Automation

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| PB-021 | Client onboarding wizard component | Low | 4h | 🔲 Todo |
| PB-022 | Deployment checklist dashboard | Low | 2h | 🔲 Todo |
| PB-023 | Template data seeding (agents, categories) | Low | 1h | 🔲 Todo |
| PB-024 | Environment configuration validator | Low | 1h | 🔲 Todo |

---

## 4. Configuration Keys Reference

### Branding Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `branding.company_name` | string | "CollabAi" | Displayed in sidebar and headers |
| `branding.logo_url` | string | null | Logo image URL (Supabase Storage) |
| `branding.primary_color` | string | "#1e293b" | Primary theme color (HSL) |
| `branding.accent_color` | string | "#3b82f6" | Accent/highlight color (HSL) |
| `branding.favicon_url` | string | null | Favicon URL |

### Feature Toggles

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `features.clients_enabled` | boolean | true | Show Clients module |
| `features.meetings_enabled` | boolean | true | Show Meetings module |
| `features.knowledge_enabled` | boolean | true | Show Knowledge Base module |
| `features.ai_enabled` | boolean | true | Show AI Agents (admin only) |
| `features.feedback_enabled` | boolean | true | Enable feedback collection |

### Integration Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `integrations.zoom_enabled` | boolean | false | Zoom integration active |
| `integrations.google_enabled` | boolean | false | Google Drive integration active |
| `integrations.sendgrid_enabled` | boolean | false | SendGrid email integration active |
| `integrations.openai_enabled` | boolean | true | OpenAI integration active |

### AI Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ai.default_model` | string | "gpt-4o-mini" | Default AI model for agents |
| `ai.max_tokens` | number | 2000 | Max tokens per response |
| `ai.temperature` | number | 0.7 | AI response temperature |

---

## 5. File Structure (New/Modified)

### New Files to Create (in Lovable.dev)

```
src/
├── hooks/
│   └── useAppConfig.ts          # Configuration hook with caching
├── pages/
│   └── admin/
│       ├── Branding.tsx         # Branding settings page
│       ├── Features.tsx         # Feature toggles page
│       ├── Users.tsx            # User management page
│       ├── Integrations.tsx     # Integration settings page
│       └── AIConfig.tsx         # AI agent management page
├── components/
│   └── admin/
│       ├── OnboardingWizard.tsx # Setup wizard for new deployments
│       ├── DeploymentChecklist.tsx
│       └── UserInviteForm.tsx
supabase/
└── functions/                   # Edge functions (auto-deployed by Lovable)
    ├── ai-chat/
    │   └── index.ts             # AI conversation handler
    ├── meeting-processor/
    │   └── index.ts             # Zoom integration handler
    ├── knowledge-search/
    │   └── index.ts             # Vector search handler
    └── email-sender/
        └── index.ts             # SendGrid email handler
```

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | AI routes wrapped with AdminRoute |
| `src/components/layout/AppSidebar.tsx` | Role-based item filtering |
| `src/pages/Admin.tsx` | Navigation to admin sub-pages |
| `src/contexts/AuthContext.tsx` | Debug logging for role fetching |

---

## 6. Client Deployment Checklist

Use this checklist when deploying CollabAi to a new client:

### Pre-Deployment (Lovable + Supabase)
- [ ] Fork/remix project in [Lovable.dev](https://lovable.dev)
- [ ] Supabase project auto-provisioned or connected
- [ ] Configure Site URL and Redirect URLs in Supabase Auth

### Admin Setup (Supabase Dashboard)
- [ ] Create admin account via Supabase Auth
- [ ] Assign admin role in `user_roles` table
- [ ] Verify admin can access `/admin` route

### Branding Configuration (via Lovable.dev)
- [ ] Set company name
- [ ] Upload company logo
- [ ] Configure primary/accent colors
- [ ] Update favicon

### Feature Configuration (via Admin Panel / Code)
- [ ] Enable/disable Clients module
- [ ] Enable/disable Meetings module
- [ ] Enable/disable Knowledge Base
- [ ] Enable/disable AI Agents

### Integration Setup (Supabase Edge Function Secrets)
- [ ] Configure Zoom credentials (if meetings used)
- [ ] Set OpenAI API key (if AI used)
- [ ] Configure SendGrid (if email notifications needed)

### User Onboarding
- [ ] Invite initial admin users
- [ ] Invite regular users
- [ ] Verify user roles assigned correctly

### Final Verification
- [ ] Test login flow (email/password)
- [ ] Verify dashboard loads correctly
- [ ] Test all enabled modules
- [ ] Confirm AI chat works (if enabled)
- [ ] Test on mobile viewport

### Go Live (via Lovable)
- [ ] Click **Publish** in Lovable.dev
- [ ] Configure custom domain (if applicable)
- [ ] Update Supabase Site URL to production URL
- [ ] Document client-specific configurations

---

## 7. Estimated Timeline

| Sprint | Focus | Estimated Hours | Cumulative |
|--------|-------|-----------------|------------|
| Sprint 1 | Access Control Fixes | 2h | 2h |
| Sprint 2 | App Configuration | 5.5h | 7.5h |
| Sprint 3 | User Management | 7h | 14.5h |
| Sprint 4 | Integration Management | 6h | 20.5h |
| Sprint 5 | Edge Functions | 8h | 28.5h |
| Sprint 6 | Onboarding | 8h | 36.5h |

**Total Estimated Development Time:** ~37 hours

---

## 8. Technical Decisions

### Why Separate `user_roles` Table?
- **Security:** Prevents privilege escalation attacks
- **Flexibility:** Users can have multiple roles
- **RLS Safety:** Uses `SECURITY DEFINER` function to avoid recursion

### Why `app_config` as Key-Value Store?
- **Flexibility:** Add new settings without schema changes
- **Multi-tenant Ready:** Each deployment has its own config
- **Type Safety:** JSONB with TypeScript interfaces

### Why Edge Functions for Backend Logic?
- **Serverless:** Auto-scaling with traffic (managed by Supabase)
- **Security:** Server-side API key handling
- **Integration:** Direct Supabase access with service role
- **Auto-deploy:** Lovable automatically deploys edge functions

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| RLS policy misconfiguration | Use `has_role()` function consistently |
| API key exposure | Store in Supabase Edge Function Secrets |
| Slow deployments | Use this checklist and template database |
| Feature conflicts | Use feature flags, test modules independently |

---

## 10. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Deployment time per client | < 4 hours | TBD |
| Code changes per client | 0 (config only) | TBD |
| Admin panel configuration coverage | 90% | ~10% |
| Edge function deployment success | 100% | 0% |

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **Lovable.dev** | [lovable.dev](https://lovable.dev) |
| **Lovable Docs** | [docs.lovable.dev](https://docs.lovable.dev) |
| **Supabase Dashboard** | [supabase.com/dashboard](https://supabase.com/dashboard) |
| **Supabase Docs** | [supabase.com/docs](https://supabase.com/docs) |

---

**Development Platform:** [Lovable.dev](https://lovable.dev)  
**Backend Platform:** [Supabase](https://supabase.com)

*Document maintained by: CollabAi Development Team*
