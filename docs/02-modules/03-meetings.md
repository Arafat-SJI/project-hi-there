# Meetings — Module Blueprint

## Overview
The Meetings module provides full meeting lifecycle management: scheduling, recurring series, agendas, takeaways, transcript processing, Zoom integration, AI-powered summaries, efficiency analysis, and participant management.

## Module Name
`Meetings` (in app_modules and navigation)

## Routes Owned
```
/meetings/schedule              → Meeting list/calendar
/meetings/schedule/:idOrSlug    → Meeting detail
/meetings/transcripts           → Transcript list
/meetings/transcripts/:slug     → Transcript detail
/meetings/transcripts/ai-match  → AI match results
/meetings/pending-assignments   → Pending meeting assignments
/knowledge/meetings             → Knowledge-embedded meetings

Legacy redirects:
/meetings        → /meetings/transcripts
/meetings/:id    → MeetingIdRedirect (resolves to schedule or transcript)
/meetings-v2     → /meetings/schedule
/meetings-v2/:id → /meetings/schedule/:id
```

Admin routes:
```
/admin/data-sync/meeting-rules  → Meeting categorization rules
```

## File Inventory

### Pages (7 files)
- src/pages/MeetingsV2.tsx — Meeting list/calendar
- src/pages/MeetingDetailV2.tsx — Meeting detail (tabs: details, agenda, takeaways, transcript, participants, series)
- src/pages/MeetingTranscripts.tsx — Transcript list
- src/pages/MeetingPendingAssignments.tsx — Pending assignments
- src/pages/MeetingAiMatchResults.tsx — AI match results
- src/pages/MeetingIdRedirect.tsx — ID-to-slug redirect
- src/pages/admin/data-sync/MeetingRules.tsx — Admin meeting rules

### Components — meetings-v2/ (30 files)
Main meeting UI:
- CreateMeetingDialog.tsx, EditMeetingDialog.tsx, DeleteMeetingDialog.tsx, CloseMeetingDialog.tsx
- EditMeetingSeriesConfirmDialog.tsx, MeetingsCalendar.tsx
- MeetingDetailsTab.tsx, DateTimePicker.tsx, ShareMeetingButton.tsx
- MeetingParticipantSelector.tsx, ParticipantsTab.tsx
- SeriesHistoryTab.tsx, PreviousAgendaViewer.tsx, RelatedTasksTab.tsx

Agenda:
- AgendaTab.tsx, AgendaColumn.tsx, AgendaItemRow.tsx, AgendaItemTakeaways.tsx
- AddAgendaItemDialog.tsx, AgendaTakeawaysPanel.tsx

Takeaways:
- TakeawaysTab.tsx, TakeawaysColumn.tsx, AddTakeawayDialog.tsx
- GeneralTakeawaysSection.tsx, InlineTakeawayForm.tsx, UnassignedTakeaways.tsx

Transcripts:
- TranscriptTab.tsx, TranscriptSummaryTab.tsx

Zoom:
- ZoomRecordingPanel.tsx

Participants:
- AddParticipantDialog.tsx

### Components — meeting/ (12 files)
- AddManualTranscriptDialog.tsx, AISuggestionDialog.tsx, ActionItemsPanel.tsx
- BulkOperationsBar.tsx, InlineMeetingAssignment.tsx, MeetingAssignmentEditor.tsx
- MeetingCategorizationCard.tsx, PendingAssignmentTaskDialog.tsx
- QuickClientMatcher.tsx, SearchableClientSelect.tsx, SearchableProjectSelect.tsx
- ZoomSyncControls.tsx

### Components — meetings/ (3 files)
- MeetingProcessingDashboard.tsx, MeetingStatusBadge.tsx, ProjectSearchFilters.tsx

### Components — meetingEfficiency/ (1 file)
- MeetingEfficiencyDashboard.tsx

### Components — AI
- src/components/ai/MeetingIssueResults.tsx

### Hooks (30 files)
Core:
- useMeetingsV2.ts — Main meetings query
- useMeetingAgenda.ts — Agenda CRUD
- useMeetingTakeaways.ts — Takeaways CRUD
- useMeetingParticipants.ts — Participant management
- useMeetingPermissions.ts — Permission checks
- useMeetingHost.ts — Host information
- useMeetingZoomLink.ts — Zoom link
- useMeetingFiles.ts — Meeting files
- useMeetingFileSummary.ts — File summaries
- useMeetingTranscriptSummary.ts — Transcript summary
- useMeetingActionItems.ts — Action items
- useMeetingAssignment.ts — Meeting assignment
- useMeetingEfficiency.ts — Efficiency metrics
- useRecurringMeetings.ts — Series management
- useCalendarMeetings.ts — Calendar integration

AI & Processing:
- useGenerateMeetingSummary.ts — AI summary generation
- useExtractMeetingTasks.ts — Extract tasks from meetings
- useCategorizeMeetings.ts — Auto-categorization
- useAutoEmbedMeetings.ts — Auto-embed for knowledge
- useMeetingsWithCategorizations.ts — Meetings with categories

Cross-module:
- useClientMeetings.ts, useContactMeetings.ts, useContactMeetingSearch.ts
- useDealMeetings.ts, useEntityMeetings.ts, useKnowledgeMeetings.ts
- useManualMeetings.ts, useProjectMeetings.ts, useProjectMeetingSearch.ts

