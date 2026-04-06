

# Knowledge Base & Meeting Transcripts -- Replication Plan

## Overview

This plan documents everything needed to replicate the Knowledge Base and Meeting Transcripts modules in another React + Supabase project.

---

## MODULE 1: KNOWLEDGE BASE

### 1.1 Database Tables

```text
knowledge_categories
├── id (uuid, PK)
├── name, slug, description, icon, color
├── parent_id (self-ref FK)
├── sort_order, metadata (jsonb)
└── created_at, updated_at

knowledge_entries
├── id (uuid, PK)
├── title, content, slug, summary
├── category_id → knowledge_categories
├── author_id → profiles
├── tags (text[]), status, view_count
├── search_vector (tsvector, GIN-indexed)
├── metadata (jsonb)
└── created_at, updated_at

knowledge_sources
├── id, name, source_type (upload|google_drive|url|meeting|api)
├── config (jsonb), is_active
├── last_synced_at, created_by
└── created_at, updated_at

knowledge_files
├── id, category_id, source_id, title, file_name
├── file_type, file_size, storage_path
├── processing_status (pending|processing|completed|failed|skipped)
├── processing_error, chunk_count, embedding_model
├── metadata, uploaded_by, processed_at
└── created_at, updated_at

knowledge_bookmarks
├── id, user_id → profiles, entry_id → knowledge_entries
└── created_at

user_knowledge_files
├── id, user_id → profiles
├── title, file_name, file_type, file_size
├── storage_path, mime_type
├── processing_status, processing_error, chunk_count
├── metadata
└── created_at, updated_at

user_knowledge_sources
├── id, user_id, name, source_type
├── source_identifier, source_url
├── sync_enabled, sync_frequency, sync_status
├── file_count, total_size
├── credentials (jsonb), sync_config, metadata
└── created_at, updated_at

unified_documents
├── id, title, owner_type (user|project|org), owner_id
├── file_name, file_type, file_size, storage_path
├── processing_status, chunk_count
└── created_at, updated_at

embeddings (shared with all modules)
├── id, entity_type, entity_id, content
├── embedding (vector(1536)), chunk_index
├── metadata (jsonb), user_id
├── unified_document_id
└── created_at

embedding_queue
├── id, entity_type, entity_id, priority
├── status, attempts, max_attempts
├── error_message, scheduled_at
├── started_at, completed_at
└── created_at
```

### 1.2 DB Functions

- `update_knowledge_search_vector()` -- trigger to auto-populate `search_vector` tsvector
- `match_embeddings(query_embedding, match_threshold, match_count, filter_entity_type, filter_user_id)` -- cosine similarity vector search via `<=>` operator
- `match_embeddings_admin(...)` -- extended with project_name, project_manager, client_name filters

### 1.3 Storage Buckets (Private)

- `user-knowledge` -- personal user uploads
- `knowledge-files` -- org-wide knowledge files

### 1.4 Frontend Routes

| Path | Page | Description |
|------|------|-------------|
| `/knowledge` | Knowledge.tsx | Main listing with categories |
| `/knowledge/upload` | KnowledgeUpload.tsx | File upload interface |
| `/knowledge/personal` | PersonalKnowledge.tsx | User's private docs |
| `/knowledge/search` | SemanticSearch.tsx | Vector + keyword search |
| `/knowledge/category/:slug` | KnowledgeByCategory.tsx | Filtered by category |
| `/knowledge/new` | KnowledgeForm.tsx | Create entry |
| `/knowledge/:id` | KnowledgeDetail.tsx | View entry |
| `/knowledge/:id/edit` | KnowledgeForm.tsx | Edit entry |

### 1.5 Hooks

