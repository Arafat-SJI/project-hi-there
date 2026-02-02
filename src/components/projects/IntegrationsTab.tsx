import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProjectIntegration } from "@/modules/projects/hooks/useProjectIntegrations";

/**
 * IntegrationsTab – project-level integrations (ActiveCollab, Slack, etc.).
 * Accepts optional integrations; when provided, shows status list. Otherwise placeholder.
 */
interface IntegrationsTabProps {
  projectId: string;
  projectName: string;
  integrations?: ProjectIntegration[];
  isLoading?: boolean;
}

export function IntegrationsTab({
  projectId,
  projectName,
  integrations = [],
  isLoading,
}: IntegrationsTabProps) {
  const hasIntegrations = integrations.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading integrations…</p>
          )}
          {!isLoading && hasIntegrations && (
            <ul className="space-y-2">
              {integrations.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{i.name}</span>
                  <div className="flex items-center gap-2">
                    {i.last_sync_at && (
                      <span className="text-xs text-muted-foreground">
                        Synced {new Date(i.last_sync_at).toLocaleString()}
                      </span>
                    )}
                    <Badge variant={i.connected ? "default" : "secondary"}>
                      {i.connected ? "Connected" : "Not connected"}
                    </Badge>
                    {!i.connected && (
                      <Button variant="outline" size="sm" disabled>
                        Connect
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && !hasIntegrations && (
            <Alert>
              <AlertDescription>
                No integration slots configured yet. This tab will show ActiveCollab,
                Slack, Google Calendar, and weekly AI updates for{" "}
                <span className="font-medium">{projectName}</span> (
                <span className="font-mono">{projectId}</span>) once you wire them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
