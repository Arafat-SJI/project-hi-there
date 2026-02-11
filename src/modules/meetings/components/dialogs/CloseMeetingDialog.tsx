/**
 * Close Meeting Dialog
 *
 * Confirmation dialog for closing/completing a meeting with optional closing notes.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CloseMeetingDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CloseMeetingDialog({
  meetingId,
  open,
  onOpenChange,
}: CloseMeetingDialogProps) {
  const queryClient = useQueryClient();
  const [closingNotes, setClosingNotes] = useState("");

  const closeMeeting = useMutation({
    mutationFn: async () => {
      const updatePayload: Record<string, unknown> = {
        status: "completed",
        closed_at: new Date().toISOString(),
      };

      if (closingNotes.trim()) {
        updatePayload.notes = closingNotes.trim();
      }

      const { error } = await supabase
        .from("meetings")
        .update(updatePayload)
        .eq("id", meetingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meeting closed");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      setClosingNotes("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to close meeting", { description: error.message });
    },
  });

  const handleClose = () => {
    closeMeeting.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to close this meeting? This will mark it as completed.
          </p>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Closing Notes (optional)
            </label>
            <Textarea
              placeholder="Add any final notes or summary..."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closeMeeting.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClose}
            disabled={closeMeeting.isPending}
          >
            {closeMeeting.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            {closeMeeting.isPending ? "Closing..." : "Close Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
