import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Brain, Loader2, Plus, Edit, Play, Pause, Trash2, MessageSquare } from "lucide-react";

interface AIAgent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  system_prompt: string;
  data_sources: any;
  provider_config: any;
  required_role: string | null;
  is_enabled: boolean;
  memory_enabled: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function AIAgents() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    category: "general",
    system_prompt: "",
    is_enabled: true,
    memory_enabled: false,
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error("Fetch agents error:", error);
      toast.error("Failed to load AI agents");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.system_prompt.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");

    setSubmitting(true);
    try {
      if (editingAgent) {
        const { error } = await supabase
          .from("ai_agents")
          .update({
            name: formData.name,
            slug,
            description: formData.description,
            category: formData.category,
            system_prompt: formData.system_prompt,
            is_enabled: formData.is_enabled,
            memory_enabled: formData.memory_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAgent.id);

        if (error) throw error;
        toast.success("Agent updated successfully!");
      } else {
        const { error } = await supabase.from("ai_agents").insert({
          name: formData.name,
          slug,
          description: formData.description,
          category: formData.category,
          system_prompt: formData.system_prompt,
          is_enabled: formData.is_enabled,
          memory_enabled: formData.memory_enabled,
        });

        if (error) throw error;
        toast.success("Agent created successfully!");
      }

      setDialogOpen(false);
      resetForm();
      fetchAgents();
    } catch (error: any) {
      console.error("Submit agent error:", error);
      toast.error(error.message || "Failed to save agent");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      slug: agent.slug,
      description: agent.description || "",
      category: agent.category || "general",
      system_prompt: agent.system_prompt,
      is_enabled: agent.is_enabled,
      memory_enabled: agent.memory_enabled,
    });
    setDialogOpen(true);
  };

  const toggleEnabled = async (agent: AIAgent) => {
    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({
          is_enabled: !agent.is_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", agent.id);

      if (error) throw error;

      toast.success(`Agent ${!agent.is_enabled ? "enabled" : "disabled"}`);
      fetchAgents();
    } catch (error: any) {
      console.error("Toggle enabled error:", error);
      toast.error("Failed to update agent status");
    }
  };

  const handleDelete = async (agent: AIAgent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"?`)) return;

    try {
      const { error } = await supabase.from("ai_agents").delete().eq("id", agent.id);

      if (error) throw error;

      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (error: any) {
      console.error("Delete agent error:", error);
      toast.error("Failed to delete agent");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      category: "general",
      system_prompt: "",
      is_enabled: true,
      memory_enabled: false,
    });
    setEditingAgent(null);
  };

  const getCategoryBadge = (category: string | null) => {
    const colors: Record<string, string> = {
      communication: "bg-blue-500",
      analysis: "bg-purple-500",
      task_management: "bg-green-500",
      general: "bg-gray-500",
    };
    return (
      <Badge className={colors[category || "general"] || "bg-gray-500"}>
        {category || "general"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their configurations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAgent ? "Edit AI Agent" : "Create New AI Agent"}
              </DialogTitle>
              <DialogDescription>
                Configure your AI agent's behavior and settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Email Draft Assistant"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="email-draft-assistant"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated if left empty
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Helps draft professional emails"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="task_management">Task Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are a professional email writing assistant..."
                  rows={6}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Enable Agent</Label>
                  <p className="text-sm text-muted-foreground">
                    Agent will be available for use
                  </p>
                </div>
                <Switch
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_enabled: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Enable Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    Agent will remember previous interactions
                  </p>
                </div>
                <Switch
                  checked={formData.memory_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, memory_enabled: checked })
                  }
                  disabled={submitting}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAgent ? "Update" : "Create"} Agent
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {agents.filter((a) => a.is_enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {agents.filter((a) => !a.is_enabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <Brain className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No AI agents yet</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className={!agent.is_enabled ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {agent.description || "No description"}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleEnabled(agent)}
                  >
                    {agent.is_enabled ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(agent.category)}
                  {agent.is_enabled && (
                    <Badge variant="default">Active</Badge>
                  )}
                  {agent.memory_enabled && (
                    <Badge variant="outline">Memory</Badge>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(agent.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(agent)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
