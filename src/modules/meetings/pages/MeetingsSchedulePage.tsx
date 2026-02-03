/**
 * Meetings Schedule Page
 *
 * Meeting list with toggle between list and calendar views.
 * Includes tabs for Schedule, Efficiency, and Action Items.
 * Replaces the old Meetings page with enhanced features.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Calendar,
  List,
  Search,
  Video,
  Clock,
  Loader2,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useMeetings, type Meeting } from "@/hooks/useMeetings";
import { MeetingsCalendar } from "../components/calendar/MeetingsCalendar";
import { MeetingEfficiencyDashboard } from "../components/MeetingEfficiencyDashboard";
import { ActionItemsPanel } from "../components/ActionItemsPanel";

type ViewMode = "list" | "calendar";
type PageTab = "schedule" | "efficiency" | "action-items";

const statusBadges: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
  no_show: { label: "No Show", className: "bg-red-100 text-red-800" },
};

export default function MeetingsSchedulePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [pageTab, setPageTab] = useState<PageTab>("schedule");

  const { data: meetings = [], isLoading } = useMeetings(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const filteredMeetings = meetings.filter((m) => {
    if (!search) return true;
    return m.title.toLowerCase().includes(search.toLowerCase());
  });

  // Stats
  const scheduled = meetings.filter((m) => m.status === "scheduled").length;
  const completed = meetings.filter((m) => m.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage meetings</p>
        </div>
        <Button onClick={() => navigate("/meetings/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Meeting
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={pageTab} onValueChange={(v) => setPageTab(v as PageTab)}>
        <TabsList>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="efficiency">
            <BarChart3 className="h-4 w-4 mr-2" />
            Efficiency
          </TabsTrigger>
          <TabsTrigger value="action-items">
            <ClipboardList className="h-4 w-4 mr-2" />
            Action Items
          </TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {meetings.filter((m) => {
                    if (!m.scheduled_at) return false;
                    const d = new Date(m.scheduled_at);
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 7);
                    return d >= weekStart && d < weekEnd;
                  }).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search meetings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
            <MeetingsCalendar meetings={filteredMeetings} />
          ) : filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">No meetings found</p>
              <p className="text-sm">Schedule a meeting to get started.</p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[100px]">Provider</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map((meeting) => (
                    <TableRow
                      key={meeting.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/meetings/${meeting.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          {(meeting as any).clients?.name && (
                            <p className="text-xs text-muted-foreground">
                              {(meeting as any).clients.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {meeting.scheduled_at ? (
                          <div className="text-sm">
                            <p>{new Date(meeting.scheduled_at).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(meeting.scheduled_at).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.duration_minutes ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {meeting.duration_minutes}m
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.provider ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Video className="h-3 w-3" />
                            <span className="capitalize text-xs">
                              {meeting.provider.replace("_", " ")}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {meeting.status && statusBadges[meeting.status] ? (
                          <Badge className={statusBadges[meeting.status].className}>
                            {statusBadges[meeting.status].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{meeting.status || "unknown"}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency">
          <MeetingEfficiencyDashboard />
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="action-items">
          <ActionItemsPanel showMeetingTitle={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
