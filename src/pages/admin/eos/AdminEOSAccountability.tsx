/**
 * EOS Accountability Admin — Manage accountability charts, responsibilities, and publishing.
 *
 * Allows admins to:
 * - View all chart versions with publish/archive
 * - Add/edit/delete responsibilities on the current chart
 * - Publish a draft chart as the current active chart
 * - Create new chart versions
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Network, CheckCircle2, Archive, Pencil, Trash2, UserPlus, ClipboardCheck } from "lucide-react";
import {
  useAccountabilityCharts,
  useAccountabilityChart,
  useCreateChart,
  useAddResponsibility,
} from "@/modules/eos/hooks/useAccountability";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AccountabilityChart, AccountabilityResponsibility, GWCAssessment } from "@/modules/eos/types";
import { ChartHistoryTimeline } from "@/modules/eos/components/accountability/ChartHistoryTimeline";
import { EmployeeAccountabilityModal } from "@/modules/eos/components/accountability/EmployeeAccountabilityModal";
import { GWCAssessmentDialog } from "@/modules/eos/components/accountability/GWCAssessmentDialog";

const ACCOUNTABILITY_KEY = "eos-accountability";

// ─── Admin mutations ─────────────────────────────────────────────────────────

function usePublishChart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (chartId: string) => {
      // Unset all current charts
      await supabase
        .from("accountability_charts")
        .update({ is_current: false })
        .eq("is_current", true);

      // Set the selected chart as current
      const { error } = await supabase
        .from("accountability_charts")
        .update({
          is_current: true,
          published_at: new Date().toISOString(),
          published_by: user!.id,
        })
        .eq("id", chartId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTABILITY_KEY] });
      toast.success("Chart published as current");
    },
    onError: (e: Error) => toast.error("Failed to publish chart", { description: e.message }),
  });
}

function useDeleteResponsibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Also remove references
      await supabase
        .from("accountability_responsibilities")
        .update({ reports_to: null })
        .eq("reports_to", id);

      const { error } = await supabase
        .from("accountability_responsibilities")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTABILITY_KEY] });
      toast.success("Role removed");
    },
    onError: (e: Error) => toast.error("Failed to remove role", { description: e.message }),
  });
}

function useUpdateResponsibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccountabilityResponsibility> }) => {
      const { error } = await supabase
        .from("accountability_responsibilities")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTABILITY_KEY] });
      toast.success("Role updated");
    },
    onError: (e: Error) => toast.error("Failed to update role", { description: e.message }),
  });
}

function useSaveGWCAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      responsibility_id: string;
      gets_it: boolean;
      wants_it: boolean;
      has_capacity: boolean;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("gwc_assessments")
        .upsert(
          { ...data, assessed_at: new Date().toISOString() },
          { onConflict: "responsibility_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTABILITY_KEY] });
      toast.success("GWC assessment saved");
    },
    onError: (e: Error) => toast.error("Failed to save assessment", { description: e.message }),
  });
}

interface RoleFormData {
  role_title: string;
  department: string;
  responsibilities: string;
}

const emptyRole: RoleFormData = { role_title: "", department: "", responsibilities: "" };

export default function AdminEOSAccountability() {
  const { data: charts, isLoading: chartsLoading } = useAccountabilityCharts();
  const { data: currentChart, isLoading: currentLoading } = useAccountabilityChart();
  const createChart = useCreateChart();
  const publishChart = usePublishChart();
  const addResponsibility = useAddResponsibility();
  const deleteResponsibility = useDeleteResponsibility();
  const updateResponsibility = useUpdateResponsibility();
  const saveGWCAssessment = useSaveGWCAssessment();

  const [chartDialog, setChartDialog] = useState(false);
  const [chartName, setChartName] = useState("");
  const [chartDesc, setChartDesc] = useState("");

  const [roleDialog, setRoleDialog] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormData>(emptyRole);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<string | null>(null);
  const [viewRoleId, setViewRoleId] = useState<string | null>(null);
  const [assessRoleId, setAssessRoleId] = useState<string | null>(null);

  const isLoading = chartsLoading || currentLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Flatten responsibilities for table display
  const flattenResponsibilities = (
    items: AccountabilityResponsibility[],
    depth = 0
  ): (AccountabilityResponsibility & { depth: number })[] => {
    const result: (AccountabilityResponsibility & { depth: number })[] = [];
    for (const item of items) {
      result.push({ ...item, depth });
      if (item.direct_reports && item.direct_reports.length > 0) {
        result.push(...flattenResponsibilities(item.direct_reports, depth + 1));
      }
    }
    return result;
  };

  const flatRoles = currentChart?.responsibilities
    ? flattenResponsibilities(currentChart.responsibilities)
    : [];

  const viewedRole = viewRoleId ? flatRoles.find((r) => r.id === viewRoleId) ?? null : null;
  const assessedRole = assessRoleId ? flatRoles.find((r) => r.id === assessRoleId) ?? null : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accountability Charts</h1>
          <p className="text-muted-foreground">
            Manage organizational accountability charts, roles, and reporting structure.
          </p>
        </div>
        <Button
          onClick={() => {
            setChartName("");
            setChartDesc("");
            setChartDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Chart Version
        </Button>
      </div>

      {/* Chart Versions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Chart Versions
          </CardTitle>
          <CardDescription>
            Each version is a snapshot. Only one can be the "current" published chart.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(charts || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No accountability charts. Create the first one.
                </TableCell>
              </TableRow>
            ) : (
              (charts || []).map((chart) => (
                <TableRow key={chart.id}>
                  <TableCell>
                    <Badge variant="outline">v{chart.version}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{chart.name}</TableCell>
                  <TableCell>
                    {chart.is_current ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Current
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {chart.published_at
                      ? new Date(chart.published_at).toLocaleDateString()
                      : "Not published"}
                  </TableCell>
                  <TableCell className="text-right">
                    {!chart.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPublishTarget(chart.id)}
                      >
                        <Archive className="h-4 w-4 mr-1" /> Publish
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Chart History Timeline */}
      {(charts || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Version Timeline</CardTitle>
            <CardDescription>
              Visual history of chart versions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartHistoryTimeline charts={charts || []} />
          </CardContent>
        </Card>
      )}

      {/* Current Chart Responsibilities */}
      {currentChart && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Current Chart: {currentChart.name} (v{currentChart.version})
                </CardTitle>
                <CardDescription>
                  {flatRoles.length} roles defined. Add or edit roles below.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setRoleForm(emptyRole);
                  setEditingRole(null);
                  setRoleDialog(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add Role
              </Button>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Responsibilities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No roles defined. Click "Add Role" to build the chart.
                  </TableCell>
                </TableRow>
              ) : (
                flatRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <span style={{ paddingLeft: `${role.depth * 24}px` }} className="font-medium flex items-center gap-1">
                        {role.depth > 0 && <span className="text-muted-foreground">└</span>}
                        <button
                          type="button"
                          className="hover:underline hover:text-primary text-left"
                          onClick={() => setViewRoleId(role.id)}
                        >
                          {role.role_title}
                        </button>
                      </span>
                    </TableCell>
                    <TableCell>
                      {role.department ? (
                        <Badge variant="secondary" className="text-xs">{role.department}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <span className="text-sm text-muted-foreground truncate block">
                        {role.responsibilities && role.responsibilities.length > 0
                          ? role.responsibilities.slice(0, 2).join(", ") + (role.responsibilities.length > 2 ? "…" : "")
                          : "No responsibilities listed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="GWC Assessment"
                          onClick={() => setAssessRoleId(role.id)}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleForm({
                              role_title: role.role_title,
                              department: role.department || "",
                              responsibilities: (role.responsibilities || []).join("\n"),
                            });
                            setEditingRole(role.id);
                            setRoleDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteRoleTarget(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* New Chart Dialog */}
      <Dialog open={chartDialog} onOpenChange={setChartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chart Version</DialogTitle>
            <DialogDescription>Create a new accountability chart. It starts as a draft until you publish it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={chartName} onChange={(e) => setChartName(e.target.value)} placeholder="e.g. Q1 2026 Org Chart" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={chartDesc} onChange={(e) => setChartDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChartDialog(false)}>Cancel</Button>
            <Button
              disabled={!chartName || createChart.isPending}
              onClick={() => createChart.mutate({ name: chartName, description: chartDesc }, { onSuccess: () => setChartDialog(false) })}
            >
              {createChart.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Role Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role Title</Label>
              <Input value={roleForm.role_title} onChange={(e) => setRoleForm({ ...roleForm, role_title: e.target.value })} placeholder="e.g. VP of Engineering" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={roleForm.department} onChange={(e) => setRoleForm({ ...roleForm, department: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div>
              <Label>Responsibilities (one per line)</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={roleForm.responsibilities}
                onChange={(e) => setRoleForm({ ...roleForm, responsibilities: e.target.value })}
                placeholder={"Lead team standups\nOwn sprint planning\nCode review accountability"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>Cancel</Button>
            <Button
              disabled={!roleForm.role_title || addResponsibility.isPending || updateResponsibility.isPending}
              onClick={() => {
                const responsibilitiesList = roleForm.responsibilities
                  .split("\n")
                  .map((r) => r.trim())
                  .filter(Boolean);

                if (editingRole) {
                  updateResponsibility.mutate(
                    {
                      id: editingRole,
                      data: {
                        role_title: roleForm.role_title,
                        department: roleForm.department || null,
                        responsibilities: responsibilitiesList,
                      },
                    },
                    { onSuccess: () => setRoleDialog(false) }
                  );
                } else if (currentChart) {
                  addResponsibility.mutate(
                    {
                      chart_id: currentChart.id,
                      role_title: roleForm.role_title,
                      department: roleForm.department || undefined,
                      responsibilities: responsibilitiesList,
                    },
                    { onSuccess: () => setRoleDialog(false) }
                  );
                }
              }}
            >
              {(addResponsibility.isPending || updateResponsibility.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirm */}
      <AlertDialog open={!!publishTarget} onOpenChange={() => setPublishTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this chart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set this chart as the current active version. The previous current chart will be archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (publishTarget) publishChart.mutate(publishTarget, { onSuccess: () => setPublishTarget(null) }); }}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Confirm */}
      <AlertDialog open={!!deleteRoleTarget} onOpenChange={() => setDeleteRoleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this role?</AlertDialogTitle>
            <AlertDialogDescription>
              Roles that report to this position will have their reporting line removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteRoleTarget) deleteResponsibility.mutate(deleteRoleTarget, { onSuccess: () => setDeleteRoleTarget(null) }); }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employee Accountability Modal */}
      {viewedRole && (
        <EmployeeAccountabilityModal
          responsibility={viewedRole}
          open={!!viewRoleId}
          onOpenChange={(open) => { if (!open) setViewRoleId(null); }}
        />
      )}

      {/* GWC Assessment Dialog */}
      {assessedRole && (
        <GWCAssessmentDialog
          responsibilityId={assessedRole.id}
          roleTitle={assessedRole.role_title}
          currentAssessment={assessedRole.gwc ?? null}
          open={!!assessRoleId}
          onOpenChange={(open) => { if (!open) setAssessRoleId(null); }}
          onSave={(data) => {
            saveGWCAssessment.mutate(data, {
              onSuccess: () => setAssessRoleId(null),
            });
          }}
          isSaving={saveGWCAssessment.isPending}
        />
      )}
    </div>
  );
}
