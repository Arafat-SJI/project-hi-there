/**
 * Task Categories Hooks
 *
 * CRUD operations for the task_categories table.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TaskCategory } from "../types/tasks";

const CATEGORIES_KEY = "task-categories";

export function useTaskCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: async (): Promise<TaskCategory[]> => {
      const { data, error } = await supabase
        .from("task_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Get next sort_order
      const { data: existing } = await supabase
        .from("task_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { data: category, error } = await supabase
        .from("task_categories")
        .insert({ name: data.name, color: data.color, slug, sort_order: nextOrder })
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      toast.success("Category created");
    },
    onError: (error: Error) => toast.error("Failed to create category", { description: error.message }),
  });
}

export function useUpdateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string; sort_order?: number } }) => {
      const { error } = await supabase.from("task_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      toast.success("Category updated");
    },
    onError: (error: Error) => toast.error("Failed to update category", { description: error.message }),
  });
}

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Unlink tasks first
      await supabase.from("tasks").update({ category_id: null }).eq("category_id", id);
      const { error } = await supabase.from("task_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["actions-tasks"] });
      toast.success("Category deleted");
    },
    onError: (error: Error) => toast.error("Failed to delete category", { description: error.message }),
  });
}
