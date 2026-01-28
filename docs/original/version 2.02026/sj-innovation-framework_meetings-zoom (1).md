# SJ Innovation Framework - Meetings & Zoom Integration Module

> **Documentation for the Meetings and Zoom integration**

**Last Updated:** January 2026

---

## 📋 Module Overview

The Meetings module provides:
- **Meetings V2**: Full meeting management with scheduling, agenda, takeaways
- **Zoom Integration**: Sync meetings, recordings, and transcripts
- **Meeting-Zoom Linking**: Connect scheduled meetings with Zoom recordings [NEW]
- **Meeting Management**: Create, view, and organize meetings
- **Transcript Processing**: Automatic transcription and parsing
- **AI Summarization**: Generate meeting summaries with AI
- **Vector Embeddings**: Semantic search across meeting content
- **Assignment System**: Assign attendees and track participation

---

## 🆕 V2 Meetings-Zoom Integration (January 2026)

### Overview

The V2 system introduces **bidirectional linking** between scheduled meetings (`meetings_v2`) and Zoom recordings (`zoom_files`), enabling:

- Link Zoom recordings to scheduled meetings
- Auto-suggest recordings based on date proximity
- View transcript directly from meeting detail
- Track which meetings have recordings

### Database Changes

```sql
-- meetings_v2 table addition
ALTER TABLE meetings_v2
ADD COLUMN zoom_file_id UUID REFERENCES zoom_files(id) ON DELETE SET NULL;

-- zoom_files table addition
ALTER TABLE zoom_files
ADD COLUMN meeting_v2_id UUID REFERENCES meetings_v2(id) ON DELETE SET NULL;
```

### New Hook: useMeetingZoomLink.ts

**Location:** `src/hooks/useMeetingZoomLink.ts`

| Function | Description |
|----------|-------------|
| `useLinkedZoomFile(meetingId)` | Fetch linked Zoom recording |
| `useSuggestedZoomMatches(meetingId)` | Find recordings near meeting date |
| `useAvailableZoomFiles()` | List all unlinked recordings |
| `useLinkMeetingToZoom()` | Link a recording to meeting |
| `useUnlinkMeetingFromZoom()` | Remove recording link |

### Suggested Match Algorithm

```typescript
// Finds Zoom recordings within ±1 day of scheduled meeting
async function fetchSuggestedMatches(meetingId: string) {
  const meeting = await getMeeting(meetingId);
  const scheduledDate = new Date(meeting.scheduled_at);

  return await supabase
    .from('zoom_files')
    .select('*')
    .is('meeting_v2_id', null)  // Only unlinked recordings
    .gte('meeting_start_time', dayBefore)
    .lte('meeting_start_time', dayAfter)
    .limit(10);
}
```

### New Component: ZoomRecordingPanel.tsx

**Location:** `src/components/meetings-v2/ZoomRecordingPanel.tsx`

Displays on Meeting Details tab:
- **Linked State**: Shows recording info, transcript link, unlink button
- **Unlinked State**: Shows suggestions, browse button, link dialog

### Usage Example

```tsx
// In MeetingDetailsTab.tsx
import { ZoomRecordingPanel } from './ZoomRecordingPanel';

function MeetingDetailsTab({ meeting }) {
  return (
    <div>
      <ZoomRecordingPanel meetingId={meeting.id} />
      {/* ... other details ... */}
    </div>
  );
}
```

### Linking Flow

1. User navigates to Meeting Detail → Details tab
2. ZoomRecordingPanel shows if any suggested recordings exist
3. Click "Link Zoom Recording" opens dialog
4. Dialog shows:
   - Suggested matches (recordings near meeting date)
   - All available (unlinked) recordings
5. Click recording to link
6. Both `meetings_v2.zoom_file_id` and `zoom_files.meeting_v2_id` updated
7. "View Transcript" button appears

---

## 🎯 Key Features

### **1. Zoom Integration**
- OAuth authentication with Zoom
- Automatic meeting sync
- Recording download and storage
- Transcript (VTT) parsing
- Attendee tracking

