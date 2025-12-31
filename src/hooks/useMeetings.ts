import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys, invalidateKeys } from "@/lib/cache";
import { MeetingFormData } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_date: string;
  duration_minutes?: number;
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  status: "scheduled" | "completed" | "cancelled";
  client_id?: string;
  transcript?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export function useMeetings(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.meetings.list(filters),
    queryFn: async () => {
      let query = supabase
        .from("meetings")
        .select("*, clients(name)")
        .order("meeting_date", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Meeting & { clients?: { name: string } })[];
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: queryKeys.meetings.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*, clients(name, email)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Meeting & { clients?: { name: string; email: string } };
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MeetingFormData) => {
      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert([{ ...data, status: "scheduled" }])
        .select()
        .single();

      if (error) throw error;
      return meeting as Meeting;
    },
    onSuccess: () => {
      invalidateKeys.meetings(queryClient);
      toast({
        title: "Success",
        description: "Meeting created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meeting",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MeetingFormData> }) => {
      const { data: meeting, error } = await supabase
        .from("meetings")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return meeting as Meeting;
    },
    onSuccess: () => {
      invalidateKeys.meetings(queryClient);
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.meetings(queryClient);
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });
}