| Hook | Purpose |
|------|---------|
| `useKnowledgeEntries(filters)` | List entries with category join, search |
| `useKnowledgeCategories()` | List categories sorted by sort_order |
| `useKnowledgeEntry(id)` | Single entry with category |
| `useKnowledgeSearch(query)` | Keyword search (ilike) |
| `useCreateKnowledgeEntry()` | Create + auto-slug + invalidation |
| `useUpdateKnowledgeEntry()` | Partial update |
| `useDeleteKnowledgeEntry()` | Delete |
| `useTriggerEmbedding()` | Invoke auto-embed edge function |
| `useIncrementViewCount()` | View count tracking |
| `useToggleBookmark()` | Bookmark toggle |
| `useBookmarkedEntries()` | User's bookmarks |
| `useIsBookmarked(entryId)` | Check bookmark status |
| `useRelatedEntries(entryId)` | Semantic similarity via edge function |
| `useUserKnowledgeFiles()` | Personal files list |
| `useUserKnowledgeSources()` | External source configs |
| `useUnifiedUserDocuments()` | Unified docs (owner_type=user) |
| `useUploadUserKnowledgeFile()` | Upload to storage + DB record |
| `useDeleteUserKnowledgeFile()` | Delete from storage + DB |
| `useUserKnowledgeStats()` | Aggregated stats |
| `useProcessAllPendingFiles()` | Trigger batch processing |
| `useKnowledgeAdmin()` | Admin stats and management |

### 1.6 Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-embeddings` | Chunks text, generates OpenAI embeddings, upserts into `embeddings` table |
| `semantic-search` | Generates query embedding, calls `match_embeddings` RPC |
| `unified-knowledge-search` | Combined keyword + semantic search across entries, files, docs |
| `auto-embed-knowledge-files` | Batch process knowledge_files for embeddings |
| `auto-embed-knowledge-entry` | Single entry embedding |
| `process-embedding-queue` | Process pending items in embedding_queue |
| `embedding-retention-cleanup` | Prune old/stale embeddings |
| `user-knowledge-upload` | Handle user file uploads |
| `user-knowledge-process` | Process pending user files for indexing |
| `user-knowledge-drive-sync` | Sync from Google Drive |
| `knowledge-base` | CRUD API for categories, sources, files |
| `google-drive-sync` | Sync Google Drive files |
| `google-drive-upload` | Upload to Google Drive |

### 1.7 Secrets Required

- `OPENAI_API_KEY` -- for embedding generation (text-embedding-3-small)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` -- for Google Drive integration (optional)

### 1.8 Components

- `GoogleDriveFilePicker.tsx` -- file picker for Drive integration
- `RelatedArticles.tsx` -- shows semantically similar entries

---

## MODULE 2: MEETING TRANSCRIPTS

### 2.1 Database Tables

```text
meetings
├── id (uuid, PK), title, description
├── scheduled_at, duration_minutes
├── provider (zoom|google_meet|microsoft_teams|webex|other)
├── status (scheduled|in_progress|completed|cancelled|no_show)
├── client_id → clients, organizer_id → profiles
├── location, meeting_type, join_url, host_url
├── series_id → meeting_series, slug
├── is_recurring, agenda_finalized
├── summary, action_items (jsonb[])
├── efficiency_score, closed_at
├── deal_id, pod_id, recording_url
├── transcript_content, transcript_text, ai_summary
├── notes, timezone, recurrence_pattern
├── categorization_data, embedding_status
├── is_external, metadata (jsonb)
└── created_at, updated_at

meeting_transcripts (speaker-turn model)
├── id (uuid, PK)
├── meeting_id → meetings
├── speaker, content
├── language, source (zoom|teams|google_meet|manual|upload)
├── word_count, duration_seconds
├── ai_summary, processed_at
└── created_at, updated_at

meeting_series
├── id, title, description
├── recurrence_rule, duration_minutes
├── organizer_id, default_agenda (jsonb)
├── is_active, next_occurrence
└── created_at, updated_at

meeting_agenda_items
├── id, meeting_id, title, description
├── duration_minutes, presenter_id, assigned_to
├── sort_order, is_completed, notes
├── created_by
└── created_at, updated_at

meeting_takeaways
├── id, meeting_id, agenda_item_id
├── content, takeaway_type (decision|action_item|note|follow_up)
├── assigned_to, due_date, is_completed
├── priority (low|medium|high), status (open|in_progress|completed|cancelled)
├── task_id, created_by
└── created_at, updated_at

