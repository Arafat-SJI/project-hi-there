# SJ Innovation Framework - Quick Start with Lovable & Claude Code

> **🚀 Complete guide for starting a new project using Lovable.dev + Claude Code (No CLI required)**

---

## 🎯 Overview

This guide shows you how to start a new project using the SJ Innovation Framework with:
- ✅ **Lovable.dev** - AI-powered development platform
- ✅ **Claude Code** - For local customization and exploration
- ❌ **No CLI required** - Everything through web interfaces

**Total Time:** ~2-3 hours for complete setup

---

## 📋 Prerequisites

1. **Lovable.dev account** - Sign up at https://lovable.dev
2. **GitHub account** - For code repository
3. **API Keys:**
   - OpenAI API key (for AI features)
   - Zoom credentials (for meetings)
   - Google OAuth credentials (optional)

---

## 🚀 Complete Workflow

### **PHASE 1: Project Setup on Lovable (30 minutes)**

#### **Step 1.1: Create New Lovable Project**

1. Go to https://lovable.dev
2. Click **"Create New Project"**
3. Choose:
   - **Template:** React + Vite + Supabase
   - **Name:** your-app-name
   - **Description:** Your app description

**Lovable automatically provisions:**
- ✅ React 18 + Vite project
- ✅ Supabase backend (database + auth + storage)
- ✅ GitHub repository
- ✅ Hosting & deployment

---

#### **Step 1.2: Upload Framework Documentation**

In Lovable, upload these framework docs (they guide the AI):

**Core Guides:**
1. `sj-innovation-framework_extraction-guide.md`
2. `sj-innovation-framework_architecture.md`
3. `sj-innovation-framework_setup.md`

**Module Docs (choose what you need):**
4. `sj-innovation-framework_ai-agents.md`
5. `sj-innovation-framework_knowledge-base.md`
6. `sj-innovation-framework_meetings-zoom.md`

**How to upload:**
- Drag & drop files into Lovable file explorer
- Or use "Upload" button in Lovable UI

---

#### **Step 1.3: Configure Supabase (Auto-provisioned)**

Lovable creates a Supabase project for you. Get the credentials:

1. In Lovable, go to **Settings** → **Integrations** → **Supabase**
2. Click **"Manage Supabase Project"**
3. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGc...`

These are already configured in Lovable's environment.

---

### **PHASE 2: Database Setup via Lovable AI (45 minutes)**

Instead of running SQL manually, use Lovable AI to create schema:

#### **Step 2.1: Create Core Tables**

**Prompt Lovable:**

```
I uploaded the SJ Innovation Framework documentation.

Please create the database schema for the V1 framework based on
sj-innovation-framework_architecture.md and module docs.

Start with these core tables:

1. profiles - User profiles with metadata
2. roles - Role definitions
3. user_roles - User-role assignments
4. clients - Client/company management
5. meetings - Meeting records
6. zoom_files - Zoom recordings and transcripts
7. knowledge_entries - Knowledge base entries
8. knowledge_categories - KB categories
9. ai_agents - AI agent configurations
10. ai_agent_runs - Agent execution history
11. embeddings - Vector embeddings (1536 dimensions)
12. ai_chat_history - Chat conversation history
13. notifications - User notifications
14. feedback - User feedback

Include:
- Primary keys (UUID)
- Foreign key relationships
- Timestamps (created_at, updated_at)
- JSONB fields for metadata where appropriate

Use the exact schema from the framework docs.
```

Lovable AI will:
1. Read the uploaded docs
2. Generate SQL migration
3. Apply to Supabase
4. Confirm completion

---

#### **Step 2.2: Add RLS Policies**

**Prompt Lovable:**

```
Now add Row Level Security (RLS) policies for the tables.

Based on sj-innovation-framework_architecture.md:

1. Enable RLS on all tables
2. profiles: Users can read/update own profile
3. clients: Authenticated users can CRUD
4. meetings: Users can view meetings they're invited to
5. knowledge_entries: Published entries visible to all authenticated
6. user_knowledge_files: Users can only see their own files
7. embeddings: Users can view own embeddings + public ones
8. ai_chat_history: Users can only access own chat sessions

