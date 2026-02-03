import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ProjectBackupRow {
  id: string;
  project_id: string;
  backup_type: string | null;
  status: string | null;
  created_at: string;
}

export function ProjectsBackupStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["project-backups-summary"],
    queryFn: async (): Promise<ProjectBackupRow[]> => {
      const { data, error } = await supabase
        .from("project_backups")
        .select("id, project_id, backup_type, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectBackupRow[];
    },
  });

  const backups = data || [];
  const totalBackups = backups.length;
  const latest = backups[0] ?? null;
  const projectsWithBackups = new Set(backups.map((b) => b.project_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project backup status</CardTitle>
        <CardDescription>
          Snapshot of backups created via the <code>project_backups</code> table.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading backup information…</span>
          </div>
        )}

        {error && (
          <Alert>
            <AlertDescription>
              Failed to load backup status:{" "}
              <span className="font-mono text-xs">{error.message}</span>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && totalBackups === 0 && (
          <Alert>
            <AlertDescription>
              No project backups have been created yet. You can create backups by
              inserting rows into <code>project_backups</code> (for example from an
              Edge Function) and they will appear here.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && totalBackups > 0 && latest && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>
                <span className="font-medium text-foreground">{totalBackups}</span>{" "}
                backups across{" "}
                <span className="font-medium text-foreground">
                  {projectsWithBackups.size}
                </span>{" "}
                project{projectsWithBackups.size === 1 ? "" : "s"}.
              </span>
              <Badge variant="outline" className="capitalize">
                Latest: {latest.status || "completed"}
              </Badge>
            </div>
            <p>
              Last backup was created{" "}
              <span className="font-medium text-foreground">
                {new Date(latest.created_at).toLocaleString()}
              </span>{" "}
              ({latest.backup_type || "manual"}).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

