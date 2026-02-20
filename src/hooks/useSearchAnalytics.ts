/**
 * Admin: Semantic Search Analytics
 * Fetches embeddings (id, entity_type) and agent_memories (id, importance_score, access_count)
 * in a single load with Promise.all. Refetches every 60 seconds.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/cache";

const REFETCH_MS = 60_000;

export interface EmbeddingsByType {
  entity_type: string;
  count: number;
  pct: number;
}

export interface QueryMetrics {
  avgLatencyMs: number;
  p95LatencyMs: number;
  truePositiveRatePct: number;
  successfulSearches: number;
  failedSearches: number;
  successRatePct: number;
  avgResultsPerQuery: number;
}

export interface SearchAnalyticsData {
  totalEmbeddings: number;
  totalMemories: number;
  searchableItems: number;
  embeddingsByType: EmbeddingsByType[];
  avgRelevancePct: number;
  totalAccesses: number;
  queryMetrics: QueryMetrics;
}

// Placeholder query metrics until we have real tracking (e.g. vector_search_logs or similar).
// Replace with real data from your query-metrics table or Edge Function when available.
const SIMULATED_QUERY_METRICS: QueryMetrics = {
  avgLatencyMs: 142,
  p95LatencyMs: 285,
  truePositiveRatePct: 87,
  successfulSearches: 1247,
  failedSearches: 31,
  successRatePct: 97.5,
  avgResultsPerQuery: 4.2,
};

async function fetchSearchAnalytics(): Promise<SearchAnalyticsData> {
  const [embeddingsRes, memoriesRes] = await Promise.all([
    supabase.from("embeddings").select("id, entity_type"),
    supabase.from("agent_memories").select("id, importance_score, access_count").eq("is_active", true),
  ]);

  if (embeddingsRes.error) throw embeddingsRes.error;
  if (memoriesRes.error) throw memoriesRes.error;

  const embeddingRows = embeddingsRes.data ?? [];
  const memoryRows = memoriesRes.data ?? [];

  const totalEmbeddings = embeddingRows.length;
  const totalMemories = memoryRows.length;
  const searchableItems = totalEmbeddings + totalMemories;

  const byType = new Map<string, number>();
  for (const r of embeddingRows) {
    const t = r.entity_type ?? "unknown";
    byType.set(t, (byType.get(t) ?? 0) + 1);
  }
  const totalForPct = totalEmbeddings || 1;
  const embeddingsByType: EmbeddingsByType[] = Array.from(byType.entries()).map(([entity_type, count]) => ({
    entity_type,
    count,
    pct: (count / totalForPct) * 100,
  }));

  const withScore = memoryRows.filter(
    (r) => r.importance_score != null
  ) as { importance_score: number }[];
  const avgRelevancePct =
    withScore.length > 0
      ? (withScore.reduce((s, r) => s + r.importance_score, 0) / withScore.length) * 100
      : 0;

  const totalAccesses = memoryRows.reduce(
    (s, r) => s + (typeof r.access_count === "number" ? r.access_count : 0),
    0
  );

  return {
    totalEmbeddings,
    totalMemories,
    searchableItems,
    embeddingsByType,
    avgRelevancePct,
    totalAccesses,
    queryMetrics: SIMULATED_QUERY_METRICS,
  };
}

export function useSearchAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.searchAnalytics,
    queryFn: fetchSearchAnalytics,
    refetchInterval: REFETCH_MS,
  });
}
