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
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Main application navigation (user sidebar)
 */
export const mainNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
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
    title: "Meetings",
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
    title: "Tasks",
    href: "/tasks",
    icon: "CheckSquare",
    module: "actions",
    featureFlag: "enableTasks",
  },
  {
    title: "Streams",
    href: "/tasks/streams",
    icon: "GitBranch",
    module: "actions",
    featureFlag: "enableTasks",
  },
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
    title: "Feedback",
    href: "/feedback",
    icon: "MessageSquare",
    featureFlag: "enableFeedback",
  },
  {
    title: "EOS",
    href: "/eos",
    icon: "Target",
    module: "eos",
  },
  {
    title: "OKRs",
    href: "/okrs",
    icon: "Crosshair",
    module: "eos",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: "FolderKanban",
    module: "projects",
  },
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
    title: "Personal Knowledge",
    href: "/personal-knowledge",
    icon: "Brain",
  },
];

/**
 * Admin panel navigation (admin sidebar)
 */
export const adminNavigation: NavGroup[] = [
{
    title: "DASHBOARD",
    items: [
      {
        title: "Overview",
        href: "/admin",
        icon: "LayoutDashboard",
      },
    ],
  },
  {
    title: "USERS & ACCESS",
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
    title: "TEAM & RESOURCES",
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
        title: "Meeting Analytics",
        href: "/admin/meeting-analytics",
        icon: "Calendar",
      },
    ],
  },
  {
    title: "KNOWLEDGE",
    items: [
      {
        title: "Knowledge Analytics",
        href: "/admin/knowledge/analytics",
        icon: "BarChart3",
      },
      {
        title: "Knowledge Categories",
        href: "/admin/knowledge/categories",
        icon: "FolderOpen",
      },
      {
        title: "Embeddings Explorer",
        href: "/admin/knowledge/embeddings",
        icon: "Brain",
      },
    ],
  },
  {
    title: "CONTENT & FEEDBACK",
    items: [
      {
        title: "Feedback Management",
        href: "/admin/feedback",
        icon: "MessageSquare",
      },
    ],
  },
  {
    title: "AI & AUTOMATION",
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
    title: "SYSTEM",
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
