/**
 * Deal Form Page - Create and edit deals
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useDeal, useCreateDeal, useUpdateDeal } from "../hooks/useDeals";
import { useClients } from "@/hooks/useClients";
import type { DealFormData, DealStage } from "../types";

const STAGES: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "discovery", label: "Discovery" },
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
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();

  const [form, setForm] = useState<DealFormData>({
    title: "",
    description: "",
    stage: "lead",
    value: undefined,
    client_id: undefined,
    expected_close_date: undefined,
    source: "",
  });

  useEffect(() => {
    if (existingDeal && isEdit) {
      setForm({
        title: existingDeal.title,
        description: existingDeal.description || "",
        stage: existingDeal.stage,
        value: existingDeal.value || undefined,
        client_id: existingDeal.client_id || undefined,
        contact_id: existingDeal.contact_id || undefined,
        owner_id: existingDeal.owner_id || undefined,
        expected_close_date: existingDeal.expected_close_date || undefined,
        source: existingDeal.source || "",
      });
    }
  }, [existingDeal, isEdit]);

  const set = (field: keyof DealFormData, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

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
                <Label htmlFor="close_date">Expected Close Date</Label>
                <Input
                  id="close_date"
                  type="date"
                  value={form.expected_close_date || ""}
                  onChange={(e) => set("expected_close_date", e.target.value || undefined)}
                />
              </div>
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
