# Integration Documentation

This directory contains detailed implementation guides for all supported third-party integrations in Control Tower.

---

## Available Integrations

| Provider | Category | Status | Documentation |
|----------|----------|--------|---------------|
| Zoom | Meetings | ✅ Available | [zoom.md](./providers/zoom.md) |
| Microsoft Teams | Meetings + Productivity | 🚧 Coming Soon | [microsoft-teams.md](./providers/microsoft-teams.md) |
| Google Workspace | Productivity + AI | 🔶 Partial | [google-workspace.md](./providers/google-workspace.md) |

---

## Integration Categories

### Meeting Providers

| Provider | Features | Status |
|----------|----------|--------|
| **Zoom** | Meetings, recordings, transcripts, webhooks | ✅ Full support |
| **Microsoft Teams** | Meetings, calendar, call records | 🚧 Planned |
| **Google Meet** | Meetings via Google Workspace | 🚧 Planned |

### Productivity Suites

| Provider | Features | Status |
|----------|----------|--------|
| **Google Drive** | File sync, storage | 🔶 Partial |
| **Microsoft 365** | Calendar, OneDrive | 🚧 Planned |

### AI Providers

| Provider | Features | Status |
|----------|----------|--------|
| **OpenAI** | Chat (GPT-4), embeddings | ✅ Available |
| **Anthropic** | Chat (Claude) | ✅ Available |
| **Google Gemini** | Chat, embeddings | ✅ Available |
| **Perplexity** | Search | ✅ Available |

---

## Quick Reference

### Required Environment Variables by Provider

| Provider | Variables | Notes |
|----------|-----------|-------|
| **Zoom** | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` | Server-to-Server OAuth |
| **Microsoft** | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Azure AD App Registration |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_KEY` | Cloud Console credentials |
| **OpenAI** | `OPENAI_API_KEY` | Already configured ✅ |

### Edge Functions by Provider

| Provider | Edge Functions |
|----------|----------------|
| **Zoom** | `sync-zoom-files`, `zoom-transcript-processing`, `generate-meeting-summary` |
| **Microsoft** | `oauth-exchange-token`, `oauth-refresh-token` (shared) |
| **Google** | `google-drive-sync`, `google-drive-upload`, `user-knowledge-drive-sync` |
| **AI** | `ai-chat-assistant`, `generate-embeddings`, `run-ai-agent` |

### Feature Flags

Enable/disable integrations via **Admin > System Settings**:

| Setting Path | Integration | Default |
|--------------|-------------|---------|
| `features.enableZoomSync` | Zoom recordings sync | `true` |
| `features.enableGoogleDrive` | Google Drive sync | `false` |
| `features.enableAIChat` | AI Chat assistant | `true` |

---

## Documentation Template

When adding a new integration, follow this standardized structure:

```markdown
# {Provider} Integration Guide

## Overview
- Provider Type, Auth Method, API Version, Status

## Quick Start Checklist
- Prerequisites and estimated setup time

## Environment Variables
- Required secrets with descriptions

## Features
- Available services and capabilities

## Setup Instructions
- Step-by-step configuration guide

## API Reference
- Key endpoints with examples

## Webhooks (if applicable)
- Event types and payload examples

## Edge Function Implementation
- Existing functions and usage

## Database Schema
- Related tables and migrations

## Testing Checklist
- Verification steps

## Troubleshooting
- Common issues and solutions

## Rate Limits
- API quotas and limits

## Security Considerations
- Best practices

## Resources
- Links to official documentation
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Control Tower                             │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)                                                │
│  ├── Admin > Integrations Page                                   │
│  ├── useIntegrations hook                                        │
│  └── ProviderCard components                                     │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions (Deno)                                           │
│  ├── oauth-exchange-token    ← OAuth flow                        │
│  ├── oauth-refresh-token     ← Token refresh                     │
│  ├── sync-zoom-files         ← Zoom sync                         │
│  ├── google-drive-sync       ← Drive sync                        │
│  └── ai-chat-assistant       ← AI providers                      │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                           │
│  ├── integration_providers   ← Provider definitions              │
│  ├── integration_categories  ← Category groupings                │
│  ├── integration_fields      ← Config field schemas              │
│  ├── organization_integrations ← User configurations             │
│  └── integration_usage_logs  ← Usage tracking                    │
├─────────────────────────────────────────────────────────────────┤
│  External APIs                                                   │
│  ├── Zoom API (api.zoom.us)                                     │
│  ├── Microsoft Graph (graph.microsoft.com)                      │
│  ├── Google APIs (googleapis.com)                               │
│  └── AI APIs (OpenAI, Anthropic, etc.)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Adding New Integrations

### Step 1: Database Setup

1. Add provider to `integration_providers` table
2. Add category if new to `integration_categories`
3. Define config fields in `integration_fields`
4. Add services to `integration_services`

### Step 2: Edge Functions

1. Create OAuth flow (if applicable) or use shared functions
2. Create sync/API wrapper function
3. Add webhook handler (if applicable)
4. Add required secrets to Supabase

### Step 3: Frontend

1. Update `useIntegrations` hook if needed
2. Create provider-specific configuration UI
3. Add to admin integrations page

### Step 4: Documentation

1. Create `docs/integrations/providers/{provider}.md`
2. Follow the documentation template above
3. Update this README with the new provider

---

## Related Documentation

- [Integration Hub Implementation Plan](../INTEGRATION_HUB_IMPLEMENTATION_PLAN.md)
- [Integration API Reference](../INTEGRATION_API_REFERENCE.md)
- [Integration Data Flows](../INTEGRATION_DATA_FLOWS.md)
- [Integration User Guide](../INTEGRATION_USER_GUIDE.md)
- [Secrets Management](../SECRETS_MANAGEMENT.md)

---

## Support

For integration issues:

1. Check the specific provider documentation
2. Review Supabase Edge Function logs
3. Verify environment variables are set
4. Check API rate limits and quotas
5. Contact your system administrator

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0
