import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  Brain,
  Plus,
  ArrowUpRight,
  Clock,
  TrendingUp
} from "lucide-react";

const stats = [
  {
    title: "Total Clients",
    value: "24",
    change: "+3 this month",
    trend: "up",
    icon: Users,
    href: "/clients",
  },
  {
    title: "Meetings",
    value: "12",
    change: "4 this week",
    trend: "up",
    icon: Calendar,
    href: "/meetings",
  },
  {
    title: "Knowledge Entries",
    value: "156",
    change: "+12 new",
    trend: "up",
    icon: BookOpen,
    href: "/knowledge",
  },
  {
    title: "AI Queries",
    value: "89",
    change: "This month",
    trend: "neutral",
    icon: Brain,
    href: "/ai",
  },
];

const quickActions = [
  {
    title: "Add Client",
    description: "Create a new client record",
    icon: Users,
    href: "/clients/new",
  },
  {
    title: "Schedule Meeting",
    description: "Set up a new meeting",
    icon: Calendar,
    href: "/meetings/new",
  },
  {
    title: "AI Assistant",
    description: "Chat with your AI agent",
    icon: Brain,
    href: "/ai/chat",
  },
  {
    title: "Knowledge Base",
    description: "Search your knowledge",
    icon: BookOpen,
    href: "/knowledge",
  },
];

const recentActivity = [
  { action: "Meeting completed", detail: "Weekly sync with Acme Corp", time: "2 hours ago" },
  { action: "Client added", detail: "New client: TechStart Inc", time: "5 hours ago" },
  { action: "Document uploaded", detail: "Q4 Planning notes", time: "Yesterday" },
  { action: "AI summary generated", detail: "Product review meeting", time: "Yesterday" },
];

export default function Dashboard() {
  const { profile } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Link key={index} to={stat.href} className="group">
            <Card className="transition-all duration-200 hover:border-border hover:shadow-soft">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                  <span>{stat.change}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                      <p className="text-xs text-muted-foreground/70">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-4 w-full text-muted-foreground">
                View all activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
