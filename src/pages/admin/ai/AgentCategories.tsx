/**
 * AI Hub Agent Categories – organize AI agents into categories.
 * Route: /admin/ai/agent-categories
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  RefreshCw,
  Plus,
  FolderOpen,
  CheckCircle2,
  Bot,
  LayoutGrid,
  List,
  Edit2,
  XCircle,
  Trash2,
  BarChart3,
  Loader2,
  FileText,
  Target,
  MessageSquare,
  Sparkles,
  Folder,
} from "lucide-react";
import { useAgentCategories, type AgentCategoryWithCounts } from "@/hooks/useAgentCategories";
import { format } from "date-fns";

type ViewMode = "cards" | "table";

const CATEGORY_ICONS = [
  { value: "FolderOpen", label: "Folder", Icon: FolderOpen },
  { value: "Folder", label: "Folder (closed)", Icon: Folder },
  { value: "BarChart3", label: "Bar Chart", Icon: BarChart3 },
  { value: "Bot", label: "Bot", Icon: Bot },
  { value: "FileText", label: "Document", Icon: FileText },
  { value: "Target", label: "Target", Icon: Target },
  { value: "MessageSquare", label: "Message", Icon: MessageSquare },
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
] as const;

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function AgentCategories() {
  const {
    data: categories,
    stats,
    isLoading,
    refetch,
    create,
    update,
    setActive,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAgentCategories();

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AgentCategoryWithCounts | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentCategoryWithCounts | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("FolderOpen");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormIcon("FolderOpen");
    setFormDisplayOrder(0);
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: AgentCategoryWithCounts) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description ?? "");
    setFormIcon(cat.icon ?? "FolderOpen");
    setFormDisplayOrder(cat.display_order ?? 0);
    setFormActive(cat.is_active ?? true);
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormName(name);
    if (!editingCategory) setFormSlug(slugFromName(name));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await update({
        id: editingCategory.id,
        oldSlug: editingCategory.slug,
        updates: {
          name: formName,
          slug: formSlug,
          description: formDescription || null,
          icon: formIcon,
          display_order: formDisplayOrder,
          is_active: formActive,
        },
      });
    } else {
      await create({
        name: formName,
        slug: formSlug,
        description: formDescription || null,
        icon: formIcon,
        display_order: formDisplayOrder,
        is_active: formActive,
      });
    }
    setDialogOpen(false);
  };

  const CategoryIcon = ({ name }: { name: string | null }) => {
    const entry = CATEGORY_ICONS.find((c) => c.value === (name ?? "FolderOpen"));
    const Icon = entry?.Icon ?? FolderOpen;
    return <Icon className="h-4 w-4" />;
  };

  const handleDeactivate = (cat: AgentCategoryWithCounts) => {
    setActive({ id: cat.id, is_active: !cat.is_active });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await remove({ id: deleteTarget.id, slug: deleteTarget.slug });
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Categories</h1>
          <p className="text-muted-foreground">
            Organize your AI agents into categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openAddDialog} disabled={isCreating}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg border p-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCategories}</p>
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg border p-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeCategories}</p>
              <p className="text-sm text-muted-foreground">Active Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg border p-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalAgents}</p>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg border p-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeAgents}</p>
              <p className="text-sm text-muted-foreground">Active Agents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
          className="rounded-lg border p-1"
        >
          <ToggleGroupItem value="cards" aria-label="Cards" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table" className="gap-2">
            <List className="h-4 w-4" />
            Table
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      {viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={cat.icon} />
                    <h3 className="font-semibold">{cat.name}</h3>
                  </div>
                  {cat.is_active ? (
                    <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {cat.description || "No description"}
                </p>
                <div className="flex gap-4 text-sm">
                  <span>{cat.total_agents} Total Agents</span>
                  <span>{cat.active_agents} Active Agents</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Slug {cat.slug}
                </p>
                <p className="text-xs text-muted-foreground">
                  Last Updated {format(new Date(cat.updated_at), "MMM d, yyyy, h:mm a")}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(cat)}
                    disabled={isUpdating}
                  >
                    <Edit2 className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeactivate(cat)}
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    {cat.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(cat)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Total Agents</TableHead>
                <TableHead>Active Agents</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    {cat.is_active ? (
                      <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.description || "No description"}
                  </TableCell>
                  <TableCell>{cat.total_agents}</TableCell>
                  <TableCell>{cat.active_agents}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(cat.updated_at), "MMM d, yyyy, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(cat)} disabled={isUpdating}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(cat)} disabled={isUpdating}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(cat)} disabled={isDeleting} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog - Create New Category modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the category details below."
                  : "Add a new category to organize your AI agents"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name *</Label>
                <Input
                  id="cat-name"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Financial Analysis"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug *</Label>
                <Input
                  id="cat-slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g., financial_analysis"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used to identify the category in code
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formIcon} onValueChange={setFormIcon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose icon">
                      {CATEGORY_ICONS.find((c) => c.value === formIcon)?.label ?? "Folder"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ICONS.map(({ value, label, Icon }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-display-order">Display Order</Label>
                <Input
                  id="cat-display-order"
                  type="number"
                  min={0}
                  value={formDisplayOrder}
                  onChange={(e) => setFormDisplayOrder(Number(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="cat-active">Active</Label>
                <Switch
                  id="cat-active"
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {editingCategory ? "Update" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the category &quot;{deleteTarget?.name}&quot;. Agents in this category will have their category cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