Create service role bypass policies for edge functions.
```

---

#### **Step 2.3: Create Storage Buckets**

**Prompt Lovable:**

```
Create Supabase storage buckets:

1. user-knowledge (private)
   - Users can upload to {user_id}/ folder
   - Users can only access their own files

2. zoom-recordings (private)
   - Authenticated users can read
   - Only service role can write

3. knowledge-files (private)
   - Authenticated users can read
   - Admins can write

Add appropriate RLS policies for each bucket.
```

---

### **PHASE 3: Deploy Edge Functions via Lovable (60 minutes)**

#### **Step 3.1: Upload Edge Function Files**

You have two options:

**Option A: Upload Individually (Recommended)**

For each V1 edge function, create in Lovable:

1. Click **"New File"** in Lovable
2. Path: `supabase/functions/<function-name>/index.ts`
3. Copy code from framework
4. Lovable auto-deploys on save

**Option B: Bulk Upload via Claude Code**

1. Use Claude Code locally to prepare functions
2. Push to GitHub
3. Lovable syncs from GitHub

---

#### **Step 3.2: Deploy Foundation Functions**

**Prompt Lovable:**

```
I need to deploy edge functions for the SJ Innovation Framework.

Start with Foundation functions. I'll upload the code files.

Please create these edge functions in supabase/functions/:

1. validate-api-key - API key validation
2. audit-log-writer - Activity logging
3. send-email - Email sending via SendGrid
4. send-notification - Multi-channel notifications

For each function:
- Create proper TypeScript types
- Add error handling
- Use Supabase admin client from _shared
- Add CORS headers

I'll provide the code from the framework.
```

Then upload each function file from:
`/framework/supabase/functions/<function-name>/index.ts`

---

#### **Step 3.3: Deploy AI Functions**

**Prompt Lovable:**

```
Deploy AI-related edge functions:

1. ai-chat-assistant - Chat with context
2. semantic-search - Vector similarity search
3. run-ai-agent - Execute AI agents with personalization
4. generate-embeddings - Create vector embeddings
5. generate-meeting-summary - Summarize meetings
6. generate-business-doc - Generate SOW, NDA, etc.

These use OpenAI API. I'll set OPENAI_API_KEY in environment variables.
```

Upload each function from framework.

---

#### **Step 3.4: Deploy Remaining Modules**

Repeat for:
- **Meetings** (sync-zoom-files, zoom-transcript-processing, etc.)
- **Knowledge Base** (user-knowledge-upload, google-drive-sync, etc.)
- **Clients** (api-v1-clients)
- **Notifications** (send-slack-message)

**Or use this comprehensive prompt:**

```
Deploy all remaining V1 edge functions from the framework:

MEETINGS (6 functions):
- sync-zoom-files
- zoom-transcript-processing
- generate-meeting-summary
- auto-embed-meetings
- categorize-meeting
- api-v1-meetings

KNOWLEDGE BASE (7 functions):
- google-drive-sync
- google-drive-upload
- user-knowledge-upload
- user-knowledge-drive-sync
- user-knowledge-process
- auto-embed-knowledge-files
- unified-knowledge-search

CLIENTS (1 function):
- api-v1-clients

FEEDBACK (1 function):
- send-feedback-notification

I'll upload the code for each function.
```

---

#### **Step 3.5: Deploy Shared Utilities**

**Important:** Upload `_shared` folder first!

Create `supabase/functions/_shared/` with:
- `cors.ts` - CORS headers
- `supabaseAdmin.ts` - Admin client
- `openai.ts` - OpenAI client
- `validation.ts` - Input validation
- `schema-config.ts` - Schema mapping (if needed)

**All functions import from `_shared`.**

---

#### **Step 3.6: Set Environment Variables**

In Lovable: **Settings** → **Environment Variables**

Add these secrets:

```bash
# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...  # Optional

# Zoom Integration
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_ACCOUNT_ID=...

