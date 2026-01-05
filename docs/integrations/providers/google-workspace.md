# Google Workspace Integration Guide

## Overview

The Google Workspace integration provides access to Google Drive, Calendar, Meet, and Google AI APIs through OAuth 2.0 authentication. This integration enables file synchronization, calendar management, and AI-powered features using Google's services.

**Provider Type**: Productivity Suite + AI Provider  
**Auth Method**: OAuth 2.0 (Google Identity)  
**API Version**: Google APIs v3  
**Status**: 🔶 Partial (Drive sync available, Calendar/Meet planned)

---

## Quick Start Checklist

Before implementing, ensure you have:

- [ ] Google Cloud Console access
- [ ] Google Workspace or personal Google account
- [ ] Control Tower Supabase project connected
- [ ] The following environment variables ready:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_API_KEY` (for non-OAuth features)

**Estimated Setup Time**: 30-45 minutes

---

## Environment Variables

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | For OAuth | OAuth 2.0 Client ID | Google Cloud Console > Credentials |
| `GOOGLE_CLIENT_SECRET` | For OAuth | OAuth 2.0 Client Secret | Google Cloud Console > Credentials |
| `GOOGLE_API_KEY` | For Drive | API key for Drive file listing | Google Cloud Console > Credentials |
| `GOOGLE_AI_API_KEY` | For Gemini | API key for AI features | Google AI Studio |

### Supabase Secrets Configuration

Add these secrets via **Supabase Dashboard > Project Settings > Edge Functions > Secrets**:

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_API_KEY=your-api-key
GOOGLE_AI_API_KEY=your-ai-api-key
```

### Related Edge Functions

| Edge Function | Purpose | Status |
|---------------|---------|--------|
| `google-drive-sync` | List files in Drive folders | ✅ Available |
| `google-drive-upload` | Upload files to Drive | 🚧 Placeholder |
| `user-knowledge-drive-sync` | Sync user's Drive to knowledge base | 🚧 Placeholder |
| `ai-chat-assistant` | AI chat (supports Gemini) | ✅ Available |
| `generate-embeddings` | Generate embeddings (supports Gemini) | ✅ Available |

### Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `user_knowledge` | Store synced Drive files | ✅ Available |
| `embeddings` | Store vector embeddings | ✅ Available |
| `organization_integrations` | Store OAuth tokens | ✅ Available |

---

## Features

### Available Services

| Service | Description | Status |
|---------|-------------|--------|
| Google Drive Sync | Sync files from Drive folders | 🔶 Partial |
| Google Drive Upload | Upload files to Drive | 🚧 Planned |
| Google Calendar | Sync calendar events | 🚧 Planned |
| Google Meet | Create and manage meetings | 🚧 Planned |
| Google AI (Gemini) | AI chat and embeddings | ✅ Available |

### Capabilities

- ✅ List files in Drive folders (API key auth)
- ✅ AI chat completions via Gemini
- ✅ Generate text embeddings via Gemini
- 🚧 Download files from Drive (requires OAuth)
- 🚧 Upload files to Drive (requires OAuth)
- 🚧 Sync calendar events
- 🚧 Create Meet meetings
- 🚧 Access user's private Drive files

---

## Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**
3. Name: "Control Tower Integration"
4. Click **Create**

### Step 2: Enable APIs

Enable the following APIs in **APIs & Services** > **Library**:

- ✅ Google Drive API
- ✅ Google Calendar API
- ✅ Generative Language API (for Gemini)
- ⚪ Google Meet API (when available)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **Internal** (for Workspace) or **External** (for testing)
3. Fill in app information:
   - **App name**: Control Tower
   - **User support email**: your-email@domain.com
   - **Authorized domains**: your-domain.com
