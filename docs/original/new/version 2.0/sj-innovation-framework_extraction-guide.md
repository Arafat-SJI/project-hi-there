# Framework Extraction Guide - V1 (Option B + Meetings)

> **READ THIS FIRST:** This guide helps you extract framework components for NEW projects WITHOUT modifying your current codebase.

---

## 📋 What's Included in V1

- ✅ Authentication (Google OAuth + Email/Password)
- ✅ User Management (users, roles)
- ✅ Protected Routes & Access Control
- ✅ Dashboard & Profile Management
- ✅ Notifications System
- ✅ Feedback Collection
- ✅ Clients Management
- ✅ Meetings (Zoom Integration)
- ✅ Knowledge Base
- ✅ AI Agents Framework
- ✅ Admin Panel
- ✅ 51 UI Components (shadcn/ui)
- ✅ Security (XSS Protection, Validation)
- ✅ Caching, Performance Monitoring
- ✅ Complete Technical Infrastructure

---

## 📁 File Structure to Copy

### **1. CONFIGURATION FILES (Root Level)**

Copy these from project root:

```
├── package.json                    # Dependencies (clean up after copy)
├── package-lock.json
├── vite.config.ts                 # Build configuration
├── tailwind.config.ts             # Theming & design system
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # App TypeScript config
├── tsconfig.node.json             # Node TypeScript config
├── eslint.config.js               # Linting rules
├── postcss.config.js              # PostCSS for Tailwind
├── components.json                # shadcn/ui configuration
├── .env.example                   # Environment variables template
└── index.html                     # Entry HTML
```

**Action:** Copy entire files, then clean up `package.json` (see cleanup checklist).

---

### **2. PUBLIC ASSETS**

```
/public/
├── placeholder.svg                # Default placeholder image
└── [your-logo-files]             # Add your branding
```

**Action:** Copy `/public` folder, replace with your assets.

---

### **3. SOURCE CODE - CORE INFRASTRUCTURE**

#### **3.1 Entry Points & App Setup**

```
/src/
├── main.tsx                       # React entry point
├── App.tsx                        # Root component with routing
├── index.css                      # Global styles with CSS variables
├── vite-env.d.ts                 # Vite type definitions
```

**Action:** Copy all 4 files.

---

#### **3.2 Configuration & Constants**

```
/src/config/
└── api.ts                         # Centralized API endpoints (250+ lines)

/src/constants/
└── routes.ts                      # Route path constants
```

**Action:** Copy both files. Clean up `api.ts` to remove project-specific endpoints.

---

#### **3.3 TypeScript Types**

```
/src/types/
├── database.ts                    # Supabase auto-generated types
├── edge-functions.ts              # Edge function request/response types
├── supabase.ts                    # Supabase client types
└── [other-types].ts              # As needed
```

**Action:** Copy `/src/types/` folder. Regenerate `database.ts` for new project.

---

### **4. AUTHENTICATION & SECURITY**

#### **4.1 Auth Context & Components**

```
/src/contexts/
└── AuthContext.tsx                # Auth provider with session management

/src/components/auth/
├── ProtectedRoute.tsx             # Require authentication
├── AdminRoute.tsx                 # Admin-only routes
└── ModuleRoute.tsx                # Module access control
```

**Action:** Copy entire `/src/contexts/` and `/src/components/auth/` folders.

---

#### **4.2 Security Utilities**

```
/src/lib/
├── sanitize.ts                    # XSS protection (DOMPurify)
├── validation.ts                  # Form validators (420+ lines)
├── auth-utils.ts                  # Auth helper functions
```

**Action:** Copy these 3 files from `/src/lib/`.

---

### **5. UI COMPONENTS (shadcn/ui)**

#### **5.1 Base UI Components (51 files)**

```
/src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── alert.tsx
├── badge.tsx
├── breadcrumb.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── carousel.tsx
├── checkbox.tsx
├── collapsible.tsx
├── command.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── hover-card.tsx
├── input-otp.tsx
├── input.tsx
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── pagination.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── resizable.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── sidebar.tsx
├── skeleton.tsx
├── slider.tsx
├── sonner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toast.tsx
├── toaster.tsx
├── toggle-group.tsx
├── toggle.tsx
├── tooltip.tsx
├── use-toast.ts
└── [remaining components]
```

