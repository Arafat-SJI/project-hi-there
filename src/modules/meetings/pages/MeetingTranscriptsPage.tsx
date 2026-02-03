/**
 * Meeting Transcripts Page
 *
 * Lists meetings that have transcripts, with search, status filter,
 * and transcript preview. Links to meeting detail for full transcript view.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  FileText,
  FileAudio,
  MessageSquare,
  ExternalLink,
  Eye,
} from "lucide-react";

interface TranscriptRow {
  id: string;
  meeting_id: string;
  content: string | null;
  summary: string | null;
  speakers: string[] | null;
  source: string | null;
  processing_status: string | null;
  created_at: string;
  meeting_title: string;
  meeting_date: string | null;
}

function useMeetingTranscripts(search: string, statusFilter: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["meeting-transcripts", search, statusFilter],
    queryFn: async (): Promise<TranscriptRow[]> => {
      // Fetch transcripts joined with meeting title
      const { data, error } = await (supabase as any)
        .from("meeting_transcripts")
        .select("id, meeting_id, content, summary, speakers, source, processing_status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get meeting IDs and fetch titles
      const meetingIds = [...new Set((data as any[]).map((t: any) => t.meeting_id))];
      const { data: meetings } = await (supabase as any)
        .from("meetings")
        .select("id, title, scheduled_at")
        .in("id", meetingIds);

      const meetingMap = new Map<string, { title: string; date: string | null }>(
        (meetings || []).map((m: any) => [m.id, { title: m.title, date: m.scheduled_at }])
      );

      let rows: TranscriptRow[] = (data as any[]).map((t: any) => {
        const meeting = meetingMap.get(t.meeting_id) || { title: "Unknown Meeting", date: null };
        return {
          ...t,
          meeting_title: meeting.title,
          meeting_date: meeting.date,
        };
      });

      // Apply search filter
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(
          (r) =>
            r.meeting_title.toLowerCase().includes(q) ||
            (r.content && r.content.toLowerCase().includes(q)) ||
            (r.summary && r.summary.toLowerCase().includes(q))
        );
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        rows = rows.filter((r) => r.processing_status === statusFilter);
      }

      return rows;
    },
    enabled: !!user,
  });
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  processing: "#f59e0b",
  pending: "#6b7280",
  failed: "#ef4444",
};

export default function MeetingTranscriptsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewTranscript, setPreviewTranscript] = useState<TranscriptRow | null>(null);
  const navigate = useNavigate();

  const { data: transcripts, isLoading } = useMeetingTranscripts(search, statusFilter);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = (transcripts || []).length;
  const withSummary = (transcripts || []).filter((t) => t.summary).length;
  const completed = (transcripts || []).filter((t) => t.processing_status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meeting Transcripts</h1>
        <p className="text-muted-foreground">
          Browse and search through transcripts from recorded meetings.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Total Transcripts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">With AI Summary</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{withSummary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileAudio className="h-4 w-4" />
              <span className="text-sm">Processed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{completed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcripts by meeting title or content…"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transcript Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Speakers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transcripts || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Transcripts</h3>
                  <p className="text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "No transcripts match your filters."
                      : "Meeting transcripts will appear here after Zoom recordings are synced and processed."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              (transcripts || []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <button
                      className="font-medium text-primary hover:underline text-left"
                      onClick={() => navigate(`/meetings/${t.meeting_id}`)}
                    >
                      {t.meeting_title}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.meeting_date
                      ? new Date(t.meeting_date).toLocaleDateString()
                      : new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {t.source || "manual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.speakers && t.speakers.length > 0
                      ? `${t.speakers.length} speaker${t.speakers.length > 1 ? "s" : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: STATUS_COLORS[t.processing_status || "pending"] || "#6b7280",
                        color: STATUS_COLORS[t.processing_status || "pending"] || "#6b7280",
                      }}
                    >
                      {t.processing_status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {t.summary ? t.summary.substring(0, 60) + "…" : "No summary"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTranscript(t)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/meetings/${t.meeting_id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTranscript} onOpenChange={() => setPreviewTranscript(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewTranscript?.meeting_title}</DialogTitle>
          </DialogHeader>
          {previewTranscript?.summary && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">AI Summary</h4>
              <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                {previewTranscript.summary}
              </p>
            </div>
          )}
          {previewTranscript?.speakers && previewTranscript.speakers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Speakers</h4>
              <div className="flex gap-1 flex-wrap">
                {previewTranscript.speakers.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-sm font-semibold mb-1">Transcript Content</h4>
            <pre className="text-xs bg-muted rounded-md p-4 whitespace-pre-wrap max-h-96 overflow-auto">
              {previewTranscript?.content || "No transcript content available."}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
