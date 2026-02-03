/**
 * Deals Hook - CRUD operations for the deals pipeline
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Deal, DealFormData, DealFilters, DealActivity, DealComment, DealPipelineStats, DealStage } from "../types";

const DEALS_KEY = "deals";

export function useDeals(filters?: DealFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [DEALS_KEY, filters],
    queryFn: async (): Promise<Deal[]> => {
      let query = supabase
        .from("deals")
        .select("*")
        .order("updated_at", { ascending: false });

      if (filters?.stage && filters.stage !== "all") query = query.eq("stage", filters.stage);
      if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id);
      if (filters?.client_id) query = query.eq("client_id", filters.client_id);
      if (filters?.search) query = query.ilike("title", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Deal[];
    },
    enabled: !!user,
  });
}

export function useDeal(slug: string) {
  return useQuery({
    queryKey: [DEALS_KEY, slug],
    queryFn: async (): Promise<Deal> => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
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
    queryKey: [DEALS_KEY, "pipeline-stats"],
    queryFn: async (): Promise<DealPipelineStats> => {
      const { data, error } = await supabase.from("deals").select("stage, value, probability");
      if (error) throw error;

      const stages: DealStage[] = ["lead", "discovery", "estimation", "proposal", "won", "lost"];
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

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: DealFormData) => {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: deal, error } = await supabase.from("deals").insert({
        title: data.title,
        slug: `${slug}-${Date.now().toString(36)}`,
        description: data.description || null,
        stage: data.stage || "lead",
        value: data.value || null,
        client_id: data.client_id || null,
        contact_id: data.contact_id || null,
        owner_id: data.owner_id || user?.id || null,
        expected_close_date: data.expected_close_date || null,
        source: data.source || null,
        created_by: user?.id || null,
      }).select().single();
      if (error) throw error;
      return deal;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [DEALS_KEY] }); toast.success("Deal created"); },
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
      if (data.client_id !== undefined) updates.client_id = data.client_id || null;
      if (data.contact_id !== undefined) updates.contact_id = data.contact_id || null;
      if (data.owner_id !== undefined) updates.owner_id = data.owner_id || null;
      if (data.expected_close_date !== undefined) updates.expected_close_date = data.expected_close_date || null;
      if (data.source !== undefined) updates.source = data.source || null;
      if (data.lost_reason !== undefined) updates.lost_reason = data.lost_reason || null;

      const { data: deal, error } = await supabase.from("deals").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return deal;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [DEALS_KEY] }); toast.success("Deal updated"); },
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [DEALS_KEY] }); toast.success("Deal deleted"); },
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

      // Log activity for the stage change
      await supabase.from("deal_activities").insert({
        deal_id: id,
        activity_type: "stage_change",
        title: `Stage changed${fromStage ? ` from ${fromStage}` : ""} to ${stage}`,
        description: stage === "won" ? "Deal closed as won" : stage === "lost" ? "Deal closed as lost" : null,
        performed_by: user?.id || null,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEALS_KEY, vars.id, "activities"] });
      toast.success("Stage updated");
    },
    onError: (error: Error) => toast.error("Failed to update stage", { description: error.message }),
  });
}

export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: [DEALS_KEY, dealId, "activities"],
    queryFn: async (): Promise<DealActivity[]> => {
      const { data, error } = await supabase
        .from("deal_activities")
        .select("*")
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
    queryKey: [DEALS_KEY, dealId, "comments"],
    queryFn: async (): Promise<DealComment[]> => {
      const { data, error } = await supabase
        .from("deal_comments")
        .select("*")
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
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: [DEALS_KEY, vars.dealId, "comments"] }); },
    onError: (error: Error) => toast.error("Failed to add comment", { description: error.message }),
  });
}
