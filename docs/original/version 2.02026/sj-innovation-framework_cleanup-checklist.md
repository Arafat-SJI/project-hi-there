# SJ Dashboard Framework - Cleanup Checklist

> **Purpose:** Clean up framework code before deploying your new project. This removes excluded features and prevents bloat.

---

## 📋 How to Use This Checklist

1. Complete setup first (see `SJ-DASHBOARD-FRAMEWORK_SETUP.md`)
2. Work through sections sequentially
3. Check off items as you complete them
4. Test after each major section
5. Commit changes frequently

**Estimated Time:** 2-4 hours for complete cleanup

---

## 🗑️ SECTION 1: Remove Excluded Feature Pages

### **Files to DELETE from `/src/pages/`**

Delete entire folders for excluded features:

```bash
# Projects & Tasks
- [ ] /src/pages/projects/
- [ ] /src/pages/tasks/
- [ ] /src/pages/bugs/

# OKRs & EOS
- [ ] /src/pages/okrs/
- [ ] /src/pages/eos/

# Productivity & Resources
- [ ] /src/pages/productivity/
- [ ] /src/pages/resources/
- [ ] /src/pages/allocations/

# Email Management
- [ ] /src/pages/emails/

# Process Documentation
- [ ] /src/pages/processes/

# PODs
- [ ] /src/pages/pods/

# Deals & Opportunities
- [ ] /src/pages/deals/
- [ ] /src/pages/opportunities/

# Integrations
- [ ] /src/pages/hubspot/
- [ ] /src/pages/activecollab/
```

**How to Delete:**

```bash
cd /your-new-project/src/pages

# Delete folders one by one
rm -rf projects/
rm -rf tasks/
rm -rf bugs/
rm -rf okrs/
rm -rf eos/
rm -rf productivity/
rm -rf resources/
rm -rf allocations/
rm -rf emails/
rm -rf processes/
rm -rf pods/
rm -rf deals/
rm -rf opportunities/
rm -rf hubspot/
rm -rf activecollab/
```

**OR** use your file manager to delete these folders.

---

## 🗑️ SECTION 2: Remove Excluded Components

### **Component Folders to DELETE from `/src/components/`**

```bash
- [ ] /src/components/projects/
- [ ] /src/components/tasks/
- [ ] /src/components/okrs/
- [ ] /src/components/eos/
- [ ] /src/components/productivity/
- [ ] /src/components/emails/
- [ ] /src/components/processes/
- [ ] /src/components/pods/
- [ ] /src/components/deals/
- [ ] /src/components/hubspot/
- [ ] /src/components/activecollab/
```

**Keep these component folders:**
```bash
✅ /src/components/auth/
✅ /src/components/ui/
✅ /src/components/common/
✅ /src/components/layout/
✅ /src/components/admin/
✅ /src/components/clients/
✅ /src/components/meetings/
✅ /src/components/knowledge/
✅ /src/components/ai/
✅ /src/components/feedback/
✅ /src/components/notifications/
```

---

## 🗑️ SECTION 3: Clean Up Hooks

### **Hooks to DELETE from `/src/hooks/`**

Delete files related to excluded features:

```bash
# Project/Task Hooks
- [ ] useProjects.ts
- [ ] useProjectStats.ts
- [ ] useTasks.ts
- [ ] useTaskStats.ts
- [ ] useBugs.ts

# OKR Hooks
- [ ] useOKRs.ts
- [ ] useKeyResults.ts
- [ ] useOKRProgress.ts

# EOS Hooks
- [ ] useEOSRocks.ts
- [ ] useEOSMeetings.ts

# Productivity Hooks
- [ ] useProductivity.ts
- [ ] useEmployeeProductivity.ts
- [ ] useTimeTracking.ts

# Resource Management Hooks
- [ ] useResourceProjection.ts
- [ ] useResourceProjectionSync.ts
- [ ] useProjectAllocations.ts
- [ ] useTeamResources.ts
- [ ] useAvailableWeeks.ts

# Email Hooks
- [ ] useSendEmail.ts
- [ ] useEmailTemplates.ts
- [ ] useEmailSchedule.ts

# Process Hooks
- [ ] useProcessDocuments.ts

# POD Hooks
- [ ] usePods.ts
- [ ] usePodMembers.ts

# Deal Hooks
- [ ] useDeals.ts
- [ ] useDealSync.ts
- [ ] useDealSyncQueue.ts

# Integration Hooks
- [ ] useHubSpotContacts.ts
- [ ] useHubSpotContactsQueue.ts
- [ ] useHubSpotDeals.ts
- [ ] useHubSpotDataHealth.ts
- [ ] useActiveCollabTasks.ts
- [ ] useActiveCollabProjects.ts
```

