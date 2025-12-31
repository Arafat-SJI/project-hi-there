import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Brain,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    title: "Meetings",
    href: "/meetings",
    icon: Calendar,
  },
  {
    title: "Knowledge Base",
    href: "/knowledge",
    icon: BookOpen,
  },
  {
    title: "AI Chat",
    href: "/ai",
    icon: Brain,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

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
              <span className="text-sm font-semibold text-sidebar-foreground">Control Tower</span>
              <span className="text-xs text-muted-foreground">CollabAi</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href ||
                             location.pathname.startsWith(item.href + "/");

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
                  <Icon className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                  )} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      isActive 
                        ? "bg-primary-foreground/20 text-primary-foreground" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary-foreground/70" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 px-4 py-3">
            <p className="text-sm font-medium text-sidebar-foreground">Framework</p>
            <p className="text-xs text-muted-foreground">v1.0.0 • Enterprise</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
