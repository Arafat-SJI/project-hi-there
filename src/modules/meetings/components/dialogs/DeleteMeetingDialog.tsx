/**
 * Delete Meeting Dialog
 *
 * Confirmation dialog for deleting a meeting. If the meeting is recurring,
 * provides options to delete just this meeting or the entire series.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteMeetingDialogProps {
  meetingId: string;
  isRecurring?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

type DeleteScope = "single" | "series";

export default function DeleteMeetingDialog({
  meetingId,
  isRecurring,
  open,
  onOpenChange,
  onDeleted,
}: DeleteMeetingDialogProps) {
  const queryClient = useQueryClient();
  const [deleteScope, setDeleteScope] = useState<DeleteScope>("single");

  const deleteMeeting = useMutation({
    mutationFn: async () => {
      if (isRecurring && deleteScope === "series") {
        // First get the parent_meeting_id to find all related meetings
        const { data: meeting, error: fetchError } = await supabase
          .from("meetings")
          .select("parent_meeting_id")
          .eq("id", meetingId)
          .single();

        if (fetchError) throw fetchError;

        const parentId = meeting?.parent_meeting_id || meetingId;

        // Delete all meetings in the series
        const { error: deleteChildrenError } = await supabase
          .from("meetings")
          .delete()
          .eq("parent_meeting_id", parentId);

        if (deleteChildrenError) throw deleteChildrenError;

        // Delete the parent meeting itself
        const { error: deleteParentError } = await supabase
          .from("meetings")
          .delete()
          .eq("id", parentId);

        if (deleteParentError) throw deleteParentError;
      } else {
        const { error } = await supabase
          .from("meetings")
          .delete()
          .eq("id", meetingId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        deleteScope === "series" ? "Meeting series deleted" : "Meeting deleted"
      );
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error: Error) => {
      toast.error("Failed to delete meeting", { description: error.message });
    },
  });

  const handleDelete = () => {
    deleteMeeting.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Meeting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this meeting? This action cannot be undone.
          </p>

          {isRecurring && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                This meeting is part of a recurring series.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    deleteScope === "single"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setDeleteScope("single")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        deleteScope === "single"
                          ? "border-primary"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {deleteScope === "single" && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">This meeting only</p>
                      <p className="text-xs text-muted-foreground">
                        Only this occurrence will be removed.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    deleteScope === "series"
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                  onClick={() => setDeleteScope("series")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        deleteScope === "series"
                          ? "border-destructive"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {deleteScope === "series" && (
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Entire series</p>
                      <p className="text-xs text-muted-foreground">
                        All meetings in this series will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMeeting.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMeeting.isPending}
          >
            {deleteMeeting.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {deleteMeeting.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
