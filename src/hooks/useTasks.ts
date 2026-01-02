import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  meeting_id: string | null;
  client_id: string | null;
  tags: string[];
  estimated_hours: number | null;
  actual_hours: number | null;
  progress_percentage: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  due_date?: string;
  meeting_id?: string;
  client_id?: string;
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage?: number;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  created_by?: string;
  client_id?: string;
  meeting_id?: string;
  overdue?: boolean;
}

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:assigned_to(id, email, raw_user_meta_data),
          creator:created_by(id, email, raw_user_meta_data),
          clients(name),
          meetings(title)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      if (filters?.assigned_to) {
        query = query.eq("assigned_to", filters.assigned_to);
      }

      if (filters?.created_by) {
        query = query.eq("created_by", filters.created_by);
      }

      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }

      if (filters?.meeting_id) {
        query = query.eq("meeting_id", filters.meeting_id);
      }

      if (filters?.overdue) {
        query = query
          .lt("due_date", new Date().toISOString())
          .not("status", "in", '("completed","cancelled")');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assigned_user:assigned_to(id, email, raw_user_meta_data),
          creator:created_by(id, email, raw_user_meta_data),
          clients(name, email),
          meetings(title, scheduled_at)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      const insertData = {
        title: data.title,
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assigned_to: data.assigned_to || null,
        due_date: data.due_date || null,
        meeting_id: data.meeting_id || null,
        client_id: data.client_id || null,
        tags: data.tags || [],
        estimated_hours: data.estimated_hours || null,
        actual_hours: data.actual_hours || null,
        progress_percentage: data.progress_percentage || 0,
        created_by: user?.id!,
      };

      const { data: task, error } = await supabase
        .from("tasks")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return task as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const { data: task, error } = await supabase
        .from("tasks")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return task as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTaskStats(userId?: string) {
  return useQuery({
    queryKey: ['task-stats', userId],
    queryFn: async () => {
      let query = supabase
        .from("task_stats")
        .select("*");

      if (userId) {
        query = query.eq("assigned_to", userId);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
