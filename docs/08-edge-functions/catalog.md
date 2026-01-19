# Edge Functions Catalog

This document catalogs all Supabase Edge Functions in the Control Tower framework, organized by functional area. Each function's purpose, required secrets, and related features are documented.

## Overview

Edge Functions run serverless TypeScript code close to your users. They handle:
- AI/ML operations (embeddings, chat, summarization)
- External API integrations (Google, Zoom, Microsoft)
- OAuth flows
- Email and notifications
- Business logic that requires secrets

**Total Functions:** 41

## Quick Reference

Use this table to quickly find functions by category:

| Category | Count | Key Dependencies |
|----------|-------|------------------|
| AI & Machine Learning | 9 | `OPENAI_API_KEY` |
| Authentication & Security | 4 | Various OAuth credentials |
| Google Integration | 2 | `GOOGLE_CLIENT_*` |
| Microsoft Integration | 1 | `MICROSOFT_CLIENT_ID` |
| Zoom Integration | 2 | `ZOOM_*` |
| Knowledge & Embeddings | 4 | `OPENAI_API_KEY` |
| User Knowledge | 3 | Varies |
| OAuth Flows | 6 | Provider-specific |
| Notifications & Email | 3 | `SENDGRID_API_KEY` |
| API Endpoints | 2 | None |
| System & Utilities | 5 | Varies |

---

## AI & Machine Learning

### `ai-chat-assistant`
**Purpose:** Main AI chat endpoint for conversational interactions

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIChat`

**Endpoints:**
- `POST /ai-chat-assistant`

**Related Files:**
- `src/hooks/useAIChatAssistant.ts`
- `src/components/ai-chat/AIChatInterface.tsx`

---

### `run-ai-agent`
**Purpose:** Execute custom AI agents with specific instructions and context

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIAgents`

**Endpoints:**
- `POST /run-ai-agent`

**Related Files:**
- `src/hooks/useAIAgents.ts`
- `src/components/ai-agents/AgentRunner.tsx`

---

### `generate-embeddings`
**Purpose:** Create vector embeddings for semantic search

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableSemanticSearch`

**Endpoints:**
- `POST /generate-embeddings`

**Use Cases:**
- Manual embedding generation
- Bulk embedding operations
- Testing embedding quality

---

### `semantic-search`
**Purpose:** Perform AI-powered semantic search across all content

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableSemanticSearch`

**Endpoints:**
- `POST /semantic-search`

**Related Files:**
- `src/hooks/useSemanticSearch.ts`
- `src/components/search/SemanticSearch.tsx`

---

### `generate-meeting-summary`
**Purpose:** Automatically summarize meeting transcripts using AI

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableMeetings`

**Endpoints:**
- `POST /generate-meeting-summary`

**Related Files:**
- `src/hooks/useMeetings.ts`

---

### `categorize-meeting`
**Purpose:** Auto-categorize meetings based on content

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableMeetings`

**Endpoints:**
- `POST /categorize-meeting`

**Related Files:**
- `src/hooks/useMeetings.ts`

---

### `generate-business-doc`
**Purpose:** Generate business documents using AI

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIChat`

**Endpoints:**
- `POST /generate-business-doc`

**Use Cases:**
- Generate reports
- Create proposals
- Draft emails

---

### `sync-ai-models`
**Purpose:** Sync available AI models from OpenAI

**Required Secrets:**
- `OPENAI_API_KEY`

**Endpoints:**
- `POST /sync-ai-models`

**Related Files:**
- `src/hooks/useModelSync.ts`

**Use Cases:**
- Update available models list
- Check for new GPT versions
- Model compatibility checks

---

### `unified-knowledge-search`
**Purpose:** Cross-source AI-powered search across all knowledge bases

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableKnowledgeBase`
- `enableSemanticSearch`

**Endpoints:**
- `POST /unified-knowledge-search`

**Related Files:**
- `src/hooks/useSemanticSearch.ts`

---

## Authentication & Security

### `azure-auth-login`
**Purpose:** Handle Azure AD / Microsoft SSO login flow

**Required Secrets:**
- `VITE_MICROSOFT_CLIENT_ID`
- `VITE_MICROSOFT_DIRECTORY_ID`

**Endpoints:**
- `POST /azure-auth-login`

**Related Files:**
- `src/lib/azureAuth.ts`

---

### `azure-auth-logout`
**Purpose:** Handle Azure AD / Microsoft SSO logout

**Required Secrets:**
- `VITE_MICROSOFT_CLIENT_ID`

**Endpoints:**
- `POST /azure-auth-logout`

**Related Files:**
- `src/lib/azureAuth.ts`

---

### `validate-api-key`
**Purpose:** Validate API keys for programmatic access

**Required Secrets:**
- None

**Endpoints:**
- `POST /validate-api-key`

**Use Cases:**
- API authentication
- Third-party integrations
- Webhook verification

