import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Database,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { formatBytes, formatDateTime } from "@/lib/utils";

interface KnowledgeSource {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  last_synced_at: string | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  [key: string]: any;
}

const SOURCE_TYPES = [
  { value: "google_drive", label: "Google Drive" },
  { value: "confluence", label: "Confluence" },
  { value: "notion", label: "Notion" },
  { value: "sharepoint", label: "SharePoint" },
  { value: "github", label: "GitHub" },
  { value: "other", label: "Other" },
];

const SYNC_FREQUENCIES = [
  { value: "manual", label: "Manual" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const SYNC_STATUS_COLORS = {
  pending: "bg-gray-500",
  syncing: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export default function KnowledgeSources() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    source_type: "google_drive",
    source_url: "",
    sync_enabled: false,
    sync_frequency: "manual",
  });

  // Fetch sources
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["admin", "knowledge-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_sources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as KnowledgeSource[];
    },
  });

  // Create source mutation
  const createSource = useMutation({
    mutationFn: async (data: Partial<KnowledgeSource>) => {
      const { data: source, error } = await supabase
        .from("knowledge_sources")
        .insert([data as any])
        .select()
        .single();
      if (error) throw error;
      return source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sources"] });
      toast({ title: "Success", description: "Knowledge source created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update source mutation
  const updateSource = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<KnowledgeSource>;
    }) => {
      const { data: source, error } = await supabase
        .from("knowledge_sources")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sources"] });
      toast({ title: "Success", description: "Knowledge source updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedSource(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete source mutation
  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("knowledge_sources")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sources"] });
      toast({ title: "Success", description: "Knowledge source deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Trigger sync mutation
  const triggerSync = useMutation({
    mutationFn: async (sourceId: string) => {
      const { data, error } = await supabase.functions.invoke("google-drive-sync", {
        body: { source_id: sourceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sources"] });
      toast({ title: "Success", description: "Sync started successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      source_type: "google_drive",
      source_url: "",
      sync_enabled: false,
      sync_frequency: "manual",
    });
  };

  const handleCreate = () => {
    createSource.mutate(formData);
  };

  const handleEdit = (source: KnowledgeSource) => {
    setSelectedSource(source);
    setFormData({
      name: source.name,
      slug: source.slug,
      description: source.description || "",
      source_type: source.source_type,
      source_url: source.source_url || "",
      sync_enabled: source.sync_enabled,
      sync_frequency: source.sync_frequency,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSource) return;
    updateSource.mutate({ id: selectedSource.id, data: formData });
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case "syncing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Sources</h1>
          <p className="text-muted-foreground">
            Manage external knowledge sources and synchronization
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Syncs</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.filter((s) => s.sync_enabled).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sources.reduce((sum, s) => sum + s.file_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(sources.reduce((sum, s) => sum + s.total_size, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
          <CardDescription>
            External systems and integrations that provide knowledge content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No knowledge sources configured yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{source.name}</div>
                        {source.description && (
                          <div className="text-sm text-muted-foreground">
                            {source.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.source_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSyncStatusIcon(source.sync_status)}
                        <Badge
                          variant="outline"
                          className={SYNC_STATUS_COLORS[source.sync_status as keyof typeof SYNC_STATUS_COLORS]}
                        >
                          {source.sync_status}
                        </Badge>
                        {source.sync_enabled && (
                          <Badge variant="secondary" className="text-xs">
                            {source.sync_frequency}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{source.file_count}</TableCell>
                    <TableCell>{formatBytes(source.total_size)}</TableCell>
                    <TableCell>
                      {source.last_synced_at
                        ? formatDateTime(source.last_synced_at)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerSync.mutate(source.id)}
                          disabled={triggerSync.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(source)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSource.mutate(source.id)}
                          disabled={deleteSource.isPending}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge Source</DialogTitle>
            <DialogDescription>
              Configure a new external knowledge source for synchronization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Knowledge Source"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="my-knowledge-source"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this source"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source_type">Source Type</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source_url">Source URL</Label>
                <Input
                  id="source_url"
                  value={formData.source_url}
                  onChange={(e) =>
                    setFormData({ ...formData, source_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sync_enabled"
                  checked={formData.sync_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sync_enabled: checked })
                  }
                />
                <Label htmlFor="sync_enabled">Enable Auto Sync</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sync_frequency">Sync Frequency</Label>
                <Select
                  value={formData.sync_frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sync_frequency: value })
                  }
                  disabled={!formData.sync_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createSource.isPending}>
              {createSource.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Source</DialogTitle>
            <DialogDescription>
              Update knowledge source configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-source_type">Source Type</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source_url">Source URL</Label>
                <Input
                  id="edit-source_url"
                  value={formData.source_url}
                  onChange={(e) =>
                    setFormData({ ...formData, source_url: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-sync_enabled"
                  checked={formData.sync_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sync_enabled: checked })
                  }
                />
                <Label htmlFor="edit-sync_enabled">Enable Auto Sync</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sync_frequency">Sync Frequency</Label>
                <Select
                  value={formData.sync_frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sync_frequency: value })
                  }
                  disabled={!formData.sync_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateSource.isPending}>
              {updateSource.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
