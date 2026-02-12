/**
 * Deals Hook - CRUD operations for the deals pipeline
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import type { Deal, DealFormData, DealFilters, DealActivity, DealComment, DealPipelineStats, DealStage, DealActivityType } from "../types";

const DEAL_SELECT = "*, owner:profiles!deals_owner_id_profiles_fkey(full_name, email), client:clients(name), contact:contacts(first_name, last_name, email)";
const ACTIVITY_SELECT = "*, user:profiles!deal_activities_user_id_profiles_fkey(full_name)";
const COMMENT_SELECT = "*, user:profiles!deal_comments_user_id_profiles_fkey(full_name, email)";

/** Metadata keys stored on deals.metadata (including URLs & Links and Advanced) */
const DEAL_METADATA_KEYS = [
  "deal_type", "category", "next_step", "pipeline", "assigned_pod",
  "estimate_url", "internal_estimate_doc_url", "client_estimate_doc_url",
  "pandadoc_proposal_url", "hubspot_deal_url", "leadslift_crm_deal_url",
  "google_drive_folder_url", "workboard_ai_link", "collaborative_ai_link", "client_agent_folder",
  "company_name", "client_email", "contact_first_name", "contact_last_name", "contact_phone",
  "website", "linkedin_profile", "hubspot_deal_id", "hubspot_owner_id", "type_of_work",
] as const;

export function useDeals(filters?: DealFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.deals.list(filters),
    queryFn: async (): Promise<Deal[]> => {
      let query = supabase
        .from("deals")
        .select(DEAL_SELECT)
        .order("updated_at", { ascending: false });

      if (filters?.stage && filters.stage !== "all") query = query.eq("stage", filters.stage);
      if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id);
      if (filters?.client_id) query = query.eq("client_id", filters.client_id);
      if (filters?.search) query = query.ilike("title", `%${filters.search}%`);
      if (filters?.excludeLost) query = query.neq("stage", "lost");

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Deal[];
    },
    enabled: !!user,
  });
}

export function useDeal(slug: string) {
  return useQuery({
    queryKey: queryKeys.deals.detail(slug),
    queryFn: async (): Promise<Deal> => {
      const { data, error } = await supabase
        .from("deals")
        .select(DEAL_SELECT)
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as unknown as Deal;
    },
    enabled: !!slug,
  });
}

export function useDealPipelineStats() {
  return useQuery({
    queryKey: queryKeys.deals.pipelineStats,
    queryFn: async (): Promise<DealPipelineStats> => {
      const { data, error } = await supabase.from("deals").select("stage, value, probability");
      if (error) throw error;

      const stages: DealStage[] = ["lead", "discovery", "qualified", "estimation", "proposal", "won", "lost"];
      const by_stage = {} as Record<DealStage, { count: number; value: number }>;
      stages.forEach((s) => { by_stage[s] = { count: 0, value: 0 }; });

      let total_value = 0;
      let prob_sum = 0;
      (data || []).forEach((d: any) => {
        if (by_stage[d.stage as DealStage]) {
          by_stage[d.stage as DealStage].count++;
          by_stage[d.stage as DealStage].value += Number(d.value) || 0;
        }
        total_value += Number(d.value) || 0;
        prob_sum += d.probability || 0;
      });

      return {
        total_deals: data?.length || 0,
        total_value,
        by_stage,
        avg_probability: data?.length ? Math.round(prob_sum / data.length) : 0,
      };
    },
  });
}

export interface RevenueProjectionMonth {
  month: string;
  label: string;
  projected: number;
}

