/**
 * Integration Sync Hooks — project PM providers and Zoho CRM.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { API } from "@/shared/config/api";
import { toast } from "sonner";
import { invalidateKeys } from "@/lib/cache";

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

const TASK_SYNC_FUNCTIONS: Record<string, string> = {
  jira: "sync-tasks-jira",
};

export interface SyncTasksChunkResponse {
  success: boolean;
  tasks_synced: number;
  tasks_created: number;
  tasks_updated: number;
  comments_synced?: number;
  worklogs_synced?: number;
  errors: string[];
  has_more?: boolean;
  next_page_token?: string;
}

/**
 * Sync projects from a Project Management provider (ActiveCollab, Jira, etc.).
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

/**
 * Sync tasks/issues from a PM provider (chunked pagination for Jira).
 */
export function useSyncTasks(providerSlug: string) {
  const queryClient = useQueryClient();
  const functionName = TASK_SYNC_FUNCTIONS[providerSlug];

  return useMutation({
    mutationFn: async (opts?: { project_key?: string }): Promise<SyncTasksChunkResponse> => {
      if (!functionName) {
        throw new Error(`No task sync function for provider: ${providerSlug}`);
      }
      let nextPageToken: string | undefined;
      let aggregate: SyncTasksChunkResponse | undefined;

      for (;;) {
        const body: Record<string, unknown> = {
          ...(opts?.project_key ? { project_key: opts.project_key } : {}),
          ...(nextPageToken ? { next_page_token: nextPageToken } : {}),
        };
        const { data, error } = await supabase.functions.invoke(functionName, { body });
        if (error) throw error;
        const result = data as SyncTasksChunkResponse;
        if (!result.success && result.errors?.length) {
          throw new Error(result.errors[0] ?? "Task sync failed");
        }
        aggregate = {
          success: result.success,
          tasks_synced: (aggregate?.tasks_synced ?? 0) + result.tasks_synced,
          tasks_created: (aggregate?.tasks_created ?? 0) + result.tasks_created,
          tasks_updated: (aggregate?.tasks_updated ?? 0) + result.tasks_updated,
          comments_synced: (aggregate?.comments_synced ?? 0) + (result.comments_synced ?? 0),
          worklogs_synced: (aggregate?.worklogs_synced ?? 0) + (result.worklogs_synced ?? 0),
          errors: [...(aggregate?.errors ?? []), ...(result.errors ?? [])],
        };
        invalidateKeys.tasks(queryClient);
        if (!result.has_more) break;
        nextPageToken = result.next_page_token;
        if (!nextPageToken) break;
      }

      if (!aggregate) {
        throw new Error("Task sync returned no data");
      }
      return aggregate;
    },
    onSuccess: (data) => {
      const msg =
        data.tasks_synced === 0
          ? "No Jira issues synced in this run."
          : `Synced ${data.tasks_synced} task${data.tasks_synced !== 1 ? "s" : ""} from Jira (${data.tasks_created} created, ${data.tasks_updated} updated).`;
      toast.success(msg);
      if (data.errors?.length) {
        data.errors.forEach((e) => toast.warning(e));
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to sync tasks");
    },
  });
}

// --- Zoho CRM ---

export type ZohoCrmResource = "leads" | "contacts" | "deals" | "accounts";

export function useSyncCrmData(providerSlug: string, resource: ZohoCrmResource) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId?: string) => {
      if (providerSlug !== "zoho-crm") {
        throw new Error(`Unsupported CRM provider: ${providerSlug}`);
      }
      const { data, error } = await supabase.functions.invoke(API.CRM.ZOHO_SYNC, {
        body: {
          resource,
          provider: providerSlug,
          user_id: user?.id ?? undefined,
          record_id: recordId,
        },
      });
      if (error) throw error;
      if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
        throw new Error(String((data as { error: string }).error));
      }
      return data as { success?: boolean; processed?: number };
    },
    onSuccess: (data) => {
      invalidateKeys.clients(queryClient);
      invalidateKeys.deals(queryClient);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      const n = data?.processed ?? 0;
      toast.success(`Zoho: synced ${n} ${resource}`);
    },
    onError: (e: Error) => {
      toast.error(e.message || "CRM sync failed");
    },
  });
}

/** Sync a single Zoho Deals or Leads row by Zoho record id (from deals.external_id). */
export function useSyncZohoCrmRecord() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { resource: ZohoCrmResource; recordId: string }) => {
      const { data, error } = await supabase.functions.invoke(API.CRM.ZOHO_SYNC, {
        body: {
          resource: input.resource,
          provider: "zoho-crm",
          user_id: user?.id ?? undefined,
          record_id: input.recordId,
        },
      });
      if (error) throw error;
      if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
        throw new Error(String((data as { error: string }).error));
      }
      return data as { success?: boolean; processed?: number };
    },
    onSuccess: () => {
      invalidateKeys.deals(queryClient);
      toast.success("Updated from Zoho CRM");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Zoho sync failed");
    },
  });
}

export function useZohoPipelineSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const resources: ZohoCrmResource[] = ["deals", "leads"];
      let total = 0;
      for (const resource of resources) {
        const { data, error } = await supabase.functions.invoke(API.CRM.ZOHO_SYNC, {
          body: { resource, provider: "zoho-crm", user_id: user?.id ?? undefined },
        });
        if (error) throw error;
        if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
          throw new Error(String((data as { error: string }).error));
        }
        total += (data as { processed?: number })?.processed ?? 0;
      }
      return total;
    },
    onSuccess: (total) => {
      invalidateKeys.deals(queryClient);
      toast.success(`Zoho: synced ${total} deal/lead records`);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Zoho sync failed");
    },
  });
}
