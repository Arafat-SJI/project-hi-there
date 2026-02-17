/**
 * Create Meeting Dialog
 *
 * Dialog form for creating a new meeting in meetings_v2 table.
 * Includes title, type, datetime, duration, location, participants.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useCreateMeetingV2 } from "../../hooks/useMeetingsV2";
import DateTimePicker from "../common/DateTimePicker";
import type { MeetingType } from "../../types/meetings";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateMeetingDialog({
  open,
  onOpenChange,
}: CreateMeetingDialogProps) {
  const createMeeting = useCreateMeetingV2();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<MeetingType>("internal");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    // Default to 1 hour from now, rounded to next 15 minutes
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setHours(now.getHours() + 1);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [location, setLocation] = useState("");
  const [notifyParticipants, setNotifyParticipants] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      await createMeeting.mutateAsync({
        title: title.trim(),
        meeting_type: type,
        description: description.trim() || undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: parseInt(durationMinutes) || 60,
        location: location.trim() || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notify_participants: notifyParticipants,
      });

      // Reset form
      setTitle("");
      setType("internal");
      setDescription("");
      setScheduledAt(() => {
        const now = new Date();
        now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
        now.setHours(now.getHours() + 1);
        now.setSeconds(0);
        now.setMilliseconds(0);
        return now.toISOString().slice(0, 16);
      });
      setDurationMinutes("60");
      setLocation("");
      setNotifyParticipants(false);

      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Team Sync"
              required
              disabled={createMeeting.isPending}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MeetingType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="l10">L10</SelectItem>
                <SelectItem value="one_on_one">One-on-One</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda and notes..."
              rows={3}
              disabled={createMeeting.isPending}
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label>
              Date & Time <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker
              value={scheduledAt}
              onChange={setScheduledAt}
              timezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
              disabled={createMeeting.isPending}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
              disabled={createMeeting.isPending}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Conference Room A / Zoom / Teams"
              disabled={createMeeting.isPending}
            />
          </div>

          {/* Notify Participants */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={notifyParticipants}
              onCheckedChange={(checked) => setNotifyParticipants(checked === true)}
              disabled={createMeeting.isPending}
            />
            <Label htmlFor="notify" className="font-normal cursor-pointer">
              Notify participants
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMeeting.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending || !title.trim()}>
              {createMeeting.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Meeting
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

