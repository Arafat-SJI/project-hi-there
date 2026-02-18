/**
 * CreateTeamDialog - Dialog to create a new team with member selection
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useCreateRPTeam, useCheckTeamNameExists } from "@/hooks/admin/useRPTeamSettings";
import { TeamMemberSelector } from "./TeamMemberSelector";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showInRP, setShowInRP] = useState(true);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);

  const createTeam = useCreateRPTeam();
  const checkNameExists = useCheckTeamNameExists();

  const handleNameBlur = async () => {
    if (!name.trim()) {
      setNameError("Team name is required");
      return;
    }

    setIsCheckingName(true);
    try {
      const exists = await checkNameExists.mutateAsync({ name: name.trim() });
      if (exists) {
        setNameError("A team with this name already exists");
      } else {
        setNameError(null);
      }
    } catch (error) {
      // Ignore errors during validation
      setNameError(null);
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError("Team name is required");
      return;
    }

    if (nameError) {
      return;
    }

    createTeam.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        show_in_resource_projection: showInRP,
        memberIds: memberIds.length > 0 ? memberIds : undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setName("");
          setDescription("");
          setShowInRP(true);
          setMemberIds([]);
          setNameError(null);
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!createTeam.isPending) {
      setName("");
      setDescription("");
      setShowInRP(true);
      setMemberIds([]);
      setNameError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team that will appear in the Resource Projection module.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                onBlur={handleNameBlur}
                placeholder="Enter team name"
                disabled={createTeam.isPending || isCheckingName}
                className={nameError ? "border-destructive" : ""}
              />
              {isCheckingName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking name...
                </p>
              )}
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Team Details</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                disabled={createTeam.isPending}
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="showInRP" className="text-base">
                  Show in Resource Projection
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, this team will appear in the Resource Projection module
                </p>
              </div>
              <Switch
                id="showInRP"
                checked={showInRP}
                onCheckedChange={setShowInRP}
                disabled={createTeam.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Team Members</Label>
              <TeamMemberSelector
                selectedIds={memberIds}
                onChange={setMemberIds}
                disabled={createTeam.isPending}
                mode="multi"
              />
              <p className="text-xs text-muted-foreground">
                Select employees who belong to this team. You can add more later.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTeam.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending || !!nameError || !name.trim()}>
              {createTeam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

