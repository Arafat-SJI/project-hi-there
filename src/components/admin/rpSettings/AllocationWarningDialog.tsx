/**
 * AllocationWarningDialog - Warns about active allocations before destructive actions
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AllocationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  allocationCount: number;
}

export function AllocationWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  allocationCount,
}: AllocationWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Active Allocations Detected</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This team has <strong>{allocationCount}</strong> active resource allocation{allocationCount !== 1 ? "s" : ""} in the Resource Projection module.
            </p>
            <p className="text-sm text-muted-foreground">
              Making this change may affect:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Active project resource allocations</li>
              <li>Resource projection filters and views</li>
              <li>Team assignment options in planning tools</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Note:</strong> Historical data will be preserved, but future allocations may be impacted.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