# Google OAuth & Drive
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# SendGrid (Email)
SENDGRID_API_KEY=...

# Slack (Optional)
SLACK_WEBHOOK_URL=...

# Supabase (Auto-set by Lovable)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

**Lovable automatically injects these into edge functions.**

---

### **PHASE 4: Frontend Setup via Lovable AI (60 minutes)**

#### **Step 4.1: Install Dependencies**

**Prompt Lovable:**

```
Install these npm packages for the SJ Innovation Framework:

@supabase/supabase-js@^2.45.0
@tanstack/react-query@^5.51.23
@tanstack/react-query-persist-client@^5.51.23
react-router-dom@^6.26.2
react-hook-form@^7.53.0
@hookform/resolvers@^3.9.0
zod@^3.23.8
dompurify@^3.1.7
date-fns@^3.6.0
lucide-react@^0.441.0
recharts@^2.12.7
html2canvas@^1.4.1
jspdf@^2.5.2
clsx@^2.1.1
tailwind-merge@^2.5.2

Also install all shadcn/ui components listed in the extraction guide.
```

---

#### **Step 4.2: Set Up Authentication**

**Prompt Lovable:**

```
Set up authentication based on sj-innovation-framework_architecture.md:

1. Create AuthContext in /src/contexts/AuthContext.tsx
   - Google OAuth + Email/Password
   - Session management with auto-refresh
   - Profile self-healing (auto-create if missing)

2. Create route guards:
   - ProtectedRoute - Requires authentication
   - AdminRoute - Requires admin role
   - ModuleRoute - Role-based module access

3. Configure Google OAuth:
   - Use GOOGLE_CLIENT_ID from environment
   - Redirect URI: current domain
   - Scopes: email, profile, openid

4. Integrate with Supabase auth
```

---

#### **Step 4.3: Create Layout Components**

**Prompt Lovable:**

```
Create the layout system from the framework:

1. DashboardLayout component:
   - Collapsible sidebar
   - Top navigation with user menu
   - Main content area
   - Breadcrumbs

2. AppSidebar component:
   - Menu items: Dashboard, Clients, Meetings, Knowledge, AI, Admin
   - Active state highlighting
   - Icons from lucide-react
   - Collapse/expand functionality

3. TopNav component:
   - Logo
   - Search bar
   - Notifications bell
   - User avatar dropdown

Use Tailwind CSS and shadcn/ui components.
Follow the layout patterns in sj-innovation-framework_architecture.md
```

---

#### **Step 4.4: Implement Core Pages**

**Prompt for each page:**

```
Create the Clients page based on sj-innovation-framework_extraction-guide.md:

1. Clients list page (/src/pages/Clients.tsx):
   - Table view with search and filters
   - Add Client button
   - Edit/Delete actions
   - Link to client detail

2. Client form (modal or separate page):
   - Name, email, company fields
   - Validation with react-hook-form + zod
   - Input sanitization

3. useClients hook (/src/hooks/useClients.ts):
   - Fetch clients with React Query
   - CRUD mutations
   - Cache invalidation

4. Client components:
   - ClientCard
   - ClientTable
   - ClientSearch

Use the patterns from the framework docs.
```

Repeat for:
- Dashboard
- Meetings
- Knowledge Base
- AI Agents
- Admin pages

---

#### **Step 4.5: Add Utilities & Helpers**

**Prompt Lovable:**

```
Create utility functions from the framework:

1. /src/lib/utils.ts:
   - cn() - Class name merging
   - formatCurrency(), formatDate()
   - getClientName()

2. /src/lib/validation.ts:
   - sanitizeString(), sanitizeEmail()
   - validateEmail(), validateUrl()
   - validateForm()

3. /src/lib/sanitize.ts:
   - sanitizeHtml() using DOMPurify
   - XSS protection

4. /src/lib/cache.ts:
   - Cache-aside pattern implementation
   - TTL configuration
   - Query key factories

Copy implementations from framework docs.
```

---

### **PHASE 5: Testing & Verification (30 minutes)**

