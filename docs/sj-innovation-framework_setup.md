# SJ Dashboard Framework - New Project Setup Guide

> **Purpose:** Step-by-step instructions to set up a new project using the extracted framework.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ Supabase account (free tier works)
- ✅ Google Cloud Console account (for OAuth)
- ✅ Zoom Developer account (for meetings integration)
- ✅ OpenAI or Google AI API key (for AI features)

---

## 🚀 Setup Process

### **PHASE 1: Project Initialization**

#### Step 1.1: Create New Project Folder

```bash
# Create your new project directory
mkdir my-new-app
cd my-new-app

# Initialize git
git init
```

#### Step 1.2: Copy Framework Files

Using `SJ-DASHBOARD-FRAMEWORK_EXTRACTION_GUIDE.md`, copy files in this order:

```bash
# 1. Copy configuration files (root level)
# Copy: package.json, vite.config.ts, tailwind.config.ts, etc.

# 2. Copy /public folder
# Copy: /public/

# 3. Copy /src folder (will clean up later)
# Copy: /src/

# 4. Copy /supabase folder
# Copy: /supabase/

# 5. Copy .env.example
# Copy: .env.example
```

**⚠️ Do NOT copy:**
- `.env` (contains your current secrets)
- `node_modules/`
- `.git/`
- `dist/` or `build/`

---

### **PHASE 2: Clean Up Package.json**

#### Step 2.1: Open `package.json`

Remove dependencies for excluded features:

```json
{
  "dependencies": {
    // REMOVE these (Project/Task related):
    // Any activecollab-related packages
    // Any hubspot-related packages

    // KEEP these (V1 Framework):
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.23",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "react-hook-form": "^7.53.0",
    "dompurify": "^3.1.7",
    "tailwindcss": "^3.4.1",
    // ... (see CLEANUP_CHECKLIST for full list)
  }
}
```

#### Step 2.2: Update Project Metadata

```json
{
  "name": "my-new-app",           // Change this
  "version": "1.0.0",              // Reset version
  "description": "Your app description",
  "author": "Your Name",
  // Remove old repository info
}
```

#### Step 2.3: Install Dependencies

```bash
npm install
# or
yarn install
```

---

### **PHASE 3: Supabase Setup**

#### Step 3.1: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project details:
   - **Name:** my-new-app
   - **Database Password:** [generate strong password]
   - **Region:** Choose closest to your users
4. Wait 2-3 minutes for setup

#### Step 3.2: Get Supabase Credentials

From project settings → API:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (keep secret!)
```

#### Step 3.3: Configure Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Google OAuth (configure later)
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173

# OpenAI (for AI features)
VITE_OPENAI_API_KEY=sk-...

# Zoom (for meetings)
VITE_ZOOM_CLIENT_ID=
VITE_ZOOM_CLIENT_SECRET=

# Google Drive (for Knowledge Base)
VITE_GOOGLE_DRIVE_API_KEY=
```

#### Step 3.4: Set Up Database Schema

**Option A: Using Supabase Dashboard (Recommended for beginners)**

1. Open Supabase dashboard → SQL Editor
2. Copy SQL from `/supabase/migrations/` files in order
3. Run each migration one by one
4. Verify tables created in Table Editor

**Option B: Using Supabase CLI (Advanced)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref xxxxx

