/**
 * Work Types — CRUD hook for admin management
 *
 * Manages work_types table (name, category, is_billable, default_rate, etc.).
 * Used by project billing and resource planning.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorkType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_billable: boolean;
  default_rate: number | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export type WorkTypeCategory = "services" | "support" | "admin" | "internal" | "other";

export const WORK_TYPE_CATEGORIES: { value: WorkTypeCategory; label: string }[] = [
  { value: "services", label: "Services" },
  { value: "support", label: "Support" },
  { value: "admin", label: "Admin" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
];

const QUERY_KEY = ["work-types"] as const;

export function useWorkTypes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<WorkType[]> => {
      // work_types may not be in auto-generated types yet
      const { data, error } = await supabase
        .from("work_types")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as WorkType[];
    },
  });
}

export function useCreateWorkType() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      slug: string;
      description?: string;
      category: string;
      is_billable: boolean;
      default_rate?: number | null;
      color: string;
      sort_order: number;
    }) => {
      const { data, error } = await supabase
        .from("work_types")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Work type created" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create work type", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateWorkType() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<WorkType> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_types")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Work type updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update work type", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteWorkType() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("work_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast({ title: "Work type deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete work type", description: err.message, variant: "destructive" });
    },
  });
}

export function useReorderWorkTypes() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase
          .from("work_types")
          .update({ sort_order: index })
          .eq("id", id)
      );
      const results = await Promise.all(updates);
      const failed = results.find((r: any) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