export function useDealRevenueProjection(year?: number) {
  const y = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: queryKeys.deals.revenueProjection(y),
    queryFn: async (): Promise<RevenueProjectionMonth[]> => {
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      const { data, error } = await supabase
        .from("deals")
        .select("value, probability, expected_close_date")
        .in("stage", ["lead", "discovery", "qualified", "estimation", "proposal"])
        .not("expected_close_date", "is", null)
        .gte("expected_close_date", start)
        .lte("expected_close_date", end);
      if (error) throw error;
      const byMonth: Record<string, number> = {};
      for (let m = 1; m <= 12; m++) {
        const key = `${y}-${String(m).padStart(2, "0")}`;
        byMonth[key] = 0;
      }
      (data || []).forEach((d: any) => {
        const date = d.expected_close_date;
        if (!date) return;
        const monthKey = date.slice(0, 7);
        const val = Number(d.value) || 0;
        const prob = Number(d.probability) || 0;
        byMonth[monthKey] = (byMonth[monthKey] ?? 0) + val * (prob / 100);
      });
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
        const month = `${y}-${String(m).padStart(2, "0")}`;
        return {
          month,
          label: `${monthNames[m - 1]} ${String(y).slice(2)}`,
          projected: byMonth[month] ?? 0,
        };
      });
    },
  });
}

export interface DealOverviewExtra {
  avg_days_to_close: number;
}

export function useDealOverviewExtra() {
  return useQuery({
    queryKey: queryKeys.deals.overviewExtra,
    queryFn: async (): Promise<DealOverviewExtra> => {
      const { data, error } = await supabase
        .from("deals")
        .select("created_at, closed_at")
        .eq("stage", "won")
        .not("closed_at", "is", null);
      if (error) throw error;
      const days: number[] = (data || []).map((d: any) => {
        const created = new Date(d.created_at).getTime();
        const closed = new Date(d.closed_at).getTime();
        return Math.round((closed - created) / (1000 * 60 * 60 * 24));
      }).filter((d) => !isNaN(d));
      const avg = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
      return { avg_days_to_close: avg };
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: DealFormData & Record<string, unknown>) => {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const metadata: Record<string, unknown> = {};
      for (const k of DEAL_METADATA_KEYS) {
        const v = data[k];
        if (v !== undefined && v !== null && v !== "") metadata[k] = v;
      }
      const { data: deal, error } = await supabase.from("deals").insert({
        title: data.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: data.description || null,
        stage: data.stage || "lead",
        value: data.value || null,
        probability: data.probability ?? 0,
        client_id: data.client_id || null,
        contact_id: data.contact_id || null,
        owner_id: data.owner_id || user?.id || null,
        expected_close_date: data.expected_close_date || null,
        source: data.source || null,
        tags: data.tags || [],
        created_by: user?.id || null,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
      }).select().single();
      if (error) throw error;
      return deal;
    },
    onSuccess: () => { invalidateKeys.deals(queryClient); toast.success("Deal created"); },
    onError: (error: Error) => toast.error("Failed to create deal", { description: error.message }),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DealFormData> & { lost_reason?: string } }) => {
      const updates: Record<string, unknown> = {};
      if (data.title !== undefined) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description || null;
      if (data.stage !== undefined) {
        updates.stage = data.stage;
        if (data.stage === "won" || data.stage === "lost") updates.closed_at = new Date().toISOString();
        else updates.closed_at = null;
      }
      if (data.value !== undefined) updates.value = data.value || null;
      if (data.probability !== undefined) updates.probability = data.probability ?? 0;
      if (data.tags !== undefined) updates.tags = data.tags || [];
      if (data.client_id !== undefined) updates.client_id = data.client_id || null;
      if (data.contact_id !== undefined) updates.contact_id = data.contact_id || null;
      if (data.owner_id !== undefined) updates.owner_id = data.owner_id || null;
      if (data.expected_close_date !== undefined) updates.expected_close_date = data.expected_close_date || null;
      if (data.source !== undefined) updates.source = data.source || null;
      if (data.lost_reason !== undefined) updates.lost_reason = data.lost_reason || null;
      const dataAny = data as Record<string, unknown>;
      const hasMeta = DEAL_METADATA_KEYS.some((k) => dataAny[k] !== undefined);
      if (hasMeta) {
        const { data: existing } = await supabase.from("deals").select("metadata").eq("id", id).single();
        const prev = (existing as any)?.metadata as Record<string, unknown> || {};
        updates.metadata = { ...prev };
        for (const k of DEAL_METADATA_KEYS) {
          if (dataAny[k] !== undefined) (updates.metadata as Record<string, unknown>)[k] = dataAny[k] || null;
        }
      }

      const { data: deal, error } = await supabase.from("deals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return deal;
    },
    onSuccess: () => { invalidateKeys.deals(queryClient); toast.success("Deal updated"); },
    onError: (error: Error) => toast.error("Failed to update deal", { description: error.message }),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateKeys.deals(queryClient); toast.success("Deal deleted"); },
    onError: (error: Error) => toast.error("Failed to delete deal", { description: error.message }),
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, stage, fromStage }: { id: string; stage: DealStage; fromStage?: string }) => {
      const updates: Record<string, unknown> = { stage };
      if (stage === "won" || stage === "lost") updates.closed_at = new Date().toISOString();
      const { error } = await supabase.from("deals").update(updates).eq("id", id);
      if (error) throw error;

      // Activity logging is best-effort (client cannot run a single transaction across deals + deal_activities).
      const { error: activityError } = await supabase.from("deal_activities").insert({
        deal_id: id,
        activity_type: "stage_change",
        content: `Stage changed${fromStage ? ` from ${fromStage}` : ""} to ${stage}${stage === "won" ? " - Deal closed as won" : stage === "lost" ? " - Deal closed as lost" : ""}`,
        user_id: user?.id || null,
      });
      if (activityError) {
        toast.error("Stage updated; activity log could not be saved.", { description: activityError.message });
      }
    },
    onSuccess: (_, vars) => {
      invalidateKeys.deals(queryClient);
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.activities(vars.id) });
      toast.success("Stage updated");
    },
    onError: (error: Error) => toast.error("Failed to update stage", { description: error.message }),
  });
}