**Action:** Copy entire `/src/components/ui/` folder (51 components).

---

#### **5.2 Common Reusable Components**

```
/src/components/common/
├── ErrorBoundary.tsx              # Error handling
├── KPICard.tsx                    # Metrics display
├── StatCard.tsx                   # Statistics cards
├── EmptyState.tsx                 # No data placeholder
├── StatusBadge.tsx                # Status indicators
├── MarkdownRenderer.tsx           # Rich text display
├── SearchBar.tsx                  # Reusable search
├── PageHeader.tsx                 # Page titles
├── FilterToolbar.tsx              # Filter controls
└── [other common components]
```

**Action:** Copy entire `/src/components/common/` folder.

---

#### **5.3 Layout Components**

```
/src/components/layout/
├── DashboardLayout.tsx            # Main app layout
├── AdminLayout.tsx                # Admin panel layout
├── TopNav.tsx                     # Top navigation bar
├── AppSidebar.tsx                 # Main sidebar
├── MainSidebar.tsx                # Alternative sidebar
├── AdminSidebar.tsx               # Admin sidebar
└── Breadcrumb.tsx                 # Breadcrumb navigation
```

**Action:** Copy entire `/src/components/layout/` folder.

---

### **6. BUSINESS FEATURES**

#### **6.1 Clients Management**

```
/src/pages/
├── Clients.tsx                    # Client list page
├── ClientForm.tsx                 # Add/edit client
└── ClientDetail.tsx               # Client details (if exists)

/src/hooks/
├── useClients.ts                  # Client data hooks
├── useAddClient.ts
├── useUpdateClient.ts
└── useDeleteClient.ts

/src/components/
└── clients/                       # Client-specific components
    └── [client components]
```

**Action:** Copy client-related pages, hooks, and components.

---

#### **6.2 Meetings (Zoom Integration)**

```
/src/pages/
└── meetings/
    ├── Meetings.tsx               # Meetings list
    ├── MeetingDetail.tsx          # Meeting details
    └── [other meeting pages]

/src/hooks/
├── useMeetings.ts                 # Meeting data hooks
├── useZoomFiles.ts                # Zoom file integration
├── useZoomTranscripts.ts
└── [other meeting hooks]

/src/components/
└── meetings/
    └── [meeting components]

/supabase/functions/
├── sync-zoom-files/               # Edge function
├── zoom-transcript-processing/    # Edge function
└── generate-meeting-summary/      # Edge function (AI)
```

**Action:** Copy meetings pages, hooks, components, and Zoom edge functions.

---

#### **6.3 Knowledge Base**

```
/src/pages/
└── knowledge/
    ├── KnowledgeBase.tsx          # Main KB page
    ├── KnowledgeCategories.tsx
    ├── KnowledgeEntry.tsx
    └── [other KB pages]

/src/hooks/
├── useKnowledge.ts                # KB data hooks
├── useKnowledgeCategories.ts
├── useSemanticSearch.ts           # AI search
└── [other KB hooks]

/src/components/
└── knowledge/
    └── [KB components]

/supabase/functions/
├── semantic-search/               # AI search edge function
└── [other KB edge functions]
```

**Action:** Copy knowledge base pages, hooks, components, and edge functions.

---

#### **6.4 AI Agents Framework**

```
/src/pages/
└── ai/
    ├── AIAgents.tsx               # AI agents list
    ├── AIAgentConfig.tsx          # Agent configuration
    └── [other AI pages]

/src/hooks/
├── useAI.ts                       # AI hooks
├── useAIAgents.ts
├── useSemanticSearch.ts
└── [other AI hooks]

/src/components/
└── ai/
    └── [AI components]

/supabase/functions/
├── ai-chat-assistant/             # Edge function
├── ai-analyze-project/            # Edge function
└── [other AI edge functions]
```

**Action:** Copy AI pages, hooks, components, and edge functions.

---

#### **6.5 Feedback Collection**

```
/src/pages/
└── Feedback.tsx                   # Feedback page

/src/hooks/
└── useFeedback.ts                 # Feedback hooks

/src/components/
└── feedback/
    └── [feedback components]
```

**Action:** Copy feedback-related files.

---

### **7. ADMIN PANEL**

