/**
 * Check-In Dialog
 *
 * Dialog for recording a check-in on a key result.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCheckIn } from "../../hooks/useOKRs";
import type { OKRKeyResult } from "../../types";

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult: OKRKeyResult;
  okrId: string;
}

export function CheckInDialog({ open, onOpenChange, keyResult, okrId }: CheckInDialogProps) {
  const [newValue, setNewValue] = useState(String(keyResult.current_value));
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");
  const checkIn = useCheckIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;

    await checkIn.mutateAsync({
      okr_id: okrId,
      key_result_id: keyResult.id,
      previous_value: keyResult.current_value,
      new_value: numValue,
      confidence,
      notes: notes.trim() || undefined,
    });

    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check-In: {keyResult.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Current: {keyResult.current_value}{keyResult.unit}</span>
            <span>·</span>
            <span>Target: {keyResult.target_value}{keyResult.unit}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newValue">New Value</Label>
            <Input
              id="newValue"
              type="number"
              step="any"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence</Label>
            <Select value={confidence} onValueChange={(v) => setConfidence(v as typeof confidence)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any updates or blockers?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={checkIn.isPending}>
              {checkIn.isPending ? "Saving..." : "Record Check-In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
