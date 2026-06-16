import { useKnowledgeSyncLogs } from "@/modules/knowledge/hooks/useKnowledgeDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

function HealthBadge({ status, label }: { status: string; label: string }) {
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    healthy: "default",
    warning: "secondary",
    failed: "destructive",
  };
  const icon =
    status === "healthy" ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : status === "warning" ? (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  return (
    <Badge variant={variants[status] ?? "outline"} className="flex items-center gap-1 w-fit">
      {icon}
      {label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "failed"
        ? "destructive"
        : status === "running" || status === "pending"
          ? "secondary"
          : "outline";
  return <Badge variant={variant}>{status ?? "unknown"}</Badge>;
}

export function SyncStatusSection() {
  const { data, isLoading } = useKnowledgeSyncLogs();
  const logs = data?.logs ?? [];
  const health = data?.health;
  const failedLogs = logs.filter((l) => l.status === "failed");

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sync Status</h2>
          <p className="text-sm text-muted-foreground">Read-only sync health and job history</p>
        </div>
        {health && <HealthBadge status={health.status} label={health.label} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {health?.lastSyncAt ? formatDateTime(health.lastSyncAt) : "Never"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.successRate ?? 0}%</div>
            <Progress value={health?.successRate ?? 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Failed Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{health?.failedCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Pending / Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.pendingCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 50 records</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>Detailed synchronization logs (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No sync logs available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Removed</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const duration =
                    log.completed_at && log.started_at
                      ? Math.round(
                          (new Date(log.completed_at).getTime() -
                            new Date(log.started_at).getTime()) /
                            1000
                        )
                      : null;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.sync_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{log.documents_added ?? 0}</TableCell>
                      <TableCell>{log.documents_removed ?? 0}</TableCell>
                      <TableCell>
                        {log.started_at ? formatDateTime(log.started_at) : "—"}
                      </TableCell>
                      <TableCell>{duration !== null ? `${duration}s` : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {failedLogs.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed Syncs Requiring Attention
            </CardTitle>
            <CardDescription>
              Manage sync operations in Integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{log.sync_type} sync</div>
                    <div className="text-xs text-muted-foreground">
                      {log.started_at ? formatDateTime(log.started_at) : "—"}
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-destructive mt-1">{log.error_message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