```
/src/pages/admin/
├── Users.tsx                      # User management
├── Roles.tsx                      # Role management
├── Settings.tsx                   # System settings
├── AIAgentAdmin.tsx              # AI agent configuration
├── KnowledgeAdmin.tsx            # KB admin
├── IntegrationSettings.tsx        # OAuth/API key setup
└── [other admin pages]

/src/hooks/
├── useUsers.ts                    # User admin hooks
├── useRoles.ts
├── usePermissions.ts
├── useDeleteUser.ts
└── [other admin hooks]

/src/components/admin/
└── [admin components]
```

**Action:** Copy entire `/src/pages/admin/`, related hooks, and components.

---

### **8. USER FEATURES**

```
/src/pages/
├── Dashboard.tsx                  # Main dashboard (landing page)
├── Profile.tsx                    # User profile
├── Settings.tsx                   # User settings
└── Login.tsx                      # Login page (if separate)

/src/hooks/
├── useProfile.ts                  # Profile hooks
└── useUserSettings.ts             # Settings hooks
```

**Action:** Copy these core user pages and hooks.

---

### **9. NOTIFICATIONS SYSTEM**

```
/src/hooks/
├── useNotifications.ts            # In-app notifications
├── useNotificationsV2.ts          # Enhanced version
├── useSendNotification.ts         # Send notifications
├── useSendSlackMessage.ts         # Slack integration
└── useNotificationPreferences.ts  # User preferences

/src/components/notifications/
├── NotificationBell.tsx           # Bell icon with count
├── NotificationItem.tsx           # Notification display
└── [other notification components]

/supabase/functions/
├── send-notification/             # Edge function
└── send-slack-message/            # Edge function
```

**Action:** Copy notification hooks, components, and edge functions.

---

### **10. UTILITIES & HELPERS**

```
/src/lib/
├── utils.ts                       # Core utilities (cn, formatters)
├── supabase-helpers.ts           # Batch data fetching
├── cache.ts                       # Caching system (480+ lines)
├── componentOptimization.ts       # Performance hooks
├── performance.ts                 # Performance monitoring
├── edge-functions.ts              # Edge function wrapper
├── toast-helpers.ts               # Toast utilities
├── csv.ts                         # CSV export
├── exportUtils.ts                 # PDF/CSV export
├── slug.ts                        # Slug generation
└── [other utilities]

/src/utils/
├── dateFormat.ts                  # Date formatting
├── timeParser.ts                  # Time parsing
├── safeArray.ts                   # Safe array operations
└── [other utils]
```

**Action:** Copy entire `/src/lib/` and `/src/utils/` folders.

---

### **11. HOOKS ECOSYSTEM**

Copy hooks organized by feature:

```
/src/hooks/
├── useProfile.ts
├── useUsers.ts
├── useClients.ts
├── useMeetings.ts
├── useKnowledge.ts
├── useNotifications.ts
├── useFeedback.ts
├── useAI.ts
├── usePermissions.ts
├── useEdgeFunction.ts
└── [100+ hooks - copy as needed]
```

**Action:** Copy `/src/hooks/` folder. Remove hooks for excluded features later.

---

### **12. SUPABASE INTEGRATION**

```
/src/integrations/supabase/
├── client.ts                      # Supabase client setup
└── [other integration files]

/supabase/
├── config.toml                    # Supabase configuration
├── migrations/                    # Database migrations
│   └── [migration files]
└── functions/                     # Edge functions
    ├── _shared/                   # Shared utilities
    ├── validate-api-key/
    ├── audit-log-writer/
    ├── send-email/
    ├── ai-chat-assistant/
    ├── semantic-search/
    ├── sync-zoom-files/
    ├── zoom-transcript-processing/
    ├── send-notification/
    ├── send-slack-message/
    └── [other edge functions for V1 features]
```

**Action:** Copy `/src/integrations/supabase/` and `/supabase/` folders. Clean up edge functions for excluded features.

---

### **13. ASSETS & STYLING**

```
/src/assets/
└── [images, icons, etc.]

/src/index.css                     # Global styles with CSS variables
```

**Action:** Copy `/src/assets/` and `/src/index.css`.

---

## 📊 DATABASE SCHEMA (Supabase)

### **Tables to Include in V1**

