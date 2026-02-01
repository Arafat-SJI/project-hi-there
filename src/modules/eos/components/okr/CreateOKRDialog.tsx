/**
 * Create OKR Dialog
 *
 * Dialog for creating a new OKR with basic fields.
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
import { useCreateOKR } from "../../hooks/useOKRs";

interface CreateOKRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

const quarters = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const results: string[] = [];
  for (let y = year; y <= year + 1; y++) {
    for (let q = 1; q <= 4; q++) {
      results.push(`Q${q} ${y}`);
    }
  }
  return results;
})();

export function CreateOKRDialog({ open, onOpenChange }: CreateOKRDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quarter, setQuarter] = useState(getCurrentQuarter());
  const createOKR = useCreateOKR();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createOKR.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      quarter,
    });

    setTitle("");
    setDescription("");
    setQuarter(getCurrentQuarter());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create OKR</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Objective</Label>
            <Input
              id="title"
              placeholder="What do you want to achieve?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional context (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quarter">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOKR.isPending || !title.trim()}>
              {createOKR.isPending ? "Creating..." : "Create OKR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
