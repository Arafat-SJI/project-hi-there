# CollabAi Quick Start Guide

> **Get CollabAi running in under 30 minutes using Lovable + Supabase**

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

1. **Lovable.dev account** - [Sign up here](https://lovable.dev)
2. **Supabase account** - Auto-provisioned by Lovable (or connect external)
3. **API Keys** (optional, for integrations):
   - OpenAI API key (for AI features)
   - Zoom credentials (for meeting sync)
   - Google OAuth (for Google sign-in)

---

## 🚀 Deployment Steps

### Step 1: Create/Fork Project in Lovable

**Option A: Start Fresh**
1. Go to [lovable.dev](https://lovable.dev)
2. Click **"Create New Project"**
3. Choose React + Vite + Supabase template
4. Name your project

**Option B: Fork Existing**
1. Open the existing CollabAi project
2. Go to **Settings** → **Remix Project**
3. Create a copy for the new client

---

### Step 2: Connect Supabase

Lovable automatically provisions a Supabase project, or you can connect an external one:

1. Go to **Settings** → **Supabase**
2. View auto-provisioned project OR connect external
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbG...`

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

**Check:** Supabase Dashboard → Table Editor

---

### Step 4: Create Admin Account

1. Open the app preview in Lovable
2. Go to `/signup`
3. Create account with admin email (e.g., `admin@client.com`)
4. Verify email (or disable email confirmation in Supabase)

**Assign Admin Role:**

In Supabase SQL Editor:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'admin@client.com';

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin');
```

---

### Step 5: Configure Branding (via Admin Panel)

1. Log in as admin
2. Go to `/admin`
3. Update branding settings:
   - Company name
   - Logo (upload to Storage)
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

In Supabase → Settings → Edge Function Secrets:

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

---

### Step 8: Invite Users

**Option A: Direct Sign Up**
- Share the app URL with users
- They sign up at `/signup`
- Admin assigns roles in database

**Option B: User Invites (Coming Soon)**
- Admin sends email invites from Admin Panel
- Users click link and create account
- Role auto-assigned from invite

---

### Step 9: Publish to Production

1. In Lovable, click **Publish**
2. Configure custom domain (optional):
   - Go to Settings → Domains
   - Add your custom domain
   - Configure DNS records
3. Click **Update** to deploy

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

Go to Supabase → Authentication → URL Configuration:

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
6. Copy Client ID and Secret to Supabase Auth → Providers → Google

---

## 📊 Estimated Time

| Task | Time |
|------|------|
| Create/fork project | 2 min |
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

1. Check Supabase Auth → URL Configuration
2. Verify Site URL matches app URL
3. Check Redirect URLs include app domain

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

1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Full deployment checklist
2. **[ADMIN-GUIDE.md](./ADMIN-GUIDE.md)** - Admin configuration guide
3. **[product-backlog.md](./product-backlog.md)** - Feature roadmap

---

**Happy deploying! 🚀**
