import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProjectTask } from "@/modules/projects/hooks/useProjectTasks";

/**
 * TasksTab – project-scoped tasks (internal or synced from ActiveCollab/Jira).
 * Accepts optional tasks; when provided, shows a list. Otherwise shows placeholder.
 */
interface TasksTabProps {
  projectId: string;
  projectSlug: string;
  tasks?: ProjectTask[];
  isLoading?: boolean;
}

const statusLabel: Record<ProjectTask["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export function TasksTab({ projectId, projectSlug, tasks = [], isLoading }: TasksTabProps) {
  const hasTasks = tasks.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading tasks…</p>
          )}
          {!isLoading && hasTasks && (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className={t.status === "done" ? "text-muted-foreground line-through" : ""}>
                    {t.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {t.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    )}
                    <Badge variant="outline">{statusLabel[t.status]}</Badge>
                    {t.source && t.source !== "internal" && (
                      <Badge variant="secondary" className="text-xs">
                        {t.source}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && !hasTasks && (
            <Alert>
              <AlertDescription>
                No tasks yet. Tasks can be added manually or synced from ActiveCollab/Jira
                when those integrations are connected for project{" "}
                <span className="font-mono">{projectSlug}</span>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
