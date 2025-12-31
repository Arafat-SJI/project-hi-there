import { useParams, useNavigate, Link } from "react-router-dom";
import { useMeeting, useDeleteMeeting } from "@/hooks/useMeetings";
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
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: meeting, isLoading } = useMeeting(id || "");
  const deleteMeeting = useDeleteMeeting();

  const handleDelete = async () => {
    if (id) {
      await deleteMeeting.mutateAsync(id);
      navigate("/meetings");
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
          {meeting.zoom_join_url && (
            <Button variant="default" asChild>
              <a href={meeting.zoom_join_url} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" />
                Join Zoom
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
                  {formatDateTime(meeting.meeting_date)}
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

            {meeting.zoom_meeting_id && (
              <div className="flex items-start gap-3">
                <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Zoom Meeting ID</p>
                  <p className="text-sm text-muted-foreground">{meeting.zoom_meeting_id}</p>
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

      {/* Summary */}
      {meeting.summary && (
        <Card>
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
            <CardDescription>Auto-generated meeting summary</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{meeting.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      {meeting.transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>Full meeting transcript</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm font-mono">{meeting.transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Files */}
      <Card>
        <CardHeader>
          <CardTitle>Related Files</CardTitle>
          <CardDescription>Meeting recordings and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No files uploaded yet</p>
            <Button variant="outline" size="sm">Upload File</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
