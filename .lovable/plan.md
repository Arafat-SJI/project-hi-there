

## Plan: Seed Rich Meeting Transcripts + Fix Transcript Page

### Problem

Two issues to address:

1. **Broken Transcript Page**: `MeetingTranscriptsPage` queries columns that don't exist in `meeting_transcripts` (`summary`, `speakers`, `source`, `processing_status`). The actual schema is `id, meeting_id, speaker, content, created_at`. The page shows "No Transcripts" even though 25 transcript turns exist across 10 meetings.

2. **Insufficient Seed Data**: The existing 10 meetings have only 2-3 speaker turns each (very short). User wants at least 10 meetings with long, realistic agency-client transcripts.

### Current State

- `meeting_transcripts` schema: `id, meeting_id, speaker, content, created_at` (speaker-turn model, one row per turn)
- `meeting_action_items` schema: `id, meeting_id, text, assignee_id, assignee_email, due_date, priority, task_id, status, extracted_from_transcript, extraction_confidence, created_at, updated_at` — currently empty
- 10 meetings already have transcripts (2-3 turns each, very brief)
- 22 clients exist (law firms, CPA firms, tech companies)

### Implementation

#### 1. Fix MeetingTranscriptsPage to match actual schema

Rewrite the query and `TranscriptRow` interface to aggregate `meeting_transcripts` by `meeting_id`:
- Group turns by `meeting_id`, collect unique speakers, concatenate content
- Remove references to non-existent columns (`summary`, `source`, `processing_status`)
- Derive speaker list from `DISTINCT speaker` per meeting
- Show turn count instead of processing status
- Keep search, preview dialog, and navigation working

#### 2. Seed 10 new meetings with long transcripts (via edge function)

Create a temporary `seed-meeting-transcripts` edge function that inserts:

- **10 new completed meetings** tied to existing clients, covering realistic agency scenarios:
  1. Acme Corp — Q1 Strategy Review (8+ turns)
  2. NovaTech Solutions — Product Roadmap Sync (8+ turns)
  3. Kevin Patel — Contract Automation Workshop (8+ turns)
  4. Sarah Chen — Document Management Discovery (8+ turns)
  5. James Thompson — Litigation Dashboard Review (8+ turns)
  6. Jennifer Adams — Tax Season Readiness (8+ turns)
  7. Michael Richardson — Year-End Compliance Review (8+ turns)
  8. Robert Martinez — Family Law Portal Demo (8+ turns)
  9. Thomas Anderson — CFO Advisory Dashboard (8+ turns)
  10. Patricia Williams — IP Portfolio Tracking (8+ turns)

- Each meeting gets **8-12 speaker turns** with realistic dialogue between agency presenter (Shahed) and client stakeholders
- Each meeting gets **2-4 action items** in `meeting_action_items` with priorities, due dates, and confidence scores

#### 3. Cleanup

Delete the temporary edge function after execution.

### Files Changed

| File | Change |
|------|--------|
| `src/modules/meetings/pages/MeetingTranscriptsPage.tsx` | Rewrite query to aggregate speaker turns per meeting; fix TranscriptRow interface |
| `supabase/functions/seed-meeting-transcripts/index.ts` | Temporary edge function to insert 10 meetings + ~100 transcript turns + ~30 action items |

