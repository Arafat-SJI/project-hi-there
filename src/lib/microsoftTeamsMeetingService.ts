/**
 * Microsoft Teams Meeting Service
 * Handles fetching and normalizing Teams online meetings from Graph API
 */

import { callGraphAPI, ForbiddenError } from './microsoftGraphClient';

// ============================================================================
// Types
// ============================================================================

export interface TeamsMeeting {
  id: string;
  subject: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  joinWebUrl: string;
  createdDateTime: string;
  participants?: {
    organizer?: {
      upn?: string;
      identity?: {
        user?: {
          displayName?: string;
        };
      };
    };
  };
}

export interface TeamsOnlineMeetingsResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string;
  value: TeamsMeeting[];
}

export interface NormalizedMeeting {
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  join_url: string;
  teams_meeting_id: string;
  meeting_type: 'teams';
  status: 'scheduled' | 'completed' | 'cancelled';
}

// ============================================================================
// Utilities
// ============================================================================

const RATE_LIMIT_DELAY_MS = 100;
const MAX_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MULTIPLIER = 2;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const backoffMs = RATE_LIMIT_DELAY_MS * Math.pow(RATE_LIMIT_BACKOFF_MULTIPLIER, attempt);
        console.log(`[TeamsMeetings] Rate limit backoff: ${backoffMs}ms (attempt ${attempt + 1})`);
        await sleep(backoffMs);
      }
      
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for rate limit error (429)
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 429) {
        const retryAfter = (error as { headers?: { 'retry-after'?: number } }).headers?.['retry-after'] || 5;
        console.warn(`[TeamsMeetings] Rate limited on ${context}. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error(`${context} failed after ${MAX_RETRIES} retries`);
}

// ============================================================================
// Duration & Status Helpers
// ============================================================================

/**
 * Calculate duration in minutes from start and end datetime strings
 */
export function calculateDurationMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('[TeamsMeetings] Invalid date format for duration calculation');
      return null;
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) {
      console.warn('[TeamsMeetings] End time is before start time');
      return null;
    }
    
    return Math.round(diffMs / 60000); // Convert to minutes
  } catch (error) {
    console.error('[TeamsMeetings] Error calculating duration:', error);
    return null;
  }
}

/**
 * Determine meeting status based on end time
 */
export function determineStatus(meeting: TeamsMeeting): 'scheduled' | 'completed' {
  if (!meeting.endDateTime) return 'scheduled';
  
  try {
    const endDate = new Date(meeting.endDateTime);
    if (isNaN(endDate.getTime())) return 'scheduled';
    
    return endDate < new Date() ? 'completed' : 'scheduled';
  } catch {
    return 'scheduled';
  }
}

// ============================================================================
// Normalization
// ============================================================================

/**
 * Normalize a Teams meeting to our app's meeting format
 * Returns null if the meeting is invalid (missing required fields)
 */
export function normalizeMeeting(meeting: TeamsMeeting): NormalizedMeeting | null {
  // Skip meetings without essential fields
  if (!meeting.id || !meeting.joinWebUrl) {
    console.warn('[TeamsMeetings] Skipping meeting with missing required fields:', {
      id: meeting.id,
      hasJoinUrl: !!meeting.joinWebUrl,
    });
    return null;
  }
  
  return {
    title: meeting.subject || 'Untitled Teams Meeting',
    scheduled_at: meeting.startDateTime || null,
    duration_minutes: calculateDurationMinutes(meeting.startDateTime, meeting.endDateTime),
    join_url: meeting.joinWebUrl,
    teams_meeting_id: meeting.id,
    meeting_type: 'teams',
    status: determineStatus(meeting),
  };
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Fetch a specific online meeting by ID
 * 
 * @param meetingId - The Teams meeting ID
 * @returns The Teams meeting details
 * @throws ForbiddenError if missing OnlineMeetings.Read permission
 */
export async function getOnlineMeetingById(meetingId: string): Promise<TeamsMeeting> {
  console.log(`[TeamsMeetings] Fetching meeting ${meetingId}...`);
  
  try {
    const response = await withRateLimitRetry(
      () => callGraphAPI<TeamsMeeting>(`/me/onlineMeetings/${meetingId}`),
      'Fetching meeting by ID'
    );
    
    return response;
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new ForbiddenError(
        'Missing OnlineMeetings.Read permission. Please disconnect and reconnect your Microsoft account to grant this permission.'
      );
    }
    throw error;
  }
}

/**
 * NOTE: Microsoft Graph API does NOT support listing all online meetings.
 * The /me/onlineMeetings endpoint requires a $filter parameter.
 * 
 * For listing meetings, use the local database (meetings table with meeting_type='teams').
 * 
 * This function is deprecated and returns an empty array.
 * @deprecated Use database query instead
 */
export async function fetchAndNormalizeMeetings(): Promise<NormalizedMeeting[]> {
  console.warn('[TeamsMeetings] Bulk listing from Graph API is not supported. Use database query instead.');
  return [];
}

// ============================================================================
// Meeting Creation Types
// ============================================================================

export interface CreateMeetingRequest {
  subject: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: Array<{
    upn?: string;
    emailAddress?: string;
  }>;
}

/**
 * Response from POST /me/onlineMeetings endpoint
 */
export interface OnlineMeetingResponse {
  id: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  joinWebUrl: string;
  audioConferencing?: {
    dialinUrl?: string;
    tollNumber?: string;
  };
}

export interface CreatedTeamsMeeting {
  teams_meeting_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  join_url: string;
  meeting_type: 'teams';
  status: 'scheduled';
}

// ============================================================================
// Meeting Creation
// ============================================================================

/**
 * Create a new online meeting in Microsoft Teams
 * Uses /me/onlineMeetings endpoint which works for all Teams users
 * (doesn't require Exchange Online mailbox like the calendar approach)
 * 
 * @param input - Meeting details (subject, start/end times, attendees)
 * @returns Created meeting details including join URL
 * @throws ForbiddenError if missing OnlineMeetings.ReadWrite permission
 */
export async function createOnlineMeeting(
  input: CreateMeetingRequest
): Promise<CreatedTeamsMeeting> {
  // Validate input dates
  const startDate = new Date(input.startDateTime);
  const endDate = new Date(input.endDateTime);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }
  
  if (endDate <= startDate) {
    throw new Error('End time must be after start time');
  }
  
  if (startDate.getTime() < Date.now() - 60000) { // 1 minute buffer
    throw new Error('Start time must be in the future');
  }
  
  // Validate subject
  const subject = input.subject?.trim();
  if (!subject || subject.length === 0) {
    throw new Error('Meeting title is required');
  }
  
  if (subject.length > 200) {
    throw new Error('Meeting title must be less than 200 characters');
  }

  // Build onlineMeetings request body
  const requestBody: Record<string, unknown> = {
    subject: subject,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    lobbyBypassSettings: {
      scope: 'organization', // Only org members bypass lobby
    },
  };

  // Add participants if attendees provided
  if (input.attendees && input.attendees.length > 0) {
    const validAttendees = input.attendees
      .filter(a => a.upn || a.emailAddress)
      .map(a => ({
        upn: a.upn || a.emailAddress,
      }));
    
    if (validAttendees.length > 0) {
      requestBody.participants = {
        attendees: validAttendees,
      };
    }
  }

  console.log('[TeamsMeetings] Creating online meeting:', subject);

  try {
    // Create online meeting directly (no calendar/Exchange dependency)
    const response = await withRateLimitRetry(
      () => callGraphAPI<OnlineMeetingResponse>(
        '/me/onlineMeetings',
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
        }
      ),
      'Creating online meeting'
    );
    
    if (!response.id || !response.joinWebUrl) {
      throw new Error('Invalid response from Microsoft Graph API - missing meeting ID or join URL');
    }
    
    const durationMinutes = calculateDurationMinutes(
      response.startDateTime,
      response.endDateTime
    );
    
    console.log('[TeamsMeetings] Online meeting created successfully:', response.id);
    
    return {
      teams_meeting_id: response.id,
      title: response.subject,
      scheduled_at: response.startDateTime,
      duration_minutes: durationMinutes || 60,
      join_url: response.joinWebUrl,
      meeting_type: 'teams',
      status: 'scheduled',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new ForbiddenError(
        'Missing OnlineMeetings.ReadWrite permission. Please disconnect and reconnect your Microsoft account to grant this permission.'
      );
    }
    console.error('[TeamsMeetings] Failed to create online meeting:', error);
    throw error;
  }
}
