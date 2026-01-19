import { useParams, useNavigate, Link } from "react-router-dom";
import { useMeeting, useDeleteMeeting } from "@/hooks/useMeetings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Video,
  User,
  Loader2,
  FileText,
  Sparkles,
  CheckSquare,
  MessageSquare,
  Tag,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { ZoomFileList } from "@/components/meetings/ZoomFileList";
import { MeetingFileList } from "@/components/meetings/MeetingFileList";
import { useSyncMeetingProvider, MeetingProvider } from "@/hooks/useSyncMeetingProvider";

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [extractingActions, setExtractingActions] = useState(false);
  const [categorizingMeeting, setCategorizingMeeting] = useState(false);

  const { data: meeting, isLoading } = useMeeting(id || "");
  const deleteMeeting = useDeleteMeeting();
  const { isFeatureEnabled } = useFeatureFlags();
  const syncMeetingProvider = useSyncMeetingProvider();
  const useGenericMeetings = isFeatureEnabled("useGenericMeetings");

  const provider = (meeting?.provider ||
    (meeting?.meeting_type === "teams" ? "microsoft_teams" : "zoom")) as MeetingProvider;
  const joinUrl = meeting?.join_url || meeting?.zoom_join_url;
  const meetingIdLabel = useGenericMeetings ? "Meeting ID" : "Zoom Meeting ID";
  const meetingIdValue = meeting?.external_meeting_id || meeting?.zoom_meeting_id;
  const canSyncFiles = provider === "zoom";

  const handleDelete = async () => {
    if (id) {
      await deleteMeeting.mutateAsync(id);
      navigate("/meetings");
    }
  };

  const handleGenerateSummary = async () => {
    if (!meeting || !user || !id) return;

    setGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meeting-summary", {
        body: {
          meeting_id: id,
          meeting_title: meeting.title,
          meeting_description: meeting.description,
          meeting_transcript: meeting.metadata?.transcript || null,
          user_id: user.id,
        },
      });

      if (error) throw error;

      // Update meeting metadata with summary
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          metadata: {
            ...meeting.metadata,
            summary: data.summary,
          },
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Invalidate query to refetch meeting
      queryClient.invalidateQueries({ queryKey: ["meetings", "detail", id] });

      toast.success("Meeting summary generated successfully!");
    } catch (error: any) {
      console.error("Generate summary error:", error);
      toast.error(error.message || "Failed to generate summary. Ensure edge function is deployed.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleExtractActionItems = async () => {
    if (!meeting || !user || !id) return;

    setExtractingActions(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meeting-summary", {
        body: {
          meeting_id: id,
          meeting_title: meeting.title,
          meeting_description: meeting.description,
          meeting_transcript: meeting.metadata?.transcript || null,
          user_id: user.id,
          extract_actions: true,
        },
      });

      if (error) throw error;

      // Update meeting metadata with action items
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          metadata: {
            ...meeting.metadata,
            action_items: data.action_items || [],
          },
        })
        .eq("id", id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["meetings", "detail", id] });

      toast.success("Action items extracted successfully!");
    } catch (error: any) {
      console.error("Extract actions error:", error);
      toast.error(error.message || "Failed to extract action items. Ensure edge function is deployed.");
    } finally {
      setExtractingActions(false);
    }
  };

  const handleCategorizeMeeting = async () => {
    if (!meeting || !user || !id) return;

    setCategorizingMeeting(true);
    try {
      const { data, error } = await supabase.functions.invoke("categorize-meeting", {
        body: {
          meeting_id: id,
          meeting_title: meeting.title,
          meeting_description: meeting.description,
          user_id: user.id,
        },
      });

      if (error) throw error;

      // Update meeting metadata with category
      const { error: updateError } = await supabase
        .from("meetings")
        .update({
          metadata: {
            ...meeting.metadata,
            category: data.category,
            category_confidence: data.confidence,
          },
        })
        .eq("id", id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["meetings", "detail", id] });

      toast.success(`Meeting categorized as: ${data.category}`);
    } catch (error: any) {
      console.error("Categorize meeting error:", error);
      toast.error(error.message || "Failed to categorize meeting. Ensure edge function is deployed.");
    } finally {
      setCategorizingMeeting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      scheduled: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getJoinButtonLabel = (meetingProvider: MeetingProvider) => {
    const labels: Record<MeetingProvider, string> = {
      zoom: "Join Zoom",
      google_meet: "Join Google Meet",
      microsoft_teams: "Join Teams Meeting",
      webex: "Join Webex",
      other: "Join Meeting",
    };

    return labels[meetingProvider] || "Join Meeting";
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Meeting not found</p>
        <Button onClick={() => navigate("/meetings")}>Back to Meetings</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
              {getStatusBadge(meeting.status)}
            </div>
            <p className="text-muted-foreground">Meeting Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {joinUrl && (
            <Button variant="default" asChild>
              <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" />
                {getJoinButtonLabel(provider)}
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to={`/meetings/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this meeting? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* AI Insights Actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Generate intelligent summaries, extract action items, and categorize this meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateSummary}
              disabled={generatingSummary || !meeting?.description}
            >
              {generatingSummary ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              {meeting?.metadata?.summary ? "Regenerate Summary" : "Generate Summary"}
            </Button>
            <Button
              variant="outline"
              onClick={handleExtractActionItems}
              disabled={extractingActions || !meeting?.description}
            >
              {extractingActions ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckSquare className="mr-2 h-4 w-4" />
              )}
              {meeting?.metadata?.action_items ? "Re-extract Actions" : "Extract Action Items"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCategorizeMeeting}
              disabled={categorizingMeeting}
            >
              {categorizingMeeting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Tag className="mr-2 h-4 w-4" />
              )}
              {meeting?.metadata?.category ? "Re-categorize" : "Categorize Meeting"}
            </Button>
          </div>
          {(!meeting?.description && !meeting?.metadata?.transcript) && (
            <p className="mt-3 text-sm text-muted-foreground">
              Add a description or transcript to enable AI features
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meeting Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>Basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.scheduled_at ? formatDateTime(meeting.scheduled_at) : "Not scheduled"}
                </p>
              </div>
            </div>

            {meeting.duration_minutes && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {meeting.duration_minutes} minutes
                  </p>
                </div>
              </div>
            )}

            {meeting.clients && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Client</p>
                  <Link
                    to={`/clients/${meeting.client_id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {meeting.clients.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{meeting.clients.email}</p>
                </div>
              </div>
            )}

            {meetingIdValue && (
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{meetingIdLabel}</p>
                  <p className="text-sm text-muted-foreground">{meetingIdValue}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Record details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="mt-1">{getStatusBadge(meeting.status)}</div>
            </div>
            {meeting.metadata?.category && (
              <div>
                <p className="text-sm font-medium">Category</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {meeting.metadata.category}
                  </Badge>
                  {meeting.metadata.category_confidence && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(meeting.metadata.category_confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(meeting.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(meeting.updated_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {meeting.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
            <CardDescription>Meeting agenda and notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{meeting.description}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {meeting.metadata?.summary && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Generated Summary
            </CardTitle>
            <CardDescription>Intelligent meeting summary powered by AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{meeting.metadata.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {meeting.metadata?.action_items && Array.isArray(meeting.metadata.action_items) && meeting.metadata.action_items.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Action Items
            </CardTitle>
            <CardDescription>
              {meeting.metadata.action_items.length} action {meeting.metadata.action_items.length === 1 ? 'item' : 'items'} extracted from this meeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {meeting.metadata.action_items.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{typeof item === 'string' ? item : item.task}</p>
                    {typeof item === 'object' && item.assignee && (
                      <p className="text-xs text-muted-foreground">Assigned to: {item.assignee}</p>
                    )}
                    {typeof item === 'object' && item.due_date && (
                      <p className="text-xs text-muted-foreground">Due: {item.due_date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {meeting.metadata?.transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meeting Transcript
            </CardTitle>
            <CardDescription>Full recording transcription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{meeting.metadata.transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Files */}
      {useGenericMeetings ? (
        <MeetingFileList
          meetingId={meeting.id}
          provider={provider}
          onSync={
            canSyncFiles
              ? () => syncMeetingProvider.mutateAsync({ provider })
              : undefined
          }
          isSyncing={syncMeetingProvider.isPending}
        />
      ) : (
        <ZoomFileList
          meetingId={meeting.id}
          onSync={
            canSyncFiles
              ? () => syncMeetingProvider.mutateAsync({ provider: "zoom" })
              : undefined
          }
          isSyncing={syncMeetingProvider.isPending}
        />
      )}
    </div>
  );
}
