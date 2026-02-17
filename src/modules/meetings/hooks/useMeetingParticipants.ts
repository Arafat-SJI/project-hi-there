/**
 * Meeting Participants Hook - CRUD operations for meeting_participants_v2
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MeetingParticipantV2, MeetingParticipantWithProfile, ParticipantRole, ParticipantStatus } from "../types/meetings";

const PARTICIPANTS_KEY = "meeting-participants";

/**
 * Fetch participants for a meeting
 */
export function useMeetingParticipants(meetingId: string | undefined) {
  return useQuery({
    queryKey: [PARTICIPANTS_KEY, meetingId],
    queryFn: async (): Promise<MeetingParticipantWithProfile[]> => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from("meeting_participants_v2")
        .select(`
          *,
          user:profiles!meeting_participants_v2_user_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        user: p.user || null,
      })) as MeetingParticipantWithProfile[];
    },
    enabled: !!meetingId,
  });
}

/**
 * Add a participant
 */
export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meetingId,
      userId,
      email,
      name,
      externalEmail,
      externalName,
      role,
      status,
    }: {
      meetingId: string;
      userId?: string;
      email?: string;
      name?: string;
      externalEmail?: string;
      externalName?: string;
      role?: ParticipantRole;
      status?: ParticipantStatus;
    }): Promise<MeetingParticipantV2> => {
      // Support both email/name (simpler) and externalEmail/externalName (explicit)
      const finalEmail = email || externalEmail;
      const finalName = name || externalName;

      const { data, error } = await supabase
        .from("meeting_participants_v2")
        .insert({
          meeting_id: meetingId,
          user_id: userId || null,
          external_email: finalEmail || null,
          external_name: finalName || null,
          role: role || "required",
          status: status || "pending",
          attended: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MeetingParticipantV2;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, variables.meetingId] });
      toast.success("Participant added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add participant: ${error.message}`);
    },
  });
}

/**
 * Update a participant
 */
export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<MeetingParticipantV2, "role" | "status" | "notes">>;
    }): Promise<MeetingParticipantV2> => {
      const { data, error } = await supabase
        .from("meeting_participants_v2")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as MeetingParticipantV2;
    },
    onSuccess: (participant) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, participant.meeting_id] });
      toast.success("Participant updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update participant: ${error.message}`);
    },
  });
}

/**
 * Update participant attendance
 */
export function useUpdateParticipantAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
      attended,
    }: {
      id: string;
      meetingId: string;
      attended: boolean;
    }): Promise<MeetingParticipantV2> => {
      const { data, error } = await supabase
        .from("meeting_participants_v2")
        .update({
          attended,
          // If marking as attended and status is still pending, update to accepted
          ...(attended ? { status: "accepted" as ParticipantStatus } : {}),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as MeetingParticipantV2;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, variables.meetingId] });
      toast.success("Attendance updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    },
  });
}

/**
 * Remove a participant
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      meetingId,
    }: {
      id: string;
      meetingId?: string;
    }): Promise<{ meeting_id: string }> => {
      // Get meeting_id before deleting
      const { data: participant } = await supabase
        .from("meeting_participants_v2")
        .select("meeting_id")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("meeting_participants_v2").delete().eq("id", id);

      if (error) throw error;
      const finalMeetingId = meetingId || participant?.meeting_id || "";
      return { meeting_id: finalMeetingId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY] });
      if (result.meeting_id) {
        queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_KEY, result.meeting_id] });
      }
      toast.success("Participant removed");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove participant: ${error.message}`);
    },
  });
}
