import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, Clock, Activity } from "lucide-react";

interface GeminiCorpus {
  id: string;
  name: string;
  display_name: string | null;
  is_active: boolean | null;
  updated_at: string | null;
  created_at: string | null;
}

interface GeminiSyncLog {
  id: string;
  corpus_id: string;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export default function GeminiRAGConfig() {
  const { data: corpora = [], isLoading: loadingCorpora, error: corporaError } = useQuery({
    queryKey: ["gemini-corpora"],
    queryFn: async (): Promise<GeminiCorpus[]> => {
      const { data, error } = await supabase
        .from("gemini_corpora")
        .select("id, name, display_name, is_active, updated_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GeminiCorpus[];
    },
  });

  const { data: syncLogs = [], isLoading: loadingLogs, error: logsError } = useQuery({
    queryKey: ["gemini-sync-logs"],
    queryFn: async (): Promise<GeminiSyncLog[]> => {
      const { data, error } = await supabase
        .from("gemini_sync_logs")
        .select("id, corpus_id, status, started_at, completed_at, error_message")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as GeminiSyncLog[];
    },
  });

  const corpusById = new Map(corpora.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Gemini RAG Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of Gemini corpora, sync status, and recent sync logs.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Corpora</CardTitle>
          <CardDescription>Configured Gemini corpora for knowledge synchronization</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCorpora ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : corporaError ? (
            <p className="text-sm text-red-500">
              Failed to load corpora: {corporaError.message}
            </p>
          ) : corpora.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Gemini corpora configured yet. Create corpora via backend tooling or SQL.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last synced</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corpora.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        {c.display_name && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {c.display_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.updated_at
                        ? new Date(c.updated_at).toLocaleString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Recent sync runs
          </CardTitle>
          <CardDescription>Last 50 Gemini sync executions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logsError ? (
            <p className="text-sm text-red-500">
              Failed to load sync logs: {logsError.message}
            </p>
          ) : syncLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sync logs recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corpus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => {
                  const corpus = corpusById.get(log.corpus_id);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {corpus?.name || "Unknown corpus"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.corpus_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === "completed"
                              ? "default"
                              : log.status === "running"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {log.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.started_at
                          ? new Date(log.started_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.completed_at
                          ? new Date(log.completed_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[260px]">
                        {log.error_message ? (
                          <span className="text-red-500 line-clamp-2">
                            {log.error_message}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

