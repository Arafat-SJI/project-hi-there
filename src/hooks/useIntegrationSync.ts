/**
 * Integration Sync Hooks
 * Invoke project-sync Edge Functions and invalidate projects query.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SyncProjectsResponse {
  success: boolean;
  projects_synced: number;
  projects_created: number;
  projects_updated: number;
  queued?: boolean;
  message?: string;
  errors: string[];
}

const PROJECT_MANAGEMENT_SYNC_FUNCTIONS: Record<string, string> = {
  activecollab: "sync-projects-activecollab",
  jira: "sync-projects-jira",
  clickup: "sync-clickup",
  workamajig: "sync-workamajig",
};

/**
 * Sync projects from a Project Management provider (ActiveCollab, Jira).
 * Requires the provider to be configured (credentials in env for Edge Function).
 * On success invalidates the projects list.
 */
export function useSyncProjects(providerSlug: string) {
  const queryClient = useQueryClient();
  const functionName = PROJECT_MANAGEMENT_SYNC_FUNCTIONS[providerSlug];

  return useMutation({
    mutationFn: async (): Promise<SyncProjectsResponse> => {
      if (!functionName) {
        throw new Error(`No sync function for provider: ${providerSlug}`);
      }
      const { data, error } = await supabase.functions.invoke(functionName, {});
      if (error) throw error;
      const result = data as SyncProjectsResponse;
      if (!result.success && result.errors?.length) {
        throw new Error(result.errors[0] ?? "Sync failed");
      }
      return result;
    },
    onSuccess: (data) => {
      const invalidateProjects = () => queryClient.invalidateQueries({ queryKey: ["projects"] });
      invalidateProjects();

      if (data.queued) {
        if (typeof window !== "undefined") {
          [5000, 15000, 30000].forEach((delay) => {
            window.setTimeout(invalidateProjects, delay);
          });
        }

        toast.success(data.message ?? "Sync started. Your projects will update shortly.");
        if (data.errors?.length) {
          data.errors.forEach((e) => toast.warning(e));
        }
        return;
      }

      const msg =
        data.projects_synced === 0
          ? "No projects to sync."
          : `Synced ${data.projects_synced} project${data.projects_synced !== 1 ? "s" : ""} (${data.projects_created} created, ${data.projects_updated} updated).`;
      toast.success(msg);
      if (data.errors?.length) {
        data.errors.forEach((e) => toast.warning(e));
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to sync projects");
    },
  });
}
