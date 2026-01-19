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
