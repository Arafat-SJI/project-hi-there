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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  TrendingUp,
  Database,
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface SyncLog {
  id: string;
  source_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  files_synced: number;
  files_created: number;
  files_updated: number;
  files_deleted: number;
  files_failed: number;
  error_message: string | null;
  metadata: Record<string, any>;
  knowledge_sources?: {
    id: string;
    name: string;
    source_type: string;
  };
}

interface KnowledgeSource {
  id: string;
  name: string;
  source_type: string;
  is_active: boolean;
  last_synced_at: string | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export default function KnowledgeSyncStatus() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sources
  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["admin", "knowledge-sync-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_sources")
        .select("*")
        .order("last_synced_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as unknown as KnowledgeSource[];
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Fetch sync logs - check if gemini_sync_logs table exists
  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["admin", "sync-logs"],
    queryFn: async () => {
      // Try gemini_sync_logs first
      const { data: geminiLogs, error: geminiError } = await (supabase as any)
        .from("gemini_sync_logs")
        .select(`
          *,
          knowledge_sources(id, name, source_type)
        `)
        .order("started_at", { ascending: false })
        .limit(50);

      if (!geminiError && geminiLogs) {
        return geminiLogs as SyncLog[];
      }

      // Fallback to creating mock data from sources
      return [] as SyncLog[];
    },
    refetchInterval: autoRefresh ? 5000 : false,
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
      queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sync-sources"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "sync-logs"] });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "syncing":
      case "in_progress":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "destructive" | "outline" | "secondary" }
    > = {
      pending: { variant: "outline" },
      syncing: { variant: "secondary" },
      in_progress: { variant: "secondary" },
      completed: { variant: "default" },
      success: { variant: "default" },
      failed: { variant: "destructive" },
      error: { variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const activeSources = sources.filter((s) => s.sync_enabled);
  const recentSyncs = syncLogs.filter((l) =>
    new Date(l.started_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  const failedSyncs = syncLogs.filter((l) => l.status === "failed" || l.status === "error");

  // Stats
  const stats = {
    totalSources: sources.length,
    activeSources: activeSources.length,
    recentSyncs: recentSyncs.length,
    failedSyncs: failedSyncs.length,
    totalFiles: sources.reduce((sum, s) => sum + s.file_count, 0),
    successRate:
      syncLogs.length > 0
        ? Math.round(
            ((syncLogs.filter((l) => l.status === "completed" || l.status === "success").length) /
              syncLogs.length) *
              100
          )
        : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Status</h1>
          <p className="text-muted-foreground">
            Monitor knowledge source synchronization and health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin", "knowledge-sync-sources"] });
              queryClient.invalidateQueries({ queryKey: ["admin", "sync-logs"] });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Disable" : "Enable"} Auto-Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSources}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Syncs</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSources}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Syncs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSyncs}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedSyncs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Active Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sources</CardTitle>
          <CardDescription>
            Knowledge sources with synchronization enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeSources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sync sources configured
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.source_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{source.sync_frequency}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(source.sync_status)}</TableCell>
                    <TableCell>{source.file_count}</TableCell>
                    <TableCell>
                      {source.last_synced_at
                        ? formatDateTime(source.last_synced_at)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerSync.mutate(source.id)}
                        disabled={triggerSync.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>
            Detailed synchronization logs and outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync logs available yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Files Synced</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => {
                  const duration = log.completed_at
                    ? Math.round(
                        (new Date(log.completed_at).getTime() -
                          new Date(log.started_at).getTime()) /
                          1000
                      )
                    : null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.knowledge_sources?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.sync_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{log.files_synced}</TableCell>
                      <TableCell>
                        <Badge variant="default">{log.files_created}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.files_updated}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.files_deleted}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.files_failed > 0 && (
                          <Badge variant="destructive">{log.files_failed}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(log.started_at)}</TableCell>
                      <TableCell>
                        {duration !== null ? `${duration}s` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Failed Syncs Alert */}
      {failedSyncs.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Failed Syncs Requiring Attention
            </CardTitle>
            <CardDescription>
              Recent sync operations that encountered errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failedSyncs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {log.knowledge_sources?.name || "Unknown Source"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(log.started_at)}
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-destructive">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                  {log.source_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => triggerSync.mutate(log.source_id)}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