### **2. Meeting Management**
- Create and schedule meetings
- Link to clients/projects
- Track meeting topics and agendas
- Meeting status tracking
- Categorization and tagging

### **3. Transcription & Analysis**
- Automatic VTT transcript parsing
- Text extraction from recordings
- Speaker identification
- Timestamp preservation
- Key moment highlighting

### **4. AI Features**
- Meeting summarization
- Action item extraction
- Key decision identification
- Follow-up topic suggestions
- Sentiment analysis

### **5. Search & Discovery**
- Full-text search
- Semantic vector search
- Filter by attendee, date, client
- Topic-based search
- Meeting insights

---

## 📊 Database Schema

### **Core Tables**

#### `meetings`
Main meeting records.

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  meeting_topic TEXT,

  -- Zoom integration
  zoom_id TEXT UNIQUE,
  zoom_meeting_id TEXT,
  zoom_uuid TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  timezone TEXT DEFAULT 'UTC',

  -- Links
  client_id UUID REFERENCES clients(id),
  project_id UUID, -- If linking to projects

  -- Organizer
  organizer_id UUID REFERENCES auth.users(id),
  organizer_email TEXT,

  -- Status
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  is_recorded BOOLEAN DEFAULT false,

  -- Join URLs
  join_url TEXT,
  start_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_zoom_id ON meetings(zoom_id);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_organizer_id ON meetings(organizer_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at DESC);
```

---

#### `zoom_files`
Zoom recordings and transcripts.

```sql
CREATE TABLE zoom_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Meeting link
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  zoom_meeting_id TEXT,

  -- File info
  file_type TEXT, -- 'MP4', 'M4A', 'TRANSCRIPT', 'CHAT', etc.
  file_name TEXT,
  file_size BIGINT,
  download_url TEXT,
  play_url TEXT,

  -- Storage
  storage_path TEXT, -- Supabase storage path
  is_downloaded BOOLEAN DEFAULT false,

  -- Meeting details
  meeting_topic TEXT,
  meeting_start_time TIMESTAMPTZ,
  meeting_duration INTEGER,

  -- Transcript data
  transcript_text TEXT, -- Parsed VTT as plain text
  transcript_content JSONB, -- Full VTT structure

  -- Processing
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  has_embeddings BOOLEAN DEFAULT false,

  -- Metadata
  recording_start TEXT,
  recording_end TEXT,
  recording_type TEXT,
  status TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoom_files_meeting_id ON zoom_files(meeting_id);
CREATE INDEX idx_zoom_files_type ON zoom_files(file_type);
CREATE INDEX idx_zoom_files_processed ON zoom_files(is_processed);
```

---

#### `meeting_assignments`
Track meeting attendees and assignments.

```sql
CREATE TABLE meeting_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role TEXT DEFAULT 'attendee', -- 'organizer', 'attendee', 'optional'

  -- Status
  status TEXT DEFAULT 'invited', -- 'invited', 'accepted', 'declined', 'attended'

  -- RSVP
  responded_at TIMESTAMPTZ,

  -- Attendance tracking
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_assignments_meeting ON meeting_assignments(meeting_id);
CREATE INDEX idx_meeting_assignments_user ON meeting_assignments(user_id);
```

---

#### `meeting_transcripts`
Processed meeting transcripts (alternative storage).

```sql
CREATE TABLE meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  zoom_file_id UUID REFERENCES zoom_files(id) ON DELETE CASCADE,

  -- Content
  full_transcript TEXT NOT NULL,
  transcript_segments JSONB, -- Array of { speaker, text, timestamp }

  -- Processing
  language TEXT DEFAULT 'en',
  word_count INTEGER,
  speaker_count INTEGER,

  -- AI Analysis
  summary TEXT,
  key_topics TEXT[],
  action_items TEXT[],
  key_decisions TEXT[],
  follow_up_topics TEXT[],

  -- Embeddings
  has_embeddings BOOLEAN DEFAULT false,
  embedding_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### `meeting_categorizations`
AI-powered meeting categorization.

