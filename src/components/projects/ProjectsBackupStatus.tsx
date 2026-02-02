import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * ProjectsBackupStatus (skeleton)
 *
 * Simple placeholder component for showing project backup status, inspired by
 * sj-control-main. Not wired to `project_backups` yet.
 */
export function ProjectsBackupStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Backup Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <Alert>
          <AlertDescription>
            This component is a shell for future project backup/restore features. When
            you add <code>project_backups</code> and related Edge Functions, you can
            surface the latest backup timestamp, backup count, and quick actions here.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