---

### `validate-sso-domain`
**Purpose:** Check if a domain is allowed for SSO authentication

**Required Secrets:**
- None

**Endpoints:**
- `POST /validate-sso-domain`

**Related Files:**
- `src/hooks/useAuthConfig.ts`

---

## Google Integration

### `google-drive-sync`
**Purpose:** Sync files from Google Drive to knowledge base

**Required Secrets:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_API_KEY`

**Features Enabled:**
- `enableGoogleDrive`

**Endpoints:**
- `POST /google-drive-sync`

**Related Files:**
- `src/components/integrations/GoogleDriveFilePicker.tsx`

---

### `google-drive-upload`
**Purpose:** Upload files to Google Drive

**Required Secrets:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_API_KEY`

**Features Enabled:**
- `enableGoogleDrive`

**Endpoints:**
- `POST /google-drive-upload`

---

## Microsoft Integration

### `microsoft-graph-subscribe`
**Purpose:** Set up Microsoft Graph API webhooks for real-time updates

**Required Secrets:**
- `VITE_MICROSOFT_CLIENT_ID`
- `VITE_MICROSOFT_CLIENT_SECRET`

**Endpoints:**
- `POST /microsoft-graph-subscribe`

**Related Files:**
- `src/hooks/useGraphWebhookSubscription.ts`

**Use Cases:**
- Teams message notifications
- Calendar event updates
- OneDrive file changes

---

## Zoom Integration

### `sync-zoom-files`
**Purpose:** Sync Zoom meeting recordings and transcripts

**Required Secrets:**
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_ACCOUNT_ID`

**Features Enabled:**
- `enableZoomSync`

**Endpoints:**
- `POST /sync-zoom-files`

**Related Files:**
- `src/hooks/useSyncZoom.ts`
- `src/hooks/useZoomFiles.ts`

---

### `zoom-transcript-processing`
**Purpose:** Process and extract insights from Zoom transcripts

**Required Secrets:**
- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `OPENAI_API_KEY` (for summarization)

**Features Enabled:**
- `enableZoomSync`

**Endpoints:**
- `POST /zoom-transcript-processing`

---

## Knowledge & Embeddings

### `auto-embed-knowledge-entry`
**Purpose:** Automatically generate embeddings when knowledge entries are created

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableKnowledgeBase`

**Trigger:** Database trigger on `knowledge_base` table INSERT

**Related Files:**
- `src/hooks/useKnowledge.ts`

---

### `auto-embed-knowledge-files`
**Purpose:** Generate embeddings for uploaded knowledge files

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableKnowledgeBase`

**Trigger:** Database trigger on `knowledge_files` table INSERT

---

### `auto-embed-meetings`
**Purpose:** Automatically embed meeting transcripts for search

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableMeetings`

**Trigger:** Database trigger on `meetings` table INSERT/UPDATE

---

## User Knowledge

### `user-knowledge-drive-sync`
**Purpose:** Sync user's personal Google Drive files

**Required Secrets:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Features Enabled:**
- `enablePersonalKnowledge`
- `enableGoogleDrive`

**Endpoints:**
- `POST /user-knowledge-drive-sync`

**Related Files:**
- `src/hooks/useUserKnowledge.ts`

---

