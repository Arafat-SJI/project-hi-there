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

/**
 * Agency roles that can see a nav item or group.
 * When omitted the item is visible to all roles.
 */
export type AgencyRole = "owner" | "pm" | "ic" | "bd";

export interface NavItem {
  title: string;
  href: string;
  icon: string; // lucide icon name — resolved in the sidebar component
  module?: ModuleId; // Module that must be enabled for this item to appear
  featureFlag?: string; // Legacy feature flag check
  adminOnly?: boolean;
  badge?: string;
  children?: NavItem[]; // Nested sub-items (e.g., Streams under Tasks)
  /** When true, parent is rendered as a section header only (collapsible), not a link; children are the links */
  headerOnly?: boolean;
  /** When set, only these agency roles see the item. Admins always see everything. */
  agencyRoles?: AgencyRole[];
  /** When true, only visible if user.isEosUser === true */
  eosOnly?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: string;
  isAI?: boolean; // Shows AI indicator animation
  module?: ModuleId;
  featureFlag?: string;
  items: NavItem[];
  /** When set, only these agency roles see the group. Admins always see everything. */
  agencyRoles?: AgencyRole[];
  /** When true, only visible if user.isEosUser === true */
  eosOnly?: boolean;
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
    title: "Sales Hub",
    icon: "Briefcase",
    module: "business-dev",
    items: [
      {
        title: "Companies",
        href: "/clients",
        icon: "Building2",
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
        title: "Business Opportunities",
        href: "/deals",
        icon: "Handshake",
        module: "business-dev",
        featureFlag: "enableClients",
        headerOnly: true,
        children: [
          { title: "Deals Dashboard", href: "/deals?tab=overview", icon: "LayoutDashboard", module: "business-dev", featureFlag: "enableClients" },
          { title: "All Deals", href: "/deals", icon: "LayoutDashboard", module: "business-dev", featureFlag: "enableClients" },
        ],
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
        title: "All Meetings",
        href: "/meetings/schedule",
        icon: "Calendar",
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
        title: "Series",
        href: "/meetings/series",
        icon: "Repeat",
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
        agencyRoles: ["owner"],
      },
    ],
  },
  {
    id: "ai-browse",
    title: "AI Agents",
    icon: "Sparkles",
    isAI: true,
    items: [
      {
        title: "Browse Agents",
        href: "/agents",
        icon: "Bot",
        featureFlag: "enableAIAgents",
      },
      {
        title: "My AI Chat",
        href: "/ai-agents",
        icon: "MessageSquare",
        featureFlag: "enableAIAgents",
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
    eosOnly: true, // Only shown to EOS-enabled users
    agencyRoles: ["owner"],
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
    agencyRoles: ["owner", "pm"], // ICs don't need operations
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
    title: "PEOPLE & PERFORMANCE",
    icon: "LayoutDashboard",
    items: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        icon: "LayoutDashboard",
      },
      {
        title: "POD Management",
        href: "/admin/pods",
        icon: "Layers",
      },
      {
        title: "Task Configuration",
        href: "/admin/tasks/streams",
        icon: "Settings",
        headerOnly: true,
        children: [
          {
            title: "Task Streams",
            href: "/admin/tasks/streams",
            icon: "GitBranch",
          },
        ],
      },
      {
        title: "OKR & Scorecards",
        href: "/admin/eos/scorecards",
        icon: "Target",
        headerOnly: true,
        children: [
          {
            title: "Scorecard Settings",
            href: "/admin/eos/scorecards",
            icon: "BarChart3",
          },
        ],
      },
      {
        title: "Accountability",
        href: "/admin/eos/accountability",
        icon: "Shield",
        headerOnly: true,
        children: [
          {
            title: "Chart Management",
            href: "/admin/eos/accountability",
            icon: "Network",
          },
          {
            title: "V/TO Settings",
            href: "/admin/eos/vto",
            icon: "FileText",
          },
        ],
      },
    ],
  },
  {
    id: "ai-agents",
    title: "AI AGENTS",
    icon: "Bot",
    isAI: true,
    items: [
      {
        title: "Agents",
        href: "/admin/ai/agents",
        icon: "Bot",
        headerOnly: true,
        children: [
          { title: "Manage Agents", href: "/admin/ai/agents", icon: "Bot" },
          { title: "Agent Categories", href: "/admin/ai/agent-categories", icon: "FolderOpen" },
          { title: "Prompt Templates", href: "/admin/ai/prompt-templates", icon: "FileText" },
        ],
      },
      { title: "Deal Coaching", href: "/admin/ai/deal-coaching", icon: "Target" },
      { title: "Email Drafting", href: "/admin/ai/email-drafting", icon: "MessageSquare" },
      { title: "Analytics", href: "/admin/ai/analytics", icon: "BarChart3" },
    ],
  },
  {
    id: "ai-hub",
    title: "AI HUB",
    icon: "Brain",
    isAI: true,
    items: [
      { title: "AI Models", href: "/admin/ai-models", icon: "Cpu" },
      { title: "Knowledge Search", href: "/admin/ai-hub/knowledge-search", icon: "Search" },
      { title: "Memory", href: "/admin/ai-hub/memory", icon: "Database" },
      { title: "Memory Admin", href: "/admin/memory/admin", icon: "Shield" },
    ],
  },
  {
    id: "knowledge-base",
    title: "KNOWLEDGE BASE",
    icon: "BookOpen",
    items: [
      {
        title: "Knowledge Base",
        href: "/admin/knowledge/dashboard",
        icon: "BookOpen",
        headerOnly: true,
        children: [
          { title: "Dashboard", href: "/admin/knowledge/dashboard", icon: "LayoutDashboard" },
          { title: "Source Config", href: "/admin/knowledge/source-config", icon: "Settings" },
          { title: "Playground", href: "/admin/knowledge/playground", icon: "FlaskConical" },
          { title: "Permissions", href: "/admin/knowledge/permissions", icon: "Shield" },
          { title: "Categories", href: "/admin/knowledge/categories", icon: "FolderOpen" },
          { title: "Files", href: "/admin/knowledge/files", icon: "FileText" },
        ],
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
        title: "Departments",
        href: "/admin/department",
        icon: "Building2",
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
        title: "Departments",
        href: "/admin/team/departments",
        icon: "Building2",
      },
    ],
  },
  {
    id: "general",
    title: "GENERAL",
    icon: "LayoutGrid",
    items: [
      {
        title: "Feedback",
        href: "/admin/feedback",
        icon: "MessageSquare",
      },
      {
        title: "Meeting Analytics",
        href: "/admin/meeting-analytics",
        icon: "Calendar",
      },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    icon: "Settings",
    items: [
      {
        title: "Settings",
        href: "/admin/settings/branding",
        icon: "Settings",
        headerOnly: true,
        children: [
          {
            title: "Branding",
            href: "/admin/settings/branding",
            icon: "Palette",
          },
          {
            title: "Workspace",
            href: "/admin/settings/workspace",
            icon: "Layers",
          },
          {
            title: "Security",
            href: "/admin/settings/security",
            icon: "Shield",
          },
          {
            title: "Notifications",
            href: "/admin/settings/notifications",
            icon: "Mail",
          },
          {
            title: "Advanced",
            href: "/admin/settings/advanced",
            icon: "Zap",
          },
        ],
      },
      {
        title: "Integrations",
        href: "/admin/integrations",
        icon: "Zap",
      },
      {
        title: "MCP Servers",
        href: "/admin/mcp-servers",
        icon: "Plug",
      },
    ],
  },
];