4. Add scopes:
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/calendar.readonly
   https://www.googleapis.com/auth/calendar.events
   ```

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Application type: **Web application**
4. Name: "Control Tower OAuth"
5. Authorized redirect URIs:
   ```
   https://tjkqvbxtziheggurtvcz.supabase.co/functions/v1/oauth-callback
   http://localhost:54321/functions/v1/oauth-callback
   ```
6. Click **Create**
7. **Save Client ID and Client Secret**

### Step 5: Create API Key (for non-OAuth features)

1. Go to **Credentials** > **Create Credentials** > **API Key**
2. Click **Restrict Key**
3. Under **API restrictions**, select:
   - Google Drive API
   - Generative Language API
4. **Save API Key**

### Step 6: Configure in Control Tower

1. Navigate to **Admin** > **Integrations**
2. Find **Google Workspace** card
3. Enter your credentials or click **Connect with Google**
4. Approve the requested permissions

---

## API Reference

### Google Drive API

**Base URL**: `https://www.googleapis.com/drive/v3`

#### List Files in Folder

```http
GET /files?q='{folder_id}'+in+parents
    &key={API_KEY}
    &fields=files(id,name,mimeType,size,webViewLink,modifiedTime)
```

**Response**:
```json
{
  "files": [
    {
      "id": "1abc123...",
      "name": "Meeting Notes.docx",
      "mimeType": "application/vnd.google-apps.document",
      "size": "12345",
      "webViewLink": "https://docs.google.com/document/d/...",
      "modifiedTime": "2026-01-03T10:00:00Z"
    }
  ]
}
```

#### Download File (OAuth required)

```http
GET /files/{file_id}?alt=media
Authorization: Bearer {access_token}
```

### Google Calendar API

**Base URL**: `https://www.googleapis.com/calendar/v3`

#### List Events

```http
GET /calendars/primary/events
    ?timeMin={ISO_date}
    &maxResults=50
    &orderBy=startTime
    &singleEvents=true
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "items": [
    {
      "id": "event123",
      "summary": "Team Standup",
      "start": {
        "dateTime": "2026-01-03T10:00:00-08:00"
      },
      "end": {
        "dateTime": "2026-01-03T10:30:00-08:00"
      },
      "hangoutLink": "https://meet.google.com/abc-defg-hij"
    }
  ]
}
```

### Google AI (Gemini) API

**Base URL**: `https://generativelanguage.googleapis.com/v1`

#### Generate Content (Chat)

```http
POST /models/gemini-2.5-flash:generateContent?key={API_KEY}
Content-Type: application/json

{
  "contents": [{
    "parts": [{"text": "Summarize this meeting transcript..."}]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```

**Response**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{"text": "The meeting covered three main topics..."}]
    }
  }],
  "usageMetadata": {
    "promptTokenCount": 150,
    "candidatesTokenCount": 200,
    "totalTokenCount": 350
  }
}
```

#### Generate Embeddings

```http
POST /models/text-embedding-004:embedContent?key={API_KEY}
Content-Type: application/json

{
  "content": {
    "parts": [{"text": "Text to embed for semantic search"}]
  }
}
```

**Response**:
```json
{
  "embedding": {
    "values": [0.0123, -0.0456, 0.0789, ...]
  }
}
```

---

## Existing Edge Function Implementation

### `google-drive-sync/index.ts`

**Purpose**: List and sync files from Google Drive folders

**Location**: `supabase/functions/google-drive-sync/index.ts`

**Usage**:
```typescript
const { data } = await supabase.functions.invoke('google-drive-sync', {
  body: { 
    action: 'list-files', 
    folder_id: 'your-folder-id' 
  }
});
```

**Supported Actions**:
- `list-files`: List files in a folder (requires API key)

**Required Secrets**:
- `GOOGLE_API_KEY`

---

## Database Schema

### Current Tables (Available)

The Google integration uses existing tables:

```sql
-- user_knowledge table stores synced Drive files
-- source_type = 'google_drive'
SELECT * FROM user_knowledge 
WHERE source_type = 'google_drive';
```

### Planned Tables

```sql
-- Future: Dedicated Google Drive files table
CREATE TABLE public.google_drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  web_view_link TEXT,
  parent_folder_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Future: Google Calendar events table