meeting_participants
├── id, meeting_id, user_id, email, name
├── role (organizer|presenter|attendee|optional)
├── rsvp_status (pending|accepted|declined|tentative)
├── attended, joined_at, left_at, response_at
└── created_at

meeting_external_participants
├── id, meeting_id, external_email, external_name
├── role, status
└── created_at, updated_at

meeting_action_items
├── id, meeting_id, text
├── assignee_id, assignee_email, due_date
├── priority, task_id, status
├── extracted_from_transcript, extraction_confidence
└── created_at, updated_at

meeting_assignments
├── id, meeting_id
├── entity_type (client|project|deal), entity_id
├── assigned_by
└── created_at

meeting_assignment_suggestions
├── id, meeting_id
├── suggested_type, suggested_id
├── confidence, reasoning
├── review_status (pending|approved|rejected)
├── reviewed_by, reviewed_at
└── created_at, updated_at

meeting_files (zoom_files equivalent)
├── id, meeting_id, provider
├── external_meeting_id, file_type, file_name
├── file_size, file_path, storage_path, download_url
├── transcript_text, transcript_content (jsonb)
├── is_processed, has_embeddings, processing_status
├── assignment_status, assignment_confidence
├── suggested_client_id, suggested_project_id
├── assignment_reasoning, metadata
└── created_at, updated_at

client_meetings
├── id, client_id, meeting_id
└── created_at

contact_meeting_links
├── id, contact_id, meeting_id
└── created_at
```

### 2.2 Storage Buckets

- `meeting-recordings` (private) -- audio/video recordings

### 2.3 Frontend Routes

| Path | Page |
|------|------|
| `/meetings` | Redirects to `/meetings/transcripts` |
| `/meetings/schedule` | MeetingsSchedulePage -- all meetings list |
| `/meetings/schedule/:idOrSlug` | MeetingDetailV2Page -- tabbed detail |
| `/meetings/transcripts` | MeetingTranscriptsPage -- transcript list |
| `/meetings/transcripts/:slug` | TranscriptDetailPage -- single transcript |
| `/meetings/series` | MeetingSeriesPage -- recurring series |
| `/meetings/transcripts/ai-match` | MeetingAiMatchResultsPage |
| `/meetings/pending-assignments` | MeetingPendingAssignmentsPage |
| `/knowledge/meetings` | KnowledgeMeetingsPage -- embedded meetings |
| `/meetings/new` | MeetingForm (create) |
| `/meetings/:id/edit` | MeetingForm (edit) |

### 2.4 Key Hooks (36 total)

| Hook | Purpose |
|------|---------|
| `useMeetingsV2()` | List meetings with filters, joins |
| `useMeetingTranscript(meetingId)` | Fetch speaker turns from meeting_transcripts |
| `useMeetingTranscriptSummary(meetingId)` | Fetch AI summary |
| `useGenerateTranscriptSummary()` | Invoke summary edge function |
| `useMeetingFiles()` | Meeting files (transcripts, recordings) |
| `useMeetingAgenda()` | CRUD for agenda items |
| `useMeetingTakeaways()` | CRUD for takeaways |
| `useMeetingParticipants()` | Manage participants |
| `useMeetingActionItems()` | Extracted action items |
| `useExtractMeetingTasks()` | AI task extraction |
| `useMeetingEfficiency()` | Efficiency scoring |
| `useCalendarMeetings()` | Calendar view data |
| `useRecurringMeetings()` | Series management |
| `useMeetingSearch()` | Full-text search |
| `useSearchTranscripts()` | Cross-meeting transcript search |
| `useKnowledgeMeetings()` | Meetings with embeddings |
| `useAutoEmbedMeetings()` | Trigger batch embedding |
| `useCategorizeMeetings()` | AI categorization |
| `useMeetingAssignment()` | Entity assignment workflow |
| `useBulkProcessTranscripts()` | Batch transcript processing |
| `useClientMeetings()` | Meetings by client |
| `useDealMeetings()` | Meetings by deal |
| `useProjectMeetings()` | Meetings by project |

### 2.5 Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-meeting-summary-v2` | AI-powered transcript summary |
| `zoom-transcript-processing` | Download + parse VTT transcripts |
| `extract-meeting-tasks` | AI extract action items from transcript |
| `extract-meeting-action-items` | Parse action items |
| `categorize-meeting` | AI categorize meeting type/client |
| `auto-embed-meetings` | Batch embed meeting transcripts |
| `ai-match-meeting-client` | Match meetings to clients via AI |
| `meeting-efficiency-analyzer` | Score meeting efficiency |
| `compile-meeting-summary` | Aggregate summary |
| `sync-zoom-files` | Sync files from Zoom |
| `fetch-zoom-transcript` | Download Zoom transcript |
| `create-zoom-meeting` | Create Zoom meeting |
| `sync-google-meet` | Sync Google Meet data |
| `sync-meeting-participants` | Sync participant lists |
| `generate-recurring-meetings` | Generate series instances |
| `send-meeting-notification` | Meeting reminders |

