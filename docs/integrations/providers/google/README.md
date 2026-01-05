# Google Integration Overview

![Status](https://img.shields.io/badge/Status-Partial-yellow)
![Auth](https://img.shields.io/badge/Auth-OAuth%202.0-blue)

## Overview

The Google integration provides access to Google Workspace services and Google AI through OAuth 2.0 authentication.

## Available Services

| Service | Documentation | Status | Priority |
|---------|---------------|--------|----------|
| Google Drive | [google-drive.md](./google-drive.md) | Partial | High |
| Google Calendar | [google-calendar.md](./google-calendar.md) | Planned | Medium |
| Google Meet | [google-meet.md](./google-meet.md) | Planned | Medium |
| Google AI (Gemini) | [google-ai.md](./google-ai.md) | Available | High |

## Quick Start

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable required APIs (see individual service docs)
4. Create OAuth 2.0 credentials

### 2. Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth | OAuth 2.0 Client Secret |
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

## Edge Functions

| Function | Service | Purpose |
|----------|---------|---------|
| `google-drive-sync` | Drive | List and sync files |
| `google-drive-upload` | Drive | Upload files (needs OAuth) |
| `user-knowledge-drive-sync` | Drive | Sync to knowledge base |
| `ai-chat-assistant` | Gemini | AI chat completions |
| `generate-embeddings` | Gemini | Text embeddings |

## OAuth Scopes

When implementing OAuth, request only necessary scopes:

```
# Drive (read-only)
https://www.googleapis.com/auth/drive.readonly

# Drive (read-write)
https://www.googleapis.com/auth/drive.file

# Calendar (read-only)
https://www.googleapis.com/auth/calendar.readonly

# Calendar (read-write)
https://www.googleapis.com/auth/calendar.events
```

## Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google APIs Explorer](https://developers.google.com/apis-explorer)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

**Last Updated**: January 5, 2026
