/**
 * Meetings Module V2 Types
 *
 * Extended type definitions for the full meetings lifecycle:
 * series, agenda, takeaways, participants, transcripts, categorizations, assignments.
 */

// Re-export existing Meeting type from legacy hook
export type { Meeting } from "@/hooks/useMeetings";

// ========================
// Meeting V2 (extended)
// ========================

export interface MeetingV2 {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  provider: string | null;
  status: string | null;
  client_id: string | null;
  organizer_id: string;
  location: string | null;
  meeting_type: string | null;
  join_url: string | null;
  host_url: string | null;
  // V2 fields
  series_id: string | null;
  slug: string | null;
  is_recurring: boolean;
  agenda_finalized: boolean;
  summary: string | null;
  action_items: unknown[];
  efficiency_score: number | null;
  closed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined relations
  clients?: { name: string; email?: string | null } | null;
  series?: MeetingSeries | null;
  agenda_items?: MeetingAgendaItem[];
  takeaways?: MeetingTakeaway[];
  participants?: MeetingParticipant[];
  transcript?: MeetingTranscript | null;
}

export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type MeetingProvider =
  | "zoom"
  | "google_meet"
  | "microsoft_teams"
  | "webex"
  | "other";

// ========================
// Meeting Series
// ========================

export interface MeetingSeries {
  id: string;
  title: string;
  description: string | null;
  recurrence_rule: string;
  duration_minutes: number;
  organizer_id: string;
  default_agenda: AgendaTemplate[];
  is_active: boolean;
  next_occurrence: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  meetings_count?: number;
}

export interface AgendaTemplate {
  title: string;
  duration_minutes?: number;
  description?: string;
}

export interface SeriesFormData {
  title: string;
  description?: string;
  recurrence_rule: string;
  duration_minutes: number;
  default_agenda?: AgendaTemplate[];
}

// ========================
// Agenda Items
// ========================

export interface MeetingAgendaItem {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  presenter_id: string | null;
  sort_order: number;
  is_completed: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  presenter?: { full_name: string; email: string } | null;
  takeaways?: MeetingTakeaway[];
}

export interface AgendaItemFormData {
  title: string;
  description?: string;
  duration_minutes?: number;
  presenter_id?: string;
}

// ========================
// Takeaways
// ========================

export type TakeawayType = "decision" | "action_item" | "note" | "follow_up";

export interface MeetingTakeaway {
  id: string;
  meeting_id: string;
  agenda_item_id: string | null;
  content: string;
  takeaway_type: TakeawayType;
  assigned_to: string | null;
  due_date: string | null;
  is_completed: boolean;
  task_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  assignee?: { full_name: string; email: string } | null;
}

export interface TakeawayFormData {
  content: string;
  takeaway_type: TakeawayType;
  agenda_item_id?: string;
  assigned_to?: string;
  due_date?: string;
}

// ========================
// Participants
// ========================

export type ParticipantRole = "organizer" | "presenter" | "attendee" | "optional";
export type RSVPStatus = "pending" | "accepted" | "declined" | "tentative";

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  role: ParticipantRole;
  rsvp_status: RSVPStatus;
  attended: boolean;
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
  // Joined
  user?: { full_name: string; email: string; avatar_url?: string } | null;
}

// ========================
// Transcripts
// ========================

export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  content: string;
  language: string;
  source: "zoom" | "teams" | "google_meet" | "manual" | "upload";
  word_count: number | null;
  duration_seconds: number | null;
  speakers: TranscriptSpeaker[];
  processed_at: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSpeaker {
  name: string;
  segments: { start: number; end: number; text: string }[];
}

// ========================
// Categorizations
// ========================

export interface MeetingCategorization {
  id: string;
  meeting_id: string;
  category: string;
  confidence: number;
  source: "manual" | "ai" | "rule";
  rule_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ========================
// Assignments
// ========================

export type AssignmentEntityType = "client" | "project" | "deal";

export interface MeetingAssignment {
  id: string;
  meeting_id: string;
  entity_type: AssignmentEntityType;
  entity_id: string;
  assigned_by: string | null;
  created_at: string;
}

// ========================
// Filters & Views
// ========================

export interface MeetingFilters {
  status?: MeetingStatus | "all";
  provider?: MeetingProvider | "all";
  client_id?: string;
  series_id?: string;
  date_range?: { start: string; end: string };
  search?: string;
}

export type MeetingView = "list" | "calendar";

export type MeetingDetailTab =
  | "details"
  | "agenda"
  | "takeaways"
  | "transcript"
  | "participants"
  | "series";