### 2.6 Transcript Data Model

Transcripts use a **speaker-turn model**: one row per speaker turn in `meeting_transcripts`. The frontend aggregates turns by `meeting_id` to calculate speaker counts, turn counts, and full content. The `useMeetingTranscript` hook reconstructs the full text as:

```
Speaker1: text\n\nSpeaker2: text\n\n...
```

### 2.7 AI Pipeline Flow

```text
1. Zoom/Teams file synced → meeting_files row created
2. zoom-transcript-processing → parses VTT → updates transcript_text
3. auto-embed-meetings → calls generate-embeddings → embeddings table
4. generate-meeting-summary-v2 → AI summary → meetings.ai_summary
5. extract-meeting-tasks → AI action items → meeting_action_items
6. categorize-meeting → AI categorization → meeting categorization data
7. semantic-search → query embeddings for RAG retrieval
```

---

## MODULE 3: SHARED INFRASTRUCTURE

### 3.1 Embeddings System

Both modules share the `embeddings` table and `generate-embeddings` edge function.

**Embedding model**: OpenAI `text-embedding-3-small` (1536 dimensions)

**Vector search**: PostgreSQL `pgvector` extension with `ivfflat` index using cosine distance (`<=>`).

**RPC functions**: `match_embeddings()` and `match_embeddings_admin()`.

### 3.2 Cache Keys (from `src/lib/cache.ts`)

```typescript
queryKeys.knowledge.entries(filters)
queryKeys.knowledge.entry(id)
queryKeys.knowledge.categories
queryKeys.knowledge.search(query)
queryKeys.knowledge.unifiedDocuments(filters)
queryKeys.knowledge.userKnowledgeStats(userId)
queryKeys.meetings.transcript(meetingId)
// + invalidateKeys.knowledge() and invalidateKeys.meetings()
```

### 3.3 Shared Dependencies

- `@tanstack/react-query` -- data fetching
- `@supabase/supabase-js` -- database + auth + storage + functions
- `sonner` + `useToast` -- toast notifications
- `react-hook-form` + `zod` -- forms
- `shadcn/ui` -- UI components

---

## MIGRATION CHECKLIST

1. Enable `pgvector` extension: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Create all tables listed above with proper FK constraints and indexes
3. Create `tsvector` trigger for `knowledge_entries.search_vector`
4. Create `match_embeddings` and `match_embeddings_admin` RPC functions
5. Create storage buckets: `user-knowledge`, `knowledge-files`, `meeting-recordings` (all private)
6. Set RLS policies on all tables (authenticated users, author-based writes)
7. Add secrets: `OPENAI_API_KEY` (required), `GOOGLE_CLIENT_ID`/`SECRET` (optional)
8. Deploy edge functions in order: `generate-embeddings` → `semantic-search` → knowledge functions → meeting functions
9. Copy types from `src/modules/knowledge/types/` and `src/modules/meetings/types/`
10. Copy hooks from both modules' `hooks/` directories
11. Copy page components and adapt routing
12. Set up cache keys in `src/lib/cache.ts`
13. Configure cron jobs (optional): `process-embedding-queue` every 5 min, `embedding-retention-cleanup` daily
14. Test: create entry → verify embedding → semantic search → transcript upload → AI summary

