import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useModuleAccess } from "@/shared/hooks/useModuleAccess";
import { useAgencyRole } from "@/hooks/useAgencyRole";
import { useDealPipelineStats } from "@/modules/business-dev/hooks/useDeals";
import {
  dashboardItem,
  navigationGroups,
  type NavItem,
  type NavGroup,
  type AgencyRole,
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
  Search,
  Calculator,
  CheckCircle,
  PanelLeft,
  Wrench,
  Monitor,
  HelpCircle,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  Search,
  Calculator,
  CheckCircle,
  Wrench,
  Monitor,
  HelpCircle,
};

function resolveIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutDashboard;
}

// Local storage key for expanded groups and header-only sections
const EXPANDED_GROUPS_KEY = "sidebar-expanded-groups";
const EXPANDED_SECTIONS_KEY = "sidebar-expanded-sections";

interface AppSidebarProps {
  open?: boolean;
  onToggleSidebar?: () => void;
}

export function AppSidebar({ open = true, onToggleSidebar }: AppSidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { companyName } = useBranding();
  const { isFeatureEnabled } = useFeatureFlags();
  const { hasModule } = useModuleAccess();
  const { agencyRole, isEosUser, isAdmin } = useAgencyRole();
  const { data: dealStats } = useDealPipelineStats();
  const dealStageCounts = dealStats?.by_stage ?? {};

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

  // Track expanded state for header-only sections (e.g. Clients)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_SECTIONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(expandedGroups));
  }, [expandedGroups]);
  useEffect(() => {
    localStorage.setItem(EXPANDED_SECTIONS_KEY, JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Admins see all navigation regardless of agency role
  const currentAgencyRole = agencyRole as AgencyRole | null;

  // Filter items based on role, feature flags, module access, and agency role
  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag as any)) return false;
    if (item.module && !hasModule(item.module)) return false;
    // EOS-gated items only show when user has EOS enabled (admins bypass)
    if (item.eosOnly && !isEosUser && !isAdmin) return false;
    // Agency role filter: admins bypass, users without a role see all items
    if (item.agencyRoles && !isAdmin && currentAgencyRole) {
      if (!item.agencyRoles.includes(currentAgencyRole)) return false;
    }
    return true;
  };

  // Filter groups - show if at least one item is visible
  const isGroupVisible = (group: NavGroup): boolean => {
    // EOS-gated groups only show when user has EOS enabled (admins bypass)
    if (group.eosOnly && !isEosUser && !isAdmin) return false;
    // Agency role filter for groups: admins bypass
    if (group.agencyRoles && !isAdmin && currentAgencyRole) {
      if (!group.agencyRoles.includes(currentAgencyRole)) return false;
    }
    if (group.module && !hasModule(group.module)) {
      const hasVisibleItem = group.items.some((item) => isItemVisible(item));
      if (!hasVisibleItem) return false;
    }
    if (group.featureFlag && !isFeatureEnabled(group.featureFlag as any)) return false;
    return group.items.some((item) => isItemVisible(item));
  };

  // Check if route is active
  const isRouteActive = (href: string): boolean => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    const path = href.split("?")[0];
    if (location.pathname !== path && !location.pathname.startsWith(path + "/")) return false;
    if (href.includes("?")) {
      const params = new URLSearchParams(href.split("?")[1]);
      const current = new URLSearchParams(location.search);
      return Array.from(params.entries()).every(([k, v]) => current.get(k) === v);
    }
    // "/clients" (all) is active only when no status filter; otherwise "Active Clients" gets the highlight
    if (href === "/clients" && location.pathname === "/clients") {
      const status = new URLSearchParams(location.search).get("status");
      return status == null || status === "";
    }
    // "/deals" (All Deals) is active only when no tab or tab=all and no stage or stage=all; otherwise Deals Dashboard / stage links get the highlight
    if (href === "/deals" && location.pathname === "/deals") {
      const tab = new URLSearchParams(location.search).get("tab");
      const stage = new URLSearchParams(location.search).get("stage");
      const tabOk = tab == null || tab === "" || tab === "all";
      const stageOk = stage == null || stage === "" || stage === "all";
      return tabOk && stageOk;
    }
    return true;
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

  // Collapsed: flat list of dashboard + all visible items (icon-only)
  const collapsedNavItems = [
    { href: dashboardItem.href, icon: dashboardItem.icon, title: dashboardItem.title },
    ...visibleGroups.flatMap((g) =>
      g.items.filter(isItemVisible).map((item) => ({
        href: item.href,
        icon: item.icon,
        title: item.title,
      }))
    ),
  ];

  return (
    <>
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200 ease-in-out",
        open ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo + sidebar toggle (expanded) / Icon only (collapsed) */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border transition-[padding] duration-200",
            open ? "justify-between gap-2 px-6" : "flex-col justify-center gap-1 px-0"
          )}
        >
          {open ? (
            <>
              <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
                  <Brain className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-sm font-semibold text-sidebar-foreground truncate">
                    Control Tower
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{companyName}</span>
                </div>
              </Link>
              {onToggleSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={onToggleSidebar}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="flex h-10 w-full items-center justify-center rounded-none text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => onToggleSidebar?.()}
                title="Dashboard"
              >
                <Brain className="h-5 w-5 text-primary-foreground shrink-0 rounded-lg bg-primary p-1" />
              </Link>
              {onToggleSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={onToggleSidebar}
                  title="Expand sidebar"
                  aria-label="Expand sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        {open ? (
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
                      const isHeaderOnly = item.headerOnly && hasChildren;
                      const sectionKey = `section-${item.href}`;
                      const isSectionExpanded = isHeaderOnly
                        ? (expandedSections[sectionKey] ?? true)
                        : true;

                      // Header-only section: collapsible "Clients" header + sub-links; all 3 parts highlighted when section is active
                      if (isHeaderOnly) {
                        const sectionHasActiveChild = item.children?.some((c) => isRouteActive(c.href));
                        return (
                          <Collapsible
                            key={item.href}
                            open={isSectionExpanded}
                            onOpenChange={() => toggleSection(sectionKey)}
                          >
                            {/* Main header: solid blue + white text when section active (like "All Deals") */}
                            <CollapsibleTrigger
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                sectionHasActiveChild
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-[18px] w-[18px] shrink-0",
                                  sectionHasActiveChild ? "text-primary-foreground" : undefined
                                )}
                              />
                              <span className="flex-1 text-left">{item.title}</span>
                              {isSectionExpanded ? (
                                <ChevronDown className={cn("h-4 w-4 shrink-0", sectionHasActiveChild && "text-primary-foreground")} />
                              ) : (
                                <ChevronRight className={cn("h-4 w-4 shrink-0", sectionHasActiveChild && "text-primary-foreground")} />
                              )}
                            </CollapsibleTrigger>
                            {/* Sub-parts: same highlighting as Deals (e.g. Discovery) - solid blue bar, blue text, badge grey */}
                            <CollapsibleContent className="mt-0.5 space-y-0.5 pl-3">
                              {item.children!.filter(isItemVisible).map((child) => {
                                const ChildIcon = resolveIcon(child.icon);
                                const isChildActive = isRouteActive(child.href);
                                // Deals section: "All Deals" shows total count, stage links show stage count
                                const isDealsSection = item.href === "/deals";
                                const allDealsChild = isDealsSection && child.href === "/deals";
                                const stageMatch = isDealsSection && child.href.match(/stage=(\w+)/);
                                const stageCount = stageMatch ? (dealStageCounts as Record<string, { count: number; value: number }>)[stageMatch[1]]?.count : undefined;
                                const badge = allDealsChild
                                  ? (dealStats?.total_deals != null ? String(dealStats.total_deals) : child.badge)
                                  : (child.badge ?? (stageCount != null ? String(stageCount) : undefined));
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
                                    <ChildIcon
                                      className={cn(
                                        "h-[14px] w-[14px] shrink-0",
                                        isChildActive ? "text-primary" : "text-muted-foreground"
                                      )}
                                    />
                                    <span className="flex-1">{child.title}</span>
                                    {badge != null && (
                                      <span className="ml-auto text-xs text-muted-foreground">({badge})</span>
                                    )}
                                  </Link>
                                );
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }

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

                          {/* Nested children (e.g., Streams under Tasks, Deals stages) */}
                          {hasChildren && (
                            <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                              {item.children!.filter(isItemVisible).map((child) => {
                                const ChildIcon = resolveIcon(child.icon);
                                const isChildActive = isRouteActive(child.href);
                                const stageMatch = item.href === "/deals" && child.href.match(/stage=(\w+)/);
                                const stageCount = stageMatch ? (dealStageCounts as Record<string, { count: number; value: number }>)[stageMatch[1]]?.count : undefined;
                                const badge = child.badge ?? (stageCount != null ? String(stageCount) : undefined);

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
                                    {badge != null && (
                                      <span className="ml-auto text-xs text-muted-foreground">({badge})</span>
                                    )}
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
        ) : (
        /* Collapsed: icon-only nav */
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="flex flex-col items-center gap-0.5">
            {collapsedNavItems.map((item) => {
              const Icon = resolveIcon(item.icon);
              const isActive = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onToggleSidebar?.()}
                  title={item.title}
                  className={cn(
                    "flex h-10 w-full items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </Link>
              );
            })}
          </div>
        </nav>
        )}

        {/* Footer */}
        <div className={cn("border-t border-sidebar-border shrink-0", open ? "p-4" : "p-2")}>
          {open ? (
            <div className="rounded-lg bg-sidebar-accent/50 px-4 py-3">
              <p className="text-sm font-medium text-sidebar-foreground">Framework</p>
              <p className="text-xs text-muted-foreground">v1.0.0 - Enterprise</p>
            </div>
          ) : onToggleSidebar ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onToggleSidebar}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
    </>
  );
}
