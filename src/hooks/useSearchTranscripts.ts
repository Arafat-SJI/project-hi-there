/**
 * useSearchTranscripts
 *
 * Searches across meetings that have complete transcripts using Postgres
 * full-text search on the transcript_content column.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TranscriptSearchResult {
  id: string;
  title: string;
  slug: string | null;
  scheduled_at: string | null;
  transcript_content: string | null;
  transcript_status: string | null;
}

export function useSearchTranscripts(query: string) {
  const trimmed = query.trim();

  const { data, isLoading, error } = useQuery<TranscriptSearchResult[]>({
    queryKey: ["search-transcripts", trimmed],
    queryFn: async (): Promise<TranscriptSearchResult[]> => {
      if (!trimmed) return [];

      const { data, error: dbError } = await supabase
        .from("meetings")
        .select("id, title, slug, scheduled_at, transcript_content, transcript_status")
        .textSearch("transcript_content", trimmed, { type: "plain" })
        .eq("transcript_status", "complete")
        .limit(20);

      if (dbError) throw dbError;
      return (data ?? []) as TranscriptSearchResult[];
    },
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });

  return {
    results: data ?? [],
    isLoading,
    error,
  };
}
