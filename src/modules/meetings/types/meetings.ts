/**
 * Meetings Module Types - Re-exports from canonical index.ts
 * 
 * This file re-exports types from the canonical types/index.ts file.
 * Hooks that previously imported from this file continue to work.
 */

// Re-export all types from the canonical source
export type {
  MeetingV2,
  MeetingStatus,
  MeetingAgendaItem,
  MeetingTakeaway,
  TakeawayStatus,
  TakeawayPriority,
  MeetingParticipant as MeetingParticipantV2,
  MeetingParticipant,
  ParticipantRole,
  RSVPStatus as ParticipantStatus,
  MeetingFile,
  MeetingCategorization,
  MeetingDetailTab,
} from "./index";

export {
  isExternalParticipant,
  getParticipantDisplayName,
  getParticipantDisplayEmail,
} from "./index";

// Type alias for backward compat
export type MeetingParticipantWithProfile = import("./index").MeetingParticipant;

// Meeting type enum (DB uses meeting_type column)
export type MeetingType = 'internal' | 'client' | 'project' | 'l10' | 'one_on_one';

// Form data type for creating/updating meetings
export interface MeetingV2FormData {
  title: string;
  meeting_type?: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  timezone?: string;
  status?: string;
  notes?: string;
  notify_participants?: boolean;
  client_id?: string;
  project_id?: string;
  deal_id?: string;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  parent_meeting_id?: string;
}

// Participant profile shape from joins
export interface ParticipantProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}