#### **Step 5.1: Test Authentication**

```
Test the authentication flow:

1. Go to your Lovable preview URL
2. Click "Sign in with Google"
3. Verify redirect to dashboard
4. Check Supabase dashboard - user should appear in auth.users
5. Check profile auto-created in profiles table
```

---

#### **Step 5.2: Test Edge Functions**

In Lovable console or browser:

```javascript
// Test semantic search
const { data } = await supabase.functions.invoke('semantic-search', {
  body: {
    query: "test query",
    match_threshold: 0.7
  }
});
console.log('Search results:', data);

// Test AI chat
const { data: chat } = await supabase.functions.invoke('ai-chat-assistant', {
  body: {
    message: "Hello",
    session_id: "test-session"
  }
});
console.log('Chat response:', chat);
```

---

#### **Step 5.3: Test CRUD Operations**

```
Test each module:

1. Clients: Create, edit, delete a client
2. Meetings: Create a meeting, sync from Zoom
3. Knowledge Base: Upload a file, search
4. AI: Send a chat message, generate summary
5. Notifications: Test toast notifications
```

---

### **PHASE 6: Customization & Branding (15 minutes)**

#### **Step 6.1: Update Branding**

**Prompt Lovable:**

```
Customize branding for my app:

1. Update Tailwind theme in tailwind.config.ts:
   - Primary color: [your color]
   - Secondary color: [your color]

2. Replace logo:
   - Upload new logo to /public/logo.svg
   - Update references in TopNav

3. Update app metadata:
   - Title: "Your App Name"
   - Description: "Your description"
   - Favicon
```

---

#### **Step 6.2: Customize Sidebar Menu**

**Prompt Lovable:**

```
Update sidebar menu items:

Keep: Dashboard, Clients, Meetings, Knowledge Base
Add: [your custom pages]
Remove: [any you don't need]

Update icons and labels to match my app's purpose.
```

---

## 🎨 Using Claude Code for Advanced Customization

While Lovable handles deployment, use **Claude Code** locally for:

### **1. Exploring the Codebase**

```bash
# Clone from GitHub (Lovable creates repo)
git clone https://github.com/your-username/your-app.git
cd your-app

# Open in Claude Code
code .
```

Ask Claude Code:
- "How does the caching system work?"
- "Show me all API endpoints"
- "Where is authentication handled?"

---

### **2. Complex Feature Development**

For features requiring multiple file changes:

1. **Develop locally** with Claude Code
2. **Test locally** with `npm run dev`
3. **Push to GitHub**
4. **Lovable auto-deploys**

**Example:**

```
Claude Code prompt:

"I want to add a Reports module with PDF export.
Create:
1. Reports page with filters
2. useReports hook
3. PDF export utility
4. Report templates

Follow the framework patterns from the docs."
```

Claude Code creates all files, you test, then push to GitHub.

---

### **3. Debugging**

Use Claude Code to:
- Review error logs
- Fix TypeScript errors
- Optimize performance
- Refactor code

**Example:**

```
"The semantic search is slow. Analyze the performance
and suggest optimizations based on the framework's
caching patterns."
```

---

## 📊 Lovable vs CLI Comparison

| Task | Lovable | CLI (Traditional) |
|------|---------|-------------------|
| **Project Setup** | 5 minutes (auto) | 30 minutes (manual) |
| **Supabase Config** | Automatic | Manual setup |
| **Database Schema** | AI-assisted | SQL migrations |
| **Edge Functions** | Upload + auto-deploy | CLI commands |
| **Frontend Build** | Automatic | npm scripts |
| **Deployment** | Auto on push | Manual deploy |
| **Environment Vars** | UI settings | CLI commands |
| **Learning Curve** | Low (AI-guided) | High (tech knowledge) |

**Lovable Advantages:**
- ✅ No CLI installation
- ✅ No local setup needed
- ✅ AI helps with implementation
- ✅ Auto-deployment
- ✅ Built-in hosting

**When to Use Claude Code:**
- Complex multi-file features
- Deep code exploration
- Performance optimization
- Custom refactoring