```sql
CREATE TABLE meeting_categorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  meeting_file_id UUID REFERENCES zoom_files(id) ON DELETE CASCADE,

  -- Categories
  primary_category TEXT,
  secondary_categories TEXT[],

  -- Metadata
  key_topics TEXT[],
  participant_count INTEGER,
  meeting_sentiment TEXT, -- 'positive', 'neutral', 'negative'

  -- Confidence scores
  category_confidence NUMERIC,
  analysis_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 Edge Functions

### **1. `sync-zoom-files`**

**Purpose:** Sync Zoom recordings and transcripts.

**Endpoint:** `POST /functions/v1/sync-zoom-files`

**Request:**
```typescript
{
  action: 'sync' | 'download';
  meeting_id?: string; // Optional: sync specific meeting
  date_from?: string; // ISO date
  date_to?: string; // ISO date
}
```

**Process:**
1. Fetch recordings from Zoom API
2. Create/update `zoom_files` records
3. Download recording files to storage
4. Parse VTT transcripts
5. Extract text content
6. Queue for embedding generation

**Response:**
```typescript
{
  success: boolean;
  synced_count: number;
  downloaded_count: number;
  errors?: string[];
}
```

---

### **2. `zoom-transcript-processing`**

**Purpose:** Process VTT transcripts into structured text.

**Endpoint:** `POST /functions/v1/zoom-transcript-processing`

**Request:**
```typescript
{
  file_id: string; // zoom_files.id
}
```

**Process:**
1. Fetch zoom_file record
2. Parse VTT format from `transcript_content.vtt`
3. Extract speaker labels and timestamps
4. Combine into full transcript
5. Update `transcript_text` field
6. Mark as processed

**Response:**
```typescript
{
  success: boolean;
  transcript_length: number;
  segments_count: number;
}
```

---

### **3. `generate-meeting-summary`**

**Purpose:** AI-powered meeting summarization.

**Endpoint:** `POST /functions/v1/generate-meeting-summary`

**Request:**
```typescript
{
  file_id: string; // zoom_files.id
}
```

**Response:**
```typescript
{
  executive_summary: string;
  key_decisions: string[];
  action_items: string[];
  follow_up_topics: string[];
  meeting_sentiment?: string;
}
```

**Uses:**
- GPT-4 or Gemini for analysis
- Structured prompt for consistent output
- Stores results in `meeting_transcripts`

---

### **4. `categorize-meeting`**

**Purpose:** Auto-categorize meetings by content.

**Endpoint:** `POST /functions/v1/categorize-meeting`

**Request:**
```typescript
{
  file_id: string;
}
```

**Response:**
```typescript
{
  primary_category: string;
  secondary_categories: string[];
  key_topics: string[];
  confidence: number;
}
```

---

### **5. `auto-embed-meetings`**

**Purpose:** Batch generate embeddings for meetings.

**Endpoint:** `POST /functions/v1/auto-embed-meetings`

**Trigger:** Scheduled (daily) or manual

**Process:**
1. Find zoom_files with `transcript_text` but `has_embeddings = false`
2. For each file:
   - Chunk transcript (800-1000 chars)
   - Generate embeddings
   - Store in `embeddings` table
   - Update `has_embeddings = true`

---

## 🪝 React Hooks

### **useMeetings**

Fetch meetings list.

```typescript
import { useMeetings } from '@/hooks/useMeetings';

const { data: meetings, isLoading } = useMeetings({
  client_id: clientId,
  status: 'completed',
  limit: 20
});
```

---

### **useZoomFiles**

Fetch Zoom recordings for a meeting.

```typescript
import { useZoomFiles } from '@/hooks/useZoomFiles';

const { data: files } = useZoomFiles(meetingId);

// Filter transcripts
const transcripts = files?.filter(f => f.file_type === 'TRANSCRIPT');
```

---

### **useMeetingSummarization**

Generate meeting summary.

```typescript
import { useMeetingSummarization } from '@/hooks/useAI';

const { generateSummary, isLoading } = useMeetingSummarization();

const summary = await generateSummary(zoomFileId);
// Returns: { executive_summary, key_decisions, action_items, ... }
```

---

### **useSyncZoom**

Trigger Zoom sync.

```typescript
import { useSyncZoom } from '@/hooks/useZoomSync';

