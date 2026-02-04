/**
 * OKR Hooks
 *
 * CRUD operations for OKRs with key results and check-ins.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { OKR, OKRKeyResult, OKRCheckIn, OKRFormData, OKRFilters } from "../types";

const OKRS_KEY = "eos-okrs";

/**
 * Fetch OKRs with optional filters.
 */
export function useOKRs(filters?: OKRFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [OKRS_KEY, filters],
    queryFn: async (): Promise<OKR[]> => {
      let query = supabase
        .from("okrs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.quarter) {
        query = query.eq("quarter", filters.quarter);
      }
      if (filters?.owner_id) {
        query = query.eq("owner_id", filters.owner_id);
      }
      if (filters?.pod_id) {
        query = query.eq("pod_id", filters.pod_id);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as OKR[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single OKR with key results and recent check-ins.
 */
export function useOKRDetail(id: string | undefined) {
  return useQuery({
    queryKey: [OKRS_KEY, "detail", id],
    queryFn: async (): Promise<OKR | null> => {
      if (!id) return null;

      const { data: okr, error } = await supabase
        .from("okrs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!okr) return null;

      // Fetch key results
      const { data: keyResults } = await supabase
        .from("okr_key_results")
        .select("*")
        .eq("okr_id", id)
        .order("sort_order", { ascending: true });

      return {
        ...okr,
        key_results: (keyResults || []) as unknown as OKRKeyResult[],
      } as OKR;
    },
    enabled: !!id,
  });
}

/**
 * Fetch check-ins for an OKR.
 */
export function useOKRCheckIns(okrId: string | undefined) {
  return useQuery({
    queryKey: [OKRS_KEY, "check-ins", okrId],
    queryFn: async (): Promise<OKRCheckIn[]> => {
      if (!okrId) return [];

      const { data, error } = await supabase
        .from("okr_check_ins")
        .select("*")
        .eq("okr_id", okrId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as OKRCheckIn[];
    },
    enabled: !!okrId,
  });
}

/**
 * Create a new OKR.
 */
export function useCreateOKR() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: OKRFormData) => {
      const { data: okr, error } = await supabase
        .from("okrs")
        .insert({
          title: data.title,
          description: data.description || null,
          owner_id: data.owner_id || user!.id,
          status: data.status || "draft",
          quarter: data.quarter,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          pod_id: data.pod_id || null,
          parent_okr_id: data.parent_okr_id || null,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return okr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKRS_KEY] });
      toast.success("OKR created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create OKR", { description: error.message });
    },
  });
}

/**
 * Update an existing OKR.
 */
export function useUpdateOKR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OKRFormData> & { progress?: number } }) => {
      const { data: okr, error } = await supabase
        .from("okrs")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return okr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKRS_KEY] });
      toast.success("OKR updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update OKR", { description: error.message });
    },
  });
}

/**
 * Delete an OKR.
 */
export function useDeleteOKR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("okrs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKRS_KEY] });
      toast.success("OKR deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete OKR", { description: error.message });
    },
  });
}

/**
 * Add a key result to an OKR.
 */
export function useAddKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      okr_id: string;
      title: string;
      description?: string;
      metric_type?: string;
      target_value: number;
      start_value?: number;
      unit?: string;
      owner_id?: string;
    }) => {
      const { data: kr, error } = await supabase
        .from("okr_key_results")
        .insert({
          okr_id: data.okr_id,
          title: data.title,
          description: data.description || null,
          metric_type: data.metric_type || "number",
          target_value: data.target_value,
          start_value: data.start_value || 0,
          current_value: data.start_value || 0,
          unit: data.unit || "",
          owner_id: data.owner_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return kr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKRS_KEY] });
      toast.success("Key result added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add key result", { description: error.message });
    },
  });
}

/**
 * Record a check-in for a key result.
 */
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      okr_id: string;
      key_result_id: string;
      previous_value: number;
      new_value: number;
      confidence?: "low" | "medium" | "high";
      notes?: string;
    }) => {
      // Create check-in record
      const { error: checkInError } = await supabase.from("okr_check_ins").insert({
        okr_id: data.okr_id,
        key_result_id: data.key_result_id,
        user_id: user!.id,
        previous_value: data.previous_value,
        new_value: data.new_value,
        confidence: data.confidence || "medium",
        notes: data.notes || null,
      });

      if (checkInError) throw checkInError;

      // Update the key result's current value
      const { error: updateError } = await supabase
        .from("okr_key_results")
        .update({
          current_value: data.new_value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.key_result_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OKRS_KEY] });
      toast.success("Check-in recorded");
    },
    onError: (error: Error) => {
      toast.error("Failed to record check-in", { description: error.message });
    },
  });
}
