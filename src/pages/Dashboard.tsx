import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, useRecentActivity, getTimeAgo } from "@/hooks/useDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  BookOpen,
  Brain,
  Plus,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Loader2,
  CheckSquare,
} from "lucide-react";

const quickActions = [
  {
    title: "Add Client",
    description: "Create a new client record",
    icon: Users,
    href: "/clients/new",
  },
  {
    title: "Create Task",
    description: "Add a new task",
    icon: CheckSquare,
    href: "/tasks/new",
  },
  {
    title: "Schedule Meeting",
    description: "Set up a new meeting",
    icon: Calendar,
    href: "/meetings/new",
  },
  {
    title: "Add Knowledge",
    description: "Upload to knowledge base",
    icon: BookOpen,
    href: "/knowledge/new",
  },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "client":
        return Users;
      case "meeting":
        return Calendar;
      case "task":
        return CheckSquare;
      case "knowledge":
        return BookOpen;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here's what's happening with your workspace today.
        </p>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Clients */}
          <Link to="/clients" className="group">
            <Card className="transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-foreground">{stats?.clients.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  {(stats?.clients.thisMonth || 0) > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
                  <span>+{stats?.clients.thisMonth || 0} this month</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Meetings */}
          <Link to="/meetings" className="group">
            <Card className="transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-foreground">{stats?.meetings.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Meetings</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{stats?.meetings.upcoming || 0} upcoming</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Tasks */}
          <Link to="/tasks" className="group">
            <Card className="transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CheckSquare className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-foreground">{stats?.tasks.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{stats?.tasks.pending || 0} pending, {stats?.tasks.inProgress || 0} in progress</span>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Knowledge */}
          <Link to="/knowledge" className="group">
            <Card className="transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-foreground">{stats?.knowledge.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Knowledge Entries</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  {(stats?.knowledge.recent || 0) > 0 && <TrendingUp className="h-3 w-3 text-green-600" />}
                  <span>+{stats?.knowledge.recent || 0} this week</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.href}
                    className="group flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-all duration-200 hover:border-border hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !recentActivity || recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item) => {
                  const Icon = getActivityIcon(item.type);
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(item.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Summary */}
      {stats && (stats.tasks.total > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Task Overview</CardTitle>
            <CardDescription>Summary of your tasks by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <Badge variant="outline">{stats.tasks.pending}</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${(stats.tasks.pending / stats.tasks.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <Badge variant="default">{stats.tasks.inProgress}</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(stats.tasks.inProgress / stats.tasks.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="secondary">{stats.tasks.completed}</Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(stats.tasks.completed / stats.tasks.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