```sql
-- Core Auth & Users
- profiles                         # User profiles
- roles                           # Role definitions
- user_roles                      # User-role assignments
- permissions                     # Permissions
- role_permissions               # Role-permission mapping
- modules                        # Module definitions
- module_access                  # User module access

-- Business Features
- clients                        # Client/company management
- meetings                       # Meetings data
- zoom_files                     # Zoom recordings
- meeting_transcripts            # Transcripts
- knowledge_entries              # Knowledge base entries
- knowledge_categories           # KB categories
- knowledge_embeddings           # Vector embeddings
- ai_agents                      # AI agent configs
- ai_conversations              # AI chat history

-- System
- notifications                  # User notifications
- notification_preferences       # Notification settings
- feedback                       # User feedback
- audit_logs                     # Activity tracking
- integration_settings           # OAuth/API keys
```

**Action:** Export schema from current project, import to new project. See `FRAMEWORK_SETUP.md` for details.

---

## 🔧 EDGE FUNCTIONS TO INCLUDE

### **V1 Edge Functions List**

```
Foundation:
✅ validate-api-key
✅ audit-log-writer
✅ send-email

Zoom Integration:
✅ sync-zoom-files
✅ zoom-transcript-processing

AI Features:
✅ ai-chat-assistant
✅ semantic-search
✅ generate-meeting-summary

Notifications:
✅ send-notification
✅ send-slack-message

Google Drive:
✅ google-drive-sync (for Knowledge Base)
✅ google-drive-upload

Reports (Optional):
⚠️ generate-project-report (may need customization)
```

**Action:** Copy these edge function folders from `/supabase/functions/`.

---

## 📦 NPM PACKAGES TO KEEP

### **Core Dependencies**

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",

  "vite": "^5.4.2",
  "@vitejs/plugin-react-swc": "^3.5.0",

  "@supabase/supabase-js": "^2.45.0",
  "@tanstack/react-query": "^5.51.23",
  "@tanstack/react-query-persist-client": "^5.51.23",

  "tailwindcss": "^3.4.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.2",

  "@radix-ui/react-*": "[shadcn/ui dependencies]",
  "lucide-react": "^0.441.0",

  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8",

  "dompurify": "^3.1.7",
  "date-fns": "^3.6.0",
  "recharts": "^2.12.7",
  "html2canvas": "^1.4.1",
  "jspdf": "^2.5.2"
}
```

**Action:** See `FRAMEWORK_CLEANUP_CHECKLIST.md` for full package cleanup.

---

## ⚠️ IMPORTANT NOTES

### **What NOT to Copy**

Do NOT copy these feature folders (excluded from V1):

```
/src/pages/
├── projects/                      ❌ Excluded
├── tasks/                         ❌ Excluded
├── okrs/                          ❌ Excluded
├── eos/                           ❌ Excluded
├── productivity/                  ❌ Excluded
├── emails/                        ❌ Excluded
├── processes/                     ❌ Excluded
├── pods/                          ❌ Excluded
├── deals/                         ❌ Excluded
├── hubspot/                       ❌ Excluded
└── activecollab/                  ❌ Excluded
```

### **Database Tables to EXCLUDE**

```
- projects
- tasks
- project_allocations
- team_members
- okrs
- okr_key_results
- eos_rocks
- deals
- deal_sync_queue
- emails
- email_templates
- process_documents
- pods
- Employee
- EmployeeProductivity
- MonthwiseEmployeeProductivityDetails
- hubspot_*
- activecollab_*
```

### **Edge Functions to EXCLUDE**

```
- hubspot-sync-*
- ac-sync-*
- generate-financial-report
- generate-productivity-report
- [any project/task related functions]
```

---

## 🎯 Next Steps

1. ✅ Review this extraction guide
2. ✅ Read `FRAMEWORK_SETUP.md` for new project setup
3. ✅ Read `FRAMEWORK_CLEANUP_CHECKLIST.md` for cleanup tasks
4. ✅ Start extracting files to new project folder
5. ✅ Follow setup guide to configure new project
6. ✅ Run cleanup checklist before deployment

---

## 💡 Tips

- **Copy, Don't Move:** Always copy files to preserve original codebase
- **Test Incrementally:** Set up auth first, then add features one by one
- **Clean As You Go:** Remove unused imports/code immediately
- **Version Control:** Initialize git in new project before copying files
- **Environment Variables:** Never copy `.env` - use `.env.example` as template

---

**Questions?** See `FRAMEWORK_SETUP.md` for detailed setup instructions.
