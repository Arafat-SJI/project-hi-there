# Integrations

Connect CollabAi to external services for enhanced functionality.

---

## Available Integrations

### Communication & Meetings
| Provider | Features | Status |
|----------|----------|--------|
| [Zoom](./providers/zoom.md) | Meeting sync, transcripts | ✅ Available |
| [Microsoft Teams](./providers/microsoft/) | Teams, Calendar, OneDrive | ✅ Available |
| [Google Meet](./providers/google/google-meet.md) | Meeting integration | 🔜 Coming Soon |

### Productivity
| Provider | Features | Status |
|----------|----------|--------|
| [Google Drive](./providers/google/google-drive.md) | File sync, knowledge import | ✅ Available |
| [Microsoft OneDrive](./providers/microsoft/microsoft-onedrive.md) | File sync | ✅ Available |
| [Google Calendar](./providers/google/google-calendar.md) | Calendar sync | ✅ Available |
| [Microsoft Calendar](./providers/microsoft/microsoft-calendar.md) | Calendar sync | ✅ Available |

### Authentication
| Provider | Features | Status |
|----------|----------|--------|
| [Google Login](./providers/google/google-login.md) | OAuth sign-in | ✅ Available |
| [Microsoft Azure AD](./providers/microsoft/microsoft-azure-ad.md) | SSO, OAuth | ✅ Available |

### AI Providers
| Provider | Features | Status |
|----------|----------|--------|
| [Lovable AI](../06-ai-features/lovable-ai.md) | Built-in, no key needed | ✅ Default |
| [OpenAI](../06-ai-features/provider-routing.md) | GPT-4, embeddings | ✅ Available |
| [Anthropic](../06-ai-features/provider-routing.md) | Claude models | ✅ Available |
| [Google AI](./providers/google/google-ai.md) | Gemini models | ✅ Available |

### Notifications
| Provider | Features | Status |
|----------|----------|--------|
| [SendGrid](./email-notifications.md) | Email notifications | ✅ Available |
| Slack | Channel notifications | 🔜 Coming Soon |

---

## Quick Reference

### Required Environment Variables by Provider

| Provider | Variables | Notes |
|----------|-----------|-------|
| **Zoom** | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` | Server-to-Server OAuth |
| **Microsoft** | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Azure AD App Registration |
| **Google Login** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth 2.0 for authentication |
| **Google AI** | `GOOGLE_AI_API_KEY` | API key for Gemini models |
| **Google Drive** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_API_KEY` | OAuth + API key |
| **OpenAI** | `OPENAI_API_KEY` | Required for AI features |

### Edge Functions by Provider

| Provider | Edge Functions |
|----------|----------------|
| **Zoom** | `sync-zoom-files`, `zoom-transcript-processing`, `generate-meeting-summary` |
| **Microsoft** | `oauth-exchange-token`, `oauth-refresh-token` (shared) |
| **Google** | `google-drive-sync`, `google-drive-upload`, `user-knowledge-drive-sync` |
| **AI** | `ai-chat-assistant`, `generate-embeddings`, `run-ai-agent` |

### Feature Flags

Enable or disable integrations via **Admin → System Settings** or **Admin → Integrations**:

| Setting Path | Integration | Default |
|--------------|-------------|---------|
| `features.enableZoomSync` | Zoom recordings sync | `true` |
| `features.enableGoogleDrive` | Google Drive sync | `false` |
| `features.enableGoogleLogin` | Sign in with Google | `false` |
| `features.enableAIChat` | AI chat assistant | `true` |

> **Note**: Most integrations are now configured via the Integration Hub at **Admin → Integrations**. The above feature flags are for backward compatibility.

---

## Two-Tier Integration Architecture

CollabAi uses a **two-tier integration model** to support enterprise deployments:

### Tier 1: Admin/Organization Level
- Admin enables integrations for the company
- Stored in `organization_integrations` table
- Answers: “Does our company use Google/Zoom/etc.?”

### Tier 2: User/Individual Level
- User connects their personal account
- Stored in `user_oauth_tokens` table
- Answers: “Can I access MY Google Drive/Calendar?”

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TWO-TIER INTEGRATION MODEL                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TIER 1: ADMIN/ORGANIZATION LEVEL                                   │
│  ─────────────────────────────────                                  │
│  Location: Admin > Integrations                                      │
│  Storage: organization_integrations                                  │
│  Purpose: "Is this integration available for our company?"           │
│                                                                      │
│                         ↓                                            │
│                                                                      │
│  TIER 2: USER/INDIVIDUAL LEVEL                                      │
│  ─────────────────────────────                                       │
│  Location: Settings > Connected Services                             │
│  Storage: user_oauth_tokens                                          │
│  Purpose: "Connect MY personal account"                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Which Tier Is Needed?

| Integration | Tier 1 Only | Tier 1 + Tier 2 |
|-------------|-------------|-----------------|
| AI Providers (OpenAI, Gemini) | ✅ | |
| Google Login | ✅ | |
| Zoom | ✅ | ✅ |
| Google Drive | ✅ | ✅ |
| Microsoft 365 | ✅ | ✅ |

---

## Integration Architecture

```
┌─────────────────────────────────────────────────┐
│                  CollabAi App                    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              Edge Functions Layer                │
│  (OAuth handling, API calls, token management)   │
└─────────────────────┬───────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  Zoom   │  │ Google  │  │Microsoft│
   │  API    │  │  APIs   │  │ Graph   │
   └─────────┘  └─────────┘  └─────────┘
```

---

## Files in This Section

| File | Description |
|------|-------------|
| [oauth-flow.md](./oauth-flow.md) | How OAuth works in CollabAi |
| [email-notifications.md](./email-notifications.md) | SendGrid setup |
| [webhook-handling.md](./webhook-handling.md) | Incoming webhooks |

### Provider Guides
| Folder | Contents |
|--------|----------|
| [providers/zoom.md](./providers/zoom.md) | Zoom setup guide |
| [providers/google/](./providers/google/) | All Google integrations |
| [providers/microsoft/](./providers/microsoft/) | All Microsoft integrations |

---

## Quick Setup

### For Lovable Users
1. Go to **Admin → Integrations**
2. Click on the provider you want
3. Click **Connect** and authorize
4. Integration is active!

### For Self-Hosted
1. Create OAuth app in provider's console
2. Add credentials to edge function secrets
3. Configure callback URLs
4. Test the connection

---

## Integration Status

Check integration status in your app:
1. Go to **Admin → Integrations**
2. View connection status for each provider
3. Test connections as needed

---

## Troubleshooting

### OAuth callback fails
- Verify callback URL matches exactly
- Check client ID and secret
- Ensure provider app is published/verified

### Token refresh fails
- Check if refresh token is stored
- Verify token hasn't been revoked
- Re-authorize the connection

### API calls failing
- Check rate limits
- Verify required scopes are granted
- Check edge function logs

---

**Last Updated:** January 28, 2026  
**Version:** 1.1.0
