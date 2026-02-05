# Plan: Fix Missing `google_meet_id` Column Error

## Problem Analysis

The `sync-google-meet` edge function is using columns that don't exist in the `meetings` table:

| Column Used in Code   | Exists in DB |
| --------------------- | ------------ |
| `google_meet_id`      | ❌ NO        |
| `google_meet_link`    | ❌ NO        |
| `external_id`         | ✅ YES       |
| `external_meeting_id` | ✅ YES       |
| `join_url`            | ✅ YES       |

The edge function was written using provider-specific columns (like Zoom has `zoom_id`, `zoom_meeting_id`, etc.), but Google Meet columns were never added to the database.

## Solution

Update the `sync-google-meet` edge function to use only the **provider-agnostic columns** that already exist in the database schema. This follows the project's established pattern for multi-provider meeting support.

## Implementation

### File: `supabase/functions/sync-google-meet/index.ts`

**Changes required:**

1. **Line 188**: Fix the `.or()` query that checks for existing meetings
   - Remove: `google_meet_id.eq.${eventId}`
   - The query should only use `external_id` since that's the standardized identifier

2. **Lines 205-206**: Remove Google Meet specific columns from `meetingData`
   - Remove: `google_meet_id: eventId`
   - Remove: `google_meet_link: meetLink`
   - Keep: `external_id`, `external_meeting_id`, `join_url`, `host_url` (these already exist)

**Before (lines 184-207):**

```typescript
// Check if meeting exists
const { data: existingMeeting } = await supabaseClient
  .from('meetings')
  .select('id')
  .or(`external_id.eq.${eventId},google_meet_id.eq.${eventId}`)  // BAD
  .single()

const meetingData = {
  // ... other fields
  google_meet_id: eventId,      // BAD - column doesn't exist
  google_meet_link: meetLink,   // BAD - column doesn't exist
}
```

**After:**

```typescript
// Check if meeting exists
const { data: existingMeeting } = await supabaseClient
  .from('meetings')
  .select('id')
  .eq('external_id', eventId)  // GOOD - use provider-agnostic column
  .single()

const meetingData = {
  title: event.summary || 'Untitled Meeting',
  description: event.description,
  scheduled_at: eventStart,
  duration_minutes: durationMinutes,
  status: new Date(eventEnd) < new Date() ? 'completed' : 'scheduled',
  provider: meetingProvider,
  external_id: eventId,
  external_uuid: eventId,
  external_meeting_id: eventId,
  join_url: meetLink,
  host_url: meetLink,
  organizer_id: user.id,
  // NO google_meet_id or google_meet_link
}
```

## Files Changed

| File                                           | Action | Description                                                         |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `supabase/functions/sync-google-meet/index.ts` | MODIFY | Remove non-existent `google_meet_id` and `google_meet_link` columns |

## Technical Notes

1. **Provider-Agnostic Design**: The `meetings` table uses `provider` column to identify the meeting type (zoom, google_meet, microsoft_teams) and generic columns (`external_id`, `join_url`, etc.) for provider-specific data

2. **Adding `organizer_id`**: The insert query should include `organizer_id: user.id` since this is a required column for new meetings

3. **No Schema Migration Needed**: This fix only requires updating the edge function code - no database changes are needed
