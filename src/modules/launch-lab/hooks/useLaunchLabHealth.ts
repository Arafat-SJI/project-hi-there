import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LaunchLabHealth = {
  ok: boolean;
  configured?: boolean;
  deployed: boolean;
  error?: string;
};

async function fetchLaunchLabHealth(): Promise<LaunchLabHealth> {
  const { data, error } = await supabase.functions.invoke("launch-lab-agent", {
    method: "GET",
  });

  if (error) {
    const status = (error as { context?: Response }).context?.status;
    if (status === 404) {
      return {
        ok: false,
        deployed: false,
        error: "Function not deployed to this Supabase project",
      };
    }
    return { ok: false, deployed: false, error: error.message };
  }

  const payload = data as { ok?: boolean; configured?: boolean } | null;
  return {
    ok: !!payload?.ok,
    configured: payload?.configured,
    deployed: true,
  };
}

export function useLaunchLabHealth() {
  return useQuery({
    queryKey: ["launch-lab", "health"],
    queryFn: fetchLaunchLabHealth,
    staleTime: 60_000,
    retry: false,
  });
}
