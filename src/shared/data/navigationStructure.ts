/**
 * Navigation Structure
 *
 * Single source of truth for all navigation items across the application.
 * Both AppSidebar and AdminSidebar read from this file.
 *
 * Items are filtered at runtime based on:
 * - Module access (useModuleAccess)
 * - Feature flags (useFeatureFlags)
 * - User role
 */

import type { ModuleId } from "@/shared/config/modules";

export interface NavItem {
  title: string;
  href: string;
  icon: string; // lucide icon name — resolved in the sidebar component
  module?: ModuleId; // Module that must be enabled for this item to appear
  featureFlag?: string; // Legacy feature flag check
  adminOnly?: boolean;
  badge?: string;
  children?: NavItem[]; // Nested sub-items (e.g., Streams under Tasks)
}

export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  isAI?: boolean; // Shows AI indicator animation
  module?: ModuleId;
  featureFlag?: string;
  items: NavItem[];
}

/**
 * Dashboard - Always visible at top level
 */
export const dashboardItem: NavItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: "LayoutDashboard",
};

/**
 * Main application navigation - Grouped structure
 */
export const navigationGroups: NavGroup[] = [
  {
    id: "business-dev",
    title: "Business Development",
    icon: "Briefcase",
    module: "business-dev",
    items: [
      {
        title: "Clients",
        href: "/clients",
        icon: "Users",
        module: "business-dev",
        featureFlag: "enableClients",
      },
      {
        title: "Deals",
        href: "/deals",
        icon: "Handshake",
        module: "business-dev",
        featureFlag: "enableClients",
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: "Contact",
        module: "business-dev",
        featureFlag: "enableClients",
      },
      {
        title: "Lead Follow-Up",
        href: "/lead-followup",
        icon: "Target",
        module: "lead-followup",
      },
    ],
  },
  {
    id: "work-management",
    title: "Work Management",
    icon: "ListTodo",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: "CheckSquare",
        module: "actions",
        featureFlag: "enableTasks",
        children: [
          {
            title: "Streams",
            href: "/tasks/streams",
            icon: "GitBranch",
            module: "actions",
            featureFlag: "enableTasks",
          },
        ],
      },
      {
        title: "Projects",
        href: "/projects",
        icon: "FolderKanban",
        module: "projects",
      },
    ],
  },
  {
    id: "meetings",
    title: "Meetings",
    icon: "Calendar",
    module: "meetings",
    items: [
      {
        title: "Schedule",
        href: "/meetings",
        icon: "Calendar",
        module: "meetings",
        featureFlag: "enableMeetings",
      },
      {
        title: "Series",
        href: "/meetings/series",
        icon: "Repeat",
        module: "meetings",
        featureFlag: "enableMeetings",
      },
      {
        title: "Transcripts",
        href: "/meetings/transcripts",
        icon: "ScrollText",
        module: "meetings",
        featureFlag: "enableMeetings",
      },
      {
        title: "Pending Assignments",
        href: "/meetings/pending-assignments",
        icon: "ClipboardCheck",
        module: "meetings",
        featureFlag: "enableMeetings",
      },
      {
        title: "AI Match",
        href: "/meetings/transcripts/ai-match",
        icon: "Sparkles",
        module: "meetings",
        featureFlag: "enableMeetings",
      },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    icon: "BookOpen",
    module: "knowledge",
    items: [
      {
        title: "Knowledge Base",
        href: "/knowledge",
        icon: "BookOpen",
        module: "knowledge",
        featureFlag: "enableKnowledgeBase",
      },
      {
        title: "Semantic Search",
        href: "/knowledge/search",
        icon: "Sparkles",
        module: "knowledge",
        featureFlag: "enableKnowledgeBase",
      },
      {
        title: "Personal Library",
        href: "/personal-knowledge",
        icon: "BookMarked",
        module: "knowledge",
        featureFlag: "enablePersonalKnowledge",
      },
    ],
  },
  {
    id: "strategy",
    title: "Strategy (EOS)",
    icon: "Target",
    module: "eos",
    items: [
      {
        title: "EOS Hub",
        href: "/eos",
        icon: "Target",
        module: "eos",
      },
      {
        title: "V/TO",
        href: "/eos/vto",
        icon: "Eye",
        module: "eos",
      },
      {
        title: "OKRs",
        href: "/okrs",
        icon: "Crosshair",
        module: "eos",
      },
      {
        title: "Issues",
        href: "/eos/issues",
        icon: "AlertCircle",
        module: "eos",
      },
      {
        title: "Scorecard",
        href: "/eos/scorecard",
        icon: "BarChart3",
        module: "eos",
      },
      {
        title: "Accountability",
        href: "/eos/accountability",
        icon: "Network",
        module: "eos",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: "Settings2",
    module: "productivity",
    items: [
      {
        title: "Productivity",
        href: "/productivity",
        icon: "BarChart3",
        module: "productivity",
      },
      {
        title: "Processes",
        href: "/process",
        icon: "FileText",
        module: "productivity",
      },
    ],
  },
  {
    id: "ai-command",
    title: "AI Command Center",
    icon: "Bot",
    isAI: true,
    items: [
      {
        title: "AI Agents",
        href: "/ai-agents",
        icon: "Bot",
        featureFlag: "enableAIAgents",
      },
      {
        title: "AI Chat",
        href: "/ai-chat",
        icon: "MessageSquare",
        featureFlag: "enableAIChat",
      },
      {
        title: "Feedback",
        href: "/feedback",
        icon: "MessageCircle",
        featureFlag: "enableFeedback",
      },
    ],
  },
];

/**
 * Legacy flat navigation - maintained for backward compatibility
 * @deprecated Use navigationGroups instead
 */
export const mainNavigation: NavItem[] = [
  dashboardItem,
  ...navigationGroups.flatMap((group) =>
    group.items.flatMap((item) => [item, ...(item.children || [])])
  ),
];

/**
 * Admin panel navigation (admin sidebar)
 */
export const adminNavigation: NavGroup[] = [
  {
    id: "admin-dashboard",
    title: "DASHBOARD",
    icon: "LayoutDashboard",
    items: [
      {
        title: "Overview",
        href: "/admin",
        icon: "LayoutDashboard",
      },
    ],
  },
  {
    id: "users-access",
    title: "USERS & ACCESS",
    icon: "Users",
    items: [
      {
        title: "User Management",
        href: "/admin/users",
        icon: "Users",
      },
      {
        title: "Role Management",
        href: "/admin/roles",
        icon: "Shield",
      },
      {
        title: "Activity Logs",
        href: "/admin/logs",
        icon: "Activity",
      },
    ],
  },
  {
    id: "team-resources",
    title: "TEAM & RESOURCES",
    icon: "Building2",
    items: [
      {
        title: "Employees",
        href: "/admin/team/employees",
        icon: "Users",
      },
      {
        title: "Departments",
        href: "/admin/team/departments",
        icon: "Building2",
      },
      {
        title: "Productivity Import",
        href: "/admin/productivity-import",
        icon: "Upload",
      },
      {
        title: "Meeting Analytics",
        href: "/admin/meeting-analytics",
        icon: "Calendar",
      },
    ],
  },
  {
    id: "admin-eos",
    title: "EOS",
    icon: "Target",
    items: [
      {
        title: "EOS Admin",
        href: "/admin/eos",
        icon: "Target",
      },
      {
        title: "VTO Config",
        href: "/admin/eos/vto",
        icon: "FileText",
      },
      {
        title: "Scorecards",
        href: "/admin/eos/scorecards",
        icon: "BarChart3",
      },
      {
        title: "OKRs Workspace",
        href: "/admin/eos/okrs",
        icon: "Crosshair",
      },
      {
        title: "Accountability",
        href: "/admin/eos/accountability",
        icon: "Network",
      },
    ],
  },
  {
    id: "admin-knowledge",
    title: "KNOWLEDGE",
    icon: "BookOpen",
    items: [
      {
        title: "Knowledge Analytics",
        href: "/admin/knowledge/analytics",
        icon: "BarChart3",
      },
      {
        title: "Categories",
        href: "/admin/knowledge/categories",
        icon: "FolderOpen",
      },
      {
        title: "Sources",
        href: "/admin/knowledge/sources",
        icon: "Database",
      },
      {
        title: "Files",
        href: "/admin/knowledge/files",
        icon: "FileText",
      },
      {
        title: "Sync Status",
        href: "/admin/knowledge/sync-status",
        icon: "RefreshCw",
      },
      {
        title: "Common Knowledge",
        href: "/admin/knowledge/common",
        icon: "Globe",
      },
      {
        title: "Embeddings",
        href: "/admin/knowledge/embeddings",
        icon: "Brain",
      },
      {
        title: "Gemini RAG",
        href: "/admin/knowledge/gemini",
        icon: "Sparkles",
      },
      {
        title: "Memory Analytics",
        href: "/admin/knowledge/memory-analytics",
        icon: "Brain",
      },
    ],
  },
  {
    id: "content-feedback",
    title: "CONTENT & FEEDBACK",
    icon: "MessageSquare",
    items: [
      {
        title: "Feedback Management",
        href: "/admin/feedback",
        icon: "MessageSquare",
      },
    ],
  },
  {
    id: "ai-automation",
    title: "AI & AUTOMATION",
    icon: "Brain",
    items: [
      {
        title: "AI Models",
        href: "/admin/ai-models",
        icon: "Brain",
      },
      {
        title: "AI Usage Analytics",
        href: "/admin/ai-usage",
        icon: "BarChart",
      },
      {
        title: "MCP Servers",
        href: "/admin/mcp-servers",
        icon: "Plug",
      },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    icon: "Settings",
    items: [
      {
        title: "System Settings",
        href: "/admin/settings",
        icon: "Settings",
      },
      {
        title: "Integrations",
        href: "/admin/integrations",
        icon: "Zap",
      },
      {
        title: "Vision & Roadmap",
        href: "/admin/roadmap",
        icon: "Rocket",
      },
      {
        title: "Seed Data Runner",
        href: "/admin/roadmap/seed",
        icon: "Database",
      },
      {
        title: "Deployment Status",
        href: "/admin/deployment",
        icon: "Database",
      },
      {
        title: "Environment Check",
        href: "/admin/environment",
        icon: "CheckCircle2",
      },
    ],
  },
];
