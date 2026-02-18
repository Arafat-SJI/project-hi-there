/**
 * EditTeamDialog - Dialog to edit team details, add/remove members
 */
import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, X, AlertTriangle } from "lucide-react";
import {
  useUpdateRPTeam,
  useRemoveRPTeamMember,
  useBulkAddRPTeamMembers,
  useCheckTeamNameExists,
  useTeamActiveAllocations,
  type RPTeamWithMembers,
} from "@/hooks/admin/useRPTeamSettings";
import { TeamMemberSelector } from "./TeamMemberSelector";
import { AllocationWarningDialog } from "./AllocationWarningDialog";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: RPTeamWithMembers | null;
}

export function EditTeamDialog({ open, onOpenChange, team }: EditTeamDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showInRP, setShowInRP] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);

  const updateTeam = useUpdateRPTeam();
  const removeMember = useRemoveRPTeamMember();
  const addMembers = useBulkAddRPTeamMembers();
  const checkNameExists = useCheckTeamNameExists();
  const { data: allocations = [] } = useTeamActiveAllocations(team?.id);

  // Initialize form when team changes
  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || "");
      setShowInRP(team.show_in_resource_projection);
      setNameError(null);
    }
  }, [team]);

  const handleNameBlur = async () => {
    if (!name.trim()) {
      setNameError("Team name is required");
      return;
    }

    if (name.trim() === team?.name) {
      setNameError(null);
      return;
    }

    setIsCheckingName(true);
    try {
      const exists = await checkNameExists.mutateAsync({
        name: name.trim(),
        excludeId: team?.id,
      });
      if (exists) {
        setNameError("A team with this name already exists");
      } else {
        setNameError(null);
      }
    } catch (error) {
      setNameError(null);
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleToggleVisibility = (newValue: boolean) => {
    if (!newValue && allocations.length > 0) {
      // Show warning before hiding
      setPendingAction(() => () => {
        updateTeam.mutate({
          id: team!.id,
          show_in_resource_projection: false,
        });
        setShowInRP(false);
        setPendingAction(null);
      });
      setWarningDialogOpen(true);
    } else {
      setShowInRP(newValue);
      updateTeam.mutate({
        id: team!.id,
        show_in_resource_projection: newValue,
      });
    }
  };

  const handleRemoveMember = (membershipId: string) => {
    if (allocations.length > 0) {
      setPendingAction(() => () => {
        removeMember.mutate(membershipId);
        setPendingAction(null);
      });
      setWarningDialogOpen(true);
    } else {
      removeMember.mutate(membershipId);
    }
  };

  const handleAddMembers = (employeeIds: string[]) => {
    if (employeeIds.length === 0) return;

    if (allocations.length > 0) {
      setPendingAction(() => () => {
        addMembers.mutate({
          podId: team!.id,
          employeeIds,
        });
        setPendingAction(null);
      });
      setWarningDialogOpen(true);
    } else {
      addMembers.mutate({
        podId: team!.id,
        employeeIds,
      });
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

    updateTeam.mutate(
      {
        id: team!.id,
        name: name.trim(),
        description: description.trim() || undefined,
        show_in_resource_projection: showInRP,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!updateTeam.isPending && !removeMember.isPending && !addMembers.isPending) {
      onOpenChange(false);
    }
  };

  const currentMemberIds = team?.members.map((m) => m.employee_id) || [];

  if (!team) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update team details and manage members.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {allocations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This team has {allocations.length} active allocation{allocations.length !== 1 ? "s" : ""} in Resource Projection.
                    Changes may affect existing allocations.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onBlur={handleNameBlur}
                  placeholder="Enter team name"
                  disabled={updateTeam.isPending || isCheckingName}
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
                <Label htmlFor="edit-description">Team Details</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  disabled={updateTeam.isPending}
                />
              </div>

              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="edit-showInRP" className="text-base">
                    Show in Resource Projection
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, this team will appear in the Resource Projection module
                  </p>
                </div>
                <Switch
                  id="edit-showInRP"
                  checked={showInRP}
                  onCheckedChange={handleToggleVisibility}
                  disabled={updateTeam.isPending}
                />
              </div>

              <div className="space-y-3">
                <Label>Current Members</Label>
                {team.members.length > 0 ? (
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.Employee.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.Employee.email}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {member.Employee.department && (
                              <Badge variant="outline" className="text-xs">
                                {member.Employee.department}
                              </Badge>
                            )}
                            {member.is_primary && (
                              <Badge variant="secondary" className="text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-2"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMember.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Add Members</Label>
                <TeamMemberSelector
                  selectedIds={[]}
                  onChange={handleAddMembers}
                  disabled={addMembers.isPending}
                  excludeIds={currentMemberIds}
                  mode="add"
                />
                <p className="text-xs text-muted-foreground">
                  Select employees to add to this team.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateTeam.isPending || removeMember.isPending || addMembers.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTeam.isPending || !!nameError || !name.trim()}
              >
                {updateTeam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AllocationWarningDialog
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        onConfirm={() => {
          if (pendingAction) {
            pendingAction();
          }
          setWarningDialogOpen(false);
        }}
        allocationCount={allocations.length}
      />
    </>
  );
}

