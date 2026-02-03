import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * ProjectsRestoreBackupDialog
 *
 * Minimal restore dialog for selecting a backup snapshot for a single project
 * and invoking the `restore-project-backup` Edge Function. The Edge Function
 * itself must be deployed separately; this dialog will surface any errors.
 */
interface ProjectsRestoreBackupDialogProps {
  projectId: string;
  onRestored?: () => void;
}

export function ProjectsRestoreBackupDialog({
  projectId,
  onRestored,
}: ProjectsRestoreBackupDialogProps) {
  const { toast } = useToast();
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["project-backups", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_backups")
        .select("id, backup_type, status, created_at, notes")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const backups = data || [];

  async function handleRestore() {
    if (!selectedBackupId) return;
    setIsRestoring(true);
    try {
      const { error } = await supabase.functions.invoke("restore-project-backup", {
        body: { backup_id: selectedBackupId },
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Restore started",
        description:
          "The restore-project-backup function was invoked. Monitor logs for completion details.",
      });
      if (onRestored) onRestored();
    } catch (err: any) {
      toast({
        title: "Failed to restore project",
        description: err?.message || "Unknown error when calling restore-project-backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Restore from backup
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore project from backup?</AlertDialogTitle>
          <AlertDialogDescription>
            Select a backup snapshot for this project and trigger the{" "}
            <code>restore-project-backup</code> Edge Function. The function must be
            deployed in Supabase for restore to succeed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Project ID:{" "}
            <span className="font-mono break-all">{projectId}</span>
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>

          {isLoading && (
            <p className="text-xs text-muted-foreground">Loading backups…</p>
          )}

          {error && (
            <p className="text-xs text-red-500">
              Failed to load backups: {error.message}
            </p>
          )}

          {!isLoading && !error && backups.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No backups found for this project yet. Create backups from a server-side
              job or Edge Function that inserts rows into <code>project_backups</code>.
            </p>
          )}

          {!isLoading && !error && backups.length > 0 && (
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border px-3 py-2">
              {backups.map((b) => (
                <label
                  key={b.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 hover:bg-muted"
                >
                  <input
                    type="radio"
                    name="backup"
                    className="mt-1"
                    value={b.id}
                    checked={selectedBackupId === b.id}
                    onChange={() => setSelectedBackupId(b.id)}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-foreground">
                        {new Date(b.created_at).toLocaleString()}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        {b.backup_type || "manual"}
                      </span>
                      <span className="rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        {b.status || "completed"}
                      </span>
                    </div>
                    {b.notes && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {b.notes}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!selectedBackupId || isRestoring || backups.length === 0}
            onClick={handleRestore}
          >
            {isRestoring ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Restoring…
              </span>
            ) : (
              "Restore selected backup"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

