import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/cache";
import type { SemanticSearchResult } from "@/types/knowledgeBase";

export interface UseSemanticMemorySearchOptions {
  query: string;
  matchThreshold?: number;
  matchCount?: number;
  entityType?: string | null;
  userId?: string | null;
  enabled?: boolean;
}

export function useSemanticMemorySearch({
  query,
  matchThreshold = 0.7,
  matchCount = 10,
  entityType = null,
  userId = null,
  enabled = true,
}: UseSemanticMemorySearchOptions) {
  return useQuery({
    queryKey: queryKeys.knowledge.semanticSearch(query, { entityType, userId }),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: {
          query,
          match_threshold: matchThreshold,
          match_count: matchCount,
          entity_type: entityType,
          user_id: userId,
        },
      });
      if (error) throw error;
      return (data?.results ?? []) as SemanticSearchResult[];
    },
    enabled: enabled && !!query && query.length >= 2,
  });
}
