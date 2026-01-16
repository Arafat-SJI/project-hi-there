# CollabAi Quick Start Guide

![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4?style=flat-square)
![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square)

> **Get CollabAi running in under 30 minutes using Lovable + Supabase**
>
> ⚠️ **No local development required!** Everything happens in the browser.

---

## 🛠️ Framework Requirements

This project is built with and requires:

| Platform | Purpose | Sign Up |
|----------|---------|---------|
| **[Lovable.dev](https://lovable.dev)** | AI-powered frontend development & deployment | [Create Account](https://lovable.dev) |
| **[Supabase](https://supabase.com)** | Backend (database, auth, storage, edge functions) | Auto-provisioned by Lovable |

### What Makes This Different?

- ✅ **No CLI required** - No npm, no terminal, no local setup
- ✅ **No local database** - Supabase handles everything in the cloud
- ✅ **AI-assisted development** - Describe changes in plain English
- ✅ **Instant preview** - See changes in real-time
- ✅ **One-click publish** - Deploy to production instantly

---

## 🎯 Overview

This guide helps you deploy CollabAi to a new client using:

- ✅ **Lovable.dev** - AI-powered frontend development
- ✅ **Supabase** - Backend (database, auth, storage, edge functions)
- ✅ **No CLI required** - Everything through web interfaces

**Total Time:** 20-30 minutes for basic setup

---

## 📋 Prerequisites

Before you begin:

1. **Lovable.dev account** - [Sign up here](https://lovable.dev) (free to start)
2. **Supabase account** - Auto-provisioned by Lovable (or connect external)
3. **API Keys** (optional, for integrations):
   - OpenAI API key (for AI features)
   - Zoom credentials (for meeting sync)
   - Google OAuth (for Google sign-in)

---

## 🔄 Remixing / Forking This Project

If you're remixing or forking this project to create your own instance:

### Step 1: Fork the Repository

**Option A: Via Lovable (Recommended)**
1. Open the project in Lovable
2. Click **"Remix"** to create your own copy
3. All code, schema, and configurations are copied

**Option B: Via GitHub**
1. Fork the repository on GitHub
2. Clone to your local machine
3. Follow local development setup

### Step 2: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Create a new Supabase project:**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Note your project ID, URL, and keys

3. **Update `.env` file** with your Supabase credentials:
   ```env
   # Replace these with YOUR values
   VITE_SUPABASE_PROJECT_ID="your-project-id-here"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key-here"
   ```

4. **Get your credentials** from Supabase:
   - Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`
   - Copy **Project URL** → paste as `VITE_SUPABASE_URL`
   - Copy **Anon (public) key** → paste as `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Copy project ID from URL → paste as `VITE_SUPABASE_PROJECT_ID`

### Step 3: Run Database Migrations

Migrations run automatically when you connect to Supabase in Lovable.

If using local development, run:
```bash
supabase db push
```

### Step 4: Configure Secrets (Optional)

Only add secrets for features you want to enable:

| Feature | Required Secret | Get From |
|---------|----------------|----------|
| AI Chat, Search, Agents | `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Email Notifications | `SENDGRID_API_KEY` | [app.sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys) |
| Zoom Integration | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` | [marketplace.zoom.us](https://marketplace.zoom.us) |
| Google Drive | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) |

**Add secrets in Supabase:**
1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions`
2. Click **"Secrets"**
3. Add each secret as `KEY=value`

### Step 5: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy ai-chat-assistant
```

### Step 6: Enable/Disable Features

Features can be toggled via the `app_config` table:

```sql
-- Disable features you don't need
UPDATE app_config SET value = 'false' WHERE key = 'features.enableZoomSync';
UPDATE app_config SET value = 'false' WHERE key = 'features.enableGoogleDrive';

-- View all feature flags
SELECT * FROM app_config WHERE key LIKE 'features.%';
```

See [FEATURE_FLAGS.md](FEATURE_FLAGS.md) for complete feature flag documentation.

### Step 7: Test Your Instance

1. Start the development server (Lovable does this automatically)
2. Create an admin account at `/signup`
3. Assign admin role via SQL (see Step 4 below)
4. Test core features:
   - Login/logout
   - Dashboard loads
   - Create clients, meetings, tasks
   - AI chat (if configured)

### What Gets Copied When You Remix?

| Item | Included | Notes |
|------|----------|-------|
| Frontend code | ✅ Yes | All React components and pages |
| Database schema | ✅ Yes | All tables, RLS policies, functions |
| Edge functions | ✅ Yes | All 41 serverless functions |
| Environment variables | ❌ No | You must set your own |
| API keys/secrets | ❌ No | You must add your own |
| Data | ❌ No | Fresh database |

### Quick Start After Remix

1. ✅ Update `.env` with your Supabase credentials
2. ✅ Add `OPENAI_API_KEY` secret if using AI features
3. ✅ Create admin account
4. ✅ Disable features you don't need (optional)
5. ✅ Deploy edge functions (if self-hosting)
6. ✅ Start developing!

**Estimated time to get running:** 10 minutes

---

## 🚀 Deployment Steps

### Step 1: Create/Fork Project in Lovable

**Option A: Start Fresh**
1. Go to [lovable.dev](https://lovable.dev)
2. Click **"Create New Project"**
3. Choose React + Vite + Supabase template
4. Name your project

**Option B: Remix Existing (Recommended)**
1. Open the existing CollabAi project in Lovable
2. Go to **Settings** → **Remix Project**
3. Create a copy for the new client

> 💡 **Tip:** Remixing preserves all code, database schema, and configurations.

---

### Step 2: Connect Supabase

Lovable automatically provisions a Supabase project, or you can connect an external one:

1. Go to **Settings** → **Supabase** in Lovable
2. View auto-provisioned project OR connect external
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbG...`

**Access Supabase Dashboard:**
- URL: `https://supabase.com/dashboard`
- Log in with same email used for Lovable

---

### Step 3: Verify Database Schema

The database should already have these tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `user_roles` | Role assignments |
| `clients` | Client data |
| `meetings` | Meeting records |
| `knowledge_entries` | Knowledge articles |
| `ai_agents` | AI configurations |

**Check in Supabase Dashboard:** Table Editor → See all tables

---

### Step 4: Create Admin Account

1. Open the app preview in Lovable
2. Go to `/signup`
3. Create account with admin email (e.g., `admin@client.com`)
4. Verify email (or disable email confirmation in Supabase)

**Assign Admin Role (in Supabase SQL Editor):**

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'admin@client.com';

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin');
```

**Access SQL Editor:** [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor

---

### Step 5: Configure Branding (via Admin Panel)

1. Log in as admin
2. Go to `/admin`
3. Update branding settings:
   - Company name
   - Logo (upload to Supabase Storage)
   - Primary colors
   - Favicon

*Note: Full branding admin panel coming in Sprint 2*

---

### Step 6: Enable Features

In the Admin Panel, configure which modules are enabled:

- [ ] Clients module
- [ ] Meetings module
- [ ] Knowledge Base
- [ ] AI Agents

*Note: Feature toggles coming in Sprint 2*

---

### Step 7: Set Up Integrations (Optional)

Configure in **Supabase Dashboard** → Settings → Edge Function Secrets:

**AI Features:**
```
OPENAI_API_KEY=sk-proj-...
```

**Zoom Integration:**
```
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_ACCOUNT_ID=...
```

**Google Drive:**
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Email Notifications:**
```
SENDGRID_API_KEY=...
```

**Access Secrets Page:** [Supabase Edge Function Secrets](https://supabase.com/dashboard)

---

### Step 8: Invite Users

**Option A: Direct Sign Up**
- Share the app URL with users
- They sign up at `/signup`
- Admin assigns roles in Supabase Table Editor

**Option B: User Invites (Coming Soon)**
- Admin sends email invites from Admin Panel
- Users click link and create account
- Role auto-assigned from invite

---

### Step 9: Publish to Production (via Lovable)

1. In Lovable, click **"Publish"** button (top right)
2. Wait for build to complete
3. Configure custom domain (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS records
4. Click **"Update"** to deploy changes

> 💡 **Note:** Frontend changes require clicking "Update". Backend changes (edge functions, database) deploy automatically.

---

### Step 10: Verify Deployment

**Test Checklist:**

- [ ] Login works (email/password)
- [ ] Dashboard loads correctly
- [ ] Can create/edit clients
- [ ] Can create/edit meetings
- [ ] Knowledge base accessible
- [ ] AI chat works (if configured)
- [ ] Admin panel accessible (admin only)

---

## 🔧 Configuration Reference

### Supabase Auth Settings

Go to **Supabase Dashboard** → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `https://your-app.lovable.app` or custom domain |
| Redirect URLs | Add all allowed redirect URLs |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret to **Supabase Auth** → Providers → Google

---

## 📊 Estimated Time

| Task | Time |
|------|------|
| Create/fork project in Lovable | 2 min |
| Connect Supabase | 2 min |
| Create admin account | 5 min |
| Configure branding | 10 min |
| Set up integrations | 10 min |
| Invite users | 5 min |
| Publish & verify | 5 min |
| **Total** | **~40 min** |

---

## 🐛 Troubleshooting

### Login Not Working

1. Check **Supabase Auth** → URL Configuration
2. Verify Site URL matches app URL
3. Check Redirect URLs include app domain
4. Review Auth logs in Supabase Dashboard

### Database Errors

1. Verify RLS policies are enabled
2. Check user has correct role in `user_roles`
3. Review Supabase logs for specific errors

### AI Chat Not Working

1. Verify `OPENAI_API_KEY` is set in Edge Function Secrets
2. Check edge function logs in Supabase Dashboard
3. Verify API key has credits

---

## 📚 Next Steps

After basic setup:

1. **[FEATURE_FLAGS.md](./FEATURE_FLAGS.md)** - Complete feature flags reference
2. **[EDGE_FUNCTIONS_CATALOG.md](./EDGE_FUNCTIONS_CATALOG.md)** - All edge functions documented
3. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment checklist
4. **[ADMIN-GUIDE.md](./ADMIN-GUIDE.md)** - Admin configuration guide
5. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
6. **[product-backlog.md](./product-backlog.md)** - Feature roadmap

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

**Happy deploying! 🚀**
