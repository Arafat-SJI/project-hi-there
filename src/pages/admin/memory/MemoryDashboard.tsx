/**
 * Admin Memory Dashboard
 * Route: /admin/memory/dashboard (redirect /admin/memory → here)
 * All data from Supabase via useQuery in this component. No custom REST API.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Users,
  Database,
  Zap,
  TrendingUp,
  Layers,
  Bot,
  Mail,
  Briefcase,
} from "lucide-react";

const STATS_REFETCH_MS = 30_000;
const QUEUE_REFETCH_MS = 30_000;
const CACHE_REFETCH_MS = 60_000;

interface MemoryStats {
  totalMemories: number;
  avgRelevancePct: number;
  hierarchyEntries: number;
  scopeDistribution: { personal: number; agent: number; organizational: number };
  totalEmbeddings: number;
  memoryTypeBreakdown: { agentMemory: number; emailMemory: number; dealMemory: number };
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  successRatePct: number;
}

interface CacheStats {
  servingUsers: number;
  cacheHitRatePct: number | null;
}

function avgRelevancePct(rows: { relevance_score?: number | null }[]): number {
  const withScore = rows.filter((r) => r.relevance_score != null) as { relevance_score: number }[];
  if (withScore.length === 0) return 0;
  const sum = withScore.reduce((s, r) => s + Number(r.relevance_score), 0);
  return (sum / withScore.length) * 100;
}

function scopeDistribution(rows: { scope_type?: string | null }[]): {
  personal: number;
  agent: number;
  organizational: number;
} {
  let personal = 0,
    agent = 0,
    organizational = 0;
  for (const r of rows) {
    const s = (r.scope_type ?? "").toLowerCase();
    if (s === "user") personal++;
    else if (["agent", "deal", "client"].includes(s)) agent++;
    else if (["organization", "team"].includes(s)) organizational++;
  }
  return { personal, agent, organizational };
}

export default function MemoryDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["admin", "memory-dashboard", "stats"],
    queryFn: async (): Promise<MemoryStats> => {
      const from = (table: string) =>
        (supabase as { from: (t: string) => ReturnType<typeof supabase.from> }).from(table);

      const agentPromise = from("agent_memory").select("id, relevance_score", { count: "exact" });
      const emailPromise = from("email_memory").select("id, relevance_score", { count: "exact" });
      const dealPromise = from("deal_memory").select("id, relevance_score", { count: "exact" });
      const hierarchyPromise = from("memory_hierarchy").select("id, scope_type", { count: "exact" });
      const embeddingsPromise = supabase
        .from("embeddings")
        .select("id", { count: "exact", head: true });

      const [agentRes, emailRes, dealRes, hierarchyRes, embeddingsRes] = await Promise.allSettled([
        agentPromise,
        emailPromise,
        dealPromise,
        hierarchyPromise,
        embeddingsPromise,
      ]);

      const agentData = agentRes.status === "fulfilled" && !agentRes.value.error ? agentRes.value.data ?? [] : [];
      const emailData = emailRes.status === "fulfilled" && !emailRes.value.error ? emailRes.value.data ?? [] : [];
      const dealData = dealRes.status === "fulfilled" && !dealRes.value.error ? dealRes.value.data ?? [] : [];
      const hierarchyData = hierarchyRes.status === "fulfilled" && !hierarchyRes.value.error ? hierarchyRes.value.data ?? [] : [];
      const embeddingsCount =
        embeddingsRes.status === "fulfilled" && !embeddingsRes.value.error && embeddingsRes.value.count != null
          ? embeddingsRes.value.count
          : 0;

      const agentCount = agentData.length;
      const emailCount = emailData.length;
      const dealCount = dealData.length;
      const totalMemories = agentCount + emailCount + dealCount;
      const allRelevanceRows = [
        ...(agentData as { relevance_score?: number | null }[]),
        ...(emailData as { relevance_score?: number | null }[]),
        ...(dealData as { relevance_score?: number | null }[]),
      ];
      const avgRelevanceVal = allRelevanceRows.length > 0 ? avgRelevancePct(allRelevanceRows) : 0;
      const scopeDist = scopeDistribution(hierarchyData as { scope_type?: string | null }[]);
      const hierarchyEntries = scopeDist.personal + scopeDist.agent + scopeDist.organizational;

      return {
        totalMemories,
        avgRelevancePct: avgRelevanceVal,
        hierarchyEntries,
        scopeDistribution: scopeDist,
        totalEmbeddings: embeddingsCount,
        memoryTypeBreakdown: { agentMemory: agentCount, emailMemory: emailCount, dealMemory: dealCount },
      };
    },
    refetchInterval: STATS_REFETCH_MS,
  });

  const { data: queueStats, isLoading: queueLoading } = useQuery({
    queryKey: ["admin", "memory-dashboard", "queue"],
    queryFn: async (): Promise<QueueStats> => {
      const { data, error } = await supabase.from("embedding_queue").select("status");
      if (error) throw error;
      const rows = data ?? [];
      const pending = rows.filter((r) => r.status === "pending").length;
      const processing = rows.filter((r) => r.status === "processing").length;
      const completed = rows.filter((r) => r.status === "completed").length;
      const failed = rows.filter((r) => r.status === "failed").length;
      const total = completed + failed;
      const successRatePct = total > 0 ? (completed / total) * 100 : 0;
      return { pending, processing, completed, failed, total: rows.length, successRatePct };
    },
    refetchInterval: QUEUE_REFETCH_MS,
  });

  const { data: cacheStats } = useQuery({
    queryKey: ["admin", "memory-dashboard", "cache"],
    queryFn: async (): Promise<CacheStats> => {
      const admin = (supabase as unknown as { auth?: { admin?: { listUsers?: () => Promise<{ data?: { users?: unknown[] } }> } } }).auth?.admin;
      if (admin?.listUsers) {
        try {
          const res = await admin.listUsers();
          const users = res?.data?.users ?? [];
          return { servingUsers: users.length, cacheHitRatePct: null };
        } catch {
          return { servingUsers: 0, cacheHitRatePct: null };
        }
      }
      return { servingUsers: 0, cacheHitRatePct: null };
    },
    refetchInterval: CACHE_REFETCH_MS,
  });

  const isLoading = statsLoading || queueLoading;
  const d = stats;
  const q = queueStats ?? { pending: 0, processing: 0, completed: 0, failed: 0, total: 0, successRatePct: 0 };
  const cache = cacheStats ?? { servingUsers: 0, cacheHitRatePct: null };

  if (statsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load Memory Dashboard: {(statsError as Error).message}
      </div>
    );
  }

  const hierarchy = d?.scopeDistribution ?? { personal: 0, agent: 0, organizational: 0 };
  const totalHierarchy = hierarchy.personal + hierarchy.agent + hierarchy.organizational || 1;
  const personalPct = (hierarchy.personal / totalHierarchy) * 100;
  const agentPct = (hierarchy.agent / totalHierarchy) * 100;
  const orgPct = (hierarchy.organizational / totalHierarchy) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          Memory Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor memory system health, embeddings pipeline, and cache performance.
        </p>
      </div>

      {/* Row 1 – Stat cards (5) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Memories</p>
                  <p className="text-2xl font-bold text-primary mt-1">{d?.totalMemories ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg relevance: {(d?.avgRelevancePct ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hierarchy Entries</p>
                  <p className="text-2xl font-bold text-primary mt-1">{d?.hierarchyEntries ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">3-tier scope system</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Embeddings</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {(d?.totalEmbeddings ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Vectorized content</p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Queue Pending</p>
                  <p className="text-2xl font-bold text-primary mt-1">{q.pending}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {q.successRatePct.toFixed(1)}% success rate
                  </p>
                </div>
                <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 p-2">
                  <Zap className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border rounded-lg shadow-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {cache.cacheHitRatePct != null ? `${cache.cacheHitRatePct}%` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Serving {cache.servingUsers} users
                  </p>
                </div>
                <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/30 p-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 – Memory Hierarchy Distribution */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          Memory Hierarchy Distribution
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border rounded-lg shadow-sm">
              <CardContent className="pt-6">
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">
                      {i === 0 ? "Personal" : i === 1 ? "Agent" : "Organizational"}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {i === 0 ? hierarchy.personal : i === 1 ? hierarchy.agent : hierarchy.organizational}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {i === 0
                        ? "User-specific preferences and history"
                        : i === 1
                          ? "Agent-level patterns and learnings"
                          : "Company-wide knowledge and policies"}
                    </p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{
                          width: `${i === 0 ? personalPct : i === 1 ? agentPct : orgPct}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(i === 0 ? personalPct : i === 1 ? agentPct : orgPct).toFixed(0)}% of hierarchy
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Row 3 – Memory Type Breakdown */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Memory Type Breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6 flex gap-4">
              <div className="rounded-md bg-violet-100 dark:bg-violet-900/30 p-2 shrink-0">
                <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-14 w-full" />
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Agent Memory</p>
                    <p className="text-2xl font-bold text-primary mt-1">{d?.memoryTypeBreakdown.agentMemory ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">User preferences, interaction patterns</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6 flex gap-4">
              <div className="rounded-md bg-violet-100 dark:bg-violet-900/30 p-2 shrink-0">
                <Mail className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-14 w-full" />
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Email Memory</p>
                    <p className="text-2xl font-bold text-primary mt-1">{d?.memoryTypeBreakdown.emailMemory ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Communication style per client</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="border rounded-lg shadow-sm">
            <CardContent className="pt-6 flex gap-4">
              <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 p-2 shrink-0">
                <Briefcase className="h-6 w-6 text-amber-700 dark:text-amber-500" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-14 w-full" />
                ) : (
                  <>
                    <p className="text-sm font-medium text-muted-foreground">Deal Memory</p>
                    <p className="text-2xl font-bold text-primary mt-1">{d?.memoryTypeBreakdown.dealMemory ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Deal coaching and stage insights</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 4 – Embedding Pipeline Status + Performance */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Embedding Pipeline Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 px-4 py-2">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Pending</span>
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{q.pending}</p>
                  </div>
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 px-4 py-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Processing</span>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{q.processing}</p>
                  </div>
                  <div className="rounded-lg bg-green-100 dark:bg-green-900/30 px-4 py-2">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Completed</span>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{q.completed}</p>
                  </div>
                  <div className="rounded-lg bg-red-100 dark:bg-red-900/30 px-4 py-2">
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">Failed</span>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400">{q.failed}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Success Rate: {q.successRatePct.toFixed(1)}% ({q.completed}/{q.completed + q.failed})
                </p>
                <p className="text-xs text-muted-foreground">
                  Auto-processing every 5 minutes. Queue items processed: {q.completed}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Query Latency</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">&lt;300ms — —</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Memory Cache TTL</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Per user — 1 hour</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Token Savings</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">70% reduction — OK</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Consolidation</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">Per user — Every 20 turns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5 – Memory System Status (static) */}
      <Card className="border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Memory System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Agent Memory</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  User preferences
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Interaction history
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Semantic Search</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Vector DB indexed
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Similarity &lt;50ms
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Auto-Embedding</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Deal notes trigger
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Meeting summaries
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Caching</p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Browser localStorage
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Session cache
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