CREATE TABLE public.google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_event_id TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  meet_link TEXT,
  attendees JSONB,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Testing Checklist

### API Key Authentication (Drive Listing)

- [ ] `GOOGLE_API_KEY` is configured in Supabase secrets
- [ ] `google-drive-sync` function responds to requests
- [ ] Can list files from public/shared folders
- [ ] Error handling works for invalid folder IDs
- [ ] Rate limiting is respected

### OAuth Flow (When Implemented)

- [ ] OAuth consent screen is configured
- [ ] Redirect URIs are correct in Google Cloud Console
- [ ] Token exchange works via `oauth-exchange-token`
- [ ] Token refresh works via `oauth-refresh-token`
- [ ] Can access user's private Drive files

### AI Integration (Gemini)

- [ ] `GOOGLE_AI_API_KEY` is configured
- [ ] Chat completions work via `ai-chat-assistant`
- [ ] Embeddings work via `generate-embeddings`
- [ ] Model sync includes Google models
- [ ] Usage logging captures Gemini calls

---

## Troubleshooting

### Issue: "API key not valid" error

**Cause**: API key misconfigured or not set

**Solution**: 
1. Verify `GOOGLE_API_KEY` is set in Supabase secrets
2. Check API key restrictions match enabled APIs
3. Ensure Google Drive API is enabled in Cloud Console
4. Wait 5-10 minutes for key propagation

### Issue: "Access Not Configured" error

**Cause**: Required API not enabled

**Solution**:
1. Go to Google Cloud Console > APIs & Services > Library
2. Enable the required API (Drive, Calendar, etc.)
3. Wait 5-10 minutes for propagation

### Issue: OAuth redirect fails

**Cause**: Redirect URI mismatch

**Solution**:
1. Verify redirect URI matches exactly (including protocol and path)
2. Check OAuth consent screen is published (or user is added as test user)
3. For external apps, ensure test users are added before publishing

### Issue: "Quota exceeded" error

**Cause**: API rate limits hit

**Solution**:
1. Implement exponential backoff
2. Cache API responses where possible
3. Request quota increase in Cloud Console if needed

---

## Rate Limits

### Google Drive API

| Quota | Limit |
|-------|-------|
| Queries per day | 1,000,000,000 |
| Queries per 100 seconds per user | 1,000 |
| Queries per 100 seconds | 10,000 |

### Google Calendar API

| Quota | Limit |
|-------|-------|
| Queries per day | 1,000,000 |

### Gemini API

| Tier | RPM (Requests per Minute) | TPM (Tokens per Minute) |
|------|---------------------------|-------------------------|
| Free | 15 | 1,000,000 |
| Paid | 2,000 | 4,000,000 |

---

## Security Considerations

1. **Use OAuth for user data access** - API keys only for non-sensitive operations
2. **Store secrets in Supabase vault** - Never commit credentials to code
3. **Implement proper token refresh** - Handle expired tokens gracefully
4. **Limit OAuth scopes** - Request only necessary permissions
5. **Validate file access** - Ensure users can only access their own synced files
6. **Monitor API usage** - Set up alerts for unusual activity
7. **Audit logging** - Log all API calls for security review

---

## Resources

### Official Documentation

- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google AI Studio](https://aistudio.google.com/)

### Internal References

- [Integration Hub Implementation Plan](../../INTEGRATION_HUB_IMPLEMENTATION_PLAN.md)
- [Integration API Reference](../../INTEGRATION_API_REFERENCE.md)
- [Secrets Management Guide](../../SECRETS_MANAGEMENT.md)

---

## Support

For issues with the Google integration:

1. Check this documentation
2. Review Google Cloud Console logs
3. Check Supabase Edge Function logs
4. Contact your system administrator
5. Submit a support ticket

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0
