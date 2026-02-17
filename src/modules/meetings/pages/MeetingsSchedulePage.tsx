/**
 * Meetings Schedule Page (All Meetings)
 *
 * Meeting list with KPI cards, tab filters (Today/Upcoming/Open/Past),
 * search, type filter, "My meetings only" checkbox, list/calendar toggle,
 * and week grouping for upcoming meetings.
 * Uses meetings_v2 table via useMeetingsV2 hook.
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek, isSameWeek, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Calendar,
  List,
  Search,
  Clock,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useMeetingsV2 } from "../hooks/useMeetingsV2";
import { useAuth } from "@/contexts/AuthContext";
import { MeetingsCalendar } from "../components/calendar/MeetingsCalendar";
import CreateMeetingDialog from "../components/dialogs/CreateMeetingDialog";
import type { MeetingV2, MeetingType } from "../types/meetings";

type ViewMode = "list" | "calendar";
type TabFilter = "today" | "upcoming" | "open" | "past";

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Scheduled", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const typeLabels: Record<MeetingType, string> = {
  internal: "Internal",
  client: "Client",
  project: "Project",
  l10: "L10",
  one_on_one: "One-on-One",
};

export default function MeetingsSchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>("list");
  const [tab, setTab] = useState<TabFilter>("upcoming");
  const [typeFilter, setTypeFilter] = useState<MeetingType | "all">("all");
  const [search, setSearch] = useState("");
  const [myMeetingsOnly, setMyMeetingsOnly] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const { data: meetings = [], isLoading } = useMeetingsV2({
    tab,
    type: typeFilter !== "all" ? typeFilter : undefined,
    search: search || undefined,
    my_meetings_only: myMeetingsOnly,
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = meetings.length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const upcoming = meetings.filter((m) => {
      if (!m.scheduled_at) return false;
      return new Date(m.scheduled_at) > new Date();
    }).length;

    return { total, completionRate, upcoming };
  }, [meetings]);

  // Group upcoming meetings by week
  const groupedByWeek = useMemo(() => {
    if (tab !== "upcoming") return null;

    const groups: Record<string, MeetingV2[]> = {};
    const now = new Date();

    meetings.forEach((meeting) => {
      if (!meeting.scheduled_at) return;
      const meetingDate = parseISO(meeting.scheduled_at);
      if (meetingDate <= now) return;

      const weekStart = startOfWeek(meetingDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }
      groups[weekKey].push(meeting);
    });

    // Sort weeks and meetings within each week
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, weekMeetings]) => ({
        weekKey,
        weekStart: parseISO(weekKey),
        meetings: weekMeetings.sort((a, b) => {
          if (!a.scheduled_at || !b.scheduled_at) return 0;
          return a.scheduled_at.localeCompare(b.scheduled_at);
        }),
      }));
  }, [meetings, tab]);

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  const handleMeetingClick = (meeting: MeetingV2) => {
    const path = meeting.slug
      ? `/meetings/schedule/${meeting.slug}`
      : `/meetings/schedule/${meeting.id}`;
    navigate(path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage your meetings</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Meetings</p>
            <p className="text-3xl font-bold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-3xl font-bold">{kpis.completionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="text-3xl font-bold">{kpis.upcoming}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tab Filters */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MeetingType | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="l10">L10</SelectItem>
            <SelectItem value="one_on_one">One-on-One</SelectItem>
          </SelectContent>
        </Select>

        {/* My Meetings Only */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="my-meetings"
            checked={myMeetingsOnly}
            onCheckedChange={(checked) => setMyMeetingsOnly(checked === true)}
          />
          <Label htmlFor="my-meetings" className="text-sm font-normal cursor-pointer">
            My meetings only
          </Label>
        </div>

        {/* View Toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : view === "calendar" ? (
        <MeetingsCalendar meetings={meetings} />
      ) : tab === "upcoming" && groupedByWeek ? (
        // Week-grouped view for upcoming
        <div className="space-y-4">
          {groupedByWeek.map(({ weekKey, weekStart, meetings: weekMeetings }) => {
            const isExpanded = expandedWeeks.has(weekKey);
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

            return (
              <Collapsible key={weekKey} open={isExpanded} onOpenChange={() => toggleWeek(weekKey)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{weekLabel}</span>
                        <Badge variant="secondary">{weekMeetings.length}</Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Meeting</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weekMeetings.map((meeting) => (
                          <TableRow
                            key={meeting.id}
                            className="cursor-pointer"
                            onClick={() => handleMeetingClick(meeting)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{meeting.title}</p>
                                {meeting.clients?.name && (
                                  <p className="text-xs text-muted-foreground">
                                    {meeting.clients.name}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {meeting.scheduled_at ? (
                                <div className="text-sm">
                                  <p>{format(parseISO(meeting.scheduled_at), "MMM d, yyyy")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(meeting.scheduled_at), "h:mm a")}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not scheduled</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {meeting.duration_minutes}m
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {typeLabels[meeting.type] || meeting.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {statusBadges[meeting.status] ? (
                                <Badge variant={statusBadges[meeting.status].variant}>
                                  {statusBadges[meeting.status].label}
                                </Badge>
                              ) : (
                                <Badge variant="outline">{meeting.status}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
          {groupedByWeek.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No upcoming meetings</p>
            </div>
          )}
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No meetings found</p>
          <p className="text-sm">Create a meeting to get started.</p>
        </div>
      ) : (
        // Regular list view for other tabs
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Meeting</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => (
                <TableRow
                  key={meeting.id}
                  className="cursor-pointer"
                  onClick={() => handleMeetingClick(meeting)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.clients?.name && (
                        <p className="text-xs text-muted-foreground">{meeting.clients.name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {meeting.scheduled_at ? (
                      <div className="text-sm">
                        <p>{format(parseISO(meeting.scheduled_at), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(meeting.scheduled_at), "h:mm a")}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {meeting.duration_minutes}m
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[meeting.type] || meeting.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {statusBadges[meeting.status] ? (
                      <Badge variant={statusBadges[meeting.status].variant}>
                        {statusBadges[meeting.status].label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{meeting.status}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Meeting Dialog */}
      <CreateMeetingDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
