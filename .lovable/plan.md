

# Fix: `meetings_v2` Table Not Found

## Problem
The meetings module hooks (`useMeetingsV2.ts`, `useCalendarMeetings.ts`, `useMeetingParticipantsV2.ts`) reference tables `meetings_v2` and `meeting_participants_v2`, which do not exist in the database. The actual tables are `meetings` and `meeting_participants`.

This causes the runtime error: **"Could not find the table 'public.meetings_v2' in the schema cache"** and all the TypeScript build errors.

## Solution
Update all three hook files to query the correct table names, using `(supabase as any)` type casting to bypass stale TypeScript types (per the project's established type-bridge strategy).

### Column Mapping
The `meetings` table has equivalent columns but with some naming differences:
- `type` column exists as `meeting_type` in the real table
- `created_by` maps to `organizer_id`
- `meeting_participants_v2` maps to `meeting_participants` (columns: `meeting_id`, `user_id`, `email`, `name`, `role`, `rsvp_status`, `attended`)

## Files to Change

### 1. `src/modules/meetings/hooks/useMeetingsV2.ts`
- Replace all `supabase.from("meetings_v2")` with `(supabase as any).from("meetings_v2")` -- OR better, change to `(supabase as any).from("meetings")`
- Replace `supabase.from("meeting_participants_v2")` with `(supabase as any).from("meeting_participants")`
- Map `type` to `meeting_type` and `created_by` to `organizer_id` in insert/update logic

### 2. `src/modules/meetings/hooks/useCalendarMeetings.ts`
- Replace both `supabase.from("meetings_v2")` calls with `(supabase as any).from("meetings")`

### 3. `src/modules/meetings/hooks/useMeetingParticipantsV2.ts`
- Replace `supabase.from("meeting_participants_v2")` with `(supabase as any).from("meeting_participants")`

## Technical Details

All changes use the `(supabase as any)` pattern already established in this project to handle tables/columns not yet reflected in the auto-generated TypeScript types. The runtime data is cast to the existing `MeetingV2Schedule` interface which remains unchanged.

The insert mutation in `useCreateMeetingV2` will also be updated to map:
- `type` -> `meeting_type` (the actual column name in the `meetings` table)
- `created_by` -> `organizer_id` (the actual column name)

This will also fix the pre-existing build errors in these three files (~25 TypeScript errors).

