import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMeeting, useCreateMeeting, useUpdateMeeting } from "@/hooks/useMeetings";
import { useClients } from "@/hooks/useClients";
import { meetingSchema, MeetingFormData } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function MeetingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: meeting, isLoading: loadingMeeting } = useMeeting(id || "");
  const { data: clients } = useClients();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
  });

  const clientId = watch("client_id");

  useEffect(() => {
    if (meeting) {
      reset({
        title: meeting.title,
        description: meeting.description || "",
        meeting_date: meeting.meeting_date.slice(0, 16), // Format for datetime-local
        duration_minutes: meeting.duration_minutes || undefined,
        client_id: meeting.client_id || "",
        zoom_meeting_id: meeting.zoom_meeting_id || "",
        zoom_join_url: meeting.zoom_join_url || "",
      });
    }
  }, [meeting, reset]);

  const onSubmit = async (data: MeetingFormData) => {
    try {
      const formattedData = {
        ...data,
        client_id: data.client_id || null,
        duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : null,
      };

      if (isEdit && id) {
        await updateMeeting.mutateAsync({ id, data: formattedData });
      } else {
        await createMeeting.mutateAsync(formattedData);
      }
      navigate("/meetings");
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isSubmitting = createMeeting.isPending || updateMeeting.isPending;

  if (loadingMeeting) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/meetings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Edit Meeting" : "Schedule Meeting"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update meeting details" : "Create a new meeting"}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Information</CardTitle>
          <CardDescription>
            Fill in the meeting details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Title */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Weekly Team Sync"
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Meeting Date */}
              <div className="space-y-2">
                <Label htmlFor="meeting_date">
                  Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting_date"
                  type="datetime-local"
                  {...register("meeting_date")}
                  disabled={isSubmitting}
                />
                {errors.meeting_date && (
                  <p className="text-sm text-destructive">{errors.meeting_date.message}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  {...register("duration_minutes")}
                  placeholder="60"
                  disabled={isSubmitting}
                />
                {errors.duration_minutes && (
                  <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
                )}
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={clientId}
                  onValueChange={(value) => setValue("client_id", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-sm text-destructive">{errors.client_id.message}</p>
                )}
              </div>

              {/* Zoom Meeting ID */}
              <div className="space-y-2">
                <Label htmlFor="zoom_meeting_id">Zoom Meeting ID</Label>
                <Input
                  id="zoom_meeting_id"
                  {...register("zoom_meeting_id")}
                  placeholder="123 456 7890"
                  disabled={isSubmitting}
                />
                {errors.zoom_meeting_id && (
                  <p className="text-sm text-destructive">{errors.zoom_meeting_id.message}</p>
                )}
              </div>

              {/* Zoom Join URL */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="zoom_join_url">Zoom Join URL</Label>
                <Input
                  id="zoom_join_url"
                  type="url"
                  {...register("zoom_join_url")}
                  placeholder="https://zoom.us/j/123456789"
                  disabled={isSubmitting}
                />
                {errors.zoom_join_url && (
                  <p className="text-sm text-destructive">{errors.zoom_join_url.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Meeting agenda and notes..."
                  rows={4}
                  disabled={isSubmitting}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/meetings")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEdit ? "Update Meeting" : "Schedule Meeting"}</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
