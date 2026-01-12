/**
 * Hook for syncing Microsoft Teams meetings to the local database
 * 
 * NOTE: Microsoft Graph API does NOT support listing all online meetings.
 * The /me/onlineMeetings endpoint requires a $filter parameter.
 * 
 * This hook now provides information about already-synced meetings from the database
 * rather than attempting to fetch from the unsupported Graph API endpoint.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getOnlineMeetingById, normalizeMeeting } from "@/lib/microsoftTeamsMeetingService";

export interface SyncResult {
  synced: number;
  updated: number;
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

      // Microsoft Graph API doesn't support listing all online meetings
      // Instead, we refresh details for meetings already in our database
      
      // Get locally stored Teams meetings
      const { data: localMeetings, error: fetchError } = await supabase
        .from('meetings')
        .select('id, metadata')
        .eq('meeting_type', 'teams')
        .eq('organizer_id', user.id);

      if (fetchError) {
        console.error('[SyncTeamsMeetings] Failed to fetch local meetings:', fetchError);
        throw new Error('Failed to fetch local meetings');
      }

      if (!localMeetings || localMeetings.length === 0) {
        return { synced: 0, updated: 0, errors: 0, total: 0 };
      }

      const result: SyncResult = {
        synced: 0,
        updated: 0,
        errors: 0,
        total: localMeetings.length,
      };

      // Refresh each meeting's details from Graph API
      for (const meeting of localMeetings) {
        const metadata = meeting.metadata as Record<string, unknown> | null;
        const teamsId = metadata?.teams_meeting_id as string | undefined;
        
        if (!teamsId) {
          continue;
        }

        try {
          // Fetch latest details from Graph API
          const graphMeeting = await getOnlineMeetingById(teamsId);
          const normalized = normalizeMeeting(graphMeeting);
          
          if (!normalized) {
            continue;
          }

          // Update local record with latest info
          const { error: updateError } = await supabase
            .from('meetings')
            .update({
              title: normalized.title,
              scheduled_at: normalized.scheduled_at,
              duration_minutes: normalized.duration_minutes,
              zoom_join_url: normalized.join_url,
              status: normalized.status,
              metadata: {
                ...metadata,
                last_synced_at: new Date().toISOString(),
              },
            })
            .eq('id', meeting.id);

          if (updateError) {
            console.error('[SyncTeamsMeetings] Update error:', updateError);
            result.errors++;
          } else {
            result.updated++;
          }
        } catch (error) {
          // Meeting may have been deleted in Teams, or other error
          console.error('[SyncTeamsMeetings] Error refreshing meeting:', error);
          result.errors++;
        }
      }

      return result;
    },
    onSuccess: (result) => {
      // Invalidate meetings queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['meetings'] });

      if (result.updated > 0) {
        toast({
          title: "Meetings Refreshed",
          description: `Updated ${result.updated} meeting${result.updated !== 1 ? 's' : ''} from Teams.`,
        });
      } else if (result.total === 0) {
        toast({
          title: "No Teams Meetings",
          description: "You don't have any Teams meetings saved locally. Create a meeting to get started.",
        });
      } else if (result.updated === 0 && result.errors === 0) {
        toast({
          title: "Meetings Up to Date",
          description: "All Teams meetings are already up to date.",
        });
      }
    },
    onError: (error: Error) => {
      console.error('[SyncTeamsMeetings] Sync failed:', error);
      
      let description = error.message || "Failed to refresh Teams meetings.";
      
      // Provide more helpful error messages
      if (error.message?.includes('OnlineMeetings.Read')) {
        description = "Missing permission. Please disconnect and reconnect your Microsoft account.";
      } else if (error.message?.includes('Filter expression expected')) {
        description = "Teams API limitation. Meetings you create in this app are automatically saved.";
      }
      
      toast({
        title: "Refresh Failed",
        description,
        variant: "destructive",
      });
    },
  });
}
