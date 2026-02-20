/**
 * Embedding Pipeline Dashboard – Admin UI to monitor and control the embedding pipeline.
 * Route: /admin/ai/embeddings
 * Data from source tables only: zoom_files (meetings), knowledge_files. No reads from embeddings table.
 * Pipeline on/off stored in system_settings (ai.embedding_processing_enabled).
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Database,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Video,
  Play,
  RotateCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import {
  useEmbeddingPipelineSetting,
  useEmbeddingPipelineStats,
  useEmbeddingPipelineList,
  useEmbeddingPipelineRetryFailed,
  invalidateEmbeddingPipelineQueries,
  type PipelineStatus,
  type SourceType,
} from "@/hooks/useEmbeddingPipeline";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export default function EmbeddingPipelineDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SourceType | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [projectBreakdownOpen, setProjectBreakdownOpen] = useState(true);

  const {
    enabled: pipelineEnabled,
    isLoading: settingLoading,
    setEnabled: setPipelineEnabled,
    isUpdating: settingUpdating,
  } = useEmbeddingPipelineSetting();

  const { data: stats, isLoading: statsLoading } = useEmbeddingPipelineStats();
  const { data: listData, isLoading: listLoading } = useEmbeddingPipelineList(
    statusFilter,
    sourceFilter,
    search,
    page,
    PAGE_SIZE
  );

  const retryFailed = useEmbeddingPipelineRetryFailed();

  const totalPages = listData ? Math.max(1, Math.ceil(listData.total / PAGE_SIZE)) : 1;

  const processMeetings = async () => {
    try {
      const { error } = await supabase.functions.invoke("auto-embed-meetings", {
        body: { batch_size: 20, retry_failed: false },
      });
      if (error) throw error;
      invalidateEmbeddingPipelineQueries(queryClient);
      toast({ title: "Process Meetings", description: "Meeting embedding job started." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to start",
        variant: "destructive",
      });
    }
  };

  const processKnowledgeFiles = async () => {
    try {
      const { error } = await supabase.functions.invoke("auto-embed-knowledge-files", {
        body: { batch_size: 20, retry_failed: false },
      });
      if (error) throw error;
      invalidateEmbeddingPipelineQueries(queryClient);
      toast({ title: "Process Knowledge Files", description: "Knowledge file embedding job started." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to start",
        variant: "destructive",
      });
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailed.mutateAsync(undefined);
      toast({ title: "Retry Failed", description: "Failed items reset to pending. Trigger Process Meetings or Process Knowledge Files to run." });
      processMeetings();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    }
  };

  const rematchProjects = async () => {
    try {
      const { error } = await supabase.functions.invoke("discover-meeting-relationships", {
        body: { force_rematch: true },
      });
      if (error) throw error;
      invalidateEmbeddingPipelineQueries(queryClient);
      toast({ title: "Re-match Projects", description: "Meeting relationship discovery started." });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    }
  };

  const refresh = () => {
    invalidateEmbeddingPipelineQueries(queryClient);
  };

  const statusBadge = (status: PipelineStatus) => {
    const config: Record<
      PipelineStatus,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }
    > = {
      pending: { variant: "outline", label: "Pending", className: "bg-amber-50 text-amber-800 border-amber-200" },
      processing: { variant: "default", label: "Processing", className: "bg-blue-100 text-blue-800 border-0" },
      completed: { variant: "secondary", label: "Completed", className: "bg-green-50 text-green-800 border-green-200" },
      failed: { variant: "destructive", label: "Failed", className: "bg-red-50 text-red-800 border-red-200" },
    };
    const c = config[status];
    return (
      <Badge variant={c.variant} className={c.className ?? ""}>
        {c.label}
      </Badge>
    );
  };

  const sourceIcon = (sourceType: SourceType) =>
    sourceType === "meeting" ? <Video className="h-4 w-4 text-blue-600" /> : <FileText className="h-4 w-4 text-violet-600" />;

  const hasProjects = true;

  const embeddingsSubtitle =
    statusFilter === "all"
      ? "All sources"
      : `All sources • ${statusFilter}`;

  return (
    <div className="space-y-6">
      {/* 1. Header: title left, controls card right */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-7 w-7 text-muted-foreground" />
            Embedding Pipeline Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage vector embeddings for semantic search
          </p>
        </div>
        <Card className="w-full lg:w-auto shrink-0">
          <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="pipeline-enabled"
                checked={pipelineEnabled}
                onCheckedChange={(v) => setPipelineEnabled(v).catch(() => {})}
                disabled={settingLoading || settingUpdating}
              />
              <label
                htmlFor="pipeline-enabled"
                className={`text-sm font-medium whitespace-nowrap ${pipelineEnabled ? "text-green-600" : "text-muted-foreground"}`}
              >
                Pipeline Active
              </label>
            </div>
            <Button size="sm" onClick={processMeetings} disabled={!pipelineEnabled}>
              <Play className="h-4 w-4 mr-2" />
              Process Meetings
            </Button>
            <Button size="sm" variant="outline" onClick={processKnowledgeFiles} disabled={!pipelineEnabled}>
              <FileText className="h-4 w-4 mr-2" />
              Process Knowledge Files
            </Button>
            <Button size="sm" variant="outline" onClick={handleRetryFailed} disabled={retryFailed.isPending || !pipelineEnabled}>
              {retryFailed.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCw className="h-4 w-4 mr-2" />}
              Retry Failed
            </Button>
            {hasProjects && (
              <Button size="sm" variant="outline" onClick={rematchProjects}>
                <RotateCw className="h-4 w-4 mr-2" />
                Re-match Projects
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 2. Four status cards – clear active state (blue border when selected) */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { key: "pending" as const, label: "Pending", sub: "Awaiting processing", icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: "text-amber-600" },
            { key: "processing" as const, label: "Processing", sub: "Currently running", icon: Loader2, iconBg: "bg-blue-100", iconColor: "text-blue-600", valueColor: "text-blue-600" },
            { key: "completed" as const, label: "Completed", sub: `${stats.totalChunks.toLocaleString()} total chunks`, icon: CheckCircle2, iconBg: "bg-green-100", iconColor: "text-green-600", valueColor: "text-green-600" },
            { key: "failed" as const, label: "Failed", sub: "Need attention", icon: AlertCircle, iconBg: "bg-red-100", iconColor: "text-red-600", valueColor: "text-red-600" },
          ].map(({ key, label, sub, icon: Icon, iconBg, iconColor, valueColor }) => {
            const isActive = statusFilter === key;
            return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-muted/50"}`}
              onClick={() => { setStatusFilter(key); setPage(1); }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{label}</h3>
                  <div className={`rounded-full p-2 shrink-0 ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor} ${key === "processing" ? "animate-spin" : ""}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold mt-3 ${valueColor}`}>{stats[key]}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}

      {/* 3. Embeddings table: dynamic subtitle, filters, tabs, table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Embeddings</CardTitle>
          <CardDescription>{embeddingsSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v as SourceType | "all"); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-full max-w-[220px]"
                />
              </div>
            </div>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-1 border-b pb-3">
              {(
                [
                  { key: "all", label: "All", count: stats.total },
                  { key: "pending", label: "Pending", count: stats.pending },
                  { key: "processing", label: "Processing", count: stats.processing },
                  { key: "completed", label: "Completed", count: stats.completed },
                  { key: "failed", label: "Failed", count: stats.failed },
                ] as const
              ).map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setStatusFilter(key); setPage(1); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {listLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !listData?.rows.length ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Database className="h-10 w-10" />
              <p className="text-sm">No embeddings match the current filters.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chunks</TableHead>
                    <TableHead>Date</TableHead>
                    {statusFilter === "failed" && <TableHead>Error</TableHead>}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listData.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sourceIcon(row.sourceType)}
                          <span className="text-sm text-muted-foreground">
                            {row.sourceType === "meeting" ? "Meeting" : "Doc"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium max-w-[220px] truncate" title={row.name}>
                        {row.name}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground" title={row.context}>
                        {row.context}
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell>{row.chunks > 0 ? row.chunks : "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.date ? formatDate(row.date, "MMM d, yyyy") : "—"}
                      </TableCell>
                      {statusFilter === "failed" && (
                        <TableCell className="max-w-[200px] truncate text-xs text-destructive" title={row.error ?? ""}>
                          {row.error ?? "—"}
                        </TableCell>
                      )}
                      <TableCell>
                        {row.status === "failed" ? (
                          <Button variant="ghost" size="sm" className="h-8" onClick={handleRetryFailed}>
                            <RotateCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8" asChild>
                            {row.meetingId ? (
                              <a href={`/meetings/${row.meetingId}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            ) : (
                              <a href={`/admin/knowledge/files#${row.sourceId}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {listData.total > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({listData.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = page <= 3 ? i + 1 : Math.max(1, page - 2 + i);
                      if (p > totalPages) return null;
                      return (
                        <Button key={p} variant={page === p ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 5. Optional: Project Breakdown (meeting source table only) */}
      <Card className="bg-muted/30">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 rounded-lg transition-colors"
          onClick={() => setProjectBreakdownOpen(!projectBreakdownOpen)}
        >
          <div className="flex items-center gap-2">
            {projectBreakdownOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            <span className="font-semibold">Project Breakdown</span>
          </div>
          <span className="text-sm text-muted-foreground">Embedding status by project (meetings only)</span>
        </button>
        {projectBreakdownOpen && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Per-project meeting count, embedded count, and last embedding date can be added when meeting–project assignment is available from the source table.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