---

## ✅ Checklist for Complete Setup

### **Infrastructure:**
- [ ] Lovable project created
- [ ] Supabase provisioned (auto)
- [ ] GitHub repo created (auto)
- [ ] Framework docs uploaded to Lovable

### **Database:**
- [ ] All V1 tables created
- [ ] RLS policies applied
- [ ] Storage buckets configured
- [ ] Test data inserted

### **Edge Functions:**
- [ ] _shared utilities uploaded
- [ ] Foundation functions deployed (4)
- [ ] AI functions deployed (8)
- [ ] Meetings functions deployed (6)
- [ ] Knowledge Base functions deployed (7)
- [ ] Environment variables set

### **Frontend:**
- [ ] Dependencies installed
- [ ] Authentication working (Google OAuth)
- [ ] Layout components created
- [ ] Core pages implemented (Dashboard, Clients, etc.)
- [ ] Utilities & helpers added

### **Testing:**
- [ ] Authentication tested
- [ ] CRUD operations work
- [ ] Edge functions responding
- [ ] No console errors
- [ ] Mobile responsive

### **Branding:**
- [ ] Logo replaced
- [ ] Colors updated
- [ ] App name changed
- [ ] Favicon updated

---

## 🚀 Going Live

When ready to deploy to production:

1. **In Lovable:** Click **"Deploy to Production"**
2. **Configure custom domain** (optional)
3. **Update OAuth redirect URIs** with production URL
4. **Monitor Lovable deployment logs**
5. **Test in production**

**Lovable handles:**
- SSL certificates
- CDN distribution
- Auto-scaling
- Monitoring

---

## 💡 Pro Tips

### **Tip 1: Use Lovable AI Effectively**

**Good prompts:**
- Reference framework docs by name
- Be specific about which module
- Ask for one feature at a time
- Request testing after implementation

**Example:**
```
"Based on sj-innovation-framework_ai-agents.md,
implement the semantic search feature.
Include:
1. useSemanticSearch hook
2. SemanticSearch component with threshold slider
3. Integration with the embeddings table
4. Test with sample query"
```

---

### **Tip 2: Hybrid Workflow**

**For most tasks:** Use Lovable (AI-assisted, fast)

**For complex features:** Use Claude Code (local, full control)

**Workflow:**
1. Lovable: Generate initial code
2. Claude Code: Refine and optimize
3. Push to GitHub
4. Lovable: Auto-deploy

---

### **Tip 3: Version Control**

Lovable syncs with GitHub:
- Every save → Git commit
- Lovable UI shows commit history
- Can revert to any version

For manual control:
1. Clone repo locally
2. Make changes
3. Push to GitHub
4. Lovable auto-deploys

---

## 📚 Resources

- **Lovable Docs:** https://lovable.dev/docs
- **Framework Docs:** See `/docs/framework/` in this repo
- **Supabase Docs:** https://supabase.com/docs

---

## ❓ Common Issues

### **Issue: Edge function returns 500**

**Solution:**
1. Check Lovable logs: Settings → Functions → View Logs
2. Verify environment variables are set
3. Check function code for syntax errors

### **Issue: Database query fails**

**Solution:**
1. Verify RLS policies allow operation
2. Check if table exists in Supabase dashboard
3. Confirm user is authenticated

### **Issue: Lovable AI not following framework patterns**

**Solution:**
```
"The code doesn't match the framework architecture.
Please rewrite using the exact patterns from
sj-innovation-framework_architecture.md.

Specifically:
- Use React Query for data fetching
- Follow cache-aside pattern
- Include proper error handling
- Use framework utilities from /src/lib/"
```

---

## 🎉 You're Ready!

With this workflow, you can:
- ✅ Start new projects in minutes (not hours)
- ✅ Deploy without CLI knowledge
- ✅ Use AI assistance throughout
- ✅ Switch to Claude Code when needed
- ✅ Scale to production seamlessly

**Next:** Pick a module to implement first (recommend starting with Authentication, then Clients).

Happy building! 🚀
