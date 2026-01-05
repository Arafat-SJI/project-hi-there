# Google Integration Overview

![Status](https://img.shields.io/badge/Status-Partial-yellow)
![Auth](https://img.shields.io/badge/Auth-OAuth%202.0-blue)

## Overview

The Google integration provides access to Google Workspace services, Google AI, and Google Authentication through OAuth 2.0 and API key authentication.

## Available Services

| Service | Documentation | Status | Priority |
|---------|---------------|--------|----------|
| Google Login | [google-login.md](./google-login.md) | Available | High |
| Google AI (Gemini) | [google-ai.md](./google-ai.md) | Available | High |
| Google Drive | [google-drive.md](./google-drive.md) | Partial | High |
| Google Calendar | [google-calendar.md](./google-calendar.md) | Planned | Medium |
| Google Meet | [google-meet.md](./google-meet.md) | Planned | Medium |

## Quick Start

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable required APIs (see individual service docs)
4. Create OAuth 2.0 credentials and/or API keys

### 2. Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth (Drive, Calendar, Meet, Login) | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth (Drive, Calendar, Meet, Login) | OAuth 2.0 Client Secret |
| `GOOGLE_API_KEY` | Drive (public) | API key for Drive listing |
| `GOOGLE_AI_API_KEY` | Gemini | API key for AI features |

### 3. Add to Supabase Secrets

```bash
# Via Supabase Dashboard > Project Settings > Edge Functions > Secrets
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_API_KEY=your-api-key
GOOGLE_AI_API_KEY=your-ai-api-key
```

## Integration Hub Configuration

All Google services can be configured through the **Admin > Integration Hub**:

| Provider | Category | Auth Type | Configure Via |
|----------|----------|-----------|---------------|
| Google Login | Authentication | OAuth 2.0 | Admin > Integrations |
| Google Gemini | AI Providers | API Key | Admin > Integrations |
| Google Workspace | Storage & Productivity | OAuth 2.0 | Admin > Integrations |
| Google Meet | Meeting Providers | OAuth 2.0 | Admin > Integrations |

## Edge Functions

| Function | Service | Purpose |
|----------|---------|---------|
| `oauth-exchange-token` | All OAuth | Exchange auth code for tokens |
| `oauth-refresh-token` | All OAuth | Refresh expired tokens |
| `google-drive-sync` | Drive | List and sync files |
| `google-drive-upload` | Drive | Upload files (needs OAuth) |
| `user-knowledge-drive-sync` | Drive | Sync to knowledge base |
| `ai-chat-assistant` | Gemini | AI chat completions |
| `generate-embeddings` | Gemini | Text embeddings |

## OAuth Scopes

When implementing OAuth, request only necessary scopes:

```
# Authentication (Google Login)
openid
email
profile

# Drive (read-only)
https://www.googleapis.com/auth/drive.readonly

# Drive (read-write)
https://www.googleapis.com/auth/drive.file

# Calendar (read-only)
https://www.googleapis.com/auth/calendar.readonly

# Calendar (read-write)
https://www.googleapis.com/auth/calendar.events

# Meet
https://www.googleapis.com/auth/meetings.space.created
```

## Frontend Integration

### Check Provider Status

```tsx
import { useOrganizationIntegration } from '@/hooks/useIntegrations';

function MyComponent() {
  // Check Google Login status
  const { data: googleLogin } = useOrganizationIntegration('google-login');

  // Check Google AI status
  const { data: googleAI } = useOrganizationIntegration('google-gemini');

  // Check Google Workspace status
  const { data: googleWorkspace } = useOrganizationIntegration('google-workspace');

  const isGoogleLoginEnabled = googleLogin?.connection_status === 'connected';
  const isGeminiEnabled = googleAI?.connection_status === 'connected';
  // ...
}
```

### Configure Provider

```tsx
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();

  const configureGoogleLogin = () => {
    navigate('/admin/integrations/google-login');
  };

  const configureGemini = () => {
    navigate('/admin/integrations/google-gemini');
  };
  // ...
}
```

## Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google APIs Explorer](https://developers.google.com/apis-explorer)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google AI Studio](https://aistudio.google.com/)
- [Google Identity Platform](https://developers.google.com/identity)

---

**Last Updated**: January 5, 2026
