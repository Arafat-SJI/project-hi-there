
# Plan: Create Missing OAuth Tables and Fix Callback Edge Function

## Current Problem

When you click "Connect with Zoom", the OAuth flow initiates but the connection status never displays anything. This is because **two essential database tables are missing** that the OAuth flow requires:

1. **`oauth_states`** - Stores temporary state tokens for CSRF protection during OAuth authorization
2. **`user_oauth_tokens`** - Stores user OAuth credentials after successful authorization

Additionally, there's a column name mismatch in the callback edge function that needs correction.

## Solution Overview

1. Create the `oauth_states` table with appropriate columns and RLS policies
2. Create the `user_oauth_tokens` table with appropriate columns and RLS policies  
3. Fix the `user-oauth-callback` edge function to use the correct column name (`enabled` instead of `is_enabled`)

---

## Implementation Details

### Step 1: Database Migration

Create the two required tables:

**`oauth_states` table:**
- `id` - UUID primary key
- `state` - Unique state token (used for CSRF protection)
- `user_id` - Reference to the user initiating OAuth
- `provider` - Provider slug (e.g., 'zoom', 'google')
- `redirect_uri` - Where to redirect after completion
- `expires_at` - Expiration timestamp (typically 10 minutes)
- `created_at` - Creation timestamp

**`user_oauth_tokens` table:**
- `id` - UUID primary key
- `user_id` - Reference to the user
- `provider_slug` - Provider identifier (e.g., 'zoom')
- `access_token` - Encrypted OAuth access token
- `refresh_token` - Encrypted OAuth refresh token (optional)
- `token_type` - Token type (e.g., 'Bearer')
- `expires_at` - Token expiration timestamp
- `scopes` - Array of granted scopes
- `account_email` - Connected account email
- `account_name` - Connected account name
- `account_id` - Connected account ID
- `account_avatar_url` - Connected account avatar
- `is_active` - Whether the connection is active
- `last_used_at` - Last usage timestamp
- `last_refreshed_at` - Last token refresh timestamp
- `error_message` - Any error message
- `error_at` - Error timestamp
- `metadata` - Additional metadata (JSONB)
- `created_at` / `updated_at` - Timestamps

**RLS Policies:**
- Users can only read/manage their own tokens
- Service role can access all tokens (for edge functions)

### Step 2: Fix Edge Function

Update `supabase/functions/user-oauth-callback/index.ts`:
- Change `.eq("is_enabled", true)` to `.eq("enabled", true)` to match the actual column name

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration (new) | Create `oauth_states` and `user_oauth_tokens` tables with RLS |
| `supabase/functions/user-oauth-callback/index.ts` | Fix column name from `is_enabled` to `enabled` |

## Expected Outcome

After these changes:
1. Admin saves Zoom Client ID and Client Secret (already working)
2. User clicks "Connect with Zoom" → State is stored in `oauth_states`
3. User authorizes on Zoom → Redirected back to callback
4. Callback exchanges code for tokens → Tokens stored in `user_oauth_tokens`
5. User sees "Connected" status with their Zoom account info

---

## Technical Details

### Database Schema (SQL Preview)

```text
oauth_states
├── id (uuid, PK)
├── state (text, unique)
├── user_id (uuid, FK → auth.users)
├── provider (text)
├── redirect_uri (text)
├── expires_at (timestamptz)
└── created_at (timestamptz)

user_oauth_tokens
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── provider_slug (text)
├── access_token (text, encrypted)
├── refresh_token (text, nullable)
├── token_type (text, default 'Bearer')
├── expires_at (timestamptz, nullable)
├── scopes (text[], default '{}')
├── account_email (text, nullable)
├── account_name (text, nullable)
├── account_id (text, nullable)
├── account_avatar_url (text, nullable)
├── is_active (boolean, default true)
├── last_used_at (timestamptz, nullable)
├── last_refreshed_at (timestamptz, nullable)
├── error_message (text, nullable)
├── error_at (timestamptz, nullable)
├── metadata (jsonb, default '{}')
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── UNIQUE(user_id, provider_slug)
```

### Edge Function Fix

```text
// Before (line 157)
.eq("is_enabled", true)

// After
.eq("enabled", true)
```
