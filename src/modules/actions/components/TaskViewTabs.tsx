import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TaskView, TaskStats } from "../types/tasks";

interface TaskViewTabsProps {
  currentView: TaskView;
  onViewChange: (view: TaskView) => void;
  stats?: TaskStats;
}

const views: { value: TaskView; label: string; statsKey?: keyof TaskStats }[] = [
  { value: "all", label: "All Tasks", statsKey: "total" },
  { value: "my_tasks", label: "My Tasks" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "overdue", label: "Overdue", statsKey: "overdue" },
  { value: "delegated", label: "Delegated" },
];

export function TaskViewTabs({ currentView, onViewChange, stats }: TaskViewTabsProps) {
  return (
    <div className="flex items-center gap-1 border-b">
      {views.map((view) => {
        const isActive = currentView === view.value;
        const count = view.statsKey && stats ? stats[view.statsKey] : undefined;
        const isOverdueWithItems = view.value === "overdue" && count && count > 0;

        return (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {view.label}
            {count !== undefined && count > 0 && (
              <Badge
                variant={isOverdueWithItems ? "destructive" : "secondary"}
                className="h-5 min-w-[20px] px-1.5 text-[10px]"
              >
                {count}
              </Badge>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
