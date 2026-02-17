/**
 * Meetings V2 Hook - CRUD operations for meetings table
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MeetingV2 } from "../types/index";
import type { MeetingV2FormData, MeetingType } from "../types/meetings";

export type { MeetingType };
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const MEETINGS_V2_KEY = "meetings-v2";

export interface MeetingsV2Filters {
  status?: MeetingStatus | "all";
  type?: MeetingType | "all";
  client_id?: string;
  project_id?: string;
  search?: string;
  my_meetings_only?: boolean;
  date_from?: string;
  date_to?: string;
  tab?: "today" | "upcoming" | "open" | "past";
}

/**
 * Fetch meetings with filters and pagination
 */
export function useMeetingsV2(filters?: MeetingsV2Filters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [MEETINGS_V2_KEY, "list", filters],
    queryFn: async (): Promise<MeetingV2[]> => {
      let query = (supabase as any)
        .from("meetings")
        .select(`*,clients(name, email)`)
        .order("scheduled_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.type && filters.type !== "all") {
        query = query.eq("meeting_type", filters.type);
      }
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }
      if (filters?.project_id) {
        query = query.eq("project_id", filters.project_id);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }
      if (filters?.my_meetings_only && user?.id) {
        query = query.eq("organizer_id", user.id);
      }
      if (filters?.date_from) {
        query = query.gte("scheduled_at", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("scheduled_at", filters.date_to);
      }
      if (filters?.tab) {
        const now = new Date().toISOString();
        switch (filters.tab) {
          case "today": {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            query = query
              .gte("scheduled_at", todayStart.toISOString())
              .lte("scheduled_at", todayEnd.toISOString());
            break;
          }
          case "upcoming":
            query = query.gt("scheduled_at", now);
            break;
          case "open":
            query = query.in("status", ["scheduled", "in_progress"]);
            break;
          case "past":
            query = query.lt("scheduled_at", now);
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MeetingV2[];
    },
    enabled: !!user,
  });
}

/**
 * Fetch a single meeting by ID or slug
 */
export function useMeetingV2(idOrSlug: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: [MEETINGS_V2_KEY, "detail", idOrSlug],
    queryFn: async (): Promise<MeetingV2 | null> => {
      if (!idOrSlug) return null;

      const { data, error } = await (supabase as any)
        .from("meetings")
        .select(`*,clients(name, email)`)
        .or(`slug.eq.${idOrSlug},id.eq.${idOrSlug}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MeetingV2 | null;
    },
    enabled: !!user && !!idOrSlug,
  });
}

/**
 * Create a new meeting
 */
export function useCreateMeetingV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: MeetingV2FormData): Promise<MeetingV2> => {
      if (!user) throw new Error("User not authenticated");

      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data: meeting, error } = await (supabase as any)
        .from("meetings")
        .insert({
          title: data.title,
          meeting_type: data.meeting_type || 'internal',
          description: data.description || null,
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          location: data.location || null,
          timezone: data.timezone || null,
          status: data.status || 'scheduled',
          notes: data.notes || null,
          client_id: data.client_id || null,
          deal_id: data.deal_id || null,
          recurrence_pattern: data.recurrence_pattern || null,
          recurrence_end_date: data.recurrence_end_date || null,
          parent_meeting_id: data.parent_meeting_id || null,
          organizer_id: user.id,
          slug,
        })
        .select(`*,clients(name, email)`)
        .single();

      if (error) throw error;
      return meeting as MeetingV2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY] });
      toast.success("Meeting created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create meeting: ${error.message}`);
    },
  });
}

/**
 * Update an existing meeting
 */
export function useUpdateMeetingV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MeetingV2FormData>;
    }): Promise<MeetingV2> => {
      if (!user) throw new Error("User not authenticated");

      const updateData: Record<string, unknown> = { ...data };
      if (data.title) {
        updateData.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      const { data: meeting, error } = await (supabase as any)
        .from("meetings")
        .update(updateData)
        .eq("id", id)
        .select(`*,clients(name, email)`)
        .single();

      if (error) throw error;
      if (!meeting) throw new Error("Meeting not found or access denied");
      return meeting as MeetingV2;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY] });
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY, "detail", variables.id] });
      toast.success("Meeting updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update meeting: ${error.message}`);
    },
  });
}

/**
 * Delete a meeting
 */
export function useDeleteMeetingV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await (supabase as any)
        .from("meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY] });
      toast.success("Meeting deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
    },
  });
}

/**
 * Close/complete a meeting
 */
export function useCloseMeetingV2() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string): Promise<MeetingV2> => {
      if (!user) throw new Error("User not authenticated");

      const { data: meeting, error } = await (supabase as any)
        .from("meetings")
        .update({ status: "completed" })
        .eq("id", id)
        .select(`*,clients(name, email)`)
        .single();

      if (error) throw error;
      if (!meeting) throw new Error("Meeting not found or access denied");
      return meeting as MeetingV2;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY] });
      queryClient.invalidateQueries({ queryKey: [MEETINGS_V2_KEY, "detail", id] });
      toast.success("Meeting marked as completed");
    },
    onError: (error: Error) => {
      toast.error(`Failed to close meeting: ${error.message}`);
    },
  });
}
