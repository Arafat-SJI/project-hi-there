/**
 * Meeting Detail V2 Page
 *
 * Loads single meeting from meetings_v2 by id or slug. Redirects to canonical slug URL if opened by UUID.
 * Tabs: Details, Agenda, Takeaways, Participants (v2).
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  ListChecks,
  ClipboardList,
  Users,
  Loader2,
  MapPin,
} from "lucide-react";
import { useMeetingV2 } from "../hooks/useMeetingsV2";
import { formatMeetingDateTime } from "../utils";
import { AgendaTab } from "../components/agenda/AgendaTab";
import { TakeawaysTab } from "../components/takeaways/TakeawaysTab";
import { useMeetingParticipantsV2 } from "../hooks/useMeetingParticipantsV2";
import type { MeetingDetailTab } from "../types";
import type { MeetingV2Schedule } from "../types/meetings";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const typeLabels: Record<string, string> = {
  internal: "Internal",
  client: "Client",
  project: "Project",
  l10: "L10",
  one_on_one: "One-on-One",
};

export default function MeetingDetailV2Page() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MeetingDetailTab>("details");

  const { data: meeting, isLoading } = useMeetingV2(idOrSlug);

  // Redirect to canonical slug URL when meeting has slug and URL is by UUID
  useEffect(() => {
    if (!meeting || !idOrSlug) return;
    if (!meeting.slug) return;
    if (!UUID_REGEX.test(idOrSlug)) return;
    navigate(`/meetings/schedule/${meeting.slug}`, { replace: true });
  }, [meeting, idOrSlug, navigate]);

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
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/meetings/schedule")}
        >
          Back to Schedule
        </Button>
      </div>
    );
  }

  const m = meeting as MeetingV2Schedule;
  const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    scheduled: { label: "Scheduled", variant: "default" },
    in_progress: { label: "In Progress", variant: "secondary" },
    completed: { label: "Completed", variant: "outline" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };
  const statusInfo = statusBadges[m.status] ?? {
    label: m.status,
    variant: "outline" as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/meetings/schedule")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{m.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="outline">{typeLabels[m.type] ?? m.type}</Badge>
            </div>
          </div>
        </div>
      </div>

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
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.scheduled_at && (
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Date & time"
                    value={formatMeetingDateTime(m.scheduled_at, m.timezone)}
                  />
                )}
                {m.duration_minutes != null && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Duration"
                    value={`${m.duration_minutes} minutes`}
                  />
                )}
                {m.location && (
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Location"
                    value={m.location}
                  />
                )}
                {m.timezone && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Timezone"
                    value={m.timezone}
                  />
                )}
              </CardContent>
            </Card>
            {m.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {m.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="mt-4">
          <AgendaTab meetingId={m.id} />
        </TabsContent>

        <TabsContent value="takeaways" className="mt-4">
          <TakeawaysTab meetingId={m.id} />
        </TabsContent>

        <TabsContent value="participants" className="mt-4">
          <ParticipantsV2Tab meetingId={m.id} />
        </TabsContent>
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

function ParticipantsV2Tab({ meetingId }: { meetingId: string }) {
  const { data: participants = [], isLoading } = useMeetingParticipantsV2(meetingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No participants added yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="font-medium">
                {p.external_name || p.external_email || (p.user_id ? "User" : "—")}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{p.role}</Badge>
                <Badge variant="secondary">{p.status}</Badge>
                {p.attended && <Badge variant="default">Attended</Badge>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