**Keep these hooks:**
```bash
✅ useProfile.ts
✅ useUsers.ts
✅ useRoles.ts
✅ usePermissions.ts
✅ useClients.ts
✅ useMeetings.ts
✅ useZoomFiles.ts
✅ useKnowledge.ts
✅ useKnowledgeCategories.ts
✅ useSemanticSearch.ts
✅ useAI.ts
✅ useAIAgents.ts
✅ useNotifications.ts
✅ useFeedback.ts
✅ useEdgeFunction.ts
```

**Quick Delete Command:**

```bash
cd /your-new-project/src/hooks

# Delete project/task related
rm -f useProjects.ts useProjectStats.ts useTasks.ts useTaskStats.ts useBugs.ts

# Delete OKR/EOS
rm -f useOKRs.ts useKeyResults.ts useOKRProgress.ts useEOSRocks.ts useEOSMeetings.ts

# Delete productivity
rm -f useProductivity.ts useEmployeeProductivity.ts useTimeTracking.ts

# Delete resources
rm -f useResourceProjection.ts useResourceProjectionSync.ts useProjectAllocations.ts useTeamResources.ts useAvailableWeeks.ts

# Delete emails
rm -f useSendEmail.ts useEmailTemplates.ts useEmailSchedule.ts

# Delete processes/pods
rm -f useProcessDocuments.ts usePods.ts usePodMembers.ts

# Delete deals
rm -f useDeals.ts useDealSync.ts useDealSyncQueue.ts

# Delete integrations
rm -f useHubSpot*.ts useActiveCollab*.ts
```

---

## 🗑️ SECTION 4: Clean Up Edge Functions

### **Edge Functions to DELETE from `/supabase/functions/`**

```bash
# HubSpot Integration (Phase 2)
- [ ] hubspot-sync-contacts/
- [ ] hubspot-sync-companies/
- [ ] hubspot-sync-deals/
- [ ] hubspot-pipeline-info/
- [ ] hubspot-contact-sync/
- [ ] hubspot-webhook-handler/

# ActiveCollab Integration (Phase 4)
- [ ] ac-sync-projects/
- [ ] ac-sync-tasks/
- [ ] ac-webhook-handler/
- [ ] ac-time-tracking/

# Project/Task Related
- [ ] sync-project-tasks/
- [ ] update-task-status/

# Resource Management (Phase 6)
- [ ] resource-projection-sync/
- [ ] calculate-resource-allocation/

# Productivity (Phase 7)
- [ ] generate-productivity-report/
- [ ] calculate-productivity-metrics/

# Email Generation
- [ ] generate-email-template/
- [ ] send-scheduled-email/

# Financial Reports (if not needed)
- [ ] generate-financial-report/

# N8N Integration (if not using)
- [ ] n8n-webhook-handler/
```

**Keep these edge functions:**
```bash
✅ validate-api-key/
✅ audit-log-writer/
✅ send-email/
✅ ai-chat-assistant/
✅ semantic-search/
✅ sync-zoom-files/
✅ zoom-transcript-processing/
✅ generate-meeting-summary/
✅ send-notification/
✅ send-slack-message/
✅ google-drive-sync/
✅ google-drive-upload/
```

---

## 📝 SECTION 5: Update Routing in `App.tsx`

### **Step 5.1: Open `/src/App.tsx`**

### **Step 5.2: Remove Excluded Routes**

Find and DELETE route imports and route definitions for:

```typescript
// DELETE these imports:
import Projects from "./pages/projects/Projects";
import Tasks from "./pages/tasks/Tasks";
import OKRs from "./pages/okrs/OKRs";
import EOS from "./pages/eos/EOS";
import Productivity from "./pages/productivity/Productivity";
import Emails from "./pages/emails/Emails";
import Processes from "./pages/processes/Processes";
import Pods from "./pages/pods/Pods";
import Deals from "./pages/deals/Deals";
import HubSpot from "./pages/hubspot/HubSpot";
import ActiveCollab from "./pages/activecollab/ActiveCollab";
// ... and any other excluded feature imports

// DELETE these routes from Router:
<Route path="/projects" element={<Projects />} />
<Route path="/tasks" element={<Tasks />} />
<Route path="/okrs" element={<OKRs />} />
<Route path="/eos" element={<EOS />} />
<Route path="/productivity" element={<Productivity />} />
<Route path="/emails" element={<Emails />} />
<Route path="/processes" element={<Processes />} />
<Route path="/pods" element={<Pods />} />
<Route path="/deals" element={<Deals />} />
<Route path="/hubspot" element={<HubSpot />} />
<Route path="/activecollab" element={<ActiveCollab />} />
```

