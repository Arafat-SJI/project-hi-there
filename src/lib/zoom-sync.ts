/**
 * Enhanced Zoom Meeting Sync
 * Advanced features for Zoom integration
 */

import { supabase } from '@/lib/supabase';
import { getValidAccessToken } from '@/lib/oauth-token-manager';

// ============================================
// TYPES
// ============================================

export interface ZoomMeeting {
  id: string;
  uuid: string;
  topic: string;
  type: number; // 1=instant, 2=scheduled, 3=recurring, 8=recurring w/ fixed time
  status: 'waiting' | 'started' | 'finished';
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  host_id: string;
  join_url: string;
  agenda?: string;
}

export interface ZoomRecording {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: 'MP4' | 'M4A' | 'TIMELINE' | 'TRANSCRIPT' | 'CHAT' | 'CC';
  file_size: number;
  download_url: string;
  status: 'processing' | 'completed';
  recording_type: 'shared_screen_with_speaker_view' | 'shared_screen_with_gallery_view' | 'active_speaker' | 'gallery_view' | 'audio_only';
}

export interface ZoomParticipant {
  id: string;
  user_id: string;
  user_name: string;
  join_time: string;
  leave_time?: string;
  duration: number;
  attentiveness_score?: number;
}

export interface ZoomWebinar {
  id: string;
  uuid: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  agenda?: string;
  created_at: string;
  join_url: string;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  error_count: number;
  errors?: string[];
}

// ============================================
// MEETING SYNC
// ============================================

/**
 * Sync all meetings from Zoom to database
 * @param orgIntegrationId - Organization integration ID
 * @param fromDate - Start date for sync (ISO string)
 * @param toDate - End date for sync (ISO string)
 */
