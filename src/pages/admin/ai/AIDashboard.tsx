/**
 * AI Features dashboard – hub for AI Agents, Semantic Search, and Embedding Management.
 * Route: /admin/ai
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Search, Database, Bot, Sparkles } from "lucide-react";
import { useAIDashboardStats } from "@/hooks/useAIDashboardStats";

const aiFeatures = [
  {
    title: "AI Agents",
    description:
      "Intelligent automation with multi-provider AI agents for financial analysis, project health, OKR tracking, and business intelligence.",
    icon: Bot,
    href: "/admin/ai/agents",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
  },
  {
    title: "Semantic Search",
    description: "Search across all documents using AI-powered vector similarity.",
    icon: Search,
    href: "/admin/ai/semantic-search",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Embedding Management",
    description: "Manage vector embeddings for semantic search and AI features.",
    icon: Database,
    href: "/admin/ai/embeddings",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
];

export default function AIDashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAIDashboardStats();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Features</h1>
        </div>
        <p className="text-muted-foreground">
          Leverage AI-powered tools to enhance productivity and gain insights.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.href}
              className="flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className={`rounded-lg p-2 ${feature.bgColor}`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                {feature.title === "AI Agents" && (
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="mt-1.5">
                    {feature.description}
                  </CardDescription>
                </div>
                <div className="mt-auto pt-2">
                  <Button
                    variant={feature.title === "AI Agents" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => navigate(feature.href)}
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active AI Agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.agentsCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Enabled agents.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>AI Executions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.runsCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">This month.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Summaries Generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.summariesCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Meeting summaries.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>AI Tokens Used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalTokens != null
                    ? stats.totalTokens.toLocaleString()
                    : "0"}
                </div>
                <p className="text-xs text-muted-foreground">This month.</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* About AI Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>About AI Features</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            AI features are powered by multiple providers (OpenAI, Anthropic, Gemini) with
            intelligent routing. Use the cards above to manage agents, run semantic search,
            and control embeddings.
          </p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              AI Agents provide specialized analysis for finance, operations, and strategy
              with configurable prompts and multi-provider support.
            </li>
            <li>
              Semantic search uses vector embeddings for intelligent document and meeting
              transcript retrieval.
            </li>
            <li>
              Embedding management enables efficient knowledge base indexing and retrieval.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
