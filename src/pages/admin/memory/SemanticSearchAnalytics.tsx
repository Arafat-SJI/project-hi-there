/**
 * Admin: Semantic Search Analytics
 * Route: /admin/memory/search
 * Real data: embeddings (entity_type counts), agent_memories (relevance, accesses).
 * Query metrics are simulated until we have real tracking.
 */
import { useSearchAnalytics } from "@/hooks/useSearchAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Zap,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const LATENCY_TARGET_MS = 300;
const P95_TARGET_MS = 500;
const TRUE_POSITIVE_TARGET_PCT = 85;

function statusHealthy(ok: boolean) {
  return ok ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Healthy
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      <AlertCircle className="h-3.5 w-3.5" />
      Warning
    </span>
  );
}

const SEARCH_SOURCES = [
  {
    name: "Deal Notes",
    description: "Auto-embedded on save via VEC-001 trigger",
    active: true,
  },
  {
    name: "Meeting Summaries",
    description: "Auto-embedded on transcript generation via VEC-002 trigger",
    active: true,
  },
  {
    name: "AI Chat Summaries",
    description: "Auto-embedded on session summary via VEC-002 trigger",
    active: true,
  },
  {
    name: "Agent Memory",
    description: "Stored patterns, preferences, and learnings",
    active: true,
  },
];

export default function SemanticSearchAnalytics() {
  const { data, isLoading, error } = useSearchAnalytics();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load Semantic Search Analytics: {(error as Error).message}
      </div>
    );
  }

  const d = data ?? null;
  const qm = d?.queryMetrics ?? null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Search className="h-6 w-6" />
          Semantic Search Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor search effectiveness, latency, and relevance metrics.
        </p>
      </div>

      {/* Performance metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Query Latency</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {qm ? `${qm.avgLatencyMs}ms` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Target: &lt;{LATENCY_TARGET_MS}ms</p>
                    {qm && statusHealthy(qm.avgLatencyMs < LATENCY_TARGET_MS)}
                  </div>
                  <div className="rounded-md bg-sky-100 dark:bg-sky-900/30 p-2">
                    <Clock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">P95 Latency</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {qm ? `${qm.p95LatencyMs}ms` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Target: &lt;{P95_TARGET_MS}ms</p>
                    {qm && statusHealthy(qm.p95LatencyMs < P95_TARGET_MS)}
                  </div>
                  <div className="rounded-md bg-violet-100 dark:bg-violet-900/30 p-2">
                    <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">True Positive Rate</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {qm ? `${qm.truePositiveRatePct}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Target: &gt;{TRUE_POSITIVE_TARGET_PCT}%</p>
                    {qm && statusHealthy(qm.truePositiveRatePct >= TRUE_POSITIVE_TARGET_PCT)}
                  </div>
                  <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/30 p-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search index coverage */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-primary" />
          Search Index Coverage
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Total Searchable Items</p>
                  <p className="text-2xl font-bold text-primary mt-1">{d?.searchableItems ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Embeddings + Memories</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Embeddings in Index</p>
                  <p className="text-2xl font-bold text-primary mt-1">{d?.totalEmbeddings ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vectorized content</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <p className="text-sm font-medium text-muted-foreground">Agent Memories</p>
                  <p className="text-2xl font-bold text-primary mt-1">{d?.totalMemories ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Searchable patterns</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <h3 className="text-base font-medium mb-3">Embeddings by Content Type</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border rounded-lg shadow-sm">
                  <CardContent className="pt-6">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (d?.embeddingsByType ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">No embeddings in index yet.</p>
            ) : (
              (d?.embeddingsByType ?? []).map((item) => (
                <Card key={item.entity_type} className="border rounded-lg shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-muted-foreground">{item.entity_type}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{item.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.pct.toFixed(0)}% of total
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Query success rate */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Query Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Successful Searches</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {qm?.successfulSearches ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed Searches</p>
                  <p className="text-2xl font-bold text-destructive">{qm?.failedSearches ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-primary">{qm?.successRatePct?.toFixed(1) ?? 0}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${qm?.successRatePct ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result quality */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Result Quality
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Avg Results per Query</p>
                <p className="text-lg font-semibold text-primary">
                  {qm?.avgResultsPerQuery ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">2–5 (optimal)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Relevance Score</p>
                <p className="text-lg font-semibold text-primary">
                  {(d?.avgRelevancePct ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">&gt;70% (high relevance)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Accesses</p>
                <p className="text-lg font-semibold text-primary">{d?.totalAccesses ?? 0}</p>
                <p className="text-xs text-muted-foreground">Historical usage</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relevance Ranking</p>
                <p className="text-lg font-semibold text-primary">50/30/20</p>
                <p className="text-xs text-muted-foreground">R/Recency/Frequency</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking formula */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Semantic Search Ranking Formula</CardTitle>
          <CardDescription>
            score = (similarity × 0.5) + (recency_boost × 0.3) + (frequency_boost × 0.2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Vector Similarity</p>
                  <Badge variant="secondary">50%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cosine distance between embeddings. Uses pgvector with IVFFlat indexing.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Latency: &lt;50ms</p>
              </CardContent>
            </Card>
            <Card className="border bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Recency Boost</p>
                  <Badge variant="secondary">30%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Exponential decay over 30 days. Recent content ranked higher.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Latency: &lt;20ms</p>
              </CardContent>
            </Card>
            <Card className="border bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">Frequency Boost</p>
                  <Badge variant="secondary">20%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Accessed count normalized. Frequently used items ranked higher.
                </p>
                <p className="text-xs text-muted-foreground mt-1">Latency: &lt;10ms</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Configuration parameters */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Configuration Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Similarity Threshold</p>
              <p className="text-lg font-semibold text-primary">0.5</p>
              <p className="text-xs text-muted-foreground">Results below this score filtered</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Recency Decay</p>
              <p className="text-lg font-semibold text-primary">30 days</p>
              <p className="text-xs text-muted-foreground">Time constant for decay function</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Frequency Normalization</p>
              <p className="text-lg font-semibold text-primary">100 accesses</p>
              <p className="text-xs text-muted-foreground">Reference point for scoring</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Max Results</p>
              <p className="text-lg font-semibold text-primary">10</p>
              <p className="text-xs text-muted-foreground">Per query default</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Token Budget</p>
              <p className="text-lg font-semibold text-primary">2000</p>
              <p className="text-xs text-muted-foreground">Context window limit</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Search Latency</p>
              <p className="text-lg font-semibold text-primary">&lt;300ms</p>
              <p className="text-xs text-muted-foreground">Target end-to-end</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search sources */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Search Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEARCH_SOURCES.map((source) => (
            <div
              key={source.name}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div>
                <p className="font-medium">{source.name}</p>
                <p className="text-sm text-muted-foreground">{source.description}</p>
              </div>
              <Badge variant={source.active ? "default" : "secondary"} className="shrink-0">
                {source.active ? "active" : "inactive"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
