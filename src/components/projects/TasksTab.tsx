import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * TasksTab (skeleton)
 *
 * Placeholder for a future project-scoped Tasks view (and external PM sync),
 * modeled after sj-control-main's TasksTab. Not wired to any data yet.
 */
interface TasksTabProps {
  projectId: string;
  projectSlug: string;
}

export function TasksTab({ projectId, projectSlug }: TasksTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription>
            This is a structural placeholder for project tasks (internal tasks or synced
            from tools like ActiveCollab/Jira). Use <code>projectId</code> (
            <span className="font-mono">{projectId}</span>) and slug (
            <span className="font-mono">{projectSlug}</span>) to load and display
            tasks when your task schema and integrations are ready.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

