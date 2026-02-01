/**
 * Task Hooks (Actions Module)
 *
 * CRUD operations and filtered queries for the tasks table,
 * with support for streams, subtasks, views (today, week, overdue, delegated).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Task, TaskFormData, TaskFilters, TaskStats, TaskView } from "../types/tasks";

const TASKS_KEY = "actions-tasks";

/**
 * Fetch tasks with filters and view support.
 */
export function useTasksV2(filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [TASKS_KEY, filters],
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          clients(name),
          meetings(title),
          task_streams(name, color),
          task_categories(name, color)
        `)
        .is("parent_id", null) // Only top-level tasks
        .order("created_at", { ascending: false });

      // View-based filters
      if (filters?.view && filters.view !== "all") {
        query = applyViewFilter(query, filters.view, user?.id);
      }

      // Explicit filters
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq("assigned_to", filters.assigned_to);
      }
      if (filters?.stream_id) {
        query = query.eq("stream_id", filters.stream_id);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(mapTaskRow);
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single task by ID with subtasks and comment count.
 */
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: [TASKS_KEY, "detail", id],
    queryFn: async (): Promise<Task | null> => {
      if (!id) return null;

      // Fetch task
      const { data: task, error } = await supabase
        .from("tasks")
        .select(`
          *,
          clients(name),
          meetings(title),
          task_streams(name, color),
          task_categories(name, color)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!task) return null;

      // Fetch subtasks
      const { data: subtasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("parent_id", id)
        .order("position", { ascending: true });

      // Fetch comment count
      const { count } = await supabase
        .from("task_comments")
        .select("id", { count: "exact", head: true })
        .eq("task_id", id);

      const mapped = mapTaskRow(task);
      mapped.subtasks = (subtasks || []).map(mapTaskRow);
      mapped.comment_count = count || 0;

      return mapped;
    },
    enabled: !!id,
  });
}

/**
 * Task statistics for the current view.
 */
export function useTaskStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [TASKS_KEY, "stats"],
    queryFn: async (): Promise<TaskStats> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("status, due_date")
        .is("parent_id", null);

      if (error) throw error;

      const now = new Date();
      const tasks = data || [];

      return {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        overdue: tasks.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < now &&
            t.status !== "completed" &&
            t.status !== "cancelled"
        ).length,
      };
    },
    enabled: !!user,
  });
}

/**
 * Create a new task.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      const slug = generateSlug(data.title);
      const { data: task, error } = await supabase
        .from("tasks")
        .insert({
          title: data.title,
          description: data.description || null,
          status: data.status,
          priority: data.priority,
          due_date: data.due_date || null,
          assigned_to: data.assigned_to || null,
          stream_id: data.stream_id || null,
          parent_id: data.parent_id || null,
          category_id: data.category_id || null,
          client_id: data.client_id || null,
          meeting_id: data.meeting_id || null,
          created_by: user!.id,
          slug,
        })
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast.success("Task created");
    },
    onError: (error: Error) => {
      toast.error("Failed to create task", { description: error.message });
    },
  });
}

/**
 * Update an existing task.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> & { completed_at?: string | null } }) => {
      // If status is changing to completed, set completed_at
      const updateData: Record<string, unknown> = { ...data };
      if (data.status === "completed" && !data.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status && data.status !== "completed") {
        updateData.completed_at = null;
      }

      const { data: task, error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast.success("Task updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update task", { description: error.message });
    },
  });
}

/**
 * Delete a task.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
      toast.success("Task deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete task", { description: error.message });
    },
  });
}

// ========================
// Helpers
// ========================

function applyViewFilter(query: any, view: TaskView, userId?: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

  switch (view) {
    case "today":
      return query
        .not("status", "in", '("completed","cancelled")')
        .lte("due_date", todayEnd)
        .gte("due_date", todayStart);
    case "this_week":
      return query
        .not("status", "in", '("completed","cancelled")')
        .lte("due_date", weekEnd)
        .gte("due_date", todayStart);
    case "overdue":
      return query
        .not("status", "in", '("completed","cancelled")')
        .lt("due_date", todayStart);
    case "delegated":
      return userId
        ? query.eq("created_by", userId).not("assigned_to", "eq", userId).not("assigned_to", "is", null)
        : query;
    case "my_tasks":
      return userId ? query.eq("assigned_to", userId) : query;
    default:
      return query;
  }
}

function mapTaskRow(row: any): Task {
  return {
    ...row,
    stream: row.task_streams || null,
    category: row.task_categories || null,
    task_streams: undefined,
    task_categories: undefined,
  };
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}
