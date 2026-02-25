import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, cacheConfig } from "@/lib/cache";

export interface OwnerMetrics {
  revenue_this_week: number;
  team_utilization: number;
  projects_in_progress: number;
  projects_at_risk: number;
  active_clients: number;
  active_team_members: number;
  generated_at: string;
}

/**
 * Queries the owner_dashboard_metrics view.
 * Returns a single-row aggregate with key business health metrics.
 */
export function useOwnerMetrics() {
  return useQuery({
    queryKey: queryKeys.dashboard.ownerMetrics,
    queryFn: async (): Promise<OwnerMetrics> => {
      const { data, error } = await supabase
        .from("owner_dashboard_metrics" as any)
        .select("*")
        .single();

      if (error) throw error;
      return data as unknown as OwnerMetrics;
    },
    staleTime: cacheConfig.staleTime.short,
  });
}
