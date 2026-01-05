# Microsoft Teams Integration Guide

## Overview

The Microsoft Teams integration leverages the Microsoft Graph API to enable meeting management, calendar synchronization, and collaboration features. This integration provides comprehensive access to Teams meetings, chat, and file storage.

**Provider Type**: Meeting Provider + Productivity Suite  
**Auth Method**: OAuth 2.0 (Microsoft Identity Platform)  
**API Version**: Microsoft Graph v1.0  
**Status**: 🚧 Coming Soon

---

## Quick Start Checklist

Before implementing, ensure you have:

- [ ] Azure Portal access with admin rights
- [ ] Microsoft 365 subscription (Business Basic or higher)
- [ ] Control Tower Supabase project connected
- [ ] The following environment variables ready:
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_TENANT_ID`

**Estimated Setup Time**: 30-45 minutes

---

## Environment Variables

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `MICROSOFT_CLIENT_ID` | Yes | Application (client) ID | Azure Portal > App registrations |
| `MICROSOFT_CLIENT_SECRET` | Yes | Client secret value | Azure Portal > Certificates & secrets |
| `MICROSOFT_TENANT_ID` | Yes | Directory (tenant) ID | Azure Portal > App registrations |

### Supabase Secrets Configuration

Add these secrets via **Supabase Dashboard > Project Settings > Edge Functions > Secrets**:

```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id
```

### Related Edge Functions

| Edge Function | Purpose | Status |
|---------------|---------|--------|
| `oauth-exchange-token` | Handles OAuth token exchange | ✅ Available |
| `oauth-refresh-token` | Refreshes expired tokens | ✅ Available |
| `microsoft-teams-sync` | Sync Teams meetings (to be created) | 🚧 Planned |
| `microsoft-webhook` | Handle Microsoft Graph webhooks | 🚧 Planned |

### Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `teams_meetings` | Store Teams meeting data | 🚧 Planned |
| `teams_call_records` | Store call records | 🚧 Planned |
| `organization_integrations` | Store OAuth tokens | ✅ Available |

---

## Features

### Available Services

| Service | Description | Status |
|---------|-------------|--------|
| Online Meetings | Create and manage Teams meetings | 🚧 Planned |
| Calendar Sync | Sync Outlook calendar events | 🚧 Planned |
| Meeting Recordings | Access and download meeting recordings | 🚧 Planned |
| Call Records | Access call history and analytics | 🚧 Planned |
| Chat Messages | Read and send Teams chat messages | 🚧 Planned |
| Channel Management | Manage Teams channels | 🚧 Planned |

### Capabilities

- ✅ Create online meetings via Graph API
- ✅ List user meetings and events
- ✅ Access call records and transcripts
- ✅ Download meeting recordings
- ✅ Send/receive chat messages
- ✅ Manage Teams and channels
- ✅ File sharing via OneDrive/SharePoint
- ✅ Webhooks via Graph subscriptions

---

## Setup Instructions

### Step 1: Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in application details:
   - **Name**: Control Tower Integration
   - **Supported account types**: Accounts in this organizational directory only (Single tenant)
   - **Redirect URI**: Web - `https://your-domain.com/api/oauth-callback`

5. Click **Register**

### Step 2: Configure API Permissions

Add the following **Delegated permissions** (for user context):

**Microsoft Graph**:
- `OnlineMeetings.ReadWrite` - Create and manage online meetings
- `Calendars.ReadWrite` - Read and write calendars
- `CallRecords.Read.All` - Read call records
- `CallRecording.Read.All` - Read call recordings
- `Chat.ReadWrite` - Read and write chats
- `Team.ReadBasic.All` - Read team information
- `Channel.ReadBasic.All` - Read channel information
- `Files.ReadWrite.All` - Read and write files
- `User.Read` - Sign in and read user profile

**Application permissions** (for background services):
- `OnlineMeetings.Read.All` - Read all online meetings
- `CallRecords.Read.All` - Read all call records
- `Calendars.Read` - Read calendars in all mailboxes