### `user-knowledge-process`
**Purpose:** Process and embed user's personal documents

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enablePersonalKnowledge`

**Endpoints:**
- `POST /user-knowledge-process`

---

### `user-knowledge-upload`
**Purpose:** Handle user's personal file uploads

**Required Secrets:**
- None

**Features Enabled:**
- `enablePersonalKnowledge`

**Endpoints:**
- `POST /user-knowledge-upload`

---

## OAuth Flows

### `oauth-exchange-token`
**Purpose:** Exchange OAuth authorization codes for access tokens

**Required Secrets:**
- Provider-specific (`GOOGLE_CLIENT_SECRET`, `ZOOM_CLIENT_SECRET`, etc.)

**Endpoints:**
- `POST /oauth-exchange-token`

**Query Params:**
- `provider`: `google`, `zoom`, `microsoft`

---

### `oauth-refresh-token`
**Purpose:** Refresh expired OAuth access tokens

**Required Secrets:**
- Provider-specific

**Endpoints:**
- `POST /oauth-refresh-token`

**Query Params:**
- `provider`: `google`, `zoom`, `microsoft`

---

### `user-oauth-connect`
**Purpose:** Initiate OAuth connection for a user

**Required Secrets:**
- Provider-specific

**Endpoints:**
- `POST /user-oauth-connect`

**Related Files:**
- `src/hooks/useUserIntegrations.ts`

---

### `user-oauth-callback`
**Purpose:** Handle OAuth callback after user authorization

**Required Secrets:**
- Provider-specific

**Endpoints:**
- `GET /user-oauth-callback`

**Query Params:**
- `code`: OAuth authorization code
- `state`: CSRF protection token

---

### `user-oauth-disconnect`
**Purpose:** Disconnect user's OAuth integration

**Required Secrets:**
- None

**Endpoints:**
- `POST /user-oauth-disconnect`

---

### `user-oauth-refresh`
**Purpose:** Refresh user's OAuth tokens

**Required Secrets:**
- Provider-specific

**Endpoints:**
- `POST /user-oauth-refresh`

---

## Notifications & Email

### `send-email`
**Purpose:** Send transactional emails

**Required Secrets:**
- `SENDGRID_API_KEY`

**Endpoints:**
- `POST /send-email`

**Use Cases:**
- User invitations
- Password resets
- Notification emails

---

### `send-notification`
**Purpose:** Send in-app notifications to users

**Required Secrets:**
- None

**Features Enabled:**
- `enableNotifications`

**Endpoints:**
- `POST /send-notification`

**Related Files:**
- `src/hooks/useNotifications.ts`

---

### `send-feedback-notification`
**Purpose:** Send feedback submissions to administrators

**Required Secrets:**
- `SENDGRID_API_KEY`

**Features Enabled:**
- `enableFeedback`

**Endpoints:**
- `POST /send-feedback-notification`

---

## API Endpoints

### `api-v1-clients`
**Purpose:** RESTful API for client management

**Required Secrets:**
- None

**Features Enabled:**
- `enableClients`

**Endpoints:**
- `GET /api-v1-clients`
- `POST /api-v1-clients`
- `PUT /api-v1-clients/:id`
- `DELETE /api-v1-clients/:id`

**Authentication:** API key or Supabase JWT

---

### `api-v1-meetings`
**Purpose:** RESTful API for meeting management

**Required Secrets:**
- None

**Features Enabled:**
- `enableMeetings`

**Endpoints:**
- `GET /api-v1-meetings`
- `POST /api-v1-meetings`
- `PUT /api-v1-meetings/:id`
- `DELETE /api-v1-meetings/:id`

**Authentication:** API key or Supabase JWT

---

## System & Utilities

### `check-environment`
**Purpose:** Health check endpoint to verify environment configuration

**Required Secrets:**
- None

**Endpoints:**
- `GET /check-environment`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-16T00:00:00Z",
  "secrets": {
    "OPENAI_API_KEY": true,
    "SENDGRID_API_KEY": false
  }
}
```

---

### `seed-template-data`
**Purpose:** Seed database with template data for new installations

**Required Secrets:**
- None

**Endpoints:**
- `POST /seed-template-data`

**Use Cases:**
- First-time setup
- Development environments
- Demo data

---

### `audit-log-writer`
**Purpose:** Write audit logs for compliance and tracking

**Required Secrets:**
- None

**Endpoints:**
- `POST /audit-log-writer`

**Use Cases:**
- Security auditing
- Compliance requirements
- User activity tracking

---

### `webhook-handler`
**Purpose:** Generic webhook handler for external services

**Required Secrets:**
- Varies by provider

**Endpoints:**
- `POST /webhook-handler`

**Query Params:**
- `provider`: webhook source

**Use Cases:**
- Zoom webhook events
- Google Drive change notifications
- Microsoft Graph subscriptions

---

## Deployment Guide

### Deploy All Functions
```bash
supabase functions deploy
```

### Deploy Single Function
```bash
supabase functions deploy ai-chat-assistant
```

### Set Secrets
```bash
# Set in Supabase Dashboard
# Project Settings > Edge Functions > Secrets

# Or via CLI
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set SENDGRID_API_KEY=SG....
```

### View Logs
```bash
supabase functions logs ai-chat-assistant
```

---

## Testing Edge Functions Locally

### Prerequisites
```bash
npm install -g supabase
```

### Start Local Development
```bash
supabase functions serve
```

### Test with cURL
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/ai-chat-assistant' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":"Hello, AI!"}'
```

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate API keys** regularly
3. **Use environment-specific secrets** (dev vs prod)
4. **Validate all inputs** in edge functions
5. **Rate limit** public-facing endpoints
6. **Log security events** via `audit-log-writer`

---

## Troubleshooting

### Function Returns 500 Error
- Check logs: `supabase functions logs <function-name>`
- Verify required secrets are set
- Test locally with `supabase functions serve`

### Timeout Errors
- Edge functions have a 60-second timeout
- Break long operations into smaller chunks
- Use database triggers for async operations

### CORS Issues
- Ensure CORS headers are set in function response
- Check `_shared/cors.ts` helper

---

## Related Documentation

- [Feature Flags](FEATURE_FLAGS.md)
- [Secrets Management](SECRETS_MANAGEMENT.md)
- [Edge Functions Deployment](EDGE_FUNCTIONS_DEPLOYMENT.md)
- [Integration API Reference](INTEGRATION_API_REFERENCE.md)
