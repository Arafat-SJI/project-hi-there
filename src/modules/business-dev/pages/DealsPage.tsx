/**
 * Deals Pipeline Page - Kanban-style pipeline view of deals
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, DollarSign, TrendingUp, BarChart3, Loader2, Handshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDeals, useDealPipelineStats, useUpdateDealStage } from "../hooks/useDeals";
import { useClients } from "@/hooks/useClients";
import type { DealStage, DealFilters } from "../types";

const STAGE_CONFIG: Record<DealStage, { label: string; color: string }> = {
  lead: { label: "Lead", color: "#6b7280" },
  discovery: { label: "Discovery", color: "#3b82f6" },
  estimation: { label: "Estimation", color: "#8b5cf6" },
  proposal: { label: "Proposal", color: "#f59e0b" },
  won: { label: "Won", color: "#22c55e" },
  lost: { label: "Lost", color: "#ef4444" },
};

const ACTIVE_STAGES: DealStage[] = ["lead", "discovery", "estimation", "proposal"];

export default function DealsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DealFilters>({});
  const { data: deals = [], isLoading } = useDeals(filters);
  const { data: stats } = useDealPipelineStats();
  const { data: clients = [] } = useClients();
  const updateStage = useUpdateDealStage();

  // Get unique owner IDs from deals and fetch their profiles
  const ownerIds = useMemo(() => [...new Set(deals.map((d) => d.owner_id).filter(Boolean))] as string[], [deals]);
  const { data: ownerProfiles = [] } = useQuery({
    queryKey: ["profiles", ownerIds],
    queryFn: async () => {
      if (ownerIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
      if (error) throw error;
      return (data || []) as { id: string; full_name: string | null; email: string | null }[];
    },
    enabled: ownerIds.length > 0,
  });

  const formatCurrency = (val: number) =>
    val >= 1_000_000 ? `$${(val / 1_000_000).toFixed(1)}M` : val >= 1_000 ? `$${(val / 1_000).toFixed(0)}K` : `$${val}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals Pipeline</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button onClick={() => navigate("/deals/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Deals</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total_deals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.total_value)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Avg Probability</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.avg_probability}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Won Deals</p>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.by_stage.won?.count || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search deals..."
            value={filters.search || ""}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
          />
        </div>
        <Select value={filters.stage || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, stage: v === "all" ? undefined : v as DealStage }))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_CONFIG).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.owner_id || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, owner_id: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {ownerProfiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || "Unknown"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.client_id || "all"} onValueChange={(v) => setFilters((f) => ({ ...f, client_id: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filters.stage && filters.stage !== "all" ? (
        /* List view when filtered to a specific stage */
        <div className="space-y-2">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Handshake className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No deals found</p>
            </div>
          ) : deals.map((deal) => (
            <Card key={deal.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate(`/deals/${deal.slug}`)}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">{deal.client?.name || "No client"}{deal.owner ? ` — ${deal.owner.full_name}` : ""}</p>
                </div>
                {deal.value && <p className="text-sm font-semibold">{formatCurrency(deal.value)}</p>}
                <Badge variant="outline" style={{ borderColor: STAGE_CONFIG[deal.stage]?.color, color: STAGE_CONFIG[deal.stage]?.color }}>
                  {STAGE_CONFIG[deal.stage]?.label}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Pipeline board view (active stages only) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACTIVE_STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage);
            const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
            const cfg = STAGE_CONFIG[stage];
            return (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <h3 className="font-semibold text-sm">{cfg.label}</h3>
                    <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageDeals.map((deal) => (
                    <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/deals/${deal.slug}`)}>
                      <CardContent className="p-3 space-y-2">
                        <p className="font-medium text-sm leading-tight">{deal.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{deal.client?.name || "—"}</span>
                          {deal.value != null && <span className="text-xs font-semibold">{formatCurrency(deal.value)}</span>}
                        </div>
                        {deal.owner && <p className="text-xs text-muted-foreground">{deal.owner.full_name}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
