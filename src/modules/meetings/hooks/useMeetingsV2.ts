/**
 * Meetings V2 Hook - CRUD operations for meetings_v2 table
 * 
 * Provides hooks for listing, fetching, creating, updating, and deleting meetings
 * from the meetings_v2 table as specified in the standalone implementation plan.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { MeetingV2, MeetingV2FormData, MeetingStatus, MeetingType } from "../types/meetings";

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
      let query = supabase
        .from("meetings_v2")
        .select(`
          *,
          clients(name, email),
          projects(name)
        `)
        .order("scheduled_at", { ascending: false });

      // Status filter
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Type filter
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      // Client filter
      if (filters?.client_id) {
        query = query.eq("client_id", filters.client_id);
      }

      // Project filter
      if (filters?.project_id) {
        query = query.eq("project_id", filters.project_id);
      }

      // Search filter
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      // My meetings only
      if (filters?.my_meetings_only && user?.id) {
        query = query.eq("created_by", user.id);
      }

      // Date range filters
      if (filters?.date_from) {
        query = query.gte("scheduled_at", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("scheduled_at", filters.date_to);
      }

      // Tab-based filters
      if (filters?.tab) {
        const now = new Date().toISOString();
        switch (filters.tab) {
          case "today":
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            query = query
              .gte("scheduled_at", todayStart.toISOString())
              .lte("scheduled_at", todayEnd.toISOString());
            break;
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

      // Try to fetch by slug first, then by ID
      let query = supabase
        .from("meetings_v2")
        .select(`
          *,
          clients(name, email),
          projects(name)
        `)
        .or(`slug.eq.${idOrSlug},id.eq.${idOrSlug}`)
        .limit(1)
        .single();

      const { data, error } = await query;
      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      return data as MeetingV2;
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

      // Generate slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { data: meeting, error } = await supabase
        .from("meetings_v2")
        .insert({
          ...data,
          created_by: user.id,
          slug,
        })
        .select(`
          *,
          clients(name, email),
          projects(name)
        `)
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

      // Update slug if title changed
      const updateData: any = { ...data };
      if (data.title) {
        const slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        updateData.slug = slug;
      }

      const { data: meeting, error } = await supabase
        .from("meetings_v2")
        .update(updateData)
        .eq("id", id)
        .eq("created_by", user.id) // Ensure user owns the meeting
        .select(`
          *,
          clients(name, email),
          projects(name)
        `)
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

      const { error } = await supabase
        .from("meetings_v2")
        .delete()
        .eq("id", id)
        .eq("created_by", user.id); // Ensure user owns the meeting

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

      const { data: meeting, error } = await supabase
        .from("meetings_v2")
        .update({ status: "completed" })
        .eq("id", id)
        .eq("created_by", user.id)
        .select(`
          *,
          clients(name, email),
          projects(name)
        `)
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

