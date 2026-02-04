/**
 * Vision & Roadmap — Product overview for stakeholders and marketing.
 *
 * Top section: Product vision and description (marketing-ready).
 * Tabs: Live module status (from implementationStatus.ts), feature roadmap, timeline.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Lock,
  Target,
  TrendingUp,
  Lightbulb,
  Layers,
  BarChart3,
  FolderKanban,
  Handshake,
  ClipboardList,
  ExternalLink,
} from "lucide-react";
import {
  implementationStatus,
  getModuleProgress,
  getPipelineProgress,
  getPipelineColor,
  getPipelineLabel,
  TEAM,
} from "@/shared/data/implementationStatus";

// ─── Product Vision ───────────────────────────────────────────────────────────

function ProductVision() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-2xl">SJ Control Tower</CardTitle>
          <CardDescription className="text-base">
            The intelligent command center for modern businesses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-relaxed">
            SJ Control Tower is an all-in-one business operations platform that unifies task management,
            meeting intelligence, project delivery, team productivity, business development, and strategic
            planning into a single, AI-powered workspace. Built for organizations that need visibility
            across every function — from the CEO tracking OKRs to the developer managing sprint tasks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Target className="h-5 w-5" />
                <h4 className="font-semibold text-sm">Mission</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Eliminate tool sprawl by providing one platform where every team — leadership, engineering,
                sales, HR, and operations — can plan, execute, and measure work with AI assistance at every step.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-5 w-5" />
                <h4 className="font-semibold text-sm">Differentiators</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                EOS framework natively integrated. AI agents that understand your business context.
                Knowledge base with semantic search (RAG). Real-time meeting intelligence with
                auto-extracted action items. Module-based architecture — use only what you need.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <h4 className="font-semibold text-sm">Target Market</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mid-market companies (50–500 employees) running on EOS or OKR frameworks who want
                AI-first operations tooling. Agencies and professional services firms managing
                multiple clients, projects, and team members across departments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key capabilities grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CAPABILITIES.map((cap) => (
          <Card key={cap.title} className="border-l-2" style={{ borderLeftColor: cap.color }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1.5" style={{ color: cap.color }}>
                {cap.icon}
                <span className="font-semibold text-xs">{cap.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{cap.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const CAPABILITIES = [
  { title: "EOS Framework", icon: <Target className="h-4 w-4" />, color: "#8b5cf6", description: "V/TO, OKRs, Issues, Scorecard, Accountability Chart — the complete Entrepreneurial Operating System." },
  { title: "AI Agents", icon: <Bot className="h-4 w-4" />, color: "#f59e0b", description: "Configurable AI agents with memory, tools, and RAG for context-aware business assistance." },
  { title: "Meeting Intelligence", icon: <Video className="h-4 w-4" />, color: "#3b82f6", description: "Zoom, Teams, and Google Meet with transcripts, AI summaries, and auto-extracted action items." },
  { title: "Project Delivery", icon: <FolderKanban className="h-4 w-4" />, color: "#22c55e", description: "Projects with milestones, risk tracking, team members, billing, and ActiveCollab sync." },
  { title: "Task Streams", icon: <CheckCircle2 className="h-4 w-4" />, color: "#06b6d4", description: "Tasks with streams, comments, subtasks, filters, and cross-module assignment." },
  { title: "Business Development", icon: <Handshake className="h-4 w-4" />, color: "#ec4899", description: "Deal pipeline, contact management, lead follow-ups, and HubSpot integration." },
  { title: "Knowledge Base", icon: <FileText className="h-4 w-4" />, color: "#14b8a6", description: "Searchable articles, file uploads, vector embeddings, and semantic search (RAG)." },
  { title: "Productivity", icon: <BarChart3 className="h-4 w-4" />, color: "#f97316", description: "Department metrics, employee profiles, process documentation, and HR data sync." },
];

// ─── Live Module Status (from implementation tracker) ─────────────────────────

function LiveModuleStatus() {
  const totalModules = implementationStatus.length;
  const devDone = implementationStatus.filter((m) => m.pipeline.development.status === "done").length;
  const qaDone = implementationStatus.filter((m) => m.pipeline.qa.status === "done").length;
  const signedOff = implementationStatus.filter((m) => m.pipeline.signOff.status === "done").length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Modules</p>
            <p className="text-2xl font-bold">{totalModules}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Dev Complete</p>
            <p className="text-2xl font-bold text-green-600">{devDone}<span className="text-sm font-normal text-muted-foreground">/{totalModules}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">QA Complete</p>
            <p className="text-2xl font-bold text-blue-600">{qaDone}<span className="text-sm font-normal text-muted-foreground">/{totalModules}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Signed Off</p>
            <p className="text-2xl font-bold text-purple-600">{signedOff}<span className="text-sm font-normal text-muted-foreground">/{totalModules}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Module pipeline table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module Delivery Status</CardTitle>
          <CardDescription>
            Live data from implementation tracker. Updated by developers after each batch.
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              <TableHead className="text-center">Owner</TableHead>
              <TableHead className="text-center">Build %</TableHead>
              <TableHead className="text-center">Development</TableHead>
              <TableHead className="text-center">QA</TableHead>
              <TableHead className="text-center">Seeding</TableHead>
              <TableHead className="text-center">Sign-off</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {implementationStatus.map((module) => {
              const buildPct = getModuleProgress(module);
              return (
                <TableRow key={module.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">P{module.phase}</Badge>
                      <span className="font-medium text-sm">{module.name.split("(")[0].trim()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">{module.owner}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Progress value={buildPct} className="h-1.5 w-12" />
                      <span className="text-xs text-muted-foreground">{buildPct}%</span>
                    </div>
                  </TableCell>
                  {(["development", "qa", "dataSeeding", "signOff"] as const).map((key) => {
                    const phase = module.pipeline[key];
                    return (
                      <TableCell key={key} className="text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px]"
                          style={{ borderColor: getPipelineColor(phase.status), color: getPipelineColor(phase.status) }}
                        >
                          {getPipelineLabel(phase.status)}
                        </Badge>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Team assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEAM.map((member) => {
              const modules = implementationStatus.filter((m) => member.modules.includes(m.id));
              return (
                <div key={member.id} className="border rounded-lg p-3">
                  <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {member.name}
                  </p>
                  <div className="space-y-1.5">
                    {modules.map((m) => {
                      const pct = getPipelineProgress(m);
                      return (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <span>{m.name.split("(")[0].trim()}</span>
                          <div className="flex items-center gap-1.5">
                            <Progress value={pct} className="h-1 w-10" />
                            <span className="text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Feature roadmap (aligned to implementation tracker) ──────────────────────

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
  // Completed — foundation + core modules
  { id: "auth", name: "Authentication & Authorization", description: "Email/password login, role-based access control (Admin, Moderator, User), Azure AD SSO, Google Workspace SSO", status: "completed", category: "Core", icon: <Lock className="h-5 w-5" />, completedDate: "Dec 2025" },
  { id: "dashboard", name: "Dashboard Analytics", description: "Real-time stats, activity feed, task overview charts, module-aware widgets", status: "completed", category: "Core", icon: <LayoutDashboard className="h-5 w-5" />, completedDate: "Dec 2025" },
  { id: "notifications", name: "Real-time Notifications", description: "In-app notifications with Supabase realtime subscriptions", status: "completed", category: "Core", icon: <Bell className="h-5 w-5" />, completedDate: "Dec 2025" },
  { id: "admin-panel", name: "Admin Panel", description: "User management, roles, activity logs, system settings, feature flags, team management", status: "completed", category: "Admin", icon: <Settings className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "tasks", name: "Task Management & Streams", description: "Task CRUD with streams, comments, subtasks, assignments, priorities, and filtering", status: "completed", category: "Business", icon: <CheckCircle2 className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "eos", name: "EOS Framework", description: "V/TO, OKRs with key results and check-ins, IDS issues, scorecard metrics, accountability chart", status: "completed", category: "Business", icon: <Target className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "meetings", name: "Meeting Management V2", description: "Agenda, takeaways, participants, recurring series, calendar view, multi-provider support", status: "completed", category: "Business", icon: <Video className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "projects", name: "Project Management", description: "Projects with milestones, members, risks, billing, create/edit forms, status pipeline", status: "completed", category: "Business", icon: <FolderKanban className="h-5 w-5" />, completedDate: "Feb 2026" },
  { id: "deals", name: "Business Development", description: "Deal pipeline, contact management, lead follow-ups, create/edit/delete CRUD, client management", status: "completed", category: "Business", icon: <Handshake className="h-5 w-5" />, completedDate: "Feb 2026" },
  { id: "productivity", name: "Productivity & Process Docs", description: "Department productivity dashboard, employee profiles, process documentation library", status: "completed", category: "Business", icon: <BarChart3 className="h-5 w-5" />, completedDate: "Feb 2026" },
  { id: "ai-models", name: "AI Model Management", description: "Multi-provider AI config (OpenAI, Anthropic, Google, Perplexity), usage analytics, cost tracking", status: "completed", category: "AI", icon: <Brain className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "mcp", name: "MCP Server Integration", description: "Model Context Protocol server management for AI tool chains", status: "completed", category: "AI", icon: <Plug className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "sso", name: "Enterprise SSO", description: "Microsoft Azure AD and Google Workspace single sign-on", status: "completed", category: "Security", icon: <Shield className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "teams", name: "Microsoft Teams Integration", description: "Teams meetings, calendar sync, channel messaging", status: "completed", category: "Integrations", icon: <Globe className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "oauth", name: "User OAuth Connections", description: "Personal account connections for Google, Zoom, Microsoft", status: "completed", category: "Integrations", icon: <Plug className="h-5 w-5" />, completedDate: "Jan 2026" },
  { id: "google-meet", name: "Google Meet Integration", description: "Meeting creation, calendar sync, OAuth integration", status: "completed", category: "Integrations", icon: <Video className="h-5 w-5" />, completedDate: "Feb 2026" },
  { id: "knowledge", name: "Knowledge Base", description: "Articles, categories, file uploads, full-text search, vector embedding tables ready", status: "completed", category: "Content", icon: <FileText className="h-5 w-5" />, completedDate: "Jan 2026" },

  // In-Progress
  { id: "ai-agents", name: "AI Agents & Chat", description: "Configurable AI agents with memory, tools, execution history, conversational chat interface", status: "in-progress", category: "AI", icon: <Bot className="h-5 w-5" />, progress: 70, targetDate: "Q1 2026" },
  { id: "semantic-search", name: "Semantic Search (RAG)", description: "Vector embeddings pipeline, semantic search UI, Gemini RAG integration", status: "in-progress", category: "AI", icon: <Search className="h-5 w-5" />, progress: 40, targetDate: "Q1 2026" },
  { id: "edge-functions", name: "Edge Functions Backend", description: "Supabase edge functions for AI processing, data sync, automation, email, and webhooks", status: "in-progress", category: "Core", icon: <Zap className="h-5 w-5" />, progress: 10, targetDate: "Q2 2026" },

  // Planned
  { id: "google-calendar", name: "Google Calendar Sync", description: "Two-way calendar synchronization with Google Workspace", status: "planned", category: "Integrations", icon: <Calendar className="h-5 w-5" />, targetDate: "Q2 2026" },
  { id: "hubspot", name: "HubSpot CRM Sync", description: "Bi-directional sync for deals, contacts, and companies with HubSpot", status: "planned", category: "Integrations", icon: <Globe className="h-5 w-5" />, targetDate: "Q2 2026" },
  { id: "activecollab", name: "ActiveCollab Sync", description: "Project and task sync with ActiveCollab for unified project delivery", status: "planned", category: "Integrations", icon: <Layers className="h-5 w-5" />, targetDate: "Q2 2026" },
  { id: "slack", name: "Slack Integration", description: "Channel messaging, notifications, and meeting summaries via Slack", status: "planned", category: "Integrations", icon: <MessageSquare className="h-5 w-5" />, targetDate: "Q2 2026" },
  { id: "advanced-analytics", name: "Advanced Reporting", description: "PDF/Excel exports, scheduled reports, custom dashboards, resource utilization", status: "planned", category: "Business", icon: <Database className="h-5 w-5" />, targetDate: "Q2 2026" },
  { id: "workflows", name: "Workflow Automation", description: "Event triggers, automated actions, task escalation, and notification rules", status: "planned", category: "Business", icon: <Zap className="h-5 w-5" />, targetDate: "Q3 2026" },
];

const categories = ["All", "Core", "Business", "AI", "Integrations", "Security", "Admin", "Content"];

function FeatureRoadmap() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const completedFeatures = features.filter((f) => f.status === "completed");
  const inProgressFeatures = features.filter((f) => f.status === "in-progress");
  const plannedFeatures = features.filter((f) => f.status === "planned");

  const filteredFeatures = (status: Feature["status"]) => {
    const byStatus = features.filter((f) => f.status === status);
    if (selectedCategory === "All") return byStatus;
    return byStatus.filter((f) => f.category === selectedCategory);
  };

  const completionPercentage = Math.round((completedFeatures.length / features.length) * 100);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Progress</CardTitle>
          <CardDescription>
            {completedFeatures.length} of {features.length} features shipped
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
        {categories.map((cat) => (
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
            {filteredFeatures("completed").map((feature) => (
              <Card key={feature.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      {feature.icon}
                      <CardTitle className="text-sm">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                  {feature.completedDate && (
                    <p className="text-[10px] text-muted-foreground">
                      <CheckCircle2 className="inline h-3 w-3 mr-1" />
                      Shipped: {feature.completedDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFeatures("in-progress").map((feature) => (
              <Card key={feature.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      {feature.icon}
                      <CardTitle className="text-sm">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
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
                    <p className="text-[10px] text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Target: {feature.targetDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredFeatures("in-progress").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No in-progress features in this category</div>
          )}
        </TabsContent>

        <TabsContent value="planned" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFeatures("planned").map((feature) => (
              <Card key={feature.id} className="border-l-4 border-l-muted">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {feature.icon}
                      <CardTitle className="text-sm">{feature.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{feature.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                  {feature.targetDate && (
                    <p className="text-[10px] text-muted-foreground">
                      <Rocket className="inline h-3 w-3 mr-1" />
                      Target: {feature.targetDate}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredFeatures("planned").length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No planned features in this category</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Development Timeline</CardTitle>
        <CardDescription>Quarterly delivery milestones</CardDescription>
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
              <h4 className="font-semibold text-green-600">Q4 2025 — Foundation</h4>
              <p className="text-sm text-muted-foreground">Core platform launch: auth, dashboard, admin, clients, notifications</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Auth & RBAC</Badge>
                <Badge variant="outline" className="text-xs">Dashboard</Badge>
                <Badge variant="outline" className="text-xs">Admin Panel</Badge>
                <Badge variant="outline" className="text-xs">Client CRUD</Badge>
                <Badge variant="outline" className="text-xs">Notifications</Badge>
              </div>
            </div>
          </div>

          {/* Q1 2026 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <div className="w-0.5 flex-1 bg-green-500" />
            </div>
            <div className="pb-8">
              <h4 className="font-semibold text-green-600">Q1 2026 — Business Modules</h4>
              <p className="text-sm text-muted-foreground">Full module build-out: EOS, meetings, tasks, projects, deals, productivity, AI models</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">EOS Framework</Badge>
                <Badge variant="outline" className="text-xs">Meetings V2</Badge>
                <Badge variant="outline" className="text-xs">Task Streams</Badge>
                <Badge variant="outline" className="text-xs">Projects</Badge>
                <Badge variant="outline" className="text-xs">Business Dev</Badge>
                <Badge variant="outline" className="text-xs">Productivity</Badge>
                <Badge variant="outline" className="text-xs">AI Models</Badge>
                <Badge variant="outline" className="text-xs">SSO</Badge>
                <Badge variant="outline" className="text-xs">Teams</Badge>
              </div>
            </div>
          </div>

          {/* Q2 2026 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div className="w-0.5 flex-1 bg-blue-500" />
            </div>
            <div className="pb-8">
              <h4 className="font-semibold text-blue-600">Q2 2026 — AI & Integrations</h4>
              <p className="text-sm text-muted-foreground">AI agents, semantic search, edge functions, CRM and project management sync</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">AI Agents & Chat</Badge>
                <Badge variant="outline" className="text-xs">Semantic Search</Badge>
                <Badge variant="outline" className="text-xs">Edge Functions</Badge>
                <Badge variant="outline" className="text-xs">HubSpot</Badge>
                <Badge variant="outline" className="text-xs">ActiveCollab</Badge>
                <Badge variant="outline" className="text-xs">Google Calendar</Badge>
              </div>
            </div>
          </div>

          {/* Q3 2026 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-muted" />
            </div>
            <div>
              <h4 className="font-semibold text-muted-foreground">Q3 2026 — Automation & Scale</h4>
              <p className="text-sm text-muted-foreground">Workflow automation, advanced reporting, Slack, and production hardening</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Workflows</Badge>
                <Badge variant="outline" className="text-xs">Advanced Reports</Badge>
                <Badge variant="outline" className="text-xs">Slack</Badge>
                <Badge variant="outline" className="text-xs">PDF/Excel Export</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductRoadmap() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            Vision & Roadmap
          </h1>
          <p className="text-muted-foreground">
            Product vision, live delivery status, and feature roadmap for SJ Control Tower
          </p>
        </div>
        <Link to="/admin/roadmap/seed">
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Seed Data
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="vision" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vision">Product Vision</TabsTrigger>
          <TabsTrigger value="status">Live Status</TabsTrigger>
          <TabsTrigger value="features">Feature Roadmap</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="vision">
          <ProductVision />
        </TabsContent>

        <TabsContent value="status">
          <LiveModuleStatus />
        </TabsContent>

        <TabsContent value="features">
          <FeatureRoadmap />
        </TabsContent>

        <TabsContent value="timeline">
          <Timeline />
        </TabsContent>
      </Tabs>

      {/* Developer Tools Card */}
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  Implementation Status
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  Developer dashboard for tracking module progress
                </CardDescription>
              </div>
            </div>
            <Link to="/admin/implementation-status">
              <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Tracker
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-green-700 dark:text-green-300">
            Track pages, hooks, components, database tables, edge functions, and QA checklists
            for all modules. Updated by developers after each batch of work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
