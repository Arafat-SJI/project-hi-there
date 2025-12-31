import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, BookOpen, Brain, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();

  const stats = [
    {
      title: "Total Clients",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Users,
      href: "/clients",
    },
    {
      title: "Meetings This Week",
      value: "8",
      change: "+4",
      trend: "up",
      icon: Calendar,
      href: "/meetings",
    },
    {
      title: "Knowledge Entries",
      value: "156",
      change: "+23",
      trend: "up",
      icon: BookOpen,
      href: "/knowledge",
    },
    {
      title: "AI Queries",
      value: "342",
      change: "+45%",
      trend: "up",
      icon: Brain,
      href: "/ai",
    },
  ];

  const recentActivity = [
    {
      type: "meeting",
      title: "Client Onboarding - Acme Corp",
      time: "2 hours ago",
      icon: Calendar,
    },
    {
      type: "knowledge",
      title: "New document added: Q4 Strategy",
      time: "5 hours ago",
      icon: BookOpen,
    },
    {
      type: "ai",
      title: "AI Agent completed analysis",
      time: "1 day ago",
      icon: Brain,
    },
    {
      type: "client",
      title: "New client registered: TechStart Inc",
      time: "2 days ago",
      icon: Users,
    },
  ];

  const quickActions = [
    {
      title: "Add Client",
      description: "Register a new client",
      href: "/clients/new",
      icon: Users,
    },
    {
      title: "Schedule Meeting",
      description: "Create a new meeting",
      href: "/meetings/new",
      icon: Calendar,
    },
    {
      title: "Upload Document",
      description: "Add to knowledge base",
      href: "/knowledge/upload",
      icon: BookOpen,
    },
    {
      title: "Chat with AI",
      description: "Start AI conversation",
      href: "/ai/chat",
      icon: Brain,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.full_name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <div className="flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-accent">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>
              Your schedule for this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Team Sync - Project Alpha</p>
                  <p className="text-sm text-muted-foreground">Today at 2:00 PM</p>
                </div>
                <Button variant="outline" size="sm">Join</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Client Review - Beta Inc</p>
                  <p className="text-sm text-muted-foreground">Tomorrow at 10:00 AM</p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/meetings">View all meetings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Latest AI-generated insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="font-medium">Meeting Summary Available</p>
                <p className="text-sm text-muted-foreground">
                  AI has processed your last meeting transcript
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Document Embeddings Ready</p>
                <p className="text-sm text-muted-foreground">
                  15 new documents indexed for search
                </p>
              </div>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/ai">Explore AI features</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
