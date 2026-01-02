import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

// NOTE: Tasks table needs to be created via migration before these hooks will work.
// The migration file exists at: supabase/migrations/20260101_tasks.sql
// Until the migration is applied, these hooks will return empty data.

export function useTasks(filters?: TaskFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      // Tasks table may not exist yet - return empty array
      // Once migration is applied and types regenerated, update this
      console.warn('Tasks table not yet available - migration required');
      return [] as Task[];
    },
    enabled: !!user,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      // Tasks table may not exist yet
      console.warn('Tasks table not yet available - migration required');
      return null as Task | null;
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
      // Tasks table may not exist yet
      throw new Error('Tasks table not yet available - migration required');
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
      // Tasks table may not exist yet
      throw new Error('Tasks table not yet available - migration required');
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
      // Tasks table may not exist yet
      throw new Error('Tasks table not yet available - migration required');
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
      // Task stats view may not exist yet
      console.warn('Task stats not yet available - migration required');
      return {
        todo_count: 0,
        in_progress_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        urgent_count: 0,
        high_count: 0,
        overdue_count: 0,
        due_soon_count: 0,
      };
    },
    enabled: !!userId,
  });
}
