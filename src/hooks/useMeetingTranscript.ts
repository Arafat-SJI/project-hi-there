/**
 * useMeetingTranscript
 *
 * Fetches transcript data for a single meeting. Polls every 2 s while the
 * transcript is being processed, and stops automatically once complete or failed.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/cache";

export interface TranscriptTurn {
  timestamp: string;
  speaker?: string;
  text: string;
}

export interface MeetingTranscript {
  status: "pending" | "processing" | "complete" | "failed";
  turns: TranscriptTurn[];
  content: string | null;
  error: string | null;
}

export function useMeetingTranscript(meetingId: string) {
  const { data, isLoading, error } = useQuery<MeetingTranscript>({
    queryKey: queryKeys.meetings.transcript(meetingId),
    queryFn: async (): Promise<MeetingTranscript> => {
      const { data: meeting, error: dbError } = await supabase
        .from("meetings")
        .select(
          "transcript_status, transcript_raw, transcript_content, transcript_error"
        )
        .eq("id", meetingId)
        .single();

      if (dbError) throw dbError;

      const raw = meeting?.transcript_raw;
      const turns: TranscriptTurn[] = Array.isArray(raw) ? (raw as TranscriptTurn[]) : [];

      return {
        status: (meeting?.transcript_status as MeetingTranscript["status"]) ?? "pending",
        turns,
        content: meeting?.transcript_content ?? null,
        error: (meeting as { transcript_error?: string | null })?.transcript_error ?? null,
      };
    },
    enabled: !!meetingId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s === "complete" || s === "failed") return false;
      return 2_000;
    },
  });

  return {
    transcript: data,
    status: data?.status ?? "pending",
    error: data?.error ?? null,
    isLoading,
    queryError: error,
  };
}
