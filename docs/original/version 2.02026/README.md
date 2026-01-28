# SJ Innovation Framework Documentation

> **Complete framework documentation for extracting and reusing the SJ Dashboard codebase**

---

## 📚 Documentation Structure

This folder contains all documentation for the **SJ Innovation Framework V1 (Option B + Meetings)**.

---

## 🗂️ Core Framework Guides

### **🚀 Quick Start** (Start Here!)

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[`QUICKSTART_LOVABLE.md`](./QUICKSTART_LOVABLE.md)** | **Complete Lovable + Claude Code workflow** | **Starting new project (No CLI)** ⭐ RECOMMENDED |

### **Essential Guides**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [`sj-innovation-framework_extraction-guide.md`](./sj-innovation-framework_extraction-guide.md) | **What to copy** - Complete file listing | Starting new project (Local) |
| [`sj-innovation-framework_setup.md`](./sj-innovation-framework_setup.md) | **How to configure** - Setup steps (CLI-based) | After copying files locally |
| [`sj-innovation-framework_cleanup-checklist.md`](./sj-innovation-framework_cleanup-checklist.md) | **Pre-deployment cleanup** | Before deploying |

### **Reference Guides**

| Document | Purpose |
|----------|---------|
| [`sj-innovation-framework_architecture.md`](./sj-innovation-framework_architecture.md) | Visual diagrams & architecture |
| [`sj-innovation-framework_lovable-guide.md`](./sj-innovation-framework_lovable-guide.md) | Lovable.dev integration |
| [`sj-innovation-framework_edge-functions-deployment.md`](./sj-innovation-framework_edge-functions-deployment.md) | **Edge functions deployment** ⭐ NEW |

### **Automation Scripts**

| Script | Purpose |
|--------|---------|
| [`copy-framework.sh`](./copy-framework.sh) | Copy framework files to new project |
| [`copy-edge-functions.sh`](./copy-edge-functions.sh) | Copy edge functions to new project ⭐ NEW |
| [`deploy-edge-functions.sh`](./deploy-edge-functions.sh) | Deploy edge functions via Supabase CLI ⭐ NEW |

---

## 📦 Module Documentation

### **V1 Framework Modules**

Detailed documentation for each framework module:

| Module | Document | Description |
|--------|----------|-------------|
| **AI Agents** | [`sj-innovation-framework_ai-agents.md`](./sj-innovation-framework_ai-agents.md) | AI agents, semantic search, chat, personalization |
| **Knowledge Base** | [`sj-innovation-framework_knowledge-base.md`](./sj-innovation-framework_knowledge-base.md) | Admin & personal knowledge, vector search, Google Drive |
| **Meetings** | [`sj-innovation-framework_meetings-zoom.md`](./sj-innovation-framework_meetings-zoom.md) | Zoom integration, transcripts, AI summarization |

### **Coming Soon**

Additional module docs being created:
- Authentication & Security
- Users & Admin
- Clients Management
- Notifications System
- Feedback Collection

---

## 🎯 What's Included in V1

### ✅ **Included Features**

- **Authentication** - Google OAuth + Email/Password
- **User Management** - Users, roles, departments
- **Clients** - Contact/company management
- **Meetings** - Zoom integration with transcripts
- **Knowledge Base** - Admin + personal knowledge libraries
- **AI Agents Framework** - Multi-provider AI with personalization
- **Admin Panel** - User/role/AI management
- **Notifications** - Toast, bell icon, email, Slack
- **Feedback** - User feedback collection
- **51 UI Components** - shadcn/ui library
- **Security** - XSS protection, input validation, RLS
- **Infrastructure** - Caching, performance monitoring, edge functions

### ❌ **Excluded from V1**

- Projects & Tasks
- OKRs & EOS
- Productivity Tracking
- Email Generation
- PODs Management
- Deals & Opportunities
- HubSpot Integration
- ActiveCollab Integration

---

## 🚀 Quick Start Workflow

### **Recommended: Lovable + Claude Code** ⭐

**For users who want AI assistance and no CLI:**

```
1. Create project on Lovable.dev (5 minutes)
2. Upload framework documentation (3 files)
3. Let Lovable AI build database schema
4. Upload edge functions (31 functions)
5. Set environment variables in UI
6. Use Claude Code for customization
7. Deploy with one click

Total time: 2-3 hours to production
```

**Complete guide:** [`QUICKSTART_LOVABLE.md`](./QUICKSTART_LOVABLE.md)

**Best for:**
- ✅ First-time users
- ✅ No CLI experience
- ✅ Want AI assistance
- ✅ Rapid prototyping
- ✅ Using Claude Code

---

### **Alternative: Local Development (CLI)**

**For developers comfortable with terminal:**

```bash
# 1. Copy framework files
./copy-framework.sh ../my-new-app

# 2. Navigate to new project
cd ../my-new-app

# 3. Install dependencies
npm install

# 4. Set up Supabase
supabase init
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 5. Deploy edge functions
./deploy-edge-functions.sh

# 6. Start development
npm run dev
```

**Complete guide:** [`sj-innovation-framework_setup.md`](./sj-innovation-framework_setup.md)

**Best for:**
- ✅ Developers with CLI experience
- ✅ Need local development
- ✅ Version control focus
- ✅ Custom deployment workflows

---

## 📖 Reading Guide

### **🚀 If you're starting a new project (Recommended):**

