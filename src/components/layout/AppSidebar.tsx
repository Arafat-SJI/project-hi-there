import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useModuleAccess } from "@/shared/hooks/useModuleAccess";
import {
  dashboardItem,
  navigationGroups,
  type NavItem,
  type NavGroup,
} from "@/shared/data/navigationStructure";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AIIndicator } from "@/components/ui/ai-indicator";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  BookOpen,
  BookMarked,
  Brain,
  Bot,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  MessageCircle,
  Target,
  FolderKanban,
  BarChart3,
  GitBranch,
  Crosshair,
  Eye,
  AlertCircle,
  Repeat,
  Handshake,
  Contact,
  FileText,
  Briefcase,
  ListTodo,
  Settings2,
  Sparkles,
  ScrollText,
  Network,
  type LucideIcon,
} from "lucide-react";

// Icon resolver: maps string names from navigation data to actual components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  BookOpen,
  BookMarked,
  Brain,
  Bot,
  MessageSquare,
  MessageCircle,
  Target,
  FolderKanban,
  BarChart3,
  GitBranch,
  Crosshair,
  Eye,
  AlertCircle,
  Repeat,
  Handshake,
  Contact,
  FileText,
  Briefcase,
  ListTodo,
  Settings2,
  Sparkles,
  ScrollText,
  Network,
};

function resolveIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutDashboard;
}

// Local storage key for expanded groups
const EXPANDED_GROUPS_KEY = "sidebar-expanded-groups";

export function AppSidebar() {
  const location = useLocation();
  const { profile } = useAuth();
  const { companyName } = useBranding();
  const { isFeatureEnabled } = useFeatureFlags();
  const { hasModule } = useModuleAccess();

  // Track expanded groups with localStorage persistence
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_GROUPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default: all groups expanded
    return navigationGroups.reduce((acc, group) => {
      acc[group.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
  });

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  // Filter items based on role, feature flags, and module access
  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag as any)) return false;
    if (item.module && !hasModule(item.module)) return false;
    return true;
  };

  // Filter groups - show if at least one item is visible
  const isGroupVisible = (group: NavGroup): boolean => {
    if (group.module && !hasModule(group.module)) {
      // Check if any item in the group is visible despite group module
      const hasVisibleItem = group.items.some((item) => isItemVisible(item));
      if (!hasVisibleItem) return false;
    }
    if (group.featureFlag && !isFeatureEnabled(group.featureFlag as any)) return false;
    return group.items.some((item) => isItemVisible(item));
  };

  // Check if route is active
  const isRouteActive = (href: string): boolean => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  // Check if any item in group is active (to keep group highlighted)
  const isGroupActive = (group: NavGroup): boolean => {
    return group.items.some(
      (item) =>
        isRouteActive(item.href) ||
        item.children?.some((child) => isRouteActive(child.href))
    );
  };

  // Filter visible groups
  const visibleGroups = navigationGroups.filter(isGroupVisible);

  // Dashboard item visibility
  const DashboardIcon = resolveIcon(dashboardItem.icon);
  const isDashboardActive = isRouteActive(dashboardItem.href);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Control Tower
              </span>
              <span className="text-xs text-muted-foreground">{companyName}</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {/* Dashboard - Always at top */}
          <div className="mb-4">
            <Link
              to={dashboardItem.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isDashboardActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <DashboardIcon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isDashboardActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
              />
              <span className="flex-1">{dashboardItem.title}</span>
              {isDashboardActive && (
                <ChevronRight className="h-4 w-4 text-primary-foreground/70" />
              )}
            </Link>
          </div>

          {/* Grouped Navigation */}
          <div className="space-y-2">
            {visibleGroups.map((group) => {
              const GroupIcon = resolveIcon(group.icon);
              const isExpanded = expandedGroups[group.id] ?? true;
              const groupActive = isGroupActive(group);

              return (
                <Collapsible
                  key={group.id}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <CollapsibleTrigger
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      groupActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-sidebar-foreground"
                    )}
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span className="flex-1 text-left">{group.title}</span>
                    {group.isAI && <AIIndicator variant="dot" size="sm" />}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
                    {group.items.filter(isItemVisible).map((item) => {
                      const Icon = resolveIcon(item.icon);
                      const isActive = isRouteActive(item.href);
                      const hasChildren =
                        item.children && item.children.filter(isItemVisible).length > 0;

                      return (
                        <div key={item.href}>
                          <Link
                            to={item.href}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-[16px] w-[16px] shrink-0",
                                isActive
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                              )}
                            />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  isActive
                                    ? "bg-primary-foreground/20 text-primary-foreground"
                                    : "bg-primary/10 text-primary"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isActive && !hasChildren && (
                              <ChevronRight className="h-4 w-4 text-primary-foreground/70" />
                            )}
                          </Link>

                          {/* Nested children (e.g., Streams under Tasks) */}
                          {hasChildren && (
                            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                              {item.children!.filter(isItemVisible).map((child) => {
                                const ChildIcon = resolveIcon(child.icon);
                                const isChildActive = isRouteActive(child.href);

                                return (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    className={cn(
                                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-150",
                                      isChildActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                  >
                                    <ChildIcon className="h-[14px] w-[14px] shrink-0" />
                                    <span>{child.title}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 px-4 py-3">
            <p className="text-sm font-medium text-sidebar-foreground">Framework</p>
            <p className="text-xs text-muted-foreground">v1.0.0 - Enterprise</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
