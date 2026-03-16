import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRelativeTime } from "@/lib/integration-utils";

interface ClickUpSyncLog {
  id: string;
  created_at: string;
  status: "success" | "error" | "partial";
  response_metadata: {
    projects_synced?: number;
    tasks_synced?: number;
    duration_ms?: number;
  } | null;
  error_message: string | null;
}

interface ClickUpProviderRow {
  id: string;
}

export function SyncMonitoringDashboard(): JSX.Element {
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["clickup-sync-logs"],
    queryFn: async (): Promise<ClickUpSyncLog[]> => {
      const { data: providerRow, error: providerError } = await supabase
        .from("integration_providers")
        .select("id")
        .eq("slug", "clickup")
        .maybeSingle();

      if (providerError) {
        throw providerError;
      }

      const providerId = (providerRow as ClickUpProviderRow | null)?.id;
      if (!providerId) {
        return [];
      }

      const { data: logs, error: logsError } = await supabase
        .from("integration_usage_logs")
        .select("id, created_at, status, response_metadata, error_message")
        .eq("provider_id", providerId)
        .eq("action", "sync-clickup")
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsError) {
        throw logsError;
      }

      return (logs ?? []) as unknown as ClickUpSyncLog[];
    },
    staleTime: 60 * 1000,
  });

  const latest = useMemo(() => (data && data.length > 0 ? data[0] : null), [data]);

  const renderStatusBadge = (status: ClickUpSyncLog["status"] | null): JSX.Element => {
    if (status === "success") {
      return (
        <Badge variant="outline" className="gap-1 border-green-500 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </Badge>
      );
    }
    if (status === "partial") {
      return (
        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Partial
        </Badge>
      );
    }
    if (status === "error") {
      return (
        <Badge variant="outline" className="gap-1 border-red-500 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        Unknown
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">ClickUp Sync Status</CardTitle>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Auto-refresh
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {renderStatusBadge(latest.status)}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(latest.created_at)}
            </span>
            <span className="text-muted-foreground">
              {latest.response_metadata?.projects_synced ?? 0} projects,{" "}
              {latest.response_metadata?.tasks_synced ?? 0} tasks
            </span>
            {typeof latest.response_metadata?.duration_ms === "number" && (
              <span className="text-muted-foreground">
                {(latest.response_metadata.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No ClickUp syncs have been recorded yet. Run a sync to see status here.
          </p>
        )}

        {data && data.length > 0 && (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Started</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-[80px] text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{renderStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-xs">
                      {log.error_message ? (
                        <span className="text-red-600 dark:text-red-400">
                          {log.error_message.slice(0, 120)}
                          {log.error_message.length > 120 ? "…" : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {(log.response_metadata?.projects_synced ?? 0)} projects,{" "}
                          {(log.response_metadata?.tasks_synced ?? 0)} tasks
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">
                      {typeof log.response_metadata?.duration_ms === "number"
                        ? `${(log.response_metadata.duration_ms / 1000).toFixed(1)}s`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
