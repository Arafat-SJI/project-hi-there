# Platform Core — Module Blueprint

## Overview
The Platform Core module provides the application shell that all other modules plug into. It contains authentication, layouts, navigation, the UI component library, contexts, shared hooks, configuration, and the Supabase integration layer.

## Routes Owned
From App.tsx:
```
/                          → Redirect to /dashboard
/login                     → Login page
/auth/callback             → OAuth callback
/access-denied             → Access denied page
/api                       → Public API docs
/ai-agent-guide            → AI agent guide
/dashboard                 → Main dashboard (ProtectedRoute + DashboardLayout)
/profile                   → User profile
/account/sessions          → Session management
/vision                    → Vision page (company overview)
/analytics                 → Analytics page
/feedback                  → User feedback
/user-guide                → Help & guides
/notifications             → Notifications
/pod                       → Pod/team view
/integrations/gmail/callback      → Gmail OAuth callback
/integrations/google-drive/callback  → Google Drive OAuth callback
/integrations/google-calendar/callback → Google Calendar OAuth callback
```

## File Inventory

### Pages
- src/pages/MyDashboard.tsx — Main user dashboard
- src/pages/Dashboard.tsx — Alternative dashboard view
- src/pages/Index.tsx — Index/home page
- src/pages/NotFound.tsx — 404 page
- src/pages/AccessDenied.tsx — 403 page
- src/pages/Profile.tsx — User profile
- src/pages/Vision.tsx — Company vision page
- src/pages/Analytics.tsx — Analytics page
- src/pages/Reports.tsx — Reports page
- src/pages/Resources.tsx — Resources page
- src/pages/Pod.tsx — Pod/team view
- src/pages/PodManagement.tsx — Pod management
- src/pages/Feedback.tsx — User feedback
- src/pages/UserGuide.tsx — Help documentation
- src/pages/AiAgentGuide.tsx — AI agent guide
- src/pages/ApiDocs.tsx — API documentation
- src/pages/PublicApiDocs.tsx — Public API docs
- src/pages/CommunicationCoach.tsx — Communication coach
- src/pages/TranscriptDetail.tsx — Transcript detail
- src/pages/auth/Login.tsx — Login page
- src/pages/auth/AuthCallback.tsx — OAuth callback handler
- src/pages/auth/SessionManagement.tsx — Session management
- src/pages/notifications/NotificationsPage.tsx — Notifications view
- src/pages/settings/NotificationPreferences.tsx — Notification prefs
- src/pages/integrations/GmailCallback.tsx — Gmail OAuth callback
- src/pages/integrations/GoogleDriveCallback.tsx — Google Drive OAuth callback
- src/pages/integrations/GoogleCalendarCallback.tsx — Google Calendar OAuth callback

### Layout Components (src/components/layout/)
- DashboardLayout.tsx — Main app layout with sidebar
- AdminLayout.tsx — Admin panel layout
- MainSidebar.tsx — Main sidebar navigation
- AdminSidebar.tsx — Admin sidebar
- AppSidebar.tsx — App-wide sidebar
- TopNav.tsx — Top navigation bar
- Breadcrumb.tsx — Breadcrumb navigation

### Auth Components (src/components/auth/)
- ProtectedRoute.tsx — Route protection HOC (checks auth)
- AdminRoute.tsx — Admin-only route protection
- ModuleRoute.tsx — Module-level access control

### Error Handling
- src/components/ErrorBoundary.tsx — Global error boundary
- src/components/common/ErrorBoundary.tsx — Common error boundary

### UI Component Library (src/components/ui/) — 45+ components
shadcn/ui based. Key ones:
- button.tsx, input.tsx, textarea.tsx, label.tsx, form.tsx
- dialog.tsx, alert-dialog.tsx, sheet.tsx, drawer.tsx
- table.tsx, card.tsx, badge.tsx, avatar.tsx
- tabs.tsx, accordion.tsx, pagination.tsx
- dropdown-menu.tsx, context-menu.tsx, navigation-menu.tsx
- progress.tsx, skeleton.tsx, toast.tsx, sonner.tsx
- tooltip.tsx, popover.tsx, hover-card.tsx
- select.tsx, checkbox.tsx, radio-group.tsx, switch.tsx, toggle.tsx
- calendar.tsx, slider.tsx, chart.tsx, command.tsx
- sidebar.tsx, scroll-area.tsx, separator.tsx, resizable.tsx
- carousel.tsx, collapsible.tsx, aspect-ratio.tsx
- FormRichTextEditor.tsx, star-rating.tsx, WeekDisplay.tsx

### Common Components (src/components/common/)
- EmployeeSelector.tsx, MultiEmployeeSelector.tsx
- EmptyState.tsx, PageHeader.tsx, KPICard.tsx, StatCard.tsx
- SearchBar.tsx, FilterToolbar.tsx, StatusBadge.tsx
- MarkdownRenderer.tsx, PodSelector.tsx
- DeprecationBanner.tsx, FeaturedAnnouncementBanner.tsx
- UnifiedFilesSection.tsx

