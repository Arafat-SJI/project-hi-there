import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Search,
  Filter,
  Download,
  Loader2,
  User,
  FileText,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatDate } from "@/lib/utils";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
}

const ACTION_ICONS: Record<string, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: FileText,
  login: LogIn,
  logout: LogOut,
  access: Shield,
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  view: "outline",
  login: "default",
  logout: "secondary",
  access: "outline",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (resourceFilter !== "all") {
        query = query.eq("resource_type", resourceFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Fetch user emails for each log
      const logsWithUsers = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", log.user_id)
            .single();

          return {
            ...log,
            user_email: profile?.email,
          };
        })
      );

      setLogs(logsWithUsers);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Convert logs to CSV
    const csv = [
      ["Timestamp", "User", "Action", "Resource", "IP Address", "Details"].join(","),
      ...logs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          log.user_email || log.user_id,
          log.action,
          log.resource_type || "N/A",
          log.ip_address || "N/A",
          JSON.stringify(log.details || {}),
        ].join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Activity logs exported successfully");
  };

  const filteredLogs = logs.filter(
    (log) =>
      (log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.resource_type?.toLowerCase().includes(search.toLowerCase()))
  );

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string) => {
    return ACTION_COLORS[action] || "outline";
  };

  const uniqueActions = [...new Set(logs.map((log) => log.action))];
  const uniqueResources = [...new Set(logs.map((log) => log.resource_type).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor user activity and system events
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map((log) => log.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueResources.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Search and filter activity logs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map((resource) => (
                    <SelectItem key={resource} value={resource!}>
                      {resource!.charAt(0).toUpperCase() + resource!.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(log.user_email || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{log.user_email || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)} className="gap-1">
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.resource_type || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {log.details ? JSON.stringify(log.details) : "No details"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {log.ip_address || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
