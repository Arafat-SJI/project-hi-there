/**
 * Zoom Meeting Service
 * Handles creating Zoom meetings via Zoom API
 */

import { supabase } from "@/integrations/supabase/client";

export interface CreateZoomMeetingRequest {
  topic: string;
  start_time: string; // ISO 8601 format
  duration: number; // minutes
  timezone?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    registrants_email_notification?: boolean;
  };
  registrants?: Array<{
    email: string;
    first_name?: string;
    last_name?: string;
  }>;
}

export interface CreatedZoomMeeting {
  zoom_meeting_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  join_url: string;
  start_url: string;
  meeting_type: 'zoom';
  status: 'scheduled';
}

interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password?: string;
  h323_password?: string;
  pstn_password?: string;
  encrypted_password?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    jbh_time: number;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    alternative_hosts_email_notification: boolean;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room: boolean;
    request_permission_to_unmute_participants: boolean;
    global_dial_in_countries: string[];
    global_dial_in_numbers: Array<{
      country: string;
      country_name: string;
      city: string;
      number: string;
      type: string;
    }>;
    contact_name: string;
    contact_email: string;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    authentication_option: string;
    authentication_domains: string;
    authentication_name: string;
    additional_data_center_regions: string[];
    breakout_room: {
      enable: boolean;
    };
    language_interpretation: {
      enable: boolean;
    };
  };
  recurrence?: {
    type: number;
    repeat_interval: number;
    weekly_days: string;
    monthly_day: number;
    monthly_week: number;
    monthly_week_day: number;
    end_times: number;
    end_date_time: string;
  };
}

/**
 * Get valid Zoom access token for the current user
 */
async function getZoomAccessToken(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider_slug', 'zoom')
    .eq('is_active', true)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('Zoom account not connected. Please connect your Zoom account first.');
  }

  let accessToken = tokenData.access_token;

  // Check if token is expired and refresh if needed
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  if (expiresAt <= now && tokenData.refresh_token) {
    // Token expired, need to refresh
    // For now, throw error - refresh logic should be handled by edge function
    throw new Error('Zoom token expired. Please disconnect and reconnect your Zoom account.');
  }

  return accessToken;
}

/**
 * Create a new Zoom meeting
 * 
 * @param input - Meeting details (topic, start time, duration, attendees)
 * @returns Created meeting details including join URL
 */
export async function createZoomMeeting(
  input: CreateZoomMeetingRequest
): Promise<CreatedZoomMeeting> {
  // Validate input dates
  const startDate = new Date(input.start_time);
  
  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (startDate.getTime() < Date.now() - 60000) { // 1 minute buffer
    throw new Error('Start time must be in the future');
  }

  // Validate topic
  const topic = input.topic?.trim();
  if (!topic || topic.length === 0) {
    throw new Error('Meeting title is required');
  }
  
  if (topic.length > 200) {
    throw new Error('Meeting title must be less than 200 characters');
  }

  // Validate duration
  if (input.duration < 1) {
    throw new Error('Duration must be at least 1 minute');
  }
  
  if (input.duration > 1440) { // 24 hours
    throw new Error('Duration cannot exceed 24 hours');
  }

  // Get access token
  const accessToken = await getZoomAccessToken();

  // Build Zoom API request body
  const requestBody: Record<string, unknown> = {
    topic: topic,
    type: 2, // Scheduled meeting
    start_time: startDate.toISOString(),
    duration: input.duration,
    timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    agenda: input.agenda || '',
    settings: {
      host_video: input.settings?.host_video ?? true,
      participant_video: input.settings?.participant_video ?? false,
      join_before_host: input.settings?.join_before_host ?? false,
      mute_upon_entry: input.settings?.mute_upon_entry ?? false,
      waiting_room: input.settings?.waiting_room ?? false,
      registrants_email_notification: input.settings?.registrants_email_notification ?? true,
      ...input.settings,
    },
  };

  // Add registrants if provided
  if (input.registrants && input.registrants.length > 0) {
    requestBody.settings = {
      ...requestBody.settings,
      approval_type: 0, // Automatically approve
      registrants_confirmation_email: true,
    };
    requestBody.registrants = input.registrants;
  }

  console.log('[ZoomMeetings] Creating Zoom meeting:', topic);

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      if (response.status === 401) {
        throw new Error('Zoom authentication failed. Please disconnect and reconnect your Zoom account.');
      } else if (response.status === 403) {
        throw new Error('Missing Zoom permissions. Please ensure your Zoom app has meeting:write:meeting scope.');
      }
      
      throw new Error(`Failed to create Zoom meeting: ${errorMessage}`);
    }

    const data: ZoomMeetingResponse = await response.json();
    
    if (!data.id || !data.join_url) {
      throw new Error('Invalid response from Zoom API - missing meeting ID or join URL');
    }

    console.log('[ZoomMeetings] Zoom meeting created successfully:', data.id);

    return {
      zoom_meeting_id: String(data.id),
      title: data.topic,
      scheduled_at: data.start_time,
      duration_minutes: data.duration,
      join_url: data.join_url,
      start_url: data.start_url,
      meeting_type: 'zoom',
      status: 'scheduled',
    };
  } catch (error) {
    console.error('[ZoomMeetings] Failed to create Zoom meeting:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while creating Zoom meeting');
  }
}

