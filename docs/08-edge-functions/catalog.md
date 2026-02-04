# Edge Functions Catalog

This document catalogs all Supabase Edge Functions in the Control Tower framework, organized by functional area. Each function's purpose, required secrets, and related features are documented.

## Overview

Edge Functions run serverless TypeScript code close to your users. They handle:
- AI/ML operations (embeddings, chat, summarization)
- External API integrations (Google, Zoom, Microsoft)
- OAuth flows
- Email and notifications
- Business logic that requires secrets

**Total Functions:** 64

## Quick Reference

Use this table to quickly find functions by category:

| Category | Count | Key Dependencies |
|----------|-------|------------------|
| AI & Machine Learning | 13 | `OPENAI_API_KEY` |
| EOS AI | 3 | `OPENAI_API_KEY` |
| Meeting AI | 2 | `OPENAI_API_KEY` |
| Authentication & Security | 6 | Various OAuth credentials |
| Google Integration | 2 | `GOOGLE_CLIENT_*` |
| Microsoft Integration | 1 | `MICROSOFT_CLIENT_ID` |
| Zoom Integration | 2 | `ZOOM_*` |
| Knowledge & Embeddings | 5 | `OPENAI_API_KEY` |
| User Knowledge | 3 | Varies |
| Client Portal | 3 | None |
| Project Integration | 2 | Provider-specific |
| OAuth Flows | 7 | Provider-specific |
| Notifications & Email | 3 | `SENDGRID_API_KEY` |
| API Endpoints | 4 | None |
| MCP (Model Context Protocol) | 2 | Varies |
| System & Utilities | 6 | Varies |

---

## AI & Machine Learning

### `ai-chat`
**Purpose:** Simple one-shot AI chat completion — accepts messages, returns AI response

**Required Secrets:**
- `OPENAI_API_KEY`

**Endpoints:**
- `POST /ai-chat`

**Use Cases:**
- One-shot chat completions
- Quick AI queries without conversation context

---

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

### `agent-chat-stream`
**Purpose:** Stream AI agent responses in real-time using SSE (Server-Sent Events)

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIAgents`

**Endpoints:**
- `POST /agent-chat-stream`

**Use Cases:**
- Real-time chat streaming
- Long-running agent responses
- Token-by-token output

---

### `agent-conversation-chat`
**Purpose:** Conversational chat with RAG context from knowledge base and user personalizations

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIAgents`
- `enableKnowledgeBase`

**Endpoints:**
- `POST /agent-conversation-chat`

**Related Files:**
- `src/modules/knowledge/hooks/useSemanticMemorySearch.ts`

**Use Cases:**
- RAG-powered agent conversations
- User-personalized AI responses
- Knowledge-grounded chat

---

### `extract-agent-memories`
**Purpose:** Extract and store key memories from agent conversations for future context

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableAIAgents`

**Endpoints:**
- `POST /extract-agent-memories`

**Use Cases:**
- Long-term memory for AI agents
- Conversation summarization
- Context persistence across sessions

---

### `gemini-rag-query`
**Purpose:** Retrieval-Augmented Generation queries using Google Gemini

**Required Secrets:**
- `GOOGLE_API_KEY` (Gemini)

**Features Enabled:**
- `enableKnowledgeBase`

**Endpoints:**
- `POST /gemini-rag-query`

**Related Files:**
- `src/pages/admin/GeminiRAG.tsx`

**Use Cases:**
- Alternative RAG backend to OpenAI
- Gemini-powered knowledge queries
- Cross-model knowledge retrieval

---

## EOS AI

### `eos-triage-assistant`
**Purpose:** AI-powered issue triage — suggests priority, category, pod assignment, and related issues

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableEOS`

**Endpoints:**
- `POST /eos-triage-assistant`

**Related Files:**
- `src/modules/eos/hooks/useEOSAI.ts`

---

### `extract-meeting-issues`
**Purpose:** Extract EOS-style issues from meeting transcripts using AI

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableEOS`
- `enableMeetings`

**Endpoints:**
- `POST /extract-meeting-issues`

**Related Files:**
- `src/modules/eos/hooks/useExtractMeetingIssues.ts`

---

### `suggest-okrs`
**Purpose:** AI-suggested OKRs based on company context (issues, meetings, existing goals)

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableEOS`

**Endpoints:**
- `POST /suggest-okrs`

**Related Files:**
- `src/modules/eos/hooks/useEOSAI.ts`

---

## Meeting AI

