/**
 * RPTeamSettings - Main admin page for managing RP teams
 * Route: /admin/team/employee_projection
 */
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, Users, Eye, EyeOff } from "lucide-react";
import { useRPTeams } from "@/hooks/admin/useRPTeamSettings";
import { RPTeamTable } from "@/components/admin/rpSettings/RPTeamTable";
import { CreateTeamDialog } from "@/components/admin/rpSettings/CreateTeamDialog";
import { EditTeamDialog } from "@/components/admin/rpSettings/EditTeamDialog";
import type { RPTeamWithMembers } from "@/hooks/admin/useRPTeamSettings";

export default function RPTeamSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<RPTeamWithMembers | null>(null);

  const { data: teams = [], isLoading } = useRPTeams();

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;

    const query = searchQuery.toLowerCase();
    return teams.filter(
      (team) =>
        team.name.toLowerCase().includes(query) ||
        (team.description || "").toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const visibleTeams = teams.filter((t) => t.show_in_resource_projection);
    const totalRPMembers = visibleTeams.reduce((sum, team) => sum + team.memberCount, 0);
    const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0);

    return {
      totalTeams: teams.length,
      visibleInRP: visibleTeams.length,
      totalRPMembers: totalRPMembers,
      totalMembers: totalMembers,
    };
  }, [teams]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RP Settings</h1>
          <p className="text-muted-foreground">
            Manage teams that appear in the Resource Projection module
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Teams
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalTeams}</p>
            <p className="text-xs text-muted-foreground">All active teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Eye className="h-4 w-4" />
              Visible in RP
            </div>
            <p className="text-2xl font-bold mt-1">{stats.visibleInRP}</p>
            <p className="text-xs text-muted-foreground">
              {stats.totalTeams - stats.visibleInRP} hidden
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total RP Members
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalRPMembers}</p>
            <p className="text-xs text-muted-foreground">Members in visible teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Members
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Across all teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Teams Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <RPTeamTable
          teams={filteredTeams}
          onEdit={(team) => setEditingTeam(team)}
        />
      )}

      {/* Dialogs */}
      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditTeamDialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
        team={editingTeam}
      />
    </div>
  );
}

