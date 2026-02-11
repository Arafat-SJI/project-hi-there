/**
 * Meeting Detail V2 Page
 *
 * Tabbed meeting detail view with: Details, Agenda, Takeaways, Participants, Transcript.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Edit,
  Loader2,
  Users,
  FileText,
  ListChecks,
  ClipboardList,
  CheckSquare,
  History,
  ScrollText,
} from "lucide-react";
import { useMeeting } from "@/hooks/useMeetings";
import { formatMeetingDateTime } from "../utils";
import { AgendaTab } from "../components/agenda/AgendaTab";
import { TakeawaysTab } from "../components/takeaways/TakeawaysTab";
import { ParticipantsTab } from "../components/participants/ParticipantsTab";
import { RelatedTasksTab } from "../components/RelatedTasksTab";
import { SeriesHistoryTab } from "../components/series/SeriesHistoryTab";
import { TranscriptTab } from "../components/transcript/TranscriptTab";
import { MeetingParticipantSelector } from "../components/participants/MeetingParticipantSelector";
import { PreviousAgendaViewer } from "../components/agenda/PreviousAgendaViewer";
import { useExtractMeetingTasks, useCreateTasksFromExtraction } from "../hooks/useExtractMeetingTasks";
import type { ExtractedTask } from "../hooks/useExtractMeetingTasks";
import { Checkbox } from "@/components/ui/checkbox";
import type { MeetingDetailTab } from "../types";

export default function MeetingDetailV2Page() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MeetingDetailTab>("details");

  const { data: meeting, isLoading } = useMeeting(id!);
  const extractTasks = useExtractMeetingTasks();
  const createTasksFromExtraction = useCreateTasksFromExtraction();
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Meeting not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/meetings")}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  const statusBadges: Record<string, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
  };

  const statusInfo = statusBadges[meeting.status || ""] || {
    label: meeting.status || "Unknown",
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
              {meeting.provider && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  <span className="capitalize">{meeting.provider.replace("_", " ")}</span>
                </Badge>
              )}
              {(meeting as any).clients?.name && (
                <Badge variant="secondary">{(meeting as any).clients.name}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meeting.join_url && (
            <Button variant="outline" asChild>
              <a href={meeting.join_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Join
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/meetings/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MeetingDetailTab)}>
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="takeaways" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Takeaways
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Participants
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex items-center gap-1.5">
            <ScrollText className="h-4 w-4" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="related-tasks" className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          {(meeting as any).series_id && (
            <TabsTrigger value="series-history" className="flex items-center gap-1.5">
              <History className="h-4 w-4" />
              Series
            </TabsTrigger>
          )}
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {meeting.scheduled_at && (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Date"
                    value={formatMeetingDateTime(meeting.scheduled_at, (meeting as any).timezone)}
                  />
                )}
                {meeting.duration_minutes && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Duration"
                    value={`${meeting.duration_minutes} minutes`}
                  />
                )}
                {meeting.location && (
                  <InfoRow
                    icon={<Video className="h-4 w-4" />}
                    label="Location"
                    value={meeting.location}
                  />
                )}
              </CardContent>
            </Card>

            {meeting.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {meeting.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingParticipantSelector meetingId={id!} editable={meeting.status !== "completed"} />
              </CardContent>
            </Card>

            {(meeting.metadata as any)?.summary && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {(meeting.metadata as any).summary}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Agenda Tab */}
        <TabsContent value="agenda" className="mt-4 space-y-4">
          <AgendaTab meetingId={id!} />
          {(meeting as any).series_id && (
            <PreviousAgendaViewer
              seriesId={(meeting as any).series_id}
              currentMeetingId={id!}
            />
          )}
        </TabsContent>

        {/* Takeaways Tab */}
        <TabsContent value="takeaways" className="mt-4">
          <TakeawaysTab meetingId={id!} />
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="mt-4">
          <ParticipantsTab meetingId={id!} />
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="mt-4">
          <TranscriptTab meetingId={id!} />
        </TabsContent>

        {/* Related Tasks Tab */}
        <TabsContent value="related-tasks" className="mt-4 space-y-4">
          {/* Extract Tasks from Transcript */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={extractTasks.isPending}
              onClick={() =>
                extractTasks.mutate(
                  { meetingId: id!, transcriptContent: "" },
                  {
                    onSuccess: (data) => {
                      setExtractedTasks(data);
                      setSelectedExtracted(new Set(data.map((_, i) => i)));
                    },
                  }
                )
              }
            >
              {extractTasks.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ListChecks className="h-4 w-4 mr-2" />
              )}
              {extractTasks.isPending ? "Extracting..." : "Extract Tasks from Transcript"}
            </Button>
          </div>

          {extractedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Extracted Tasks ({extractedTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {extractedTasks.map((task, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-1">
                    <Checkbox
                      checked={selectedExtracted.has(idx)}
                      onCheckedChange={(checked) => {
                        setSelectedExtracted((prev) => {
                          const next = new Set(prev);
                          if (checked) {
                            next.add(idx);
                          } else {
                            next.delete(idx);
                          }
                          return next;
                        });
                      }}
                    />
                    <span className="text-sm flex-1">{task.content}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {Math.round(task.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <Button
                    size="sm"
                    disabled={selectedExtracted.size === 0 || createTasksFromExtraction.isPending}
                    onClick={() => {
                      const selected = extractedTasks.filter((_, i) =>
                        selectedExtracted.has(i)
                      );
                      createTasksFromExtraction.mutate(
                        { meetingId: id!, tasks: selected },
                        {
                          onSuccess: () => {
                            setExtractedTasks([]);
                            setSelectedExtracted(new Set());
                          },
                        }
                      );
                    }}
                  >
                    {createTasksFromExtraction.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckSquare className="h-4 w-4 mr-2" />
                    )}
                    Create Selected Tasks ({selectedExtracted.size})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <RelatedTasksTab meetingId={id!} />
        </TabsContent>

        {/* Series History Tab */}
        {(meeting as any).series_id && (
          <TabsContent value="series-history" className="mt-4">
            <SeriesHistoryTab seriesId={(meeting as any).series_id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