1. **Read:** [`QUICKSTART_LOVABLE.md`](./QUICKSTART_LOVABLE.md) - Complete Lovable + Claude Code workflow
2. **Glance:** [`sj-innovation-framework_architecture.md`](./sj-innovation-framework_architecture.md) - See visual diagrams
3. **Follow:** QUICKSTART guide step-by-step
4. **Reference:** Module docs as needed:
   - [`sj-innovation-framework_ai-agents.md`](./sj-innovation-framework_ai-agents.md) - When implementing AI
   - [`sj-innovation-framework_knowledge-base.md`](./sj-innovation-framework_knowledge-base.md) - When adding knowledge features
   - [`sj-innovation-framework_meetings-zoom.md`](./sj-innovation-framework_meetings-zoom.md) - When integrating Zoom
5. **Deploy:** One click in Lovable

**Time:** 15 minutes reading + 2-3 hours building

---

### **If you want to understand architecture first:**

1. **Read:** [`sj-innovation-framework_architecture.md`](./sj-innovation-framework_architecture.md) - Visual overview
2. **Read:** Module docs for features you need
3. **Decide:** Lovable vs Local workflow
4. **Follow:** Appropriate quick start guide

---

### **If you prefer local/CLI development:**

1. **Read:** [`sj-innovation-framework_extraction-guide.md`](./sj-innovation-framework_extraction-guide.md) - What to copy
2. **Do:** Run `./copy-framework.sh ../your-app-name`
3. **Read:** [`sj-innovation-framework_setup.md`](./sj-innovation-framework_setup.md) - Configure everything
4. **Reference:** Module docs as you implement features
5. **Read:** [`sj-innovation-framework_cleanup-checklist.md`](./sj-innovation-framework_cleanup-checklist.md) - Pre-deploy cleanup

---

## 🏗️ Framework Architecture

The framework follows a **modular, layered architecture**:

```
Layer 1: Configuration (Vite, Tailwind, TypeScript)
    ↓
Layer 2: Core Infrastructure (Auth, UI, Utilities, Types)
    ↓
Layer 3: Business Logic (Pages, Components, Hooks, API)
    ↓
Layer 4: Integrations (Supabase, Google, Zoom, AI)
```

**See [`sj-innovation-framework_architecture.md`](./sj-innovation-framework_architecture.md) for visual diagrams.**

---

## 🎨 Design Patterns

The framework implements these proven patterns:

- **Cache-Aside Pattern** - For performance
- **Query Key Factory** - For React Query
- **Protected Route Pattern** - For security
- **Edge Function Wrapper** - For type safety
- **RLS Enforcement** - For data isolation
- **Multi-Provider Routing** - For AI flexibility

---

## 💡 Module Quick Reference

### **AI Agents Module**

**Use when you need:**
- Chat assistants
- Semantic search
- Meeting summarization
- Document generation
- Custom AI workflows

**Key Files:**
- `/src/hooks/useAI.ts`
- `/src/hooks/useAIAgents.ts`
- `/supabase/functions/ai-chat-assistant/`
- `/supabase/functions/semantic-search/`

**Database Tables:**
- `ai_agents`, `ai_agent_runs`, `embeddings`, `ai_chat_history`

---

### **Knowledge Base Module**

**Use when you need:**
- Document management
- File uploads
- Google Drive sync
- Vector search
- Personal knowledge libraries

**Key Files:**
- `/src/pages/KnowledgeBase.tsx`
- `/src/hooks/useKnowledge.ts`
- `/supabase/functions/generate-embeddings/`

**Database Tables:**
- `knowledge_entries`, `knowledge_categories`, `knowledge_files`, `user_knowledge_files`

---

### **Meetings Module**

**Use when you need:**
- Zoom integration
- Meeting management
- Transcript processing
- AI meeting summaries
- Recording storage

**Key Files:**
- `/src/pages/meetings/`
- `/src/hooks/useMeetings.ts`
- `/supabase/functions/sync-zoom-files/`
- `/supabase/functions/generate-meeting-summary/`

**Database Tables:**
- `meetings`, `zoom_files`, `meeting_assignments`, `meeting_transcripts`

---

## 🔧 Customization Guide

### **Adding a New Module**

1. Create database tables (with RLS)
2. Create edge functions (if needed)
3. Create React hooks for data fetching
4. Create UI components
5. Add routes to `App.tsx`
6. Add menu items to `AppSidebar.tsx`
7. Document in a new module doc file

### **Removing a Module**

1. Follow `sj-innovation-framework_cleanup-checklist.md`
2. Delete pages, components, hooks
3. Remove routes and menu items
4. Clean up database tables (optional)
5. Remove edge functions (optional)

---

## 📊 Framework Statistics

| Metric | Value |
|--------|-------|
| **UI Components** | 51 (shadcn/ui) |
| **Custom Hooks** | 100+ |
| **Pages** | 20+ (V1) |
| **Edge Functions** | 12 (V1) |
| **Database Tables** | 25+ (V1) |
| **TypeScript** | 100% |
| **Test Coverage** | TBD |

---

## 🆘 Support & Resources

### **Within This Repo**

- **Framework Docs:** `/docs/framework/` (you are here)
- **Existing Module Docs:** `/docs/` (parent directory)
- **Database Migrations:** `/supabase/migrations/`
- **Edge Functions:** `/supabase/functions/`

### **External Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [React Router v6](https://reactrouter.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-25 | Initial framework documentation release |

---

## 📝 Contributing

To contribute to framework documentation:

1. Update relevant module doc
2. Update this README if structure changes
3. Keep examples current
4. Test all code snippets
5. Maintain consistent formatting

---

## 📧 Questions?

If you have questions about the framework:

1. Check module-specific docs first
2. Review architecture diagrams
3. Look at existing code examples
4. Consult parent `/docs/` folder for feature-specific details

---

**Happy Building! 🚀**
