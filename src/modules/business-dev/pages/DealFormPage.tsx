/**
 * Deal Form Page - Create and edit deals
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeal, useCreateDeal, useUpdateDeal } from "../hooks/useDeals";
import { useClients } from "@/hooks/useClients";
import { useContacts } from "../hooks/useContacts";
import type { DealFormData, DealStage } from "../types";

const STAGES: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "discovery", label: "Discovery" },
  { value: "qualified", label: "Qualified" },
  { value: "estimation", label: "Estimation" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function DealFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = !!slug;

  const { data: existingDeal, isLoading: loadingDeal } = useDeal(slug || "");
  const { data: clients = [] } = useClients();
  const { data: contacts = [] } = useContacts();
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return (data || []) as { id: string; full_name: string | null; email: string | null }[];
    },
  });
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();

  const [form, setForm] = useState<DealFormData>({
    title: "",
    description: "",
    stage: "lead",
    value: undefined,
    probability: 0,
    client_id: undefined,
    contact_id: undefined,
    owner_id: undefined,
    expected_close_date: undefined,
    source: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (existingDeal && isEdit) {
      setForm({
        title: existingDeal.title,
        description: existingDeal.description || "",
        stage: existingDeal.stage,
        value: existingDeal.value || undefined,
        probability: existingDeal.probability ?? 0,
        client_id: existingDeal.client_id || undefined,
        contact_id: existingDeal.contact_id || undefined,
        owner_id: existingDeal.owner_id || undefined,
        expected_close_date: existingDeal.expected_close_date || undefined,
        source: existingDeal.source || "",
        tags: existingDeal.tags || [],
      });
    }
  }, [existingDeal, isEdit]);

  const set = (field: keyof DealFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      set("tags", [...(form.tags || []), tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    set("tags", (form.tags || []).filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (isEdit && existingDeal) {
      updateDeal.mutate(
        { id: existingDeal.id, data: form },
        { onSuccess: () => navigate(`/deals/${slug}`) }
      );
    } else {
      createDeal.mutate(form, {
        onSuccess: (deal: any) => navigate(`/deals/${deal.slug}`),
      });
    }
  };

  const isPending = createDeal.isPending || updateDeal.isPending;

  if (isEdit && loadingDeal) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/deals/${slug}` : "/deals")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Deal" : "New Deal"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Website redesign for Acme Corp"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief description of the deal..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stage</Label>
                <Select value={form.stage || "lead"} onValueChange={(v) => set("stage", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  min={0}
                  value={form.value ?? ""}
                  onChange={(e) => set("value", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="probability">Win Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min={0}
                  max={100}
                  value={form.probability ?? ""}
                  onChange={(e) => set("probability", e.target.value ? Number(e.target.value) : 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="close_date">Expected Close Date</Label>
                <Input
                  id="close_date"
                  type="date"
                  value={form.expected_close_date || ""}
                  onChange={(e) => set("expected_close_date", e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <Select
                  value={form.client_id || "none"}
                  onValueChange={(v) => set("client_id", v === "none" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact</Label>
                <Select
                  value={form.contact_id || "none"}
                  onValueChange={(v) => set("contact_id", v === "none" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name || ""}{c.company ? ` (${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Select
                  value={form.owner_id || "none"}
                  onValueChange={(v) => set("owner_id", v === "none" ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.email || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={form.source || ""}
                  onChange={(e) => set("source", e.target.value)}
                  placeholder="e.g. Referral, Website, Cold outreach"
                />
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              {(form.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(form.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit ? `/deals/${slug}` : "/deals")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!form.title.trim() || isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</>
                ) : (
                  isEdit ? "Save Changes" : "Create Deal"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
