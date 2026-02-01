/**
 * Meeting Participants Hook
 *
 * CRUD operations for meeting participants and attendance tracking.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MeetingParticipant, ParticipantRole } from "../types";

const PARTICIPANTS_KEY = "meeting-participants";

/**
 * Fetch participants for a meeting.
 */
export function useMeetingParticipants(meetingId: string) {
  return useQuery({
    queryKey: [PARTICIPANTS_KEY, meetingId],
    queryFn: async (): Promise<MeetingParticipant[]> => {
      const { data, error } = await supabase
        .from("meeting_participants")
        .select("*, user:user_id(full_name, email, avatar_url)")
        .eq("meeting_id", meetingId)
        .order("role", { ascending: true });

      if (error) throw error;
      return (data || []) as MeetingParticipant[];
    },
    enabled: !!meetingId,
  });
}

/**
 * Add a participant to a meeting.
 */
export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      user_id,
      email,
      name,
      role,
    }: {
      meetingId: string;
      user_id?: string;
      email?: string;
      name?: string;
      role?: ParticipantRole;
    }) => {
      const { data: participant, error } = await supabase
        .from("meeting_participants")
        .insert({
          meeting_id: meetingId,
          user_id: user_id || null,
          email: email || null,
          name: name || null,
          role: role || "attendee",
        })
        .select()
        .single();

      if (error) throw error;
      return participant;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, vars.meetingId] });
      toast.success("Participant added");
    },
    onError: (error: Error) => {
      if (error.message?.includes("unique")) {
        toast.error("This participant is already added to the meeting");
      } else {
        toast.error("Failed to add participant", { description: error.message });
      }
    },
  });
}

/**
 * Remove a participant from a meeting.
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, meetingId }: { id: string; meetingId: string }) => {
      const { error } = await supabase
        .from("meeting_participants")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, vars.meetingId] });
      toast.success("Participant removed");
    },
    onError: (error: Error) => {
      toast.error("Failed to remove participant", { description: error.message });
    },
  });
}

/**
 * Update participant attendance status.
 */
export function useUpdateParticipantAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
      attended,
      rsvp_status,
    }: {
      id: string;
      meetingId: string;
      attended?: boolean;
      rsvp_status?: string;
    }) => {
      const { error } = await supabase
        .from("meeting_participants")
        .update({
          ...(attended !== undefined && { attended }),
          ...(rsvp_status !== undefined && { rsvp_status }),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, vars.meetingId] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update attendance", { description: error.message });
    },
  });
}
