import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBranding } from "@/contexts/BrandingContext";
import { useIntegrationStatus } from "@/hooks/useIntegrationStatus";
import { adminNavigation, type NavGroup } from "@/shared/data/navigationStructure";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Settings,
  Zap,
  Database,
  ArrowLeft,
  CheckCircle2,
  Brain,
  BarChart,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Plug,
  Rocket,
  ClipboardList,
  Building2,
  Calendar,
  BarChart3,
  FolderOpen,
  Upload,
  GitBranch,
  Target,
  Crosshair,
  Layers,
  FileText,
  Network,
  Bot,
  Search,
  BookOpen,
  Globe,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// Icon resolver: maps string names from navigation data to actual components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Shield,
  Activity,
  Settings,
  Zap,
  Database,
  CheckCircle2,
  Brain,
  BarChart,
  MessageSquare,
  Plug,
  Rocket,
  ClipboardList,
  Building2,
  Calendar,
  BarChart3,
  FolderOpen,
  Upload,
  GitBranch,
  Target,
  Crosshair,
  Layers,
  FileText,
  Network,
  Bot,
  Search,
  BookOpen,
  Globe,
  RefreshCw,
  Sparkles,
};

function resolveIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || LayoutDashboard;
}

export function AdminSidebar() {
  const location = useLocation();
  const { companyName } = useBranding();
  const { status: integrationStatus } = useIntegrationStatus();

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Initialize expanded state based on active route
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    adminNavigation.forEach((group) => {
      const hasActiveItem = group.items.some((item) => location.pathname === item.href);
      initialExpanded[group.title] = hasActiveItem || group.title === "PEOPLE & PERFORMANCE";
    });
    setExpandedGroups(initialExpanded);
  }, []);

  // Update expanded state when route changes
  useEffect(() => {
    adminNavigation.forEach((group) => {
      const hasActiveItem = group.items.some(
        (item) =>
          location.pathname === item.href ||
          (item.children?.some(
            (c) => location.pathname === c.href || location.pathname.startsWith(c.href + "/")
          ))
      );
      if (hasActiveItem) {
        setExpandedGroups((prev) => ({ ...prev, [group.title]: true }));
      }
      group.items.forEach((item) => {
        if (item.children?.length) {
          const hasActiveChild = item.children.some(
            (c) => location.pathname === c.href || location.pathname.startsWith(c.href + "/")
          );
          if (hasActiveChild) {
            setExpandedItems((prev) => ({ ...prev, [`${group.title}-${item.title}`]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  const toggleItem = (itemKey: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar-background">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive shadow-sm">
              <Shield className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Admin Panel
              </span>
              <span className="text-xs text-muted-foreground">
                {companyName}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {adminNavigation.map((group: NavGroup) => {
              const isExpanded = expandedGroups[group.title] ?? true;

              return (
                <Collapsible
                  key={group.title}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.title)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-sidebar-foreground transition-colors">
                    <span>{group.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {group.items.map((item) => {
                      const hasChildren = item.children && item.children.length > 0;
                      const isHeaderOnly = item.headerOnly && hasChildren;
                      const itemKey = `${group.title}-${item.title}`;
                      const hasActiveChild = hasChildren && item.children!.some((c) => location.pathname === c.href || location.pathname.startsWith(c.href + "/"));
                      const isItemExpanded = expandedItems[itemKey] ?? hasActiveChild ?? false;

                      if (isHeaderOnly) {
                        return (
                          <Collapsible
                            key={itemKey}
                            open={isItemExpanded}
                            onOpenChange={() => toggleItem(itemKey)}
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const Icon = resolveIcon(item.icon);
                                  return (
                                    <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                                  );
                                })()}
                                <span>{item.title}</span>
                              </div>
                              {isItemExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-0.5 space-y-0.5 pl-3">
                              {(() => {
                                const path = location.pathname;
                                const normalizedPath = path.replace(/\/$/, "") || "/";
                                const matching = item.children!.filter(
                                  (c) => {
                                    const h = c.href.startsWith("/") ? c.href : `/${c.href}`;
                                    return normalizedPath === h || normalizedPath.startsWith(h + "/");
                                  }
                                );
                                const bestMatchHref =
                                  matching.length > 0
                                    ? matching.reduce(
                                        (best, c) => {
                                          const h = c.href.startsWith("/") ? c.href : `/${c.href}`;
                                          return h.length > best.length ? h : best;
                                        },
                                        matching[0].href.startsWith("/") ? matching[0].href : `/${matching[0].href}`
                                      )
                                    : "";
                                const firstMatchIndex =
                                  bestMatchHref
                                    ? item.children!.findIndex(
                                        (c) =>
                                          (c.href.startsWith("/") ? c.href : `/${c.href}`) === bestMatchHref
                                      )
                                    : -1;
                                return item.children!.map((child, index) => {
                                  const ChildIcon = resolveIcon(child.icon);
                                  const childHref = child.href.startsWith("/") ? child.href : `/${child.href}`;
                                  const matchesPath = normalizedPath === childHref || normalizedPath.startsWith(childHref + "/");
                                  const isChildActive =
                                    matchesPath &&
                                    (firstMatchIndex < 0 || index === firstMatchIndex);
                                return (
                                  <Link
                                    key={`${group.id}-${item.title}-${child.title}`}
                                    to={childHref}
                                    className={cn(
                                      "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-150",
                                      isChildActive
                                        ? "border-l-2 border-primary bg-primary/10 font-medium text-primary"
                                        : "border-l-2 border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                  >
                                    <ChildIcon className="h-[14px] w-[14px] shrink-0" />
                                    <span>{child.title}</span>
                                  </Link>
                                );
                                });
                              })()}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }

                      const Icon = resolveIcon(item.icon);
                      const isActive = location.pathname === item.href;
                      const isIntegrations = item.href === '/admin/integrations';

                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                            )}
                          />
                          <span className="flex-1">{item.title}</span>
                          {isIntegrations && integrationStatus && integrationStatus.connected > 0 && (
                            <Badge
                              variant={isActive ? "secondary" : "default"}
                              className="h-5 min-w-[20px] px-1.5 text-xs"
                            >
                              {integrationStatus.connected}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </nav>

        {/* Footer - Back to Dashboard */}
        <div className="border-t border-sidebar-border p-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-4 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