export async function syncZoomMeetings(
  orgIntegrationId: string,
  fromDate?: string,
  toDate?: string
): Promise<SyncResult> {
  try {
    // Get valid access token
    const tokenResult = await getValidAccessToken(orgIntegrationId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [tokenResult.error || 'Failed to get access token'],
      };
    }

    // Fetch meetings from Zoom API
    const meetings = await fetchZoomMeetings(
      tokenResult.accessToken,
      fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: last 30 days
      toDate || new Date().toISOString()
    );

    if (!meetings.success || !meetings.data) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [meetings.error || 'Failed to fetch Zoom meetings'],
      };
    }

    // Store meetings in database
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const meeting of meetings.data) {
      const result = await storeMeetingInDatabase(meeting, orgIntegrationId);
      if (result.success) {
        syncedCount++;
      } else {
        errorCount++;
        errors.push(result.error || `Failed to store meeting ${meeting.id}`);
      }
    }

    return {
      success: errorCount === 0,
      synced_count: syncedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      synced_count: 0,
      error_count: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Fetch meetings from Zoom API
 */
async function fetchZoomMeetings(
  accessToken: string,
  from: string,
  to: string
): Promise<{ success: boolean; data?: ZoomMeeting[]; error?: string }> {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/users/me/meetings?type=scheduled&from=${from}&to=${to}&page_size=300`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Zoom API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data: data.meetings || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store Zoom meeting in database
 */
async function storeMeetingInDatabase(
  meeting: ZoomMeeting,
  orgIntegrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get organization ID from integration
    const { data: integration } = await supabase
      .from('organization_integrations')
      .select('organization_id')
      .eq('id', orgIntegrationId)
      .single();

    if (!integration) {
      return { success: false, error: 'Integration not found' };
    }

    // Check if meeting already exists
    const { data: existing } = await supabase
      .from('meetings')
      .select('id')
      .eq('zoom_meeting_id', meeting.id)
      .eq('organization_id', integration.organization_id)
      .single();

    if (existing) {
      // Update existing meeting
      const { error } = await supabase
        .from('meetings')
        .update({
          title: meeting.topic,
          scheduled_at: meeting.start_time,
          duration: meeting.duration,
          meeting_url: meeting.join_url,
          description: meeting.agenda || '',
          status: meeting.status === 'finished' ? 'completed' : 'scheduled',
        })
        .eq('id', existing.id);

      return { success: !error, error: error?.message };
    } else {
      // Insert new meeting
      const { error } = await supabase.from('meetings').insert({
        organization_id: integration.organization_id,
        zoom_meeting_id: meeting.id,
        title: meeting.topic,
        scheduled_at: meeting.start_time,
        duration: meeting.duration,
        meeting_url: meeting.join_url,
        description: meeting.agenda || '',
        status: meeting.status === 'finished' ? 'completed' : 'scheduled',
        created_by: null, // Will be set by trigger or application logic
      });

      return { success: !error, error: error?.message };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// RECORDING SYNC
// ============================================

/**
 * Sync meeting recordings from Zoom
 * @param orgIntegrationId - Organization integration ID
 * @param meetingId - Zoom meeting ID
 */
export async function syncMeetingRecordings(
  orgIntegrationId: string,
  meetingId: string
): Promise<SyncResult> {
  try {
    // Get valid access token
    const tokenResult = await getValidAccessToken(orgIntegrationId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [tokenResult.error || 'Failed to get access token'],
      };
    }

    // Fetch recordings from Zoom
    const recordings = await fetchZoomRecordings(tokenResult.accessToken, meetingId);

    if (!recordings.success || !recordings.data) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [recordings.error || 'Failed to fetch recordings'],
      };
    }

    // Store recordings in database
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const recording of recordings.data) {
      const result = await storeRecordingInDatabase(recording, meetingId, orgIntegrationId);
      if (result.success) {
        syncedCount++;
      } else {
        errorCount++;
        errors.push(result.error || `Failed to store recording ${recording.id}`);
      }
    }

    return {
      success: errorCount === 0,
      synced_count: syncedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      synced_count: 0,
      error_count: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Fetch recordings from Zoom API
 */
async function fetchZoomRecordings(
  accessToken: string,
  meetingId: string
): Promise<{ success: boolean; data?: ZoomRecording[]; error?: string }> {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // 404 means no recordings available yet
      if (response.status === 404) {
        return { success: true, data: [] };
      }

      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Zoom API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data: data.recording_files || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store recording in database
 */
async function storeRecordingInDatabase(
  recording: ZoomRecording,
  meetingId: string,
  orgIntegrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the meeting in our database
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('zoom_meeting_id', meetingId)
      .single();

    if (!meeting) {
      return { success: false, error: 'Meeting not found in database' };
    }

    // Store recording metadata
    const { error } = await supabase.from('meeting_recordings').upsert(
      {
        meeting_id: meeting.id,
        zoom_recording_id: recording.id,
        file_type: recording.file_type,
        file_size: recording.file_size,
        download_url: recording.download_url,
        recording_start: recording.recording_start,
        recording_end: recording.recording_end,
        status: recording.status,
      },
      {
        onConflict: 'zoom_recording_id',
      }
    );

    return { success: !error, error: error?.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// PARTICIPANT SYNC
// ============================================

/**
 * Sync meeting participants from Zoom
 * @param orgIntegrationId - Organization integration ID
 * @param meetingId - Zoom meeting ID
 */
export async function syncMeetingParticipants(
  orgIntegrationId: string,
  meetingId: string
): Promise<SyncResult> {
  try {
    // Get valid access token
    const tokenResult = await getValidAccessToken(orgIntegrationId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [tokenResult.error || 'Failed to get access token'],
      };
    }

    // Fetch participants from Zoom
    const participants = await fetchZoomParticipants(tokenResult.accessToken, meetingId);

    if (!participants.success || !participants.data) {
      return {
        success: false,
        synced_count: 0,
        error_count: 1,
        errors: [participants.error || 'Failed to fetch participants'],
      };
    }

    // Store participants in database
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const participant of participants.data) {
      const result = await storeParticipantInDatabase(participant, meetingId);
      if (result.success) {
        syncedCount++;
      } else {
        errorCount++;
        errors.push(result.error || `Failed to store participant ${participant.id}`);
      }
    }

    return {
      success: errorCount === 0,
      synced_count: syncedCount,
      error_count: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      synced_count: 0,
      error_count: 1,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Fetch participants from Zoom API
 */
async function fetchZoomParticipants(
  accessToken: string,
  meetingId: string
): Promise<{ success: boolean; data?: ZoomParticipant[]; error?: string }> {
  try {
    const response = await fetch(
      `https://api.zoom.us/v2/past_meetings/${meetingId}/participants?page_size=300`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Zoom API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data: data.participants || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Store participant in database
 */
async function storeParticipantInDatabase(
  participant: ZoomParticipant,
  meetingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the meeting in our database
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('zoom_meeting_id', meetingId)
      .single();

    if (!meeting) {
      return { success: false, error: 'Meeting not found in database' };
    }

    // Store participant
    const { error } = await supabase.from('meeting_participants').upsert(
      {
        meeting_id: meeting.id,
        zoom_participant_id: participant.id,
        name: participant.user_name,
        join_time: participant.join_time,
        leave_time: participant.leave_time,
        duration: participant.duration,
      },
      {
        onConflict: 'zoom_participant_id',
      }
    );

    return { success: !error, error: error?.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Download Zoom recording file
 * @param downloadUrl - Recording download URL
 * @param accessToken - Zoom access token
 */
export async function downloadZoomRecording(
  downloadUrl: string,
  accessToken: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
  try {
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download recording: ${response.status}`,
      };
    }

    const blob = await response.blob();
    return { success: true, blob };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create Zoom meeting
 * @param orgIntegrationId - Organization integration ID
 * @param meetingData - Meeting configuration
 */
export async function createZoomMeeting(
  orgIntegrationId: string,
  meetingData: {
    topic: string;
    type: number;
    start_time?: string;
    duration?: number;
    timezone?: string;
    agenda?: string;
  }
): Promise<{ success: boolean; meeting?: ZoomMeeting; error?: string }> {
  try {
    // Get valid access token
    const tokenResult = await getValidAccessToken(orgIntegrationId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      return {
        success: false,
        error: tokenResult.error || 'Failed to get access token',
      };
    }

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Zoom API error: ${response.status}`,
      };
    }

    const meeting = await response.json();
    return { success: true, meeting };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