### Global Components
- src/components/GlobalSearch.tsx — Global search
- src/components/NavLink.tsx — Navigation link
- src/components/notifications/NotificationBell.tsx
- src/components/notifications/NotificationItem.tsx

### Vision Components (src/components/vision/)
- VisionHero.tsx, TowerCard.tsx, ControlTowerEcosystem.tsx
- ModuleOverviewGrid.tsx, AnnouncementCard.tsx
- AiGuidePromo.tsx, AiSectionDivider.tsx, WhatsNewTimeline.tsx, index.ts

### Dashboard Components (src/components/dashboard/)
- tabs/MyMeetingsTab.tsx, tabs/MyDealsTab.tsx

### Contexts (src/contexts/)
- AuthContext.tsx — Authentication state (user, session, roles, sign in/out)
- SearchContext.tsx — Global search state
- ActivityTrackerContext.tsx — Activity tracking

### Core Hooks (src/hooks/)
Auth & Permissions:
- useModuleAccess.ts — Check module access (calls get_user_modules RPC)
- useUserRole.ts — Get user role
- usePermissions.ts — Permission checks
User Profile:
- useUpdateProfile.ts, useEmployeeProfile.ts, useEmployeeFullProfile.ts
Notifications:
- useNotifications.ts, useNotificationsV2.ts, useNotificationPreferences.ts
- useAnnouncements.ts, useUserNotifications.ts, useInactiveUserAlerts.ts
Session:
- useMemoryOnAuth.ts, useUserMemoryAtLogin.ts, useMemoryHierarchy.ts
Utility:
- use-toast.ts, use-mobile.tsx
Settings:
- useSettings.ts, useFeedback.ts

### Configuration (src/config/)
- api.ts — API endpoint definitions (API_ENDPOINTS, buildApiUrl, getApiEndpoint)
- storageConfig.ts — Storage bucket configuration
- controlTowers.ts — Control tower definitions

### Data (src/data/)
- navigationStructure.ts — Main and admin navigation definitions
- documentationIndex.ts, agentDataSourceRegistry.ts, userGuideIndex.ts
- feedbackModules.ts, urlAuditData.ts

### Supabase Integration (src/integrations/supabase/)
- client.ts — Supabase client initialization with custom auth storage
- types.ts — Auto-generated database types (590KB)

### Type Definitions (src/types/)
- database.ts, database-custom.ts — Database schema types
- integrations.ts, pods.ts, edge-functions.ts — Shared types

### Utilities (src/lib/)
- utils.ts — General utilities (cn, clsx)
- auth-utils.ts — Auth helpers
- validation.ts, type-guards.ts, cache.ts, performance.ts
- supabase-helpers.ts, supabase-typed.ts
- csv.ts, exportUtils.ts, slug.ts, sanitize.ts, toast-helpers.ts
- edge-functions.ts, componentOptimization.ts
- isoWeeks.ts

### Constants (src/constants/)
- routes.ts — Route path constants
- timezones.ts — Timezone constants

### Services (src/services/)
- uploadService.ts — File upload service

## Database Tables
- `profiles` — User profiles
- `app_modules` — Module definitions (name, page_route, is_active, category)
- `user_module_permissions` — Per-user module access
- `system_settings` — Key-value system configuration
- `user_roles` — Role assignments
- `announcements` — System announcements
- `feedback` — User feedback
- `sessions` — Active sessions

## Key RPC Functions
- `get_user_modules` — Returns module names accessible to current user

## Permission System
1. `app_modules` table defines available modules
2. `get_user_modules` RPC returns modules for current user (or `*` for admin)
3. `useModuleAccess(moduleName)` hook checks access in components
4. `MainSidebar` filters navigation items by `hasModule(moduleName)`
5. `ModuleRoute` component guards routes

## Environment Variables
```
VITE_SUPABASE_PROJECT_ID=      # Supabase project ID
VITE_SUPABASE_URL=             # Supabase URL
VITE_SUPABASE_PUBLISHABLE_KEY= # Supabase anon key
VITE_API_BASE_URL=             # Edge Functions base URL
```

## Build Configuration
- vite.config.ts: Port 8080, SWC React plugin, path alias @/ → src/
- tsconfig.json: @/* → ./src/*, strict: false, skipLibCheck: true
- tailwind.config.ts: Tailwind CSS configuration
- package.json: Dependencies and scripts

## Implementation Notes
- Auth uses Supabase Auth with custom "remember me" storage
- Query caching uses TanStack React Query persist with localStorage
- Cache version tracking (`CACHE_VERSION = 'v15'`) for invalidation
- Stale time: 5 min, GC time: 30 min, persist: 4 hours
- All protected routes wrap with `<ProtectedRoute>` + `<DashboardLayout>`
- Admin routes additionally wrap with `<AdminRoute>` + `<AdminLayout>`
- The navigation structure uses `moduleName` field for permission filtering