const { mutate: syncZoom, isLoading } = useSyncZoom();

syncZoom({
  action: 'sync',
  date_from: '2025-01-01',
  date_to: '2025-01-31'
});
```

---

### **useMeetingAssignments**

Manage meeting attendees.

```typescript
import { useMeetingAssignments } from '@/hooks/useMeetingAssignments';

const { data: attendees } = useMeetingAssignments(meetingId);

// Add attendee
const { mutate: assignAttendee } = useAssignMeetingAttendee();
assignAttendee({ meeting_id: meetingId, user_id: userId, role: 'attendee' });
```

---

## 🎨 UI Components

### **Meetings List Page**

**Location:** `/src/pages/meetings/Meetings.tsx`

**Features:**
- Table view with filters
- Search by topic, attendee, client
- Date range picker
- Status filter (scheduled, completed, cancelled)
- Quick actions (view, summarize, download)

---

### **Meeting Detail Page**

**Location:** `/src/pages/meetings/MeetingDetail.tsx`

**Sections:**
- Meeting info (title, time, duration, organizer)
- Attendees list
- Recordings & transcripts
- AI-generated summary
- Action items
- Related meetings

---

### **Meeting Summary Component**

**Location:** `/src/components/meetings/MeetingSummary.tsx`

**Props:**
```typescript
interface MeetingSummaryProps {
  meetingId: string;
  zoomFileId?: string;
}
```

**Features:**
- Executive summary display
- Key decisions list
- Action items with checkboxes
- Follow-up topics
- Regenerate summary button

---

### **Zoom File List**

**Location:** `/src/components/meetings/ZoomFileList.tsx`

**Features:**
- List recordings/transcripts
- Download button
- View transcript button
- Processing status
- File size and duration

---

### **Transcript Viewer**

**Location:** `/src/components/meetings/TranscriptViewer.tsx`

**Features:**
- Scrollable transcript view
- Timestamp display
- Speaker labels
- Search within transcript
- Export as PDF/TXT

---

## 📈 Best Practices

### **1. Zoom API Integration**

**OAuth Setup:**
```typescript
// Zoom OAuth credentials
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
ZOOM_ACCOUNT_ID=your_account_id
```

**Required Scopes:**
- `meeting:read:admin`
- `recording:read:admin`
- `user:read:admin`

**API Rate Limits:**
- 10 requests/second
- Implement exponential backoff
- Cache recordings list

---

### **2. Transcript Processing**

**VTT Parsing:**
```typescript
// Parse VTT format
const parseVTT = (vttContent: string) => {
  const lines = vttContent.split('\n');
  const segments = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      const timestamp = lines[i];
      const text = lines[i + 1];
      segments.push({ timestamp, text });
    }
  }

  return segments;
};
```

**Text Extraction:**
- Remove timestamps
- Combine speaker segments
- Preserve paragraph breaks
- Handle special characters

---

### **3. Storage Management**

**File Storage:**
- Store recordings in Supabase Storage bucket `zoom-recordings`
- Path structure: `{meeting_id}/{file_type}/{file_name}`
- Set expiration policy (auto-delete after 90 days)
- Compress large files before storage

**Cleanup:**
```sql
-- Delete old recordings
DELETE FROM zoom_files
WHERE created_at < NOW() - INTERVAL '90 days'
  AND file_type = 'MP4';
