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

/**
 * ProjectsRestoreBackupDialog (skeleton)
 *
 * Placeholder dialog for restoring a project from a backup snapshot, based on
 * sj-control-main's ProjectsRestoreBackupDialog. No restore logic yet.
 */
interface ProjectsRestoreBackupDialogProps {
  projectId: string;
}

export function ProjectsRestoreBackupDialog({
  projectId,
}: ProjectsRestoreBackupDialogProps) {
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
            This dialog is a structural placeholder. Connect it to a restore
            Edge Function and <code>project_backups</code> before using it in
            production. Project ID:{" "}
            <span className="font-mono break-all">{projectId}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled>Restore (not implemented)</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

