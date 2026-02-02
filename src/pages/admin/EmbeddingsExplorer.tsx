import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Database,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Zap,
  BarChart3,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";

interface EmbeddingQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  priority: number | null;
  status: string | null;
  attempts: number | null;
  max_attempts: number | null;
  error_message: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

interface VectorSearchLog {
  id: string;
  user_id: string | null;
  query: string;
  result_count: number | null;
  top_score: number | null;
  search_type: string | null;
  duration_ms: number | null;
  created_at: string | null;
}

function useEmbeddingOverview() {
  return useQuery({
    queryKey: ["admin-embedding-overview"],
    queryFn: async () => {
      // Count total knowledge embeddings
      const { count: embeddingCount } = await supabase
        .from("knowledge_embeddings")
        .select("*", { count: "exact", head: true });

      // Count total entries
      const { count: entryCount } = await supabase
        .from("knowledge_entries")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Count entries that have at least one embedding
      const { data: entriesWithEmb } = await supabase
        .from("knowledge_embeddings")
        .select("entry_id");

      const uniqueEntryIds = new Set(
        entriesWithEmb?.filter((e) => e.entry_id).map((e) => e.entry_id) || []
      );

      // Count knowledge files
      const { count: fileCount } = await supabase
        .from("knowledge_files")
        .select("*", { count: "exact", head: true });

      const { count: indexedFileCount } = await supabase
        .from("knowledge_files")
        .select("*", { count: "exact", head: true })
        .eq("processing_status", "completed");

      // Embedding queue stats
      const { data: queueItems } = await supabase
        .from("embedding_queue")
        .select("status");

      const queuePending = queueItems?.filter((q) => q.status === "pending").length || 0;
      const queueProcessing = queueItems?.filter((q) => q.status === "processing").length || 0;
      const queueCompleted = queueItems?.filter((q) => q.status === "completed").length || 0;
      const queueFailed = queueItems?.filter((q) => q.status === "failed").length || 0;

      // Vector search log count
      const { count: searchCount } = await supabase
        .from("vector_search_logs")
        .select("*", { count: "exact", head: true });

      return {
        totalEmbeddings: embeddingCount || 0,
        totalEntries: entryCount || 0,
        entriesWithEmbeddings: uniqueEntryIds.size,
        totalFiles: fileCount || 0,
        indexedFiles: indexedFileCount || 0,
        queue: {
          pending: queuePending,
          processing: queueProcessing,
          completed: queueCompleted,
          failed: queueFailed,
          total: (queueItems?.length || 0),
        },
        totalSearches: searchCount || 0,
      };
    },
  });
}

function useEmbeddingQueue() {
  return useQuery({
    queryKey: ["admin-embedding-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("embedding_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as EmbeddingQueueItem[];
    },
  });
}

function useVectorSearchLogs() {
  return useQuery({
    queryKey: ["admin-vector-search-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vector_search_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as VectorSearchLog[];
    },
  });
}

export default function EmbeddingsExplorer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: overview, isLoading: overviewLoading } = useEmbeddingOverview();
  const { data: queue = [], isLoading: queueLoading } = useEmbeddingQueue();
  const { data: searchLogs = [], isLoading: logsLoading } = useVectorSearchLogs();

  // Trigger batch embedding via edge function
  const triggerBatch = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "auto-embed-knowledge-entry",
        { body: { batch: true } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-embedding-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-embedding-queue"] });
      toast({
        title: "Batch Embedding Started",
        description: `Processing ${data?.processed || "entries"}. This may take a few moments.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getQueueStatusBadge = (status: string | null) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      processing: { variant: "default", icon: Loader2 },
      completed: { variant: "secondary", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: AlertCircle },
      cancelled: { variant: "outline", icon: AlertCircle },
    };
    const { variant, icon: Icon } = config[status || "pending"] || config.pending;
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
        {status || "pending"}
      </Badge>
    );
  };

  const coveragePercent = overview
    ? overview.totalEntries > 0
      ? Math.round((overview.entriesWithEmbeddings / overview.totalEntries) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Embeddings Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor embedding coverage, queue status, and vector search analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-embedding-overview"] });
              queryClient.invalidateQueries({ queryKey: ["admin-embedding-queue"] });
              queryClient.invalidateQueries({ queryKey: ["admin-vector-search-logs"] });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => triggerBatch.mutate()}
            disabled={triggerBatch.isPending}
          >
            {triggerBatch.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Run Batch Embedding
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overviewLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : overview && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Total Embeddings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalEmbeddings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">embedding chunks stored</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Entry Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview.entriesWithEmbeddings} / {overview.totalEntries}
                </div>
                <Progress value={coveragePercent} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">{coveragePercent}% embedded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Queue Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.queue.pending + overview.queue.processing}</div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{overview.queue.pending} pending</Badge>
                  <Badge variant="default" className="text-xs">{overview.queue.processing} active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Total Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalSearches.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">vector search queries logged</p>
              </CardContent>
            </Card>
          </div>

          {/* Queue Summary */}
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: "Pending", count: overview.queue.pending, icon: Clock, color: "text-yellow-600" },
              { label: "Processing", count: overview.queue.processing, icon: Loader2, color: "text-blue-600" },
              { label: "Completed", count: overview.queue.completed, icon: CheckCircle2, color: "text-green-600" },
              { label: "Failed", count: overview.queue.failed, icon: AlertCircle, color: "text-red-600" },
              { label: "Files Indexed", count: overview.indexedFiles, icon: FileText, color: "text-purple-600" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="text-xl font-bold mt-1">{item.count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Tabs: Queue / Search Logs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="search-logs" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Search Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Queue</CardTitle>
              <CardDescription>
                Recent embedding processing jobs (most recent 50)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {queueLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : queue.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <Brain className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No items in the embedding queue
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.entity_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {item.entity_id}
                        </TableCell>
                        <TableCell>{item.priority ?? 0}</TableCell>
                        <TableCell>{getQueueStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          {item.attempts ?? 0} / {item.max_attempts ?? 3}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {item.error_message ? (
                            <span className="text-xs text-destructive line-clamp-2">
                              {item.error_message}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.created_at ? formatDateTime(item.created_at) : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search-logs">
          <Card>
            <CardHeader>
              <CardTitle>Vector Search Logs</CardTitle>
              <CardDescription>
                Recent semantic search queries and their performance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchLogs.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2">
                  <Search className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No search logs recorded yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Top Score</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Searched At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="max-w-[300px]">
                          <span className="line-clamp-1 text-sm">{log.query}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.search_type || "semantic"}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.result_count ?? 0}</TableCell>
                        <TableCell>
                          {log.top_score != null ? (
                            <span className="font-mono text-sm">
                              {(log.top_score * 100).toFixed(1)}%
                            </span>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell>
                          {log.duration_ms != null ? (
                            <span className="text-sm">{log.duration_ms}ms</span>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.created_at ? formatDateTime(log.created_at) : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
