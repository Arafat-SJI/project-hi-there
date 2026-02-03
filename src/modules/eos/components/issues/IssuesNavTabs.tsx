/**
 * Issues Navigation Tabs
 *
 * Provides navigation between different issue views (All, Solved, Archived, Anonymous, AI, Pod Overview).
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  List,
  CheckCircle2,
  Archive,
  EyeOff,
  Bot,
  Users,
} from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
}

const navTabs: NavTab[] = [
  {
    label: "All Issues",
    href: "/eos/issues/all",
    icon: List,
    matchPaths: ["/eos/issues/all", "/eos/issues"],
  },
  {
    label: "Solved",
    href: "/eos/issues/solved",
    icon: CheckCircle2,
  },
  {
    label: "Archived",
    href: "/eos/issues/archived",
    icon: Archive,
  },
  {
    label: "Anonymous",
    href: "/eos/issues/anonymous",
    icon: EyeOff,
  },
  {
    label: "AI Suggestions",
    href: "/eos/issues/ai",
    icon: Bot,
  },
  {
    label: "By Pod",
    href: "/eos/issues/pod-overview",
    icon: Users,
  },
];

export function IssuesNavTabs() {
  const location = useLocation();

  const isActive = (tab: NavTab) => {
    if (tab.matchPaths) {
      return tab.matchPaths.some((path) => location.pathname === path);
    }
    return location.pathname === tab.href;
  };

  return (
    <div className="flex items-center gap-1 flex-wrap border-b pb-3 mb-4">
      {navTabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
