/**
 * Meeting Takeaways Hook
 *
 * CRUD operations for meeting takeaways (decisions, action items, notes, follow-ups).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MeetingTakeaway, TakeawayFormData } from "../types";

const TAKEAWAYS_KEY = "meeting-takeaways";

/**
 * Fetch takeaways for a meeting.
 */
export function useMeetingTakeaways(meetingId: string) {
  return useQuery({
    queryKey: [TAKEAWAYS_KEY, meetingId],
    queryFn: async (): Promise<MeetingTakeaway[]> => {
      const { data, error } = await supabase
        .from("meeting_takeaways")
        .select("*, assignee:assigned_to(full_name, email)")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as MeetingTakeaway[];
    },
    enabled: !!meetingId,
  });
}

/**
 * Add a new takeaway.
 */
export function useAddTakeaway() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      meetingId,
      data,
    }: {
      meetingId: string;
      data: TakeawayFormData;
    }) => {
      const { data: takeaway, error } = await supabase
        .from("meeting_takeaways")
        .insert({
          meeting_id: meetingId,
          content: data.content,
          takeaway_type: data.takeaway_type,
          agenda_item_id: data.agenda_item_id || null,
          assigned_to: data.assigned_to || null,
          due_date: data.due_date || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return takeaway;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [TAKEAWAYS_KEY, vars.meetingId] });
      toast.success("Takeaway added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add takeaway", { description: error.message });
    },
  });
}

/**
 * Update a takeaway.
 */
export function useUpdateTakeaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
      data,
    }: {
      id: string;
      meetingId: string;
      data: Partial<TakeawayFormData & { is_completed: boolean }>;
    }) => {
      const { data: takeaway, error } = await supabase
        .from("meeting_takeaways")
        .update({
          ...(data.content !== undefined && { content: data.content }),
          ...(data.takeaway_type !== undefined && { takeaway_type: data.takeaway_type }),
          ...(data.assigned_to !== undefined && { assigned_to: data.assigned_to || null }),
          ...(data.due_date !== undefined && { due_date: data.due_date || null }),
          ...(data.is_completed !== undefined && { is_completed: data.is_completed }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return takeaway;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [TAKEAWAYS_KEY, vars.meetingId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update takeaway", { description: error.message });
    },
  });
}

/**
 * Delete a takeaway.
 */
export function useDeleteTakeaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meetingId }: { id: string; meetingId: string }) => {
      const { error } = await supabase
        .from("meeting_takeaways")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [TAKEAWAYS_KEY, vars.meetingId] });
      toast.success("Takeaway removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove takeaway", { description: error.message });
    },
  });
}

/**
 * Toggle takeaway completion.
 */
export function useToggleTakeaway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
      is_completed,
    }: {
      id: string;
      meetingId: string;
      is_completed: boolean;
    }) => {
      const { error } = await supabase
        .from("meeting_takeaways")
        .update({ is_completed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [TAKEAWAYS_KEY, vars.meetingId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update takeaway", { description: error.message });
    },
  });
}