# Push migrations
supabase db push
```

#### Step 3.5: Enable Row Level Security (RLS)

Critical tables need RLS policies:

```sql
-- profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add similar policies for: meetings, knowledge_entries, notifications, feedback
```

**💡 Tip:** Copy RLS policies from your current project's SQL or use Supabase dashboard → Authentication → Policies.

---

### **PHASE 4: Google OAuth Setup**

#### Step 4.1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click "New Project"
3. Enter project name: "My New App"
4. Click "Create"

#### Step 4.2: Enable Google+ API

1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

#### Step 4.3: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Configure consent screen:
   - User type: External
   - App name: My New App
   - User support email: your@email.com
   - Scopes: email, profile, openid
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: My New App Web Client
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)

#### Step 4.4: Copy Client ID to .env

```bash
VITE_GOOGLE_CLIENT_ID=xxxxx-xxxxx.apps.googleusercontent.com
```

#### Step 4.5: Configure Supabase Auth

In Supabase dashboard → Authentication → Providers:

1. Enable Google provider
2. Enter Google Client ID and Secret
3. Save

---

### **PHASE 5: Zoom Integration Setup** (For Meetings Feature)

#### Step 5.1: Create Zoom App

1. Go to https://marketplace.zoom.us/develop/create
2. Click "Create" under "Server-to-Server OAuth"
3. Enter app details:
   - App name: My New App Zoom Integration
   - Description: Zoom integration for meetings
   - Company name: Your Company

#### Step 5.2: Get Credentials

From app dashboard:

```
Account ID: xxxxx
Client ID: xxxxx
Client Secret: xxxxx
```

#### Step 5.3: Add Scopes

Required scopes:
- `meeting:read:admin`
- `recording:read:admin`
- `user:read:admin`

#### Step 5.4: Update .env

```bash
VITE_ZOOM_ACCOUNT_ID=xxxxx
VITE_ZOOM_CLIENT_ID=xxxxx
VITE_ZOOM_CLIENT_SECRET=xxxxx
```

---

### **PHASE 6: OpenAI Setup** (For AI Features)

#### Step 6.1: Get API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "My New App"
4. Copy key (starts with `sk-`)

#### Step 6.2: Update .env

```bash
VITE_OPENAI_API_KEY=sk-xxxxx
```

**Cost Management:**
- Set usage limits in OpenAI dashboard
- Start with $5-10 limit for testing
- Monitor usage regularly

---

### **PHASE 7: Deploy Edge Functions**

#### Step 7.1: Install Supabase CLI (if not done)

```bash
npm install -g supabase
supabase login
```

#### Step 7.2: Deploy Functions

```bash
cd my-new-app

# Deploy all edge functions
supabase functions deploy validate-api-key
supabase functions deploy audit-log-writer
supabase functions deploy send-email
supabase functions deploy ai-chat-assistant
supabase functions deploy semantic-search
supabase functions deploy sync-zoom-files
supabase functions deploy zoom-transcript-processing
supabase functions deploy send-notification
supabase functions deploy send-slack-message
supabase functions deploy google-drive-sync
supabase functions deploy google-drive-upload

# Or deploy all at once:
supabase functions deploy --all
```

#### Step 7.3: Set Edge Function Secrets

```bash
# OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-xxxxx

# Zoom credentials
supabase secrets set ZOOM_ACCOUNT_ID=xxxxx
supabase secrets set ZOOM_CLIENT_ID=xxxxx
supabase secrets set ZOOM_CLIENT_SECRET=xxxxx

# Google credentials
supabase secrets set GOOGLE_CLIENT_ID=xxxxx
supabase secrets set GOOGLE_CLIENT_SECRET=xxxxx

# Slack (if using notifications)
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx
```

#### Step 7.4: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Test a function
curl -X POST https://xxxxx.supabase.co/functions/v1/validate-api-key \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

### **PHASE 8: Clean Up Code**

See `SJ-DASHBOARD-FRAMEWORK_CLEANUP_CHECKLIST.md` for detailed cleanup tasks:

1. Remove excluded feature pages/components
2. Clean up unused imports
3. Remove excluded hooks
4. Update routing in `App.tsx`
5. Clean up API endpoints in `/src/config/api.ts`
6. Remove excluded database types from `/src/types/database.ts`
7. Update sidebar menu items
8. Remove excluded edge function types

---

### **PHASE 9: First Run & Testing**

#### Step 9.1: Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open browser to `http://localhost:5173`

#### Step 9.2: Test Authentication

1. Click "Sign in with Google"
2. Authorize app
3. Verify redirect to dashboard
4. Check Supabase dashboard → Authentication → Users (user should appear)

#### Step 9.3: Test Profile Creation

1. After login, check if profile auto-created
2. Go to Profile page
3. Update name, avatar
4. Verify changes saved in Supabase

#### Step 9.4: Create First Admin User

**Option A: Supabase Dashboard**

1. Go to Table Editor → `profiles`
2. Find your user row
3. Edit row, set appropriate fields for admin privileges

**Option B: SQL Editor**

