

## Complete Integration Hub Implementation Guide

This is a documentation/reference deliverable — a comprehensive implementation guide file that captures every layer of your integration system so you can replicate it in another project.

### What will be delivered

A single comprehensive markdown file (`docs/INTEGRATION_HUB_IMPLEMENTATION_GUIDE.md`) containing the full reusable blueprint, organized into these sections:

---

### 1. Database Schema (7 tables)

The guide will include the complete SQL for all integration-related tables:

| Table | Purpose |
|-------|---------|
| `integration_categories` | Groups integrations (AI, Meeting, Email, CRM, etc.) |
| `integration_providers` | Individual providers with auth_type + oauth_config JSONB |
| `integration_fields` | Dynamic form fields per provider (api_key, client_id, etc.) |
| `organization_integrations` | Org-level config storage (credentials in `config` JSONB) |
| `integration_services` | Sub-services per provider (e.g., Zoom meetings vs recordings) |
| `integration_usage_logs` | Analytics/cost tracking |
| `oauth_states` | CSRF protection during OAuth flow |
| `user_oauth_tokens` | Per-user OAuth token storage |

Including all RLS policies, indexes, triggers, helper functions (`user_has_valid_oauth_token`, `cleanup_expired_oauth_states`), and the `user_id` column migration for `organization_integrations`.

### 2. Seed Data

Complete INSERT statements for 20+ providers across 7 categories, plus their field definitions and service configurations.

### 3. Edge Functions (4 core functions)

Full source code for:
- **`user-oauth-connect`** — Initiates OAuth flow: validates user, checks org config, builds authorization URL with provider-specific scopes, stores state for CSRF
- **`user-oauth-callback`** — Handles redirect: exchanges code for tokens, fetches user info, upserts into `user_oauth_tokens`, redirects back to app
- **`user-oauth-disconnect`** — Revokes token at provider (if supported), deletes from `user_oauth_tokens`
- **`user-oauth-refresh`** — Refreshes expired tokens using refresh_token
- **`validate-api-key`** — Tests API key credentials for non-OAuth providers

### 4. Frontend Architecture

Complete source for all React components and hooks:

**Hooks:**
- `useIntegrations.ts` — 15 React Query hooks (categories, providers, fields, org integrations, services, usage logs, grouped data)
- `useUserIntegrations.ts` — User-level OAuth token management (connect, disconnect, refresh, validity check)
- `useIntegrationStatus.ts` — Connection statistics

**Utilities:**
- `integration-utils.ts` — Type definitions, icon mapping, status helpers, OAuth URL builder, field validation, masking

**Components:**
- `ProviderCard.tsx` — Card per provider with status badge + action button
- `DynamicFormField.tsx` — Renders text/password/select/textarea with validation
- `ProviderDetailHeader.tsx` — Detail page header with connect/test/disconnect actions
- `ConnectedServices.tsx` — User settings page for managing personal connections

**Pages:**
- `Integrations.tsx` — Main hub with category-based collapsible grid, search, filtering
- `ZoomIntegration.tsx` — Full provider detail page (reference implementation showing org config form, user OAuth connection, sync controls, statistics)

### 5. OAuth Flow Diagram

```text
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────┐
│  Admin   │     │   Frontend   │     │ Edge Functions  │     │ Provider │
│  Panel   │     │   (React)    │     │  (Supabase)     │     │  (Zoom)  │
└────┬─────┘     └──────┬───────┘     └───────┬────────┘     └────┬─────┘
     │                  │                     │                    │
     │ 1. Save Client   │                     │                    │
     │ ID + Secret ─────┼──► upsert into      │                    │
     │                  │    organization_     │                    │
     │                  │    integrations      │                    │
     │                  │                     │                    │
     │                  │ 2. Click "Connect"  │                    │
     │                  │────────────────────►│                    │
     │                  │  user-oauth-connect │                    │
     │                  │                     │── 3. Store state   │
     │                  │                     │   in oauth_states  │
     │                  │                     │                    │
     │                  │◄── auth URL ────────│                    │
     │                  │                     │                    │
     │                  │──── 4. Redirect ────┼───────────────────►│
     │                  │                     │                    │
     │                  │                     │◄── 5. Callback ────│
     │                  │                     │   with code+state  │
     │                  │                     │                    │
     │                  │                     │── 6. Exchange code │
     │                  │                     │   for tokens ─────►│
     │                  │                     │◄── tokens ─────────│
     │                  │                     │                    │
     │                  │                     │── 7. Store tokens  │
     │                  │                     │   in user_oauth_   │
     │                  │                     │   tokens           │
     │                  │                     │                    │
     │                  │◄── 8. Redirect ─────│                    │
     │                  │   back to app       │                    │
```

### 6. Adding a New Provider Checklist

Step-by-step guide for adding any new OAuth or API-key provider.

### Files Changed

| File | Change |
|------|--------|
| `docs/INTEGRATION_HUB_IMPLEMENTATION_GUIDE.md` | New — complete implementation guide with all SQL, edge function code, React components, and architecture documentation |

