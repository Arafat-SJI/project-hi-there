/**
 * Scorecard Workspace — Admin CRUD for scorecards and their metrics.
 *
 * Allows admins to:
 * - Create / edit / delete / toggle scorecards
 * - Add / edit / delete / reorder metrics within a scorecard
 * - Set metric targets and goal direction
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Plus, Pencil, Trash2, BarChart3, Target } from "lucide-react";
import {
  useScorecards,
  useScorecardMetrics,
  useCreateScorecard,
  useAddMetric,
  useUpdateMetric,
} from "@/modules/eos/hooks/useScorecard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EOSScorecard, EOSScorecardMetric } from "@/modules/eos/types";

const SCORECARD_KEY = "eos-scorecards";

// ─── Admin-specific mutations ────────────────────────────────────────────────

function useUpdateScorecard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EOSScorecard> }) => {
      const { error } = await supabase
        .from("eos_scorecards")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORECARD_KEY] });
      toast.success("Scorecard updated");
    },
    onError: (e: Error) => toast.error("Failed to update scorecard", { description: e.message }),
  });
}

function useDeleteScorecard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete metrics first, then scorecard
      await supabase.from("eos_scorecard_metrics").delete().eq("scorecard_id", id);
      const { error } = await supabase.from("eos_scorecards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORECARD_KEY] });
      toast.success("Scorecard deleted");
    },
    onError: (e: Error) => toast.error("Failed to delete scorecard", { description: e.message }),
  });
}

function useDeleteMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("eos_scorecard_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SCORECARD_KEY] });
      toast.success("Metric deleted");
    },
    onError: (e: Error) => toast.error("Failed to delete metric", { description: e.message }),
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ScorecardFormData {
  name: string;
  description: string;
  frequency: string;
}

interface MetricFormData {
  name: string;
  description: string;
  metric_type: string;
  target_value: string;
  unit: string;
  goal_direction: string;
}

const emptyScorecard: ScorecardFormData = { name: "", description: "", frequency: "weekly" };
const emptyMetric: MetricFormData = {
  name: "",
  description: "",
  metric_type: "number",
  target_value: "",
  unit: "",
  goal_direction: "higher_is_better",
};

export default function ScorecardWorkspace() {
  const { data: scorecards, isLoading } = useScorecards();
  const createScorecard = useCreateScorecard();
  const updateScorecard = useUpdateScorecard();
  const deleteScorecard = useDeleteScorecard();
  const addMetric = useAddMetric();
  const updateMetric = useUpdateMetric();
  const deleteMetric = useDeleteMetric();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scDialog, setScDialog] = useState(false);
  const [scForm, setScForm] = useState<ScorecardFormData>(emptyScorecard);
  const [editingSc, setEditingSc] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [metricDialog, setMetricDialog] = useState(false);
  const [metricForm, setMetricForm] = useState<MetricFormData>(emptyMetric);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [deleteMetricTarget, setDeleteMetricTarget] = useState<string | null>(null);

  const selectedScorecard = selectedId || (scorecards && scorecards.length > 0 ? scorecards[0].id : null);
  const { data: metrics } = useScorecardMetrics(selectedScorecard || undefined);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onTrackCount = (metrics || []).filter((m) => m.status === "on_track").length;
  const offTrackCount = (metrics || []).filter((m) => m.status === "off_track").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scorecard Workspace</h1>
          <p className="text-muted-foreground">Create and manage EOS scorecards with their metrics.</p>
        </div>
        <Button
          onClick={() => {
            setScForm(emptyScorecard);
            setEditingSc(null);
            setScDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Scorecard
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Scorecards</p>
            <p className="text-2xl font-bold">{(scorecards || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Metrics</p>
            <p className="text-2xl font-bold">{(metrics || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">On Track</p>
            <p className="text-2xl font-bold text-green-600">{onTrackCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Off Track</p>
            <p className="text-2xl font-bold text-red-600">{offTrackCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Scorecard selector */}
      {(scorecards || []).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(scorecards || []).map((sc) => (
            <Button
              key={sc.id}
              variant={selectedScorecard === sc.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedId(sc.id)}
            >
              {sc.name}
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {sc.frequency}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Selected Scorecard Detail */}
      {selectedScorecard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {(scorecards || []).find((s) => s.id === selectedScorecard)?.name || "Scorecard"}
                </CardTitle>
                <CardDescription>
                  {(scorecards || []).find((s) => s.id === selectedScorecard)?.description || "No description"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sc = (scorecards || []).find((s) => s.id === selectedScorecard);
                    if (sc) {
                      setScForm({
                        name: sc.name,
                        description: sc.description || "",
                        frequency: sc.frequency,
                      });
                      setEditingSc(sc.id);
                      setScDialog(true);
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteTarget(selectedScorecard)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMetricForm(emptyMetric);
                    setEditingMetric(null);
                    setMetricDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Metric
                </Button>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(metrics || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No metrics yet. Click "Add Metric" to create the first one.
                  </TableCell>
                </TableRow>
              ) : (
                (metrics || []).map((m) => {
                  const pct = m.target_value ? Math.min(100, Math.round((m.current_value / m.target_value) * 100)) : 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{m.name}</span>
                          {m.description && (
                            <p className="text-xs text-muted-foreground">{m.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{m.metric_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.current_value}{m.unit ? ` ${m.unit}` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.target_value ?? "—"}{m.unit && m.target_value ? ` ${m.unit}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 w-16" />
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor:
                              m.status === "on_track" ? "#22c55e" : m.status === "off_track" ? "#ef4444" : "#f59e0b",
                            color:
                              m.status === "on_track" ? "#22c55e" : m.status === "off_track" ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {m.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMetricForm({
                                name: m.name,
                                description: m.description || "",
                                metric_type: m.metric_type,
                                target_value: String(m.target_value ?? ""),
                                unit: m.unit,
                                goal_direction: m.goal_direction,
                              });
                              setEditingMetric(m.id);
                              setMetricDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteMetricTarget(m.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {(scorecards || []).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Scorecards</h3>
            <p className="text-muted-foreground mb-4">
              Create your first scorecard to start tracking metrics.
            </p>
            <Button onClick={() => { setScForm(emptyScorecard); setEditingSc(null); setScDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Create Scorecard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scorecard Create/Edit Dialog */}
      <Dialog open={scDialog} onOpenChange={setScDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSc ? "Edit Scorecard" : "New Scorecard"}</DialogTitle>
            <DialogDescription>
              {editingSc ? "Update scorecard details." : "Create a new scorecard to track metrics."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={scForm.name} onChange={(e) => setScForm({ ...scForm, name: e.target.value })} placeholder="e.g. Weekly L10 Scorecard" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={scForm.description} onChange={(e) => setScForm({ ...scForm, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={scForm.frequency} onValueChange={(v) => setScForm({ ...scForm, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScDialog(false)}>Cancel</Button>
            <Button
              disabled={!scForm.name || createScorecard.isPending || updateScorecard.isPending}
              onClick={() => {
                if (editingSc) {
                  updateScorecard.mutate(
                    { id: editingSc, data: { name: scForm.name, description: scForm.description || null, frequency: scForm.frequency as any } },
                    { onSuccess: () => setScDialog(false) }
                  );
                } else {
                  createScorecard.mutate(
                    { name: scForm.name, description: scForm.description, frequency: scForm.frequency },
                    { onSuccess: () => setScDialog(false) }
                  );
                }
              }}
            >
              {(createScorecard.isPending || updateScorecard.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSc ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metric Create/Edit Dialog */}
      <Dialog open={metricDialog} onOpenChange={setMetricDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Edit Metric" : "Add Metric"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={metricForm.name} onChange={(e) => setMetricForm({ ...metricForm, name: e.target.value })} placeholder="e.g. Revenue" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={metricForm.description} onChange={(e) => setMetricForm({ ...metricForm, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={metricForm.metric_type} onValueChange={(v) => setMetricForm({ ...metricForm, metric_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={metricForm.unit} onChange={(e) => setMetricForm({ ...metricForm, unit: e.target.value })} placeholder="e.g. $, %, hrs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Value</Label>
                <Input type="number" value={metricForm.target_value} onChange={(e) => setMetricForm({ ...metricForm, target_value: e.target.value })} placeholder="e.g. 100" />
              </div>
              <div>
                <Label>Goal Direction</Label>
                <Select value={metricForm.goal_direction} onValueChange={(v) => setMetricForm({ ...metricForm, goal_direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="higher_is_better">Higher is Better</SelectItem>
                    <SelectItem value="lower_is_better">Lower is Better</SelectItem>
                    <SelectItem value="target">Hit Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricDialog(false)}>Cancel</Button>
            <Button
              disabled={!metricForm.name || addMetric.isPending || updateMetric.isPending}
              onClick={() => {
                if (editingMetric) {
                  updateMetric.mutate(
                    {
                      id: editingMetric,
                      data: {
                        name: metricForm.name,
                        description: metricForm.description || null,
                        metric_type: metricForm.metric_type as any,
                        target_value: metricForm.target_value ? parseFloat(metricForm.target_value) : null,
                        unit: metricForm.unit,
                        goal_direction: metricForm.goal_direction as any,
                      },
                    },
                    { onSuccess: () => setMetricDialog(false) }
                  );
                } else if (selectedScorecard) {
                  addMetric.mutate(
                    {
                      scorecard_id: selectedScorecard,
                      name: metricForm.name,
                      description: metricForm.description,
                      metric_type: metricForm.metric_type,
                      target_value: metricForm.target_value ? parseFloat(metricForm.target_value) : 0,
                      unit: metricForm.unit,
                      goal_direction: metricForm.goal_direction,
                    },
                    { onSuccess: () => setMetricDialog(false) }
                  );
                }
              }}
            >
              {(addMetric.isPending || updateMetric.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMetric ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Scorecard Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scorecard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scorecard and all its metrics. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteScorecard.mutate(deleteTarget, {
                    onSuccess: () => {
                      setDeleteTarget(null);
                      if (selectedScorecard === deleteTarget) setSelectedId(null);
                    },
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Metric Confirm */}
      <AlertDialog open={!!deleteMetricTarget} onOpenChange={() => setDeleteMetricTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete metric?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the metric from this scorecard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteMetricTarget) deleteMetric.mutate(deleteMetricTarget, { onSuccess: () => setDeleteMetricTarget(null) }); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