export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: queryKeys.deals.activities(dealId),
    queryFn: async (): Promise<DealActivity[]> => {
      const { data, error } = await supabase
        .from("deal_activities")
        .select(ACTIVITY_SELECT)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DealActivity[];
    },
    enabled: !!dealId,
  });
}

export function useDealComments(dealId: string) {
  return useQuery({
    queryKey: queryKeys.deals.comments(dealId),
    queryFn: async (): Promise<DealComment[]> => {
      const { data, error } = await supabase
        .from("deal_comments")
        .select(COMMENT_SELECT)
        .eq("deal_id", dealId)
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as DealComment[];
    },
    enabled: !!dealId,
  });
}

export function useAddDealComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ dealId, content }: { dealId: string; content: string }) => {
      const { error } = await supabase.from("deal_comments").insert({ deal_id: dealId, user_id: user?.id!, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: queryKeys.deals.comments(vars.dealId) }); },
    onError: (error: Error) => toast.error("Failed to add comment", { description: error.message }),
  });
}

export function useUpdateDealComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dealId, content }: { id: string; dealId: string; content: string }) => {
      const { error } = await supabase.from("deal_comments").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: queryKeys.deals.comments(vars.dealId) }); toast.success("Comment updated"); },
    onError: (error: Error) => toast.error("Failed to update comment", { description: error.message }),
  });
}

export function useDeleteDealComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; dealId: string }) => {
      const { error } = await supabase.from("deal_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: queryKeys.deals.comments(vars.dealId) }); toast.success("Comment deleted"); },
    onError: (error: Error) => toast.error("Failed to delete comment", { description: error.message }),
  });
}

export function useAddDealActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ dealId, activityType, content }: { dealId: string; activityType: DealActivityType; content: string }) => {
      const { error } = await supabase.from("deal_activities").insert({
        deal_id: dealId,
        activity_type: activityType,
        content,
        user_id: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deals.activities(vars.dealId) });
      toast.success("Activity logged");
    },
    onError: (error: Error) => toast.error("Failed to log activity", { description: error.message }),
  });
}