### **Step 5.3: Verify Remaining Routes**

Your `App.tsx` should have routes ONLY for:

```typescript
// ✅ KEEP these routes:
<Route path="/" element={<Dashboard />} />
<Route path="/profile" element={<Profile />} />
<Route path="/settings" element={<Settings />} />
<Route path="/clients" element={<Clients />} />
<Route path="/meetings" element={<Meetings />} />
<Route path="/knowledge" element={<KnowledgeBase />} />
<Route path="/ai" element={<AIAgents />} />
<Route path="/feedback" element={<Feedback />} />
<Route path="/admin/*" element={<AdminRoutes />} />
```

### **Step 5.4: Test Routing**

```bash
npm run dev
```

Visit each route to ensure no broken links.

---

## 🗑️ SECTION 6: Clean Up API Endpoints

### **Step 6.1: Open `/src/config/api.ts`**

### **Step 6.2: Remove Excluded Endpoints**

Delete endpoint definitions for excluded features:

```typescript
// DELETE these endpoint groups:
const API_ENDPOINTS = {
  // DELETE:
  PROJECTS: { ... },
  TASKS: { ... },
  BUGS: { ... },
  OKRS: { ... },
  EOS: { ... },
  PRODUCTIVITY: { ... },
  EMAILS: { ... },
  PROCESSES: { ... },
  PODS: { ... },
  DEALS: { ... },
  HUBSPOT: { ... },
  ACTIVECOLLAB: { ... },
  RESOURCE_PROJECTION: { ... },

  // KEEP:
  EMPLOYEES: { ... },
  CLIENTS: { ... },
  MEETINGS: { ... },
  ZOOM: { ... },
  KNOWLEDGE: { ... },
  AI: { ... },
  ADMIN: { ... },
  GOOGLE: { ... },
  NOTIFICATIONS: { ... },
  FEEDBACK: { ... },
}
```

### **Step 6.3: Save and Test**

Ensure no TypeScript errors after removal.

---

## 🗑️ SECTION 7: Clean Up Database Types

### **Step 7.1: Regenerate Database Types**

After setting up your new Supabase project with V1 schema only:

```bash
# Install Supabase CLI if not done
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Generate fresh types (only V1 tables)
supabase gen types typescript --local > src/types/database.ts
```

This automatically removes types for excluded tables.

### **Step 7.2: Verify Types**

Open `/src/types/database.ts` and confirm ONLY these tables exist:

```typescript
// ✅ Should have types for:
- profiles
- roles
- user_roles
- permissions
- role_permissions
- modules
- module_access
- clients
- meetings
- zoom_files
- meeting_transcripts
- knowledge_entries
- knowledge_categories
- knowledge_embeddings
- ai_agents
- ai_conversations
- notifications
- notification_preferences
- feedback
- audit_logs
- integration_settings

// ❌ Should NOT have types for:
- projects
- tasks
- okrs
- okr_key_results
- eos_rocks
- deals
- emails
- process_documents
- pods
- Employee
- EmployeeProductivity
- hubspot_*
- activecollab_*
```

---

## 🗑️ SECTION 8: Clean Up Sidebar Navigation

### **Step 8.1: Open `/src/components/layout/AppSidebar.tsx`**

### **Step 8.2: Remove Menu Items**

Delete menu items for excluded features:

```typescript
// DELETE these menu items:
{ name: "Projects", path: "/projects", icon: FolderKanban },
{ name: "Tasks", path: "/tasks", icon: CheckSquare },
{ name: "OKRs", path: "/okrs", icon: Target },
{ name: "EOS", path: "/eos", icon: Compass },
{ name: "Productivity", path: "/productivity", icon: TrendingUp },
{ name: "Emails", path: "/emails", icon: Mail },
{ name: "Processes", path: "/processes", icon: FileText },
{ name: "PODs", path: "/pods", icon: Users },
{ name: "Deals", path: "/deals", icon: DollarSign },
```