Memory:
- src/hooks/memory/useEntityMeetings.ts

### AI Agent
- src/lib/ai-agents/meeting-intelligence-agent.ts — Meeting intelligence

### Types (1 file)
- src/types/meetings.ts — MeetingV2, MeetingTakeaway, ParticipantProfile, etc.

### Edge Functions (33 functions)
Core:
- ai-summarize-meeting, api-v1-meetings, api-v1-transcripts
- apply-meeting-rules, categorize-meeting, smart-categorize-meetings
- classify-zoom-meetings, compile-meeting-summary
- convert-takeaway-to-task, create-meeting-review-tasks
- discover-meeting-relationships, extract-meeting-issues
- extract-meeting-tasks-for-ac, generate-meeting-summary
- generate-meeting-summary-v2, generate-recurring-meetings
- get-meeting-participants, match-meeting-to-project
- meeting-efficiency-analyzer, meeting-issue-reporter
- parse-meeting-action-items, process-pending-meetings
- send-meeting-efficiency-report, send-meeting-notification
- sync-meeting-participants, auto-embed-meetings, ai-match-meeting-client

Zoom:
- api-v1-zoom-files, check-zoom-sync-health, manage-zoom-account
- sync-zoom-files, zoom-cron-sync

Shared:
- _shared/send-meeting-completion-email.ts
- _shared/link-zoom-recording-to-meeting.ts

### API Endpoints
```
MEETINGS.BASE: 'api-v1-meetings'
MEETINGS.SYNC_ZOOM: 'sync-zoom-files'
MEETINGS.GENERATE_SUMMARY: 'generate-meeting-summary'
MEETINGS.CATEGORIZE: 'categorize-meeting'
MEETINGS.EFFICIENCY_ANALYZER: 'meeting-efficiency-analyzer'
ZOOM.SYNC_FILES: 'sync-zoom-files'
ZOOM.MANAGE_ACCOUNT: 'manage-zoom-account'
```

## Database Tables
- `meetings_v2` — Meeting records
- `meeting_agenda_items` — Agenda items
- `meeting_takeaways` — Takeaways/decisions
- `meeting_participants` — Participant list
- `meeting_transcripts` — Transcript content
- `meeting_series` — Recurring meeting definitions
- `meeting_categorizations` — Auto-categorizations
- `meeting_files` — Attached files
- `meeting_assignments` — Client/project assignments

## Cross-Module Dependencies
**Depends on:** Platform Core
**Used by:**
- Projects (project meetings tab, link meetings to projects)
- Business Dev (deal meetings, client meetings)
- EOS (extract issues from meetings)
- Knowledge Base (embed meetings into knowledge)
- Actions (convert takeaways to tasks)

## Implementation Status

### Built (Sprint 1)
- **MeetingTranscriptsPage** (`src/modules/meetings/pages/MeetingTranscriptsPage.tsx`) — Transcript browser with search, status filter, summary cards (total/with AI summary/processed), table with meeting name, date, source, speakers, status, summary preview, preview dialog
- **useMeetingEfficiency** (`src/modules/meetings/hooks/useMeetingEfficiency.ts`) — Efficiency metrics: totalMeetings, avgDuration, avgParticipants, avgTakeaways, agendaRate, takeawayRate, avgEfficiencyScore (weighted composite: 25pts agenda + 25pts takeaways + 25pts duration + 25pts attendance), monthly trend
- **MeetingAnalytics efficiency section** — Wired useMeetingEfficiency to admin MeetingAnalytics page with efficiency score card, breakdown (agenda rate, takeaway rate, avg participants, avg takeaways), monthly efficiency trend with progress bars

### Routes Registered
- `/meetings/transcripts` → MeetingTranscriptsPage

### Built (Sprint 2 — Detail Page Enhancements)

**5 New Components:**
- **AddParticipantDialog** (`src/modules/meetings/components/participants/AddParticipantDialog.tsx`) — Dialog with name, email, role selector, calls `useAddParticipant()`
- **MeetingParticipantSelector** (`src/modules/meetings/components/participants/MeetingParticipantSelector.tsx`) — Inline participant list with avatars, role badges, remove buttons
- **PreviousAgendaViewer** (`src/modules/meetings/components/agenda/PreviousAgendaViewer.tsx`) — Read-only agenda from previous meeting in series
- **SeriesHistoryTab** (`src/modules/meetings/components/series/SeriesHistoryTab.tsx`) — Timeline of all meetings in a series with status badges, clickable
- **RelatedTasksTab** (`src/modules/meetings/components/RelatedTasksTab.tsx`) — Action items and linked tasks from meeting takeaways

**MeetingDetailV2Page Enhanced:**
- Added "Tasks" tab (always shown) → RelatedTasksTab
- Added "Series" tab (conditional on `series_id`) → SeriesHistoryTab
- MeetingDetailTab type updated: `"details" | "agenda" | "takeaways" | "participants" | "related-tasks" | "series-history"`

## Implementation Notes
- Meetings support both one-off and recurring series
- Zoom integration syncs recordings, transcripts, and files
- AI features: summarization, task extraction, issue extraction, categorization
- Takeaways can be converted to Actions (tasks) via edge function
- Meeting assignments link meetings to clients and projects
- Efficiency analyzer provides meeting quality metrics
