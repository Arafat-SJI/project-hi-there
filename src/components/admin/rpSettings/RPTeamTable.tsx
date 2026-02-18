/**
 * RPTeamTable - Table with visibility toggle, member preview, actions
 */
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Eye, EyeOff, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RPTeamWithMembers } from "@/hooks/admin/useRPTeamSettings";
import { useUpdateRPTeam, useDeleteRPTeam } from "@/hooks/admin/useRPTeamSettings";

interface RPTeamTableProps {
  teams: RPTeamWithMembers[];
  onEdit: (team: RPTeamWithMembers) => void;
}

function MemberPreview({ members }: { members: RPTeamWithMembers["members"] }) {
  const visibleMembers = members.slice(0, 4);
  const remainingCount = members.length - 4;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (members.length === 0) {
    return <span className="text-sm text-muted-foreground">No members</span>;
  }

  return (
    <div className="flex items-center -space-x-2">
      <TooltipProvider>
        {visibleMembers.map((member) => (
          <Tooltip key={member.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
                <AvatarFallback className="text-xs">
                  {getInitials(member.Employee.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{member.Employee.name}</p>
              <p className="text-xs text-muted-foreground">{member.Employee.email}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background cursor-pointer bg-muted">
                <AvatarFallback className="text-xs">+{remainingCount}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">+{remainingCount} more</p>
                {members.slice(4).map((member) => (
                  <p key={member.id} className="text-xs">
                    {member.Employee.name}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}

export function RPTeamTable({ teams, onEdit }: RPTeamTableProps) {
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const updateTeam = useUpdateRPTeam();
  const deleteTeam = useDeleteRPTeam();

  const handleToggleVisibility = (team: RPTeamWithMembers) => {
    updateTeam.mutate({
      id: team.id,
      show_in_resource_projection: !team.show_in_resource_projection,
    });
  };

  const handleDelete = () => {
    if (deletingTeamId) {
      deleteTeam.mutate(deletingTeamId, {
        onSuccess: () => {
          setDeletingTeamId(null);
        },
      });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Team Details</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Team Members</TableHead>
              <TableHead>Visible in RP</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow
                  key={team.id}
                  className={cn(
                    !team.show_in_resource_projection && "opacity-60 bg-muted/30"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: team.color || "#3b82f6" }}
                      />
                      <span className="font-medium">{team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.description ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-muted-foreground line-clamp-1 cursor-help">
                              {team.description}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{team.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{team.memberCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <MemberPreview members={team.members} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(team)}
                      disabled={updateTeam.isPending}
                      className="h-8"
                    >
                      {team.show_in_resource_projection ? (
                        <>
                          <Eye className="h-4 w-4 mr-2 text-green-600" />
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Visible
                          </Badge>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            Hidden
                          </Badge>
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(team)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingTeamId(team.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingTeamId} onOpenChange={(open) => !open && setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
              The team will be marked as inactive and hidden from the Resource Projection module.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