### `extract-meeting-tasks`
**Purpose:** Extract action items from meeting transcripts using AI

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableMeetings`

**Endpoints:**
- `POST /extract-meeting-tasks`

**Related Files:**
- `src/modules/meetings/hooks/useExtractMeetingTasks.ts`

---

### `quarterly-digest`
**Purpose:** Generate comprehensive quarterly digest report aggregating EOS, OKR, meeting, and scorecard data

**Required Secrets:**
- `OPENAI_API_KEY`

**Features Enabled:**
- `enableEOS`

**Endpoints:**
- `POST /quarterly-digest`

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

### `promote-first-admin`
**Purpose:** Promote the first registered user to admin role during initial setup

**Required Secrets:**
- None

**Endpoints:**
- `POST /promote-first-admin`

**Use Cases:**
- First-time installation setup
- Bootstrap admin access

---

### `promote-to-admin`
**Purpose:** Promote an existing user to administrator role

**Required Secrets:**
- None

**Endpoints:**
- `POST /promote-to-admin`

**Use Cases:**
- Admin user management
- Role escalation

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

### `knowledge-base`
**Purpose:** Admin API for knowledge base management — categories, sources, files, and stats

**Required Secrets:**
- None

**Features Enabled:**
- `enableKnowledgeBase`

**Endpoints:**
- `GET /knowledge-base?action=stats`
- `GET /knowledge-base?action=categories`
- `GET /knowledge-base?action=sources`
- `GET /knowledge-base?action=files`
- `POST /knowledge-base`

**Related Files:**
- `src/modules/knowledge/hooks/useKnowledgeBase.ts`

---

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

## Client Portal

### `client-dashboard-api`
**Purpose:** API for the external client portal dashboard — project status, milestones, documents

**Required Secrets:**
- None

**Features Enabled:**
- `enableClients`

**Endpoints:**
- `GET /client-dashboard-api`
- `POST /client-dashboard-api`

**Authentication:** Client portal token (PBKDF2 password-based)

**Related Files:**
- `src/pages/client-portal/ClientPortalDashboard.tsx`

---

### `client-documents`
**Purpose:** Manage documents scoped to a specific client

**Required Secrets:**
- None

**Features Enabled:**
- `enableClients`

**Endpoints:**
- `GET /client-documents`
- `POST /client-documents`
- `DELETE /client-documents/:id`

**Authentication:** Client portal token or Supabase JWT

---

### `create-client-access`
**Purpose:** Create client portal access credentials (token + password hash)

**Required Secrets:**
- None

**Features Enabled:**
- `enableClients`

**Endpoints:**
- `POST /create-client-access`

**Related Files:**
- `src/components/projects/ClientAccessManagement.tsx`

**Use Cases:**
- Generate client login credentials
- Set up external client portal access
- Manage client access tokens

---

## Project Integration

### `sync-projects-activecollab`
**Purpose:** Sync projects and tasks from ActiveCollab project management tool

**Required Secrets:**
- `ACTIVECOLLAB_API_TOKEN`
- `ACTIVECOLLAB_API_URL`

**Endpoints:**
- `POST /sync-projects-activecollab`

**Related Files:**
- `src/hooks/useProjectSync.ts`

**Use Cases:**
- Import projects from ActiveCollab
- Sync task status updates
- Two-way project synchronization

---

### `sync-projects-jira`
**Purpose:** Sync projects, issues, and sprints from Jira

**Required Secrets:**
- `JIRA_API_TOKEN`
- `JIRA_API_URL`
- `JIRA_USER_EMAIL`

**Endpoints:**
- `POST /sync-projects-jira`

**Related Files:**
- `src/hooks/useProjectSync.ts`

**Use Cases:**
- Import Jira projects and sprints
- Sync issue status updates
- Sprint progress tracking

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

### `oauth-revoke-token`
**Purpose:** Revoke an OAuth access token at the provider's revocation endpoint

**Required Secrets:**
- Provider-specific

**Endpoints:**
- `POST /oauth-revoke-token`

**Use Cases:**
- Token cleanup on disconnection
- Security revocation of compromised tokens

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

### `api-v1-tasks`
**Purpose:** RESTful API for task/action item management

**Required Secrets:**
- None

**Features Enabled:**
- `enableActions`

**Endpoints:**
- `GET /api-v1-tasks`
- `POST /api-v1-tasks`
- `PATCH /api-v1-tasks/:id`
- `DELETE /api-v1-tasks/:id`

**Authentication:** API key or Supabase JWT

---

### `api-v1-documents`
**Purpose:** RESTful API for unified document management (polymorphic owner)

**Required Secrets:**
- None

**Features Enabled:**
- `enableKnowledgeBase`

**Endpoints:**
- `GET /api-v1-documents`
- `POST /api-v1-documents`
- `PUT /api-v1-documents/:id`
- `DELETE /api-v1-documents/:id`

**Authentication:** API key or Supabase JWT

**Use Cases:**
- CRUD for unified_documents table
- Filter by owner_type (user, project, client, deal, common)
- Document processing status management

---

## MCP (Model Context Protocol)

### `execute-mcp-tool`
**Purpose:** Execute a tool on a registered MCP server

**Required Secrets:**
- Varies by MCP server configuration

**Endpoints:**
- `POST /execute-mcp-tool`

**Related Files:**
- `src/pages/admin/MCPServers.tsx`

**Use Cases:**
- Run MCP tools from AI agents
- External tool execution
- AI-driven automation

---

### `verify-mcp-server`
**Purpose:** Verify connectivity and capabilities of a registered MCP server

**Required Secrets:**
- Varies by MCP server configuration

**Endpoints:**
- `POST /verify-mcp-server`

**Related Files:**
- `src/pages/admin/MCPServers.tsx`

**Use Cases:**
- Health check MCP server connections
- Discover available tools
- Validate server configuration

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

### `run-seed`
**Purpose:** Execute SQL seed files from the admin Seed Data Runner

**Required Secrets:**
- None

**Endpoints:**
- `POST /run-seed`

**Related Files:**
- `src/pages/admin/SeedRunner.tsx`

**Use Cases:**
- Run specific seed SQL files from admin panel
- Module-specific data seeding
- Development/staging data population

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

### `log-activity`
**Purpose:** Record user actions to the activity_logs table for auditing (fire-and-forget)

**Required Secrets:**
- None

**Endpoints:**
- `POST /log-activity`

**Use Cases:**
- User activity audit trail
- Action logging for compliance
- Usage analytics

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