### **Step 8.3: Keep V1 Menu Items**

```typescript
// ✅ KEEP these menu items:
const menuItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Clients", path: "/clients", icon: Users },
  { name: "Meetings", path: "/meetings", icon: Video },
  { name: "Knowledge Base", path: "/knowledge", icon: BookOpen },
  { name: "AI Agents", path: "/ai", icon: Bot },
  { name: "Feedback", path: "/feedback", icon: MessageSquare },
];
```

### **Step 8.4: Update Admin Sidebar**

Open `/src/components/layout/AdminSidebar.tsx`:

```typescript
// ✅ KEEP admin items:
const adminMenuItems = [
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Roles", path: "/admin/roles", icon: Shield },
  { name: "AI Agents", path: "/admin/ai-agents", icon: Bot },
  { name: "Knowledge Base", path: "/admin/knowledge", icon: BookOpen },
  { name: "Integrations", path: "/admin/integrations", icon: Puzzle },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

// DELETE if present:
// - Project Settings
// - OKR Management
// - POD Management
// - HubSpot Sync
// - ActiveCollab Sync
```

---

## 🗑️ SECTION 9: Clean Up Package.json

### **Step 9.1: Open `package.json`**

### **Step 9.2: Remove Unused Dependencies**

Review and DELETE these if present:

```json
{
  "dependencies": {
    // DELETE if you find these (integration-specific):
    "@hubspot/api-client": "...",       // HubSpot SDK
    "activecollab-sdk": "...",           // ActiveCollab SDK

    // DELETE if present (project/task specific):
    "gantt-chart-library": "...",

    // KEEP all of these (V1 Framework):
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.23",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.8",
    "dompurify": "^3.1.7",
    "tailwindcss": "^3.4.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.441.0",
    "date-fns": "^3.6.0",
    "recharts": "^2.12.7",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.2",
    // ... all shadcn/ui dependencies
  }
}
```

### **Step 9.3: Run Clean Install**

```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Fresh install
npm install
```

---

## 🗑️ SECTION 10: Remove Unused Utility Files

### **Check `/src/lib/` for Feature-Specific Utilities**

```bash
# Review and DELETE if present:
- [ ] /src/lib/deal-utils.ts          # Deal calculations
- [ ] /src/lib/hubspot.ts             # HubSpot helpers
- [ ] /src/lib/activecollab.ts        # ActiveCollab helpers
- [ ] /src/lib/okr-helpers.ts         # OKR calculations

# KEEP these utilities:
✅ /src/lib/utils.ts
✅ /src/lib/sanitize.ts
✅ /src/lib/validation.ts
✅ /src/lib/auth-utils.ts
✅ /src/lib/supabase-helpers.ts
✅ /src/lib/cache.ts
✅ /src/lib/componentOptimization.ts
✅ /src/lib/performance.ts
✅ /src/lib/edge-functions.ts
✅ /src/lib/toast-helpers.ts
✅ /src/lib/csv.ts
✅ /src/lib/exportUtils.ts
✅ /src/lib/slug.ts
```

---

## 🔍 SECTION 11: Find & Remove Unused Imports

### **Use IDE to Find Unused Imports**

**VS Code:**
1. Install "TypeScript Hero" extension
2. Run command: "TypeScript: Organize Imports"
3. Automatically removes unused imports

**Or manually:**

```bash
# Search for common unused imports
grep -r "import.*Projects" src/
grep -r "import.*Tasks" src/
grep -r "import.*OKR" src/
grep -r "import.*HubSpot" src/
```

Delete any remaining references.

---

## 🧪 SECTION 12: Test Everything

### **Checklist:**

- [ ] `npm run dev` starts without errors
- [ ] No TypeScript errors (`npm run type-check` if available)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Authentication works (Google OAuth)
- [ ] Protected routes work
- [ ] Admin routes work (for admin users)
- [ ] Dashboard loads
- [ ] Clients CRUD works
- [ ] Meetings CRUD works (if Zoom configured)
- [ ] Knowledge Base works
- [ ] AI features work (if OpenAI configured)
- [ ] Feedback submission works
- [ ] Notifications work
- [ ] Profile page works
- [ ] Settings page works
- [ ] No console errors in browser

### **Run Tests (if you have tests):**

```bash
npm run test
```

---