```

---

### **4. Embedding Generation**

**Best Practices:**
- ✅ Chunk transcripts at 800-1000 characters
- ✅ Include meeting metadata (topic, date, attendees)
- ✅ Enrich with context (client name, project name)
- ✅ Process in batches (10-20 meetings at once)
- ❌ Don't embed very short meetings (< 5 min)
- ❌ Don't generate duplicates (check `has_embeddings`)

---

## 💰 Cost Estimation

### **Zoom API**
- **Free tier:** 100 participants, 40 min limit
- **Pro:** $14.99/month per license
- **Business:** $19.99/month per license
- **Recording storage:** Unlimited (cloud recordings)

### **Supabase Storage**
- **Recordings:** ~100 MB per hour of video
- **Transcripts:** ~10 KB per hour of text
- **Example:** 50 meetings/month × 1 hour avg = 5 GB/month

### **AI Costs**

**Summarization (GPT-4):**
- Input: 5000 tokens (1-hour transcript)
- Output: 500 tokens (summary)
- Cost per meeting: ~$0.02

**Embeddings (OpenAI):**
- 5000 tokens per meeting
- Cost: ~$0.0001 per meeting

---

## 🔒 Security

### **RLS Policies**

```sql
-- Meetings
CREATE POLICY "Users can view meetings they're invited to"
  ON meetings FOR SELECT
  USING (
    auth.uid() = organizer_id
    OR EXISTS (
      SELECT 1 FROM meeting_assignments
      WHERE meeting_id = meetings.id
        AND user_id = auth.uid()
    )
  );

-- Zoom files
CREATE POLICY "Users can view files from their meetings"
  ON zoom_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = zoom_files.meeting_id
        AND (
          m.organizer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM meeting_assignments ma
            WHERE ma.meeting_id = m.id
              AND ma.user_id = auth.uid()
          )
        )
    )
  );
```

---

### **Zoom OAuth Token Storage**

```sql
CREATE TABLE user_zoom_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_zoom_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON user_zoom_tokens
  USING (auth.uid() = user_id);
```

---

## 🚀 Quick Start

### **1. Configure Zoom OAuth**

In Supabase dashboard → Edge Functions, set secrets:
```bash
supabase secrets set ZOOM_CLIENT_ID=your_client_id
supabase secrets set ZOOM_CLIENT_SECRET=your_client_secret
supabase secrets set ZOOM_ACCOUNT_ID=your_account_id
```

---

### **2. Sync Zoom Meetings**

```typescript
const { data } = await supabase.functions.invoke('sync-zoom-files', {
  body: {
    action: 'sync',
    date_from: '2025-01-01',
    date_to: '2025-01-31'
  }
});
```

---

### **3. Generate Meeting Summary**

```typescript
const { data: summary } = await supabase.functions.invoke('generate-meeting-summary', {
  body: {
    file_id: zoomFileId
  }
});

console.log(summary.executive_summary);
console.log(summary.action_items);
```

---

### **4. Search Meeting Transcripts**

```typescript
const { data: results } = await supabase.functions.invoke('semantic-search', {
  body: {
    query: "budget discussion",
    entity_type: "meeting_transcript",
    match_threshold: 0.7
  }
});
```

---

## 📚 Additional Resources

- [ASSIGNMENT-SYSTEM.md](../02-modules/meetings/ASSIGNMENT-SYSTEM.md) - Assignment system details
- [VECTOR-DB-PLAN.md](../02-modules/meetings/VECTOR-DB-PLAN.md) - Vector DB implementation
- [EDGE-FUNCTIONS-SYNC.md](../03-development/EDGE-FUNCTIONS-SYNC.md) - Sync guide

---

## 🐛 Troubleshooting

### **Zoom Sync Fails**

**Solutions:**
1. Verify OAuth credentials in Edge Function secrets
2. Check token expiration: `SELECT * FROM user_zoom_tokens WHERE user_id = auth.uid()`
3. Review Zoom API rate limits
4. Check meeting date range (Zoom retains recordings for limited time)

---

### **Transcript Not Available**

**Solutions:**
1. Verify recording has completed processing in Zoom
2. Check `transcript_content` field: `SELECT transcript_content FROM zoom_files WHERE id = '...'`
3. Manually trigger transcript processing
4. Ensure VTT file was downloaded from Zoom

---

### **Meeting Summary Generation Fails**

**Solutions:**
1. Check if transcript exists: `SELECT transcript_text FROM zoom_files WHERE id = '...'`
2. Verify OpenAI API key in Edge Function secrets
3. Review error in `ai_agent_runs` table
4. Check transcript length (too short or too long)

---

**Last Updated:** 2025-12-25
**Version:** 1.0.0
**Module:** Meetings & Zoom Integration
