import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useCreateProject, useProjectStatuses } from "@/modules/projects/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import type { ProjectFormData } from "@/modules/projects/types";

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: statuses = [] } = useProjectStatuses();
  const { data: clients = [] } = useClients();
  const createProject = useCreateProject();

  const [form, setForm] = useState<ProjectFormData>({
    name: "",
    description: "",
    status_id: undefined,
    client_id: undefined,
    start_date: undefined,
    end_date: undefined,
    budget: undefined,
  });

  useEffect(() => {
    if (open && statuses.length > 0 && !form.status_id) {
      const defaultStatus = statuses.find((s) => s.is_default) || statuses[0];
      setForm((f) => ({ ...f, status_id: defaultStatus.id }));
    }
  }, [open, statuses, form.status_id]);

  const set = (field: keyof ProjectFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createProject.mutate(form, {
      onSuccess: (project: { slug?: string }) => {
        setOpen(false);
        setForm({ name: "", description: "", status_id: undefined, client_id: undefined, start_date: undefined, end_date: undefined, budget: undefined });
        if (project?.slug) navigate(`/projects/${project.slug}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a new project. You can add more details after creation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Q1 Marketing Website"
            />
          </div>
          <div>
            <Label htmlFor="create-desc">Description</Label>
            <Textarea
              id="create-desc"
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status_id ?? ""} onValueChange={(v) => set("status_id", v || undefined)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Client</Label>
            <Select value={form.client_id ?? "none"} onValueChange={(v) => set("client_id", v === "none" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="create-start">Start date</Label>
              <Input
                id="create-start"
                type="date"
                value={form.start_date ?? ""}
                onChange={(e) => set("start_date", e.target.value || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="create-end">End date</Label>
              <Input
                id="create-end"
                type="date"
                value={form.end_date ?? ""}
                onChange={(e) => set("end_date", e.target.value || undefined)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="create-budget">Budget</Label>
            <Input
              id="create-budget"
              type="number"
              min={0}
              step={1}
              value={form.budget ?? ""}
              onChange={(e) => set("budget", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Optional"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.name.trim() || createProject.isPending}>
              {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
