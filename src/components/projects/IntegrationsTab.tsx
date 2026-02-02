import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * IntegrationsTab (skeleton)
 *
 * Placeholder tab for project-level integrations (ActiveCollab, Slack,
 * Google Calendar, weekly updates, etc.), modeled after sj-control-main.
 */
interface IntegrationsTabProps {
  projectId: string;
  projectName: string;
}

export function IntegrationsTab({ projectId, projectName }: IntegrationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription>
            This tab is reserved for project-specific integrations (e.g. ActiveCollab
            connection, Slack notifications, Google Calendar, weekly AI updates) for{" "}
            <span className="font-medium">{projectName}</span> (
            <span className="font-mono">{projectId}</span>). Implement the cards and
            controls you need here when those integrations are configured.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

