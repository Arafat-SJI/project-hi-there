import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useBranding } from "@/contexts/BrandingContext";
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
} from "lucide-react";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminItems: SidebarItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Role Management",
    href: "/admin/roles",
    icon: Shield,
  },
  {
    title: "Activity Logs",
    href: "/admin/logs",
    icon: Activity,
  },
  {
    title: "System Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Integrations",
    href: "/admin/integrations",
    icon: Zap,
  },
  {
    title: "Deployment Status",
    href: "/admin/deployment",
    icon: Database,
  },
  {
    title: "Environment Check",
    href: "/admin/environment",
    icon: CheckCircle2,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { companyName, logoUrl } = useBranding();

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
          <div className="space-y-1">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

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
                </Link>
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
