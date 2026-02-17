/**
 * Meetings Module Types - Standalone Implementation
 * 
 * Type definitions for meetings_v2 table and related entities
 * as specified in the standalone implementation plan.
 */

// ========================
// Meeting V2
// ========================

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'internal' | 'client' | 'project' | 'l10' | 'one_on_one';

export interface MeetingV2 {
  id: string;
  title: string;
  type: MeetingType;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  timezone: string;
  status: MeetingStatus;
  notes: string | null;
  notify_participants: boolean;
  // Recurrence
  recurrence_pattern: string | null;
  recurrence_interval: number | null;
  recurrence_days_of_week: number[] | null;
  recurrence_day_of_month: number | null;
  recurrence_end_date: string | null;
  parent_meeting_id: string | null;
  // Relationships
  client_id: string | null;
  project_id: string | null;
  deal_id: string | null;
  // Content
  recording_url: string | null;
  transcript_content: Record<string, unknown> | null;
  transcript_text: string | null;
  ai_summary: Record<string, unknown> | null;
  categorization_confidence: number | null;
  is_categorized: boolean;
  // Metadata
  slug: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  clients?: { name: string; email?: string | null } | null;
  projects?: { name: string } | null;
}

// ========================
// Meeting Participant V2
// ========================

export type ParticipantRole = 'organizer' | 'required' | 'optional';
export type ParticipantStatus = 'pending' | 'accepted' | 'declined' | 'tentative';

export interface MeetingParticipantV2 {
  id: string;
  meeting_id: string;
  user_id: string | null;
  external_email: string | null;
  external_name: string | null;
  role: ParticipantRole;
  status: ParticipantStatus;
  attended?: boolean;
  notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  user?: ParticipantProfile | null;
}

export interface ParticipantProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export type MeetingParticipantWithProfile = MeetingParticipantV2 & {
  user?: ParticipantProfile | null;
};

// ========================
// Meeting Agenda Item
// ========================

export interface MeetingAgendaItem {
  id: string;
  meeting_id: string;
  content: string;
  sort_order: number;
  is_completed: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ========================
// Meeting Takeaway
// ========================

export type TakeawayStatus = 'open' | 'in_progress' | 'completed';

export interface MeetingTakeaway {
  id: string;
  meeting_id: string;
  content: string;
  assigned_to: string | null;
  due_date: string | null;
  status: TakeawayStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  assignee?: ParticipantProfile | null;
}

// ========================
// Meeting File (Transcript)
// ========================

export interface MeetingFile {
  id: string;
  slug: string | null;
  zoom_meeting_id: number | null;
  zoom_meeting_uuid: string | null;
  meeting_topic: string | null;
  meeting_start_time: string | null;
  file_type: string;
  download_url: string | null;
  host_email: string | null;
  host_name: string | null;
  participants_count: number | null;
  status: string | null;
  duration_minutes: number | null;
  // Categorization
  meeting_category: string | null;
  categorization_status: string | null;
  categorization_confidence: number | null;
  categorized_at: string | null;
  // Transcript
  transcript_content: Record<string, unknown> | null;
  transcript_text: string | null;
  transcript_summary: string | null;
  summary_overview: string | null;
  next_steps: string[] | null;
  // AI Processing
  ai_processing_status: string | null;
  ai_suggestions: Record<string, unknown> | null;
  processing_error: string | null;
  last_processed_at: string | null;
  // Project/Client matching
  project_id: string | null;
  project_name: string | null;
  project_manager: string | null;
  client_name: string | null;
  client_id: string | null;
  project_match_confidence: number | null;
  // Assignment
  assignment_status: string | null;
  assignment_confidence: number | null;
  suggested_client_id: string | null;
  suggested_project_id: string | null;
  assignment_reasoning: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Embedding
  embedding_status: string | null;
  embedding_generated_at: string | null;
  embedding_chunks_count: number | null;
  // Link to meetings_v2
  meeting_id_v2: string | null;
  meeting_type: string | null;
  // Zoom account
  zoom_account_name: string | null;
  zoom_account_id: string | null;
  // Metadata
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ========================
// Meeting Categorization
// ========================

export interface MeetingCategorization {
  id: string;
  meeting_file_id: string | null;
  category: string | null;
  confidence: number | null;
  is_verified: boolean;
  verified_by: string | null;
  created_at: string;
}

// ========================
// Form Data Types
// ========================

export interface MeetingV2FormData {
  title: string;
  type: MeetingType;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  timezone?: string;
  status?: MeetingStatus;
  notes?: string;
  notify_participants?: boolean;
  client_id?: string;
  project_id?: string;
  deal_id?: string;
  recurrence_pattern?: string;
  recurrence_interval?: number;
  recurrence_days_of_week?: number[];
  recurrence_day_of_month?: number;
  recurrence_end_date?: string;
}

// ========================
// Helper Functions
// ========================

/** Check if a participant is external (no user_id) */
export function isExternalParticipant(p: MeetingParticipantV2): boolean {
  return p.user_id === null && p.external_email !== null;
}

/** Get display name for a participant */
export function getParticipantDisplayName(p: MeetingParticipantV2): string {
  if (p.user) {
    return p.user.full_name || p.user.email;
  }
  return p.external_name || p.external_email || 'Unknown';
}

/** Get display email for a participant */
export function getParticipantDisplayEmail(p: MeetingParticipantV2): string {
  if (p.user) {
    return p.user.email;
  }
  return p.external_email || '';
}

