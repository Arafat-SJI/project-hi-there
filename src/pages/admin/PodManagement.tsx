/**
 * POD Management — Admin page for managing PODs (teams) and their members.
 * Route: /admin/team/pods
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  Users,
  UserCheck,
  UserX,
  Layers,
  BarChart3,
  RefreshCw,
  Plus,
  MoreVertical,
  BarChart2,
  EyeOff,
} from "lucide-react";
import { usePodsManagement, useInvalidatePodsManagement } from "@/hooks/usePodsManagement";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const POD_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#a855f7", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
];

export default function PodManagement() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createColor, setCreateColor] = useState(POD_COLORS[0].value);
  const [creating, setCreating] = useState(false);
  const invalidate = useInvalidatePodsManagement();

  const { data, isLoading, refetch, isFetching } = usePodsManagement(search);
  const { pods = [], stats } = data ?? { pods: [], stats: { totalPods: 0, hrSynced: 0, rpMembers: 0, hasLogin: 0, noProfile: 0 } };

  const handleSyncHr = () => {
    toast.info("HR sync is read-only. Use your HR integration or import to update member data.");
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Refreshed");
  };

  const handleCreatePod = async () => {
    const name = createName.trim();
    if (!name) {
      toast.error("POD name is required");
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from("pods").insert({
        name,
        description: createDescription.trim() || null,
        is_active: true,
        color: createColor,
      } as Record<string, unknown>);
      if (error) throw error;
      toast.success("POD created");
      setCreateOpen(false);
      setCreateName("");
      setCreateDescription("");
      setCreateColor(POD_COLORS[0].value);
      invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create POD");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">POD Management</h1>
        <p className="text-muted-foreground">Manage PODs (teams) and their members</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span className="text-sm">Total PODs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalPods}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">HR Synced</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.hrSynced}</p>
            <p className="text-xs text-muted-foreground">Read-only</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">RP Members</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.rpMembers}</p>
            <p className="text-xs text-muted-foreground">In projections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm">Has Login</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.hasLogin}</p>
            <p className="text-xs text-muted-foreground">With profile</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserX className="h-4 w-4" />
              <span className="text-sm">No Profile</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.noProfile}</p>
            <p className="text-xs text-muted-foreground">Pending login</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PODs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSyncHr}>
          <Users className="h-4 w-4 mr-2" />
          Sync HR Data
        </Button>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create POD
        </Button>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POD Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>HR Synced</TableHead>
                <TableHead>RP Members</TableHead>
                <TableHead>Resource Projection</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pods.map((pod) => (
                <TableRow key={pod.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full shrink-0",
                          pod.is_active !== false ? "bg-primary/20" : "bg-muted"
                        )}
                      />
                      <span className="font-medium">{pod.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {pod.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      {pod.hr_synced}
                    </Badge>
                  </TableCell>
                  <TableCell>{pod.rp_members}</TableCell>
                  <TableCell>
                    {pod.show_in_projection ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1">
                        <BarChart2 className="h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(pod.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info("Edit POD — coming soon")}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info("Manage members — use Employee Projection")}>
                          Manage members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && pods.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">No PODs found</p>
            <p className="text-sm">Create a POD or adjust your search.</p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create POD
            </Button>
          </div>
        )}
      </Card>

      {/* Create New POD dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New POD</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new team (POD). Configure details, members, and permissions.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="members">Members (0)</TabsTrigger>
              <TabsTrigger value="permissions">Permissions (0)</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="pod-name">
                  POD Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pod-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Enter POD name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pod-desc">Description</Label>
                <Textarea
                  id="pod-desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="resize-y"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {POD_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      aria-label={c.label}
                      onClick={() => setCreateColor(c.value)}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition-shadow focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        createColor === c.value
                          ? "border-foreground shadow-md ring-2 ring-offset-2 ring-primary"
                          : "border-transparent hover:border-muted-foreground/50"
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="members" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Add members after creating the POD from Employee Projection or POD settings.
              </p>
            </TabsContent>
            <TabsContent value="permissions" className="pt-4">
              <p className="text-sm text-muted-foreground">
                Configure permissions after creating the POD.
              </p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePod} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create POD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
