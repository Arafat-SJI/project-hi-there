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
export type AgencyRole = "owner" | "pm" | "ic";

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
          { title: "Lead", href: "/deals?tab=all&stage=lead", icon: "Users", module: "business-dev", featureFlag: "enableClients" },
          { title: "Discovery", href: "/deals?tab=all&stage=discovery", icon: "Search", module: "business-dev", featureFlag: "enableClients" },
          { title: "Estimation", href: "/deals?tab=all&stage=estimation", icon: "Calculator", module: "business-dev", featureFlag: "enableClients" },
          { title: "Proposal", href: "/deals?tab=all&stage=proposal", icon: "FileText", module: "business-dev", featureFlag: "enableClients" },
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
  {
    id: "system-tools",
    title: "System & Tools",
    icon: "Wrench",
    items: [
      {
        title: "Sessions",
        href: "/sessions",
        icon: "Monitor",
      },
      {
        title: "Feedback",
        href: "/feedback",
        icon: "MessageCircle",
        featureFlag: "enableFeedback",
      },
      {
        title: "Help & Guides",
        href: "/help",
        icon: "HelpCircle",
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
        title: "Employee Management",
        href: "/admin/team/employees",
        icon: "Users",
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
      {
        title: "Teams & PODs",
        href: "/admin/team/pods",
        icon: "Layers",
        headerOnly: true,
        children: [
          {
            title: "POD Management",
            href: "/admin/team/pods",
            icon: "Users",
          },
          {
            title: "Skill Management",
            href: "/admin/skillmanagement",
            icon: "Zap",
          },
          {
            title: "RP Settings",
            href: "/admin/team/employee_projection",
            icon: "Settings",
          },
        ],
      },
    ],
  },
  {
    id: "knowledge-ai",
    title: "KNOWLEDGE & AI",
    icon: "Brain",
    items: [
      {
        title: "AI Hub",
        href: "/admin/ai-usage",
        icon: "Brain",
        headerOnly: true,
        children: [
          { title: "Dashboard", href: "/admin/ai", icon: "LayoutDashboard" },
          { title: "AI Agents", href: "/admin/ai/agents", icon: "Bot" },
          { title: "Agent Analytics", href: "/admin/ai/agent-analytics", icon: "BarChart3" },
          { title: "Agent Categories", href: "/admin/ai/agent-categories", icon: "FolderOpen" },
          { title: "Prompt Templates", href: "/admin/ai/prompt-templates", icon: "FileText" },
          { title: "Email Drafting", href: "/admin/ai/email-drafting", icon: "MessageSquare" },
          { title: "Deal Coaching", href: "/admin/ai/deal-coaching", icon: "Target" },
        ],
      },
      {
        title: "Semantic Search",
        href: "/admin/ai/semantic-search",
        icon: "Search",
        headerOnly: true,
        children: [
          { title: "Search", href: "/admin/ai/semantic-search", icon: "Search" },
          { title: "Embeddings", href: "/admin/ai/embeddings", icon: "Brain" },
        ],
      },
      {
        title: "User Memory",
        href: "/admin/memory/dashboard",
        icon: "Brain",
        headerOnly: true,
        children: [
          { title: "Memory Dashboard", href: "/admin/memory/dashboard", icon: "LayoutDashboard" },
          { title: "User Memory Stats", href: "/admin/memory/user-stats", icon: "BarChart3" },
          { title: "Search Analytics", href: "/admin/memory/search", icon: "BarChart3" },
          { title: "Team Learning Patterns", href: "/admin/memory/team-learning-patterns", icon: "Users" },
        ],
      },
      {
        title: "Knowledge Base",
        href: "/admin/knowledge/common",
        icon: "BookOpen",
        headerOnly: true,
        children: [
          { title: "Common Knowledge", href: "/admin/knowledge/common", icon: "Globe" },
          { title: "Processing Queue", href: "/admin/knowledge/analytics", icon: "ClipboardList" },
          { title: "Sources", href: "/admin/knowledge/sources", icon: "Database" },
          { title: "Categories", href: "/admin/knowledge/categories", icon: "FolderOpen" },
          { title: "Batch Upload", href: "/admin/knowledge/files", icon: "Upload" },
          { title: "Files", href: "/admin/knowledge/files", icon: "FileText" },
          { title: "Sync Status", href: "/admin/knowledge/sync-status", icon: "RefreshCw" },
          { title: "Gemini RAG", href: "/admin/knowledge/gemini", icon: "Sparkles" },
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
