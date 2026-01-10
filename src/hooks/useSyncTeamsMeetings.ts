/**
 * Hook for syncing Microsoft Teams meetings to the local database
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAndNormalizeMeetings, NormalizedMeeting } from "@/lib/microsoftTeamsMeetingService";

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
  total: number;
}

export function useSyncTeamsMeetings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch normalized meetings from Graph API
      const meetings = await fetchAndNormalizeMeetings();
      
      if (meetings.length === 0) {
        return { synced: 0, skipped: 0, errors: 0, total: 0 };
      }

      const result: SyncResult = {
        synced: 0,
        skipped: 0,
        errors: 0,
        total: meetings.length,
      };

      // Process each meeting
      for (const meeting of meetings) {
        try {
          // Check if meeting already exists by teams_meeting_id
          const { data: existing } = await supabase
            .from('meetings')
            .select('id, metadata')
            .eq('metadata->>teams_meeting_id', meeting.teams_meeting_id)
            .maybeSingle();

          if (existing) {
            // Meeting already synced, skip
            result.skipped++;
            continue;
          }

          // Insert new meeting
          const { error: insertError } = await supabase
            .from('meetings')
            .insert({
              title: meeting.title,
              scheduled_at: meeting.scheduled_at,
              duration_minutes: meeting.duration_minutes,
              zoom_join_url: meeting.join_url, // Reuse field for virtual meeting URL
              meeting_type: 'teams',
              status: meeting.status,
              organizer_id: user.id,
              metadata: {
                teams_meeting_id: meeting.teams_meeting_id,
                synced_from: 'microsoft_teams',
                synced_at: new Date().toISOString(),
              },
            });

          if (insertError) {
            console.error('[SyncTeamsMeetings] Insert error:', insertError);
            result.errors++;
          } else {
            result.synced++;
          }
        } catch (error) {
          console.error('[SyncTeamsMeetings] Error processing meeting:', error);
          result.errors++;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate meetings queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['meetings'] });

      if (result.synced > 0) {
        toast({
          title: "Teams Meetings Synced",
          description: `Synced ${result.synced} new meeting${result.synced !== 1 ? 's' : ''}${result.skipped > 0 ? `, ${result.skipped} already existed` : ''}.`,
        });
      } else if (result.total === 0) {
        toast({
          title: "No Meetings Found",
          description: "You don't have any Teams online meetings to sync.",
        });
      } else if (result.skipped === result.total) {
        toast({
          title: "Already Synced",
          description: "All Teams meetings are already synced.",
        });
      }
    },
    onError: (error: Error) => {
      console.error('[SyncTeamsMeetings] Sync failed:', error);
      
      let description = error.message || "Failed to sync Teams meetings.";
      
      // Provide more helpful error messages
      if (error.message?.includes('OnlineMeetings.Read')) {
        description = "Missing permission. Please disconnect and reconnect your Microsoft account.";
      }
      
      toast({
        title: "Sync Failed",
        description,
        variant: "destructive",
      });
    },
  });
}