**Important**: Click **Grant admin consent** for your organization after adding permissions.

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add description: "Control Tower Integration Secret"
4. Select expiration: 24 months
5. Click **Add**
6. **Copy the secret value immediately** (it won't be shown again)

### Step 4: Note Application Details

You'll need these values:
- **Application (client) ID**: `{CLIENT_ID}`
- **Directory (tenant) ID**: `{TENANT_ID}`
- **Client Secret**: `{CLIENT_SECRET}`

### Step 5: Configure in Control Tower

1. Navigate to **Admin** > **Integrations**
2. Find **Microsoft Teams** card
3. Click **Connect**
4. You'll be redirected to Microsoft's login page
5. Sign in with your Microsoft 365 account
6. Approve the requested permissions
7. You'll be redirected back to Control Tower

---

## API Reference

### Base URL
```
https://graph.microsoft.com/v1.0
```

### Authentication

Microsoft Graph uses OAuth 2.0 Bearer tokens.

**Authorization Endpoint**:
```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
```

**Token Endpoint**:
```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
```

**Authorization URL Example**:
```
https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
  client_id={CLIENT_ID}&
  response_type=code&
  redirect_uri=https://your-domain.com/api/oauth-callback&
  response_mode=query&
  scope=https://graph.microsoft.com/OnlineMeetings.ReadWrite
        https://graph.microsoft.com/Calendars.ReadWrite
        https://graph.microsoft.com/User.Read
        offline_access&
  state={RANDOM_STATE}
```

**Token Exchange**:
```http
POST /oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id={CLIENT_ID}&
client_secret={CLIENT_SECRET}&
code={AUTHORIZATION_CODE}&
redirect_uri=https://your-domain.com/api/oauth-callback&
scope=https://graph.microsoft.com/OnlineMeetings.ReadWrite
```

**Token Response**:
```json
{
  "token_type": "Bearer",
  "scope": "https://graph.microsoft.com/OnlineMeetings.ReadWrite ...",
  "expires_in": 3600,
  "access_token": "eyJ0eXAi...",
  "refresh_token": "AwABAAAAv...",
  "id_token": "eyJ0eXAi..."
}
```

### Key API Endpoints

#### 1. Get Current User
```http
GET /me
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd",
  "displayName": "John Doe",
  "mail": "john@company.com",
  "userPrincipalName": "john@company.onmicrosoft.com",
  "officeLocation": "San Francisco",
  "jobTitle": "Software Engineer"
}
```

#### 2. Create Online Meeting
```http
POST /me/onlineMeetings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "startDateTime": "2026-01-03T10:00:00Z",
  "endDateTime": "2026-01-03T11:00:00Z",
  "subject": "Team Standup"
}
```

**Response**:
```json
{
  "id": "MSo1N2Y5ZGFjYy03MWJmLTQ3NDMtYjQxMy01M2EdFGkdRWHJlQ",
  "creationDateTime": "2026-01-02T18:00:00Z",
  "startDateTime": "2026-01-03T10:00:00Z",
  "endDateTime": "2026-01-03T11:00:00Z",
  "subject": "Team Standup",
  "joinUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "joinWebUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "videoTeleconferenceId": "123456789",
  "participants": {
    "organizer": {
      "upn": "john@company.com",
      "identity": {
        "user": {
          "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd",
          "displayName": "John Doe"
        }
      }
    }
  }
}
```

#### 3. List Calendar Events
```http
GET /me/calendar/events?$select=subject,start,end,onlineMeeting&$top=50
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "value": [
    {
      "id": "AAMkAGI2TG...",
      "subject": "Team Standup",
      "start": {
        "dateTime": "2026-01-03T10:00:00.0000000",
        "timeZone": "Pacific Standard Time"
      },
      "end": {
        "dateTime": "2026-01-03T11:00:00.0000000",
        "timeZone": "Pacific Standard Time"
      },
      "onlineMeeting": {
        "joinUrl": "https://teams.microsoft.com/l/meetup-join/..."
      }
    }
  ]
}
```

#### 4. Get Call Records
```http
GET /communications/callRecords/{id}
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "id": "af...d3",
  "version": 1,
  "type": "groupCall",
  "modalities": ["audio", "video", "screenSharing"],
  "lastModifiedDateTime": "2026-01-03T11:00:00Z",
  "startDateTime": "2026-01-03T10:00:00Z",
  "endDateTime": "2026-01-03T11:00:00Z",
  "joinWebUrl": "https://teams.microsoft.com/l/meetup-join/...",
  "organizer": {
    "user": {
      "id": "87d349ed-44d7-43e1-9a83-5f2406dee5bd",
      "displayName": "John Doe"
    }
  },
  "participants": [
    {
      "user": {
        "id": "...",
        "displayName": "Jane Smith"
      }
    }
  ],
  "sessions": [...]
}
```

#### 5. List Call Recordings
```http
GET /communications/callRecords/{id}/recordings
Authorization: Bearer {access_token}
```

**Note**: This endpoint is currently in beta. Access requires special permissions.

**Response**:
```json
{
  "value": [
    {
      "id": "recording-id",
      "createdDateTime": "2026-01-03T10:05:00Z",
      "recordingContentUrl": "https://...",
      "meetingId": "MSo1N2Y5ZGFjYy03MWJmLTQ3NDMtYjQxMy01M2EdFGkdRWHJlQ"
    }
  ]
}
```

---

## Change Notifications (Webhooks)

Microsoft Graph supports change notifications via subscriptions.

### Create Subscription

```http
POST /subscriptions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "changeType": "created,updated",
  "notificationUrl": "https://your-domain.com/api/webhooks/microsoft",
  "resource": "/me/onlineMeetings",
  "expirationDateTime": "2026-01-04T18:00:00Z",
  "clientState": "your-secret-state"
}
```

**Supported Resources**:
- `/me/onlineMeetings` - Online meetings
- `/me/events` - Calendar events
- `/communications/callRecords` - Call records
- `/me/messages` - Chat messages
- `/teams/{id}/channels/{id}/messages` - Channel messages

### Webhook Validation

Microsoft Graph validates your webhook endpoint:

**Validation Request**:
```http
POST /api/webhooks/microsoft?validationToken={token}
```

**Expected Response**:
```http
HTTP/1.1 200 OK
Content-Type: text/plain

{validation_token}
```

### Webhook Payload

```json
{
  "value": [
    {
      "subscriptionId": "subscription-id",
      "clientState": "your-secret-state",
      "changeType": "created",
      "resource": "me/onlineMeetings('MSo1N2Y5...')",
      "resourceData": {
        "@odata.type": "#microsoft.graph.onlineMeeting",
        "@odata.id": "me/onlineMeetings('MSo1N2Y5...')",
        "id": "MSo1N2Y5..."
      },
      "subscriptionExpirationDateTime": "2026-01-04T18:00:00Z",
      "tenantId": "tenant-id"
    }
  ]
}
```

---

## Integration Services Configuration

### Service 1: Online Meetings

**Configuration Options**:
```typescript
{
  enabled: boolean;
  auto_create_from_calendar: boolean;
  default_duration_minutes: number;
  enable_recording: boolean;
  enable_transcription: boolean;
  lobby_bypass_settings: {
    scope: 'everyone' | 'organization' | 'organizer';
    isDialInBypassEnabled: boolean;
  };
}
```

### Service 2: Calendar Sync

**Configuration Options**:
```typescript
{
  enabled: boolean;
  sync_direction: 'to_control_tower' | 'from_control_tower' | 'bidirectional';
  sync_frequency: '5min' | '15min' | '30min' | '1hour';
  auto_add_teams_link: boolean;
  calendar_filter: {
    include_private: boolean;
    organizer_only: boolean;
  };
}
```

### Service 3: Call Records

**Configuration Options**:
```typescript
{
  enabled: boolean;
  store_call_logs: boolean;
  include_session_details: boolean;
  include_participant_data: boolean;
  retention_days: number;
}
```

### Service 4: Meeting Recordings

**Configuration Options**:
```typescript
{
  enabled: boolean;
  auto_download: boolean;
  storage_location: 'database' | 's3' | 'onedrive';
  download_transcripts: boolean;
  retention_days: number;
}
```

---

## Database Schema

### Table: `teams_meetings`

```sql
CREATE TABLE public.teams_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teams_meeting_id TEXT NOT NULL UNIQUE,
  subject TEXT,
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  join_url TEXT,
  video_teleconference_id TEXT,
  organizer_id TEXT,
  organizer_email TEXT,
  participants JSONB,
  recording_enabled BOOLEAN DEFAULT false,
  transcription_enabled BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teams_meetings_id ON public.teams_meetings(teams_meeting_id);
CREATE INDEX idx_teams_meetings_organizer ON public.teams_meetings(organizer_id);
CREATE INDEX idx_teams_meetings_start ON public.teams_meetings(start_datetime);
```

### Table: `teams_call_records`

```sql
CREATE TABLE public.teams_call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_record_id TEXT NOT NULL UNIQUE,
  meeting_id UUID REFERENCES public.teams_meetings(id) ON DELETE CASCADE,
  call_type TEXT,
  modalities TEXT[],
  start_datetime TIMESTAMPTZ,
  end_datetime TIMESTAMPTZ,
  duration_seconds INTEGER,
  participants JSONB,
  sessions JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_teams_call_records_id ON public.teams_call_records(call_record_id);
CREATE INDEX idx_teams_call_records_meeting ON public.teams_call_records(meeting_id);
```

---

## Edge Function Implementation

### `microsoft-oauth/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MICROSOFT_AUTHORIZE_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      MICROSOFT_TOKEN_URL.replace('{tenant}', Deno.env.get('MICROSOFT_TENANT_ID') ?? ''),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET') ?? '',
          code,
          redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/microsoft-oauth`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }

    const tokens = await tokenResponse.json();

    // Store tokens in organization_integrations
    // ... (implement database storage)

    // Redirect back to integration page
    return Response.redirect(
      `${Deno.env.get('FRONTEND_URL')}/admin/integrations/microsoft-teams?success=true`,
      302
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Testing Checklist

### OAuth Flow
- [ ] Authorization URL is correct
- [ ] User can sign in to Microsoft account
- [ ] Consent screen displays all permissions
- [ ] Authorization code is received
- [ ] Tokens are exchanged successfully
- [ ] Tokens are stored securely
- [ ] Refresh token works

### API Calls
- [ ] Can get current user
- [ ] Can create online meeting
- [ ] Can list calendar events
- [ ] Can access call records
- [ ] Can list recordings
- [ ] Rate limits are handled
- [ ] Token refresh works automatically

### Webhooks
- [ ] Subscription is created successfully
- [ ] Validation request is handled
- [ ] Change notifications are received
- [ ] Notification payload is parsed
- [ ] Database is updated
- [ ] Subscription renewal works

---

## Troubleshooting

### Issue: "AADSTS65001: The user or administrator has not consented"

**Solution**: Go to Azure Portal > App registrations > API permissions and click "Grant admin consent"

### Issue: "AADSTS50011: The redirect URI specified in the request does not match"

**Solution**: Ensure redirect URI in code matches exactly with Azure app registration (including trailing slash)

### Issue: Token refresh fails

**Solution**: Ensure `offline_access` scope is included in initial authorization request

### Issue: "Forbidden" when accessing call records

**Solution**: Verify application has `CallRecords.Read.All` permission and admin consent is granted

---

## Rate Limits

Microsoft Graph rate limits:
- **Per-app**: 2,000 requests per second per tenant
- **Per-user**: Varies by endpoint
  - Most endpoints: 10,000 requests/10 minutes
  - OnlineMeetings: 500 requests/10 minutes
  - CallRecords: 1,500 requests/10 minutes

**Throttling Response**:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 120
```

**Best Practices**:
- Implement retry logic with exponential backoff
- Use batching for multiple requests
- Use change notifications instead of polling
- Monitor throttling headers

---

## Security Considerations

1. **Use minimum required permissions** (principle of least privilege)
2. **Implement proper token storage** with encryption
3. **Rotate client secrets** regularly (every 6-12 months)
4. **Use certificate-based authentication** for production
5. **Implement webhook signature validation**
6. **Use HTTPS** for all endpoints
7. **Monitor audit logs** in Azure AD
8. **Implement proper error handling** (don't expose sensitive details)

---

## Resources

- [Microsoft Graph Documentation](https://learn.microsoft.com/en-us/graph/overview)
- [Microsoft Identity Platform](https://learn.microsoft.com/en-us/azure/active-directory/develop/)
- [Graph API Reference](https://learn.microsoft.com/en-us/graph/api/overview)
- [Change Notifications](https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks)
- [Best Practices](https://learn.microsoft.com/en-us/graph/best-practices-concept)

---

**Last Updated**: January 2, 2026
