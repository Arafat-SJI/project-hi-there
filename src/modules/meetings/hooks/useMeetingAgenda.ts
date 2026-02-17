/**
 * Meeting Agenda Hook - CRUD operations for meeting_agenda_items
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MeetingAgendaItem } from "../types/meetings";

const AGENDA_KEY = "meeting-agenda";

/**
 * Fetch agenda items for a meeting
 */
export function useMeetingAgenda(meetingId: string | undefined) {
  return useQuery({
    queryKey: [AGENDA_KEY, meetingId],
    queryFn: async (): Promise<MeetingAgendaItem[]> => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as MeetingAgendaItem[];
    },
    enabled: !!meetingId,
  });
}

/**
 * Add an agenda item
 */
export function useAddAgendaItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      meetingId,
      content,
      sortOrder,
    }: {
      meetingId: string;
      content: string;
      sortOrder?: number;
    }): Promise<MeetingAgendaItem> => {
      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .insert({
          meeting_id: meetingId,
          content,
          sort_order: sortOrder ?? 0,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MeetingAgendaItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, variables.meetingId] });
      toast.success("Agenda item added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add agenda item: ${error.message}`);
    },
  });
}

/**
 * Update an agenda item
 */
export function useUpdateAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<MeetingAgendaItem, "content" | "sort_order" | "is_completed">>;
    }): Promise<MeetingAgendaItem> => {
      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as MeetingAgendaItem;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, item.meeting_id] });
      toast.success("Agenda item updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update agenda item: ${error.message}`);
    },
  });
}

/**
 * Delete an agenda item
 */
export function useDeleteAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ meeting_id: string }> => {
      // Get meeting_id before deleting
      const { data: item } = await supabase
        .from("meeting_agenda_items")
        .select("meeting_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("meeting_agenda_items").delete().eq("id", id);

      if (error) throw error;
      return { meeting_id: item?.meeting_id || "" };
    },
    onSuccess: (_, id) => {
      // Invalidate all agenda queries since we don't have meeting_id in the response
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY] });
      toast.success("Agenda item deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete agenda item: ${error.message}`);
    },
  });
}
