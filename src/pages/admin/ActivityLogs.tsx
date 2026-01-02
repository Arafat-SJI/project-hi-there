import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Search,
  Download,
  Loader2,
  FileText,
  Trash2,
  Edit,
  Plus,
  LogIn,
  LogOut,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getInitials, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

// Demo data for when the activity_logs table doesn't exist yet
const DEMO_LOGS: ActivityLog[] = [
  {
    id: "1",
    user_id: "demo-1",
    action: "login",
    resource_type: null,
    resource_id: null,
    details: { method: "email" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user_email: "admin@example.com",
  },
  {
    id: "2",
    user_id: "demo-1",
    action: "create",
    resource_type: "client",
    resource_id: "client-1",
    details: { name: "Acme Corp" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user_email: "admin@example.com",
  },
  {
    id: "3",
    user_id: "demo-2",
    action: "update",
    resource_type: "meeting",
    resource_id: "meeting-1",
    details: { title: "Weekly Standup" },
    ip_address: "192.168.1.2",
    user_agent: "Mozilla/5.0",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user_email: "user@example.com",
  },
  {
    id: "4",
    user_id: "demo-1",
    action: "view",
    resource_type: "knowledge",
    resource_id: "knowledge-1",
    details: { title: "Product Documentation" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0",
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user_email: "admin@example.com",
  },
  {
    id: "5",
    user_id: "demo-3",
    action: "delete",
    resource_type: "task",
    resource_id: "task-1",
    details: { reason: "Completed" },
    ip_address: "192.168.1.3",
    user_agent: "Mozilla/5.0",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    user_email: "manager@example.com",
  },
];

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [usingDemoData, setUsingDemoData] = useState(false);

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);

      // Try to fetch from activity_logs table
      // Note: This table may not exist yet until the migration is applied
      const { data, error } = await supabase
        .from("activity_logs" as any)
        .select(`
          id,
          user_id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("Activity logs table not available, using demo data:", error.message);
        setUsingDemoData(true);
        setLogs(DEMO_LOGS);
        return;
      }

      if (!data || data.length === 0) {
        setUsingDemoData(true);
        setLogs(DEMO_LOGS);
        return;
      }

      // Fetch user emails from profiles table
      const userIds = [...new Set(data.map((log: any) => log.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const userEmailMap = new Map(
        profilesData?.map((profile) => [profile.id, profile.email]) || []
      );

      const logsWithEmails = data.map((log: any) => ({
        ...log,
        user_email: userEmailMap.get(log.user_id) || "Unknown",
      }));

      setUsingDemoData(false);
      setLogs(logsWithEmails);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setUsingDemoData(true);
      setLogs(DEMO_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
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
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(search.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    const Icon = ACTION_ICONS[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getActionBadgeVariant = (action: string) => {
    return ACTION_COLORS[action] || "outline";
  };

  return (
    <div className="space-y-6">
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

      {usingDemoData && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Showing Demo Data
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                The activity_logs table hasn't been created yet. Run the migration at{" "}
                <code className="rounded bg-amber-200 dark:bg-amber-900 px-1">
                  supabase/migrations/20260101_activity_logs.sql
                </code>{" "}
                to enable real activity tracking.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="text-2xl font-bold">
              {new Set(logs.map((log) => log.action)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map((log) => log.resource_type).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Search activity logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, or resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
