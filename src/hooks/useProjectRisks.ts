import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, cacheConfig } from "@/lib/cache";

export interface ProjectRisk {
  id: string;
  name: string;
  slug: string;
  client_name: string | null;
  end_date: string | null;
  expected_completion_date: string | null;
  is_at_risk: boolean;
  risk_flags: string | null; // comma-separated from view
  open_tasks: number;
  last_client_meeting: string | null;
  last_activity: string | null;
}

/**
 * Queries the project_risk_summary view for at-risk projects.
 * Used by WatchListCard on the Owner dashboard.
 */
export function useProjectRisks(limit = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.projectRisks({ limit }),
    queryFn: async (): Promise<ProjectRisk[]> => {
      const { data, error } = await supabase
        .from("project_risk_summary" as any)
        .select("*")
        .eq("is_at_risk", true)
        .order("end_date", { ascending: true, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as ProjectRisk[];
    },
    staleTime: cacheConfig.staleTime.short,
  });
}

/**
 * Queries all projects from the risk summary view (not just at-risk).
 * Used to check how many are at risk and to show full project health.
 */
export function useAllProjectRisks() {
  return useQuery({
    queryKey: queryKeys.dashboard.projectRisks(),
    queryFn: async (): Promise<ProjectRisk[]> => {
      const { data, error } = await supabase
        .from("project_risk_summary" as any)
        .select("*")
        .order("is_at_risk", { ascending: false })
        .order("end_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return (data ?? []) as ProjectRisk[];
    },
    staleTime: cacheConfig.staleTime.short,
  });
}
