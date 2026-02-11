

# Run Pending Migrations and Fix Build Errors

## Overview
Two migrations from today (Feb 11) need to be applied, and several TypeScript/edge function errors need fixing. Running the migrations will auto-regenerate `types.ts` and resolve the majority of build errors.

## Step 1: Run Migration -- Deals Module Fixes
**File:** `20260211_deals_module_fixes.sql`

What it does:
- Adds FK constraints: `deals.client_id -> clients`, `deals.owner_id -> profiles`, `deals.created_by -> profiles`
- Adds FK constraints on `deal_activities` and `deal_comments` to `profiles`
- Adds missing columns to `contacts`: `followup_status`, `is_lead_follow_up`, `last_contact_date`, `next_followup_date` (idempotent, most already exist)
- Tightens RLS policies on deals/activities/comments to owner/creator-based access

**Must run first** -- no dependencies on the second migration.

## Step 2: Run Migration -- Meetings Replication Alignment
**File:** `20260211_meetings_replication_alignment.sql`

What it does:
- Creates 5 new tables: `meeting_external_participants`, `meeting_action_items`, `meeting_assignment_suggestions`, `client_meetings`, `contact_meeting_links`
- Adds columns to `meetings`: `deal_id`, `pod_id`, `recording_url`, `transcript_content`, `parent_meeting_id`, `ai_summary`, etc.
- Adds columns to `meeting_participants`, `meeting_agenda_items`, `meeting_takeaways`, `meeting_files`, `meeting_categorizations`
- Creates indexes and RLS policies for all new tables

**Must run second** -- references `deals`, `pods`, `tasks`, `clients`, `contacts` tables.

## Step 3: Fix Edge Function Type Errors (6 errors)
After migrations run and `types.ts` regenerates, fix remaining edge function issues:

- **`compile-meeting-summary/index.ts`**: Fix `profiles` type -- Supabase returns arrays for joined relations; access as `profiles[0]` instead of treating as single object
- **`get-meeting-participants/index.ts`**: Add explicit type annotation to `enrichedInternal` array
- **`match-meeting-to-project/index.ts`**: Fix `clients` join type (array vs object)
- **`send-meeting-notification/index.ts`**: Fix `profiles` cast (array vs object)

## Step 4: Fix Frontend Type Errors
After types regenerate, most meeting hooks errors will resolve automatically. Remaining fixes:

- **`src/hooks/useMeetings.ts`**: Cast query result through `unknown` to handle new optional columns
- **`src/pages/ClientKnowledge.tsx`**: Fix `deals.status` column reference
- **`src/pages/admin/CommonKnowledgeManagement.tsx`**: Fix join query syntax

## Expected Outcome
- All pending migrations applied
- `types.ts` regenerated with new tables and columns
- Build errors reduced from 30+ to 0
- New meeting tables available for the meetings module hooks

## Technical Notes
- Both migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` so they are safe to re-run
- The deals migration tightens RLS -- existing "manage" policies are dropped and replaced with owner-based policies
- The meetings migration adds `CHECK` constraints on new columns (e.g., priority, status enums)