```sql
-- Grant admin role to your user
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'your-user-uuid',  -- Get from auth.users table
  (SELECT id FROM roles WHERE name = 'Admin')
);
```

#### Step 9.5: Test Admin Access

1. Navigate to `/admin`
2. Verify you can access admin panel
3. Test user management, role assignment

#### Step 9.6: Test Core Features

- ✅ Create a client
- ✅ Add a meeting (if Zoom configured)
- ✅ Add knowledge base entry
- ✅ Test AI chat (if OpenAI configured)
- ✅ Submit feedback
- ✅ Check notifications

---

### **PHASE 10: Customize & Brand**

#### Step 10.1: Update Branding

```typescript
// src/index.css - Update CSS variables
:root {
  --primary: 210 100% 50%;        // Your brand color
  --secondary: 340 100% 50%;      // Secondary color
  // ... update other colors
}
```

#### Step 10.2: Replace Logo

```
/public/logo.svg          // Replace with your logo
/public/favicon.ico       // Replace favicon
```

#### Step 10.3: Update App Metadata

```html
<!-- index.html -->
<title>My New App</title>
<meta name="description" content="Your app description">
```

#### Step 10.4: Update Sidebar Menu

```typescript
// src/components/layout/AppSidebar.tsx
const menuItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Clients", path: "/clients", icon: Users },
  { name: "Meetings", path: "/meetings", icon: Video },
  { name: "Knowledge Base", path: "/knowledge", icon: BookOpen },
  // Add/remove items as needed
];
```

---

## 🎯 Production Deployment

### **Vercel Deployment** (Recommended)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial framework setup"
git remote add origin https://github.com/yourusername/my-new-app.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables (copy from `.env`)
6. Click "Deploy"

#### Step 3: Update OAuth Redirect URIs

Add production URL to:
- Google Cloud Console → Credentials
- Supabase → Authentication → URL Configuration

#### Step 4: Update .env Production Values

```bash
VITE_GOOGLE_REDIRECT_URI=https://yourapp.vercel.app
```

---

### **Netlify Deployment** (Alternative)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables set in production
- [ ] Google OAuth working in production
- [ ] Supabase RLS policies tested
- [ ] Edge functions responding
- [ ] SSL certificate active (https://)
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring set up (Sentry, LogRocket, etc.)
- [ ] Analytics added (Google Analytics, Plausible, etc.)
- [ ] Backup strategy configured

---

## 🐛 Troubleshooting

### **Issue: "User not found" after Google login**

**Solution:** Check profile auto-creation in `AuthContext.tsx`. Ensure `profiles` table has correct schema.

### **Issue: Edge functions returning 401**

**Solution:** Verify JWT token being sent in headers. Check edge function auth logic.

### **Issue: Zoom sync not working**

**Solution:**
1. Verify Zoom credentials in Supabase secrets
2. Check Zoom app scopes
3. Review edge function logs: `supabase functions logs sync-zoom-files`

### **Issue: AI features not responding**

**Solution:**
1. Verify OpenAI API key in Supabase secrets
2. Check API usage limits in OpenAI dashboard
3. Review edge function logs

### **Issue: "Query client not found" errors**

**Solution:** Ensure `QueryClientProvider` wraps app in `main.tsx`.

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Router v6 Guide](https://reactrouter.com/en/main)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 💡 Tips for Success

1. **Start Small:** Get auth working first, then add features incrementally
2. **Test Locally:** Always test thoroughly before deploying
3. **Version Control:** Commit frequently with clear messages
4. **Environment Variables:** NEVER commit `.env` to git
5. **Database Backups:** Set up automated Supabase backups
6. **Monitoring:** Add error tracking early (Sentry is free for small projects)

---

## 🎉 You're Ready!

Your new project should now be fully set up with the SJ Dashboard Framework. Start building your unique features on top of this solid foundation!

**Next Steps:**
1. Review `SJ-DASHBOARD-FRAMEWORK_CLEANUP_CHECKLIST.md`
2. Customize branding and content
3. Add your app-specific features
4. Deploy to production

**Questions or issues?** Refer to the troubleshooting section or check Supabase/framework documentation.
