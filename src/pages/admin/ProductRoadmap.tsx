import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Rocket, 
  Users, 
  Brain, 
  Calendar, 
  FileText, 
  Shield, 
  Plug, 
  MessageSquare,
  Database,
  Settings,
  Zap,
  Video,
  Search,
  Bell,
  LayoutDashboard,
  Bot,
  Globe,
  Lock
} from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  category: string;
  icon: React.ReactNode;
  completedDate?: string;
  targetDate?: string;
  progress?: number;
}

const features: Feature[] = [
  // Completed Features
  {
    id: "auth",
    name: "Authentication & Authorization",
    description: "Email/password login, role-based access control (Admin, Moderator, User)",
    status: "completed",
    category: "Core",
    icon: <Lock className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "dashboard",
    name: "Dashboard Analytics",
    description: "Real-time stats, activity feed, task overview charts",
    status: "completed",
    category: "Core",
    icon: <LayoutDashboard className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "clients",
    name: "Client Management",
    description: "Full CRUD operations for client/customer data",
    status: "completed",
    category: "Business",
    icon: <Users className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "tasks",
    name: "Task Management",
    description: "Task tracking with assignments, priorities, and status",
    status: "completed",
    category: "Business",
    icon: <CheckCircle2 className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "meetings",
    name: "Meeting Management",
    description: "Multi-provider support (Zoom, Teams, Google Meet), transcripts, AI summaries",
    status: "completed",
    category: "Business",
    icon: <Video className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    description: "Searchable articles with categories, tags, and full-text search",
    status: "completed",
    category: "Content",
    icon: <FileText className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "ai-agents",
    name: "AI Agents",
    description: "Configurable AI agents with memory, tools, and execution history",
    status: "completed",
    category: "AI",
    icon: <Bot className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "ai-chat",
    name: "AI Chat Interface",
    description: "Conversational AI with streaming responses and context awareness",
    status: "completed",
    category: "AI",
    icon: <MessageSquare className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "semantic-search",
    name: "Semantic Search (RAG)",
    description: "Vector embeddings for intelligent knowledge retrieval",
    status: "completed",
    category: "AI",
    icon: <Search className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "notifications",
    name: "Real-time Notifications",
    description: "In-app notifications with Supabase subscriptions",
    status: "completed",
    category: "Core",
    icon: <Bell className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "admin-panel",
    name: "Admin Panel",
    description: "User management, roles, activity logs, system settings",
    status: "completed",
    category: "Admin",
    icon: <Settings className="h-5 w-5" />,
    completedDate: "Dec 2025"
  },
  {
    id: "sso",
    name: "Enterprise SSO",
    description: "Microsoft Azure AD and Google Workspace integration",
    status: "completed",
    category: "Security",
    icon: <Shield className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams Integration",
    description: "Teams meetings, calendar sync, channel messaging",
    status: "completed",
    category: "Integrations",
    icon: <Globe className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "mcp",
    name: "MCP Server Integration",
    description: "Model Context Protocol for AI tool chains",
    status: "completed",
    category: "AI",
    icon: <Plug className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  {
    id: "user-integrations",
    name: "User OAuth Connections",
    description: "Personal account connections for Google, Zoom, Microsoft",
    status: "completed",
    category: "Integrations",
    icon: <Plug className="h-5 w-5" />,
    completedDate: "Jan 2026"
  },
  // In-Progress Features
  {
    id: "generic-meetings",
    name: "Provider-Agnostic Meetings",
    description: "Unified meeting system across all providers with feature flag rollout",
    status: "in-progress",
    category: "Business",
    icon: <Calendar className="h-5 w-5" />,
    progress: 80,
    targetDate: "Feb 2026"
  },
  {
    id: "ai-analytics",
    name: "AI Usage Analytics",
    description: "Token tracking, cost estimation, and usage dashboards",
    status: "in-progress",
    category: "AI",
    icon: <Brain className="h-5 w-5" />,
    progress: 90,
    targetDate: "Feb 2026"
  },
  // Planned Features
  {
    id: "google-calendar",
    name: "Google Calendar Sync",
    description: "Two-way calendar synchronization with Google Workspace",
    status: "planned",
    category: "Integrations",
    icon: <Calendar className="h-5 w-5" />,
    targetDate: "Q1 2026"
  },
  {
    id: "slack",
    name: "Slack Integration",
    description: "Channel messaging and notifications via Slack",
    status: "planned",
    category: "Integrations",
    icon: <MessageSquare className="h-5 w-5" />,
    targetDate: "Q1 2026"
  },
  {
    id: "advanced-analytics",
    name: "Advanced Reporting",
    description: "PDF/Excel exports, scheduled reports, custom dashboards",
    status: "planned",
    category: "Business",
    icon: <Database className="h-5 w-5" />,
    targetDate: "Q2 2026"
  },
  {
    id: "workflows",
    name: "Workflow Automation",
    description: "Triggers, actions, and automated task flows",
    status: "planned",
    category: "Business",
    icon: <Zap className="h-5 w-5" />,
    targetDate: "Q2 2026"
  }
];

const categories = ["All", "Core", "Business", "AI", "Integrations", "Security", "Admin", "Content"];

export default function ProductRoadmap() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const completedFeatures = features.filter(f => f.status === "completed");
  const inProgressFeatures = features.filter(f => f.status === "in-progress");
  const plannedFeatures = features.filter(f => f.status === "planned");

  const filteredFeatures = (status: Feature["status"]) => {
    const byStatus = features.filter(f => f.status === status);
    if (selectedCategory === "All") return byStatus;
    return byStatus.filter(f => f.category === selectedCategory);
  };

  const completionPercentage = Math.round((completedFeatures.length / features.length) * 100);

  const getStatusColor = (status: Feature["status"]) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "planned": return "bg-muted";
    }
  };

  const getStatusBadge = (status: Feature["status"]) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "in-progress": return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "planned": return <Badge variant="secondary">Planned</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          Product Roadmap
        </h1>
        <p className="text-muted-foreground">
          Track our progress and see what's coming next
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {completedFeatures.length} of {features.length} features completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>{completedFeatures.length} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>{inProgressFeatures.length} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span>{plannedFeatures.length} Planned</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Feature Tabs */}
      <Tabs defaultValue="completed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({filteredFeatures("completed").length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({filteredFeatures("in-progress").length})
          </TabsTrigger>
          <TabsTrigger value="planned" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Planned ({filteredFeatures("planned").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures("completed").map(feature => (
              <Card key={feature.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      {feature.icon}
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  {feature.completedDate && (
                    <p className="text-xs text-muted-foreground">
                      <CheckCircle2 className="inline h-3 w-3 mr-1" />
                      Completed: {feature.completedDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFeatures("in-progress").map(feature => (
              <Card key={feature.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      {feature.icon}
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  {feature.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{feature.progress}%</span>
                      </div>
                      <Progress value={feature.progress} className="h-2" />
                    </div>
                  )}
                  {feature.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Target: {feature.targetDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredFeatures("in-progress").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No in-progress features in this category
            </div>
          )}
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFeatures("planned").map(feature => (
              <Card key={feature.id} className="border-l-4 border-l-muted">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {feature.icon}
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  {feature.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      <Rocket className="inline h-3 w-3 mr-1" />
                      Target: {feature.targetDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredFeatures("planned").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No planned features in this category
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Development Timeline</CardTitle>
          <CardDescription>Feature delivery schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Q4 2025 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <div className="w-0.5 flex-1 bg-green-500" />
              </div>
              <div className="pb-8">
                <h4 className="font-semibold text-green-600">Q4 2025</h4>
                <p className="text-sm text-muted-foreground">Core Platform Launch</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Auth</Badge>
                  <Badge variant="outline" className="text-xs">Dashboard</Badge>
                  <Badge variant="outline" className="text-xs">Clients</Badge>
                  <Badge variant="outline" className="text-xs">Tasks</Badge>
                  <Badge variant="outline" className="text-xs">Knowledge Base</Badge>
                </div>
              </div>
            </div>

            {/* Q1 2026 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <div className="w-0.5 flex-1 bg-blue-500" />
              </div>
              <div className="pb-8">
                <h4 className="font-semibold text-blue-600">Q1 2026</h4>
                <p className="text-sm text-muted-foreground">AI & Integrations</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">AI Agents</Badge>
                  <Badge variant="outline" className="text-xs">Teams Integration</Badge>
                  <Badge variant="outline" className="text-xs">SSO</Badge>
                  <Badge variant="outline" className="text-xs">MCP</Badge>
                  <Badge variant="outline" className="text-xs">Meetings</Badge>
                </div>
              </div>
            </div>

            {/* Q2 2026 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-muted" />
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground">Q2 2026</h4>
                <p className="text-sm text-muted-foreground">Advanced Features</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Workflows</Badge>
                  <Badge variant="outline" className="text-xs">Advanced Reports</Badge>
                  <Badge variant="outline" className="text-xs">Slack</Badge>
                  <Badge variant="outline" className="text-xs">Google Calendar</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
