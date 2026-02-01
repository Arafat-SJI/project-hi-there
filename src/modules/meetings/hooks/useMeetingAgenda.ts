/**
 * Meeting Agenda Hook
 *
 * CRUD operations for meeting agenda items with reordering support.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MeetingAgendaItem, AgendaItemFormData } from "../types";

const AGENDA_KEY = "meeting-agenda";

/**
 * Fetch agenda items for a meeting, ordered by sort_order.
 */
export function useMeetingAgenda(meetingId: string) {
  return useQuery({
    queryKey: [AGENDA_KEY, meetingId],
    queryFn: async (): Promise<MeetingAgendaItem[]> => {
      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as MeetingAgendaItem[];
    },
    enabled: !!meetingId,
  });
}

/**
 * Add a new agenda item.
 */
export function useAddAgendaItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      meetingId,
      data,
    }: {
      meetingId: string;
      data: AgendaItemFormData;
    }) => {
      // Get current max sort_order
      const { data: existing } = await supabase
        .from("meeting_agenda_items")
        .select("sort_order")
        .eq("meeting_id", meetingId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;

      const { data: item, error } = await supabase
        .from("meeting_agenda_items")
        .insert({
          meeting_id: meetingId,
          title: data.title,
          description: data.description || null,
          duration_minutes: data.duration_minutes || null,
          presenter_id: data.presenter_id || null,
          sort_order: nextOrder,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, vars.meetingId] });
      toast.success("Agenda item added");
    },
    onError: (error: Error) => {
      toast.error("Failed to add agenda item", { description: error.message });
    },
  });
}

/**
 * Update an agenda item.
 */
export function useUpdateAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
      data,
    }: {
      id: string;
      meetingId: string;
      data: Partial<AgendaItemFormData & { is_completed: boolean; notes: string }>;
    }) => {
      const { data: item, error } = await supabase
        .from("meeting_agenda_items")
        .update({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.duration_minutes !== undefined && { duration_minutes: data.duration_minutes || null }),
          ...(data.presenter_id !== undefined && { presenter_id: data.presenter_id || null }),
          ...(data.is_completed !== undefined && { is_completed: data.is_completed }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return item;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, vars.meetingId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update agenda item", { description: error.message });
    },
  });
}

/**
 * Delete an agenda item.
 */
export function useDeleteAgendaItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meetingId }: { id: string; meetingId: string }) => {
      const { error } = await supabase
        .from("meeting_agenda_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, vars.meetingId] });
      toast.success("Agenda item removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove agenda item", { description: error.message });
    },
  });
}

/**
 * Reorder agenda items.
 */
export function useReorderAgendaItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      items,
    }: {
      meetingId: string;
      items: { id: string; sort_order: number }[];
    }) => {
      const updates = items.map(({ id, sort_order }) =>
        supabase
          .from("meeting_agenda_items")
          .update({ sort_order })
          .eq("id", id)
      );

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error);
      if (firstError?.error) throw firstError.error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [AGENDA_KEY, vars.meetingId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to reorder agenda", { description: error.message });
    },
  });
}