## 🎨 SECTION 13: Customize for Your Brand

### **Step 13.1: Update App Name**

```typescript
// package.json
{
  "name": "your-app-name",
  "description": "Your app description"
}

// index.html
<title>Your App Name</title>
<meta name="description" content="Your app description">

// src/components/layout/TopNav.tsx (or similar)
<h1>Your App Name</h1>
```

### **Step 13.2: Update Colors (Theming)**

```css
/* src/index.css */
:root {
  --primary: 210 100% 50%;        /* Your primary brand color */
  --secondary: 340 100% 50%;      /* Your secondary color */
  --accent: 160 100% 50%;         /* Your accent color */

  /* Update other color values as needed */
}
```

Use tools like https://uicolors.app/create to generate Tailwind color palettes.

### **Step 13.3: Replace Logo & Favicon**

```bash
# Replace these files in /public:
- [ ] /public/logo.svg
- [ ] /public/favicon.ico
- [ ] /public/og-image.png (for social sharing)
```

### **Step 13.4: Update Default Avatar Placeholder**

```bash
- [ ] /public/placeholder.svg     # Default user avatar
```

---

## 📱 SECTION 14: Update Meta Tags & SEO

### **Open `index.html`**

```html
<head>
  <title>Your App Name</title>
  <meta name="description" content="Your app description for SEO">

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:title" content="Your App Name">
  <meta property="og:description" content="Your app description">
  <meta property="og:image" content="/og-image.png">
  <meta property="og:url" content="https://yourapp.com">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Your App Name">
  <meta name="twitter:description" content="Your app description">
  <meta name="twitter:image" content="/og-image.png">
</head>
```

---

## 🔒 SECTION 15: Security Final Check

### **Checklist:**

- [ ] `.env` file is in `.gitignore`
- [ ] No API keys hardcoded in source code
- [ ] All user inputs use `sanitizeString()` or `sanitizeHtml()`
- [ ] All forms use validation from `/src/lib/validation.ts`
- [ ] Supabase RLS policies enabled on all tables
- [ ] Admin routes protected with `AdminRoute` component
- [ ] User routes protected with `ProtectedRoute` component
- [ ] Edge functions validate authentication
- [ ] CORS configured properly in Supabase

---

## 📦 SECTION 16: Build & Production Test

### **Step 16.1: Build for Production**

```bash
npm run build
```

Check for errors. Fix any TypeScript or build errors.

### **Step 16.2: Preview Production Build**

```bash
npm run preview
```

Open `http://localhost:4173` and test:
- [ ] All routes work
- [ ] Assets load correctly
- [ ] Authentication works
- [ ] No console errors

### **Step 16.3: Check Bundle Size**

```bash
# After build, check dist folder size
du -sh dist/

# Typical size should be:
# - < 5MB total (good)
# - 5-10MB (acceptable)
# - > 10MB (investigate large dependencies)
```

---

## ✅ FINAL CHECKLIST

Before deploying to production:

### **Code Quality:**
- [ ] All excluded features removed
- [ ] No unused imports
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted consistently

### **Functionality:**
- [ ] Authentication works
- [ ] All V1 features tested
- [ ] Admin panel accessible
- [ ] No broken links
- [ ] Mobile responsive

### **Configuration:**
- [ ] Environment variables set
- [ ] Database schema deployed
- [ ] Edge functions deployed
- [ ] RLS policies active
- [ ] OAuth configured

### **Branding:**
- [ ] App name updated everywhere
- [ ] Logo replaced
- [ ] Colors customized
- [ ] Meta tags updated

### **Security:**
- [ ] No secrets in code
- [ ] Input sanitization active
- [ ] RLS enabled
- [ ] Protected routes working

### **Performance:**
- [ ] Build size reasonable
- [ ] No console errors
- [ ] Fast page loads
- [ ] Images optimized

---

## 🎉 Cleanup Complete!

Your framework is now cleaned up and ready for deployment!

**Next Steps:**
1. Commit all changes: `git add . && git commit -m "Framework cleanup complete"`
2. Deploy to production (see `SJ-DASHBOARD-FRAMEWORK_SETUP.md` Section 10)
3. Start building your unique features!

---

## 📝 Notes

- Keep this checklist for future reference
- Some sections may not apply if you customized during setup
- When in doubt, test after each major deletion
- Commit frequently during cleanup process

**Questions?** Review the setup guide or framework extraction guide for more details.
