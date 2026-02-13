/**
 * All Deals Page - Business Opportunities structure
 * Matches reference: Overview, Active Pipeline, Archive, Analytics with stage pills, counts, Export, Sync
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, LayoutDashboard, Layers, BarChart3, Download, RefreshCw, Grid, Users, Search, FileText, Calculator, CheckCircle, Trophy, ThumbsUp, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
import { useDeals, useDealPipelineStats } from "../hooks/useDeals";
import { generateDealsCSV } from "@/lib/csv";
import { toast } from "sonner";
import DealsOverview from "../components/DealsOverview";
import DealsStageTabContent from "../components/DealsStageTabContent";
import DealsAnalytics from "../components/DealsAnalytics";
import type { DealStage } from "../types";

type MainTab = "overview" | "all" | "archive" | "analytics";
type ArchiveStage = "won" | "accepted" | "lost";

const ACTIVE_STAGE_TABS: { value: DealStage | "all"; label: string; icon: "Grid" | "Users" | "Search" | "FileText" | "Calculator" | "CheckCircle" }[] = [
  { value: "all", label: "All", icon: "Grid" },
  { value: "lead", label: "Lead", icon: "Users" },
  { value: "discovery", label: "Discovery", icon: "Search" },
  { value: "qualified", label: "Qualified", icon: "CheckCircle" },
  { value: "estimation", label: "Estimation", icon: "Calculator" },
  { value: "proposal", label: "Proposal", icon: "FileText" },
];

const ARCHIVE_STAGE_TABS: { value: ArchiveStage; label: string; icon: "Trophy" | "ThumbsUp" | "XCircle" }[] = [
  { value: "won", label: "Won", icon: "Trophy" },
  { value: "accepted", label: "Accepted", icon: "ThumbsUp" },
  { value: "lost", label: "Lost", icon: "XCircle" },
];

const STAGE_COLORS: Record<DealStage | "all", string> = {
  all: "border-primary text-primary",
  lead: "border-red-500/50 text-red-600",
  discovery: "border-violet-500/50 text-violet-600",
  qualified: "border-blue-400/50 text-blue-600",
  estimation: "border-gray-500/50 text-gray-600",
  proposal: "border-amber-500/50 text-amber-600",
  won: "border-green-500/50 text-green-600",
  lost: "border-red-500/50 text-red-600",
};

function formatShortCurrency(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Number(val).toLocaleString()}`;
  return `$${val}`;
}

export default function DealsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mainTab = (searchParams.get("tab") as MainTab) || "all";
  const stageParam = searchParams.get("stage") || "all";
  const viewMode = (searchParams.get("view") as "card" | "table") || "table";
  const showLostDeals = searchParams.get("showLost") === "true";

  const archiveStageParam: ArchiveStage =
    mainTab === "archive" && (stageParam === "won" || stageParam === "accepted" || stageParam === "lost")
      ? stageParam
      : "won";
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [ownerId, setOwnerId] = useState<string | undefined>(searchParams.get("owner") || undefined);
  const [bdRepId, setBdRepId] = useState<string | undefined>(searchParams.get("bdRep") || undefined);
  const [clientId, setClientId] = useState<string | undefined>(searchParams.get("client") || undefined);

  const setMainTab = (t: MainTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", t);
      if (t === "all") next.set("stage", "all");
      if (t === "archive") next.set("stage", "won");
      return next;
    }, { replace: true });
  };

  const setStageParam = (s: DealStage | "all" | ArchiveStage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("stage", s);
      return next;
    }, { replace: true });
  };

  const setViewMode = (v: "card" | "table") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", v);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setOwnerId(searchParams.get("owner") || undefined);
    setBdRepId(searchParams.get("bdRep") || undefined);
    setClientId(searchParams.get("client") || undefined);
  }, [searchParams]);

  const handleFiltersToUrl = (updates: { search?: string; owner?: string; bdRep?: string; client?: string; showLost?: boolean }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (updates.search !== undefined) (updates.search ? next.set("search", updates.search) : next.delete("search"));
      if (updates.owner !== undefined) (updates.owner ? next.set("owner", updates.owner) : next.delete("owner"));
      if (updates.bdRep !== undefined) (updates.bdRep ? next.set("bdRep", updates.bdRep) : next.delete("bdRep"));
      if (updates.client !== undefined) (updates.client ? next.set("client", updates.client) : next.delete("client"));
      if (updates.showLost !== undefined) (updates.showLost ? next.set("showLost", "true") : next.delete("showLost"));
      return next;
    }, { replace: true });
  };

  const { data: clients = [] } = useClients();
  const { data: stats } = useDealPipelineStats();
  const { data: ownerIds = [] } = useQuery({
    queryKey: ["deal-owner-ids"],
    queryFn: async () => {
      const { data, error } = await supabase.from("deals").select("owner_id");
      if (error) throw error;
      return [...new Set((data || []).map((d) => d.owner_id).filter(Boolean))] as string[];
    },
  });
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

  const activeCount = ["lead", "discovery", "qualified", "estimation", "proposal"].reduce(
    (sum, s) => sum + (stats?.by_stage?.[s as DealStage]?.count ?? 0),
    0
  );
  const archiveCount = (stats?.by_stage?.won?.count ?? 0) + (stats?.by_stage?.lost?.count ?? 0);

  const handleExport = async () => {
    let query = supabase
      .from("deals")
      .select("*, owner:profiles!deals_owner_id_profiles_fkey(full_name), client:clients(name)")
      .order("updated_at", { ascending: false });
    if (mainTab === "all" && stageParam !== "all") query = query.eq("stage", stageParam);
    if (mainTab === "archive") query = query.eq("stage", archiveStageParam === "accepted" ? "won" : archiveStageParam);
    if (mainTab === "all" && !showLostDeals) query = query.neq("stage", "lost");
    if (ownerId || bdRepId) query = query.eq("owner_id", ownerId || bdRepId);
    if (clientId) query = query.eq("client_id", clientId);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    if (error) return;
    const rows = (data || []).map((d: any) => ({
      title: d.title,
      stage: d.stage,
      value: d.value,
      probability: d.probability ?? 0,
      client_name: d.client?.name,
      owner_name: d.owner?.full_name,
      expected_close_date: d.expected_close_date,
      updated_at: d.updated_at,
    }));
    generateDealsCSV(rows, `deals-export-${new Date().toISOString().slice(0, 10)}`);
    toast.success("Deals exported successfully");
  };

  const handleSyncLatest = () => {
    // Placeholder - wire to hubspot-sync-deals if available
    // toast.info("Sync not configured");
  };

  const handleViewDetails = (slug: string) => {
    navigate(`/deals/${slug}`);
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Business Opportunities</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and track deal progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleSyncLatest}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Latest Deals
          </Button>
          <Button onClick={() => navigate("/deals/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Layers className="h-4 w-4" />
            Active Pipeline
            {activeCount > 0 && (
              <span className="ml-1 text-xs font-normal opacity-80">({activeCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Trophy className="h-4 w-4" />
            Archive Won & Lost
            {archiveCount > 0 && (
              <span className="ml-1 text-xs font-normal opacity-80">({archiveCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <DealsOverview />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Open opportunities</p>
            {/* Stage pills with counts and icons */}
            <div className="flex flex-wrap gap-2">
              {ACTIVE_STAGE_TABS.map((t) => {
                const count = t.value === "all" ? activeCount : (stats?.by_stage?.[t.value as DealStage]?.count ?? 0);
                const Icon = t.icon === "Grid" ? Grid : t.icon === "Users" ? Users : t.icon === "Search" ? Search : t.icon === "CheckCircle" ? CheckCircle : t.icon === "Calculator" ? Calculator : FileText;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStageParam(t.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      stageParam === t.value ? STAGE_COLORS[t.value as keyof typeof STAGE_COLORS] : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                    <span className="text-muted-foreground">({count})</span>
                  </button>
                );
              })}
            </div>
            {/* Stage overview: all or selected stage */}
            {(() => {
              const overviewLabel = stageParam === "all" ? "All stage overview" : `${ACTIVE_STAGE_TABS.find((t) => t.value === stageParam)?.label ?? stageParam} stage overview`;
              const overviewCount = stageParam === "all" ? (stats?.total_deals ?? 0) : (stats?.by_stage?.[stageParam as DealStage]?.count ?? 0);
              const overviewValue = stageParam === "all" ? (stats?.total_value ?? 0) : (stats?.by_stage?.[stageParam as DealStage]?.value ?? 0);
              return (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{overviewLabel}</p>
                        <p className="text-2xl font-bold">{overviewCount} deals</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">TOTAL VALUE</p>
                        <p className="text-2xl font-bold">{formatShortCurrency(overviewValue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            <Tabs value={stageParam} onValueChange={(v) => setStageParam(v as DealStage | "all")}>
              {ACTIVE_STAGE_TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-0">
                  <DealsStageTabContent
                    stage={t.value}
                    stageLabel={t.label}
                    viewMode={viewMode}
                    search={search}
                    onSearchChange={(v) => {
                      setSearch(v);
                      handleFiltersToUrl({ search: v || undefined });
                    }}
                    ownerId={ownerId}
                    onOwnerChange={(v) => {
                      setOwnerId(v);
                      handleFiltersToUrl({ owner: v });
                    }}
                    bdRepId={bdRepId}
                    onBdRepChange={(v) => {
                      setBdRepId(v);
                      handleFiltersToUrl({ bdRep: v });
                    }}
                    clientId={clientId}
                    onClientIdChange={(v) => {
                      setClientId(v);
                      handleFiltersToUrl({ client: v });
                    }}
                    showLostDeals={showLostDeals}
                    onShowLostDealsChange={(v) => handleFiltersToUrl({ showLost: v })}
                    onViewModeChange={setViewMode}
                    onViewDetails={handleViewDetails}
                    owners={ownerProfiles}
                    clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="archive" className="mt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Won & Lost</p>
            {/* Archive stage pills: Won, Accepted, Lost */}
            <div className="flex flex-wrap gap-2 justify-center">
              {ARCHIVE_STAGE_TABS.map((t) => {
                const count =
                  t.value === "accepted"
                    ? stats?.by_stage?.won?.count ?? 0
                    : (stats?.by_stage?.[t.value as DealStage]?.count ?? 0);
                const Icon = t.icon === "Trophy" ? Trophy : t.icon === "ThumbsUp" ? ThumbsUp : XCircle;
                const isSelected = archiveStageParam === t.value;
                const isLost = t.value === "lost";
                const pillClass = isSelected
                  ? isLost
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-green-600 text-white border-green-600"
                  : isLost
                    ? "border-red-500/50 text-red-600 hover:bg-red-50"
                    : "border-green-500/50 text-green-600 hover:bg-green-50";
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setStageParam(t.value)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${pillClass}`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                    <span className={isSelected ? "opacity-90" : "text-muted-foreground"}>({count})</span>
                  </button>
                );
              })}
            </div>
            {/* Stage overview card */}
            {(() => {
              const overviewLabel = `${ARCHIVE_STAGE_TABS.find((t) => t.value === archiveStageParam)?.label ?? archiveStageParam} stage overview`;
              const overviewCount =
                archiveStageParam === "accepted"
                  ? stats?.by_stage?.won?.count ?? 0
                  : (stats?.by_stage?.[archiveStageParam as DealStage]?.count ?? 0);
              const overviewValue =
                archiveStageParam === "accepted"
                  ? stats?.by_stage?.won?.value ?? 0
                  : (stats?.by_stage?.[archiveStageParam as DealStage]?.value ?? 0);
              return (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{overviewLabel}</p>
                        <p className="text-2xl font-bold">{overviewCount} deals</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">TOTAL VALUE</p>
                        <p className="text-2xl font-bold">{formatShortCurrency(overviewValue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            <Tabs value={archiveStageParam} onValueChange={(v) => setStageParam(v as ArchiveStage)}>
              {ARCHIVE_STAGE_TABS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-0">
                  <DealsStageTabContent
                    stage={t.value === "accepted" ? "won" : t.value}
                    stageLabel={t.label}
                    viewMode={viewMode}
                    search={search}
                    onSearchChange={(v) => {
                      setSearch(v);
                      handleFiltersToUrl({ search: v || undefined });
                    }}
                    ownerId={ownerId}
                    onOwnerChange={(v) => {
                      setOwnerId(v);
                      handleFiltersToUrl({ owner: v });
                    }}
                    bdRepId={bdRepId}
                    onBdRepChange={(v) => {
                      setBdRepId(v);
                      handleFiltersToUrl({ bdRep: v });
                    }}
                    clientId={clientId}
                    onClientIdChange={(v) => {
                      setClientId(v);
                      handleFiltersToUrl({ client: v });
                    }}
                    showLostDeals={showLostDeals}
                    onShowLostDealsChange={(v) => handleFiltersToUrl({ showLost: v })}
                    onViewModeChange={setViewMode}
                    onViewDetails={handleViewDetails}
                    owners={ownerProfiles}
                    clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                    searchPlaceholder={`Search ${t.label.toLowerCase()} deals`}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <DealsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
