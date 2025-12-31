# CollabAi Deployment Checklist

> **Complete checklist for deploying CollabAi to a new client**

---

## 📋 Pre-Deployment

### Infrastructure

- [ ] Lovable project created/forked
- [ ] Supabase project connected
- [ ] GitHub repo linked (optional)

### Access Credentials

- [ ] Lovable login for admin
- [ ] Supabase dashboard access
- [ ] API keys collected (OpenAI, Zoom, etc.)

---

## 🗄️ Database Setup

### Tables Verified

- [ ] `profiles` - User profiles
- [ ] `user_roles` - Role assignments
- [ ] `roles` - Role definitions
- [ ] `clients` - Client data
- [ ] `meetings` - Meeting records
- [ ] `zoom_files` - Zoom recordings
- [ ] `knowledge_entries` - Knowledge articles
- [ ] `knowledge_categories` - Categories
- [ ] `ai_agents` - AI configurations
- [ ] `ai_agent_runs` - AI execution logs
- [ ] `ai_chat_history` - Chat history
- [ ] `embeddings` - Vector embeddings
- [ ] `feedback` - User feedback
- [ ] `notifications` - Notifications

### Security

- [ ] RLS enabled on all tables
- [ ] Policies configured correctly
- [ ] `has_role()` function exists
- [ ] Service role key secured

---

## 🔐 Authentication

### Supabase Auth Config

- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Email templates customized (optional)
- [ ] Email confirmation setting decided

### OAuth Providers (Optional)

- [ ] Google OAuth configured
- [ ] Redirect URI added to Google Console
- [ ] Provider enabled in Supabase

### Admin Account

- [ ] Admin user created
- [ ] Admin role assigned in `user_roles`
- [ ] Admin can access `/admin`

---

## 🎨 Branding

### Visual Identity

- [ ] Company name updated
- [ ] Logo uploaded
- [ ] Favicon updated
- [ ] Primary colors configured
- [ ] App title in `index.html` updated

### Content

- [ ] Welcome message customized
- [ ] Email templates branded (if using)
- [ ] Demo credentials removed/updated

---

## ⚙️ Feature Configuration

### Core Modules

- [ ] Clients module enabled/disabled
- [ ] Meetings module enabled/disabled
- [ ] Knowledge Base enabled/disabled
- [ ] AI Agents enabled/disabled
- [ ] Feedback enabled/disabled

### Navigation

- [ ] Sidebar items match enabled features
- [ ] Admin-only items hidden from regular users

---

## 🔌 Integrations

### AI (OpenAI)

- [ ] `OPENAI_API_KEY` set in Edge Function Secrets
- [ ] API key has credits
- [ ] AI chat tested

### Zoom (Optional)

- [ ] Zoom Server-to-Server OAuth app created
- [ ] `ZOOM_CLIENT_ID` set
- [ ] `ZOOM_CLIENT_SECRET` set
- [ ] `ZOOM_ACCOUNT_ID` set
- [ ] Required scopes added (`meeting:read:admin`, `recording:read:admin`)

### Google Drive (Optional)

- [ ] Google Cloud project created
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] Drive API enabled

### Email (Optional)

- [ ] SendGrid account created
- [ ] `SENDGRID_API_KEY` set
- [ ] Sender domain verified

### Slack (Optional)

- [ ] Slack webhook created
- [ ] `SLACK_WEBHOOK_URL` set

---

## 📦 Storage Buckets

- [ ] `user-knowledge` bucket created (private)
- [ ] `meeting-recordings` bucket created (private)
- [ ] `knowledge-files` bucket created (private)
- [ ] Bucket policies configured

---

## 🧪 Testing

### Authentication

- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth works (if enabled)
- [ ] Logout works
- [ ] Password reset works

### Core Features

- [ ] Dashboard loads with KPIs
- [ ] Clients CRUD operations work
- [ ] Meetings CRUD operations work
- [ ] Knowledge Base accessible
- [ ] AI Chat responds (if configured)
- [ ] Notifications appear

### Access Control

- [ ] Regular users see only allowed items
- [ ] Admins can access `/admin`
- [ ] AI routes protected (admin only)
- [ ] RLS prevents unauthorized data access

### Responsive

- [ ] Desktop layout works
- [ ] Tablet layout works
- [ ] Mobile layout works

---

## 🚀 Publishing

### Lovable Publish

- [ ] Click "Publish" button
- [ ] Wait for build to complete
- [ ] Verify preview URL works

### Custom Domain (Optional)

- [ ] Domain purchased/available
- [ ] DNS records configured:
  - `A` record → Lovable IP
  - `CNAME` record (if subdomain)
- [ ] SSL certificate provisioned (automatic)
- [ ] Custom domain verified in Lovable

### Post-Publish

- [ ] Production URL tested
- [ ] All features work on production
- [ ] No console errors

---

## 👥 User Onboarding

### Initial Users

- [ ] Admin users invited
- [ ] Roles assigned correctly
- [ ] Login credentials shared securely

### Documentation

- [ ] User guide provided (if needed)
- [ ] Admin guide provided
- [ ] Support contact shared

---

## 📊 Monitoring

### Supabase

- [ ] Database logs monitored
- [ ] Auth logs reviewed
- [ ] Edge function logs checked

### Performance

- [ ] Page load times acceptable
- [ ] No memory leaks
- [ ] API response times normal

---

## 📝 Handoff

### Client Deliverables

- [ ] Production URL shared
- [ ] Admin credentials delivered
- [ ] Documentation links provided
- [ ] Support process defined

### Internal

- [ ] Deployment documented
- [ ] Client-specific configs noted
- [ ] Any customizations documented

---

## ✅ Sign-Off

| Check | Completed | Notes |
|-------|-----------|-------|
| Infrastructure | ☐ | |
| Database | ☐ | |
| Authentication | ☐ | |
| Branding | ☐ | |
| Features | ☐ | |
| Integrations | ☐ | |
| Testing | ☐ | |
| Publishing | ☐ | |
| User Onboarding | ☐ | |

**Deployed By:** _______________  
**Date:** _______________  
**Client:** _______________  
**Production URL:** _______________

---

**🎉 Deployment Complete!**
