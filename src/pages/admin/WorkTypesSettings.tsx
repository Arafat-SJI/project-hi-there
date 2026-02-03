import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Briefcase,
  DollarSign,
} from "lucide-react";
import {
  useWorkTypes,
  useCreateWorkType,
  useUpdateWorkType,
  useDeleteWorkType,
  useReorderWorkTypes,
  WORK_TYPE_CATEGORIES,
  type WorkType,
  type WorkTypeCategory,
} from "@/hooks/useWorkTypes";

const DEFAULT_COLORS = [
  "#8b5cf6", "#3b82f6", "#ec4899", "#22c55e", "#f59e0b",
  "#14b8a6", "#ef4444", "#6b7280", "#9ca3af",
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function categoryBadge(cat: string) {
  const colors: Record<string, string> = {
    services: "bg-blue-100 text-blue-800 border-blue-200",
    support: "bg-teal-100 text-teal-800 border-teal-200",
    admin: "bg-gray-100 text-gray-800 border-gray-200",
    internal: "bg-amber-100 text-amber-800 border-amber-200",
    other: "bg-violet-100 text-violet-800 border-violet-200",
  };
  return (
    <Badge variant="outline" className={colors[cat] || ""}>
      {cat}
    </Badge>
  );
}

interface WorkTypeFormData {
  name: string;
  description: string;
  category: WorkTypeCategory;
  is_billable: boolean;
  default_rate: string;
  color: string;
  is_active: boolean;
}

const emptyForm: WorkTypeFormData = {
  name: "",
  description: "",
  category: "services",
  is_billable: true,
  default_rate: "",
  color: DEFAULT_COLORS[0],
  is_active: true,
};

export default function WorkTypesSettings() {
  const { data: workTypes = [], isLoading } = useWorkTypes();
  const createMutation = useCreateWorkType();
  const updateMutation = useUpdateWorkType();
  const deleteMutation = useDeleteWorkType();
  const reorderMutation = useReorderWorkTypes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkTypeFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<WorkType | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(wt: WorkType) {
    setEditingId(wt.id);
    setForm({
      name: wt.name,
      description: wt.description || "",
      category: wt.category as WorkTypeCategory,
      is_billable: wt.is_billable,
      default_rate: wt.default_rate != null ? String(wt.default_rate) : "",
      color: wt.color || DEFAULT_COLORS[0],
      is_active: wt.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const rate = form.default_rate ? parseFloat(form.default_rate) : null;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        name: form.name.trim(),
        slug: slugify(form.name),
        description: form.description || null,
        category: form.category,
        is_billable: form.is_billable,
        default_rate: rate,
        color: form.color,
        is_active: form.is_active,
      });
    } else {
      const maxSort = workTypes.reduce((max, w) => Math.max(max, w.sort_order ?? 0), -1);
      await createMutation.mutateAsync({
        name: form.name.trim(),
        slug: slugify(form.name),
        description: form.description || undefined,
        category: form.category,
        is_billable: form.is_billable,
        default_rate: rate,
        color: form.color,
        sort_order: maxSort + 1,
      });
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function moveType(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= workTypes.length) return;
    const ids = workTypes.map((w) => w.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    await reorderMutation.mutateAsync(ids);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Summary stats
  const billableCount = workTypes.filter((w) => w.is_billable && w.is_active).length;
  const activeCount = workTypes.filter((w) => w.is_active).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Types</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workTypes.length}</div>
            <p className="text-xs text-muted-foreground">{activeCount} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableCount}</div>
            <p className="text-xs text-muted-foreground">billable work types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(workTypes.map((w) => w.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">unique categories in use</p>
          </CardContent>
        </Card>
      </div>

      {/* Main table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Work Types</CardTitle>
            <CardDescription>
              Configure work types used in project billing and resource planning
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Work Type
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : workTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No work types configured</p>
              <p className="text-sm">Add your first work type to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead className="text-right">Default Rate</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workTypes.map((wt, index) => (
                  <TableRow key={wt.id}>
                    <TableCell>
                      <div
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: wt.color || "#3b82f6" }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{wt.name}</span>
                        {wt.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {wt.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{categoryBadge(wt.category)}</TableCell>
                    <TableCell>
                      {wt.is_billable ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">Billable</Badge>
                      ) : (
                        <Badge variant="outline">Non-billable</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {wt.default_rate != null
                        ? `$${Number(wt.default_rate).toFixed(2)}`
                        : <span className="text-muted-foreground">--</span>}
                    </TableCell>
                    <TableCell>
                      {wt.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === 0 || reorderMutation.isPending}
                          onClick={() => moveType(index, -1)}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={index === workTypes.length - 1 || reorderMutation.isPending}
                          onClick={() => moveType(index, 1)}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(wt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(wt)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Work Type" : "Add Work Type"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this work type configuration."
                : "Create a new work type for project billing and resource planning."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wt-name">Name</Label>
              <Input
                id="wt-name"
                placeholder="e.g. Development"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wt-desc">Description</Label>
              <Textarea
                id="wt-desc"
                placeholder="Optional description..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => setForm((f) => ({ ...f, category: val as WorkTypeCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_TYPE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-7 w-7 rounded border-2 transition-all ${
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
                <Input
                  type="color"
                  className="h-7 w-7 p-0 border-0 cursor-pointer"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="wt-billable">Billable</Label>
              <Switch
                id="wt-billable"
                checked={form.is_billable}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_billable: checked }))}
              />
            </div>
            {form.is_billable && (
              <div className="space-y-2">
                <Label htmlFor="wt-rate">Default Hourly Rate ($)</Label>
                <Input
                  id="wt-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150.00"
                  value={form.default_rate}
                  onChange={(e) => setForm((f) => ({ ...f, default_rate: e.target.value }))}
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="wt-active">Active</Label>
              <Switch
                id="wt-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Work Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This work type will be permanently removed. Any project billing entries
              referencing it may need to be updated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
