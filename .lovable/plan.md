
# Plan: Create Missing `sync-google-meet` Edge Function

## Problem Analysis

The CORS error is occurring because the `sync-google-meet` edge function **does not exist**. When a user clicks "Sync Meetings" on the Google Meet integration page:

1. The frontend calls `supabase.functions.invoke('sync-google-meet', ...)`
2. Supabase returns an error (function not found) without CORS headers
3. The browser blocks the response with: `Response to preflight request doesn't pass access control check`

## Solution

Create the `sync-google-meet` edge function following the same pattern as the existing `sync-zoom-files` function, but adapted for Google Calendar/Meet APIs.

## Implementation

### File 1: `supabase/functions/sync-google-meet/index.ts` (CREATE)

New edge function that:
- Handles CORS preflight requests properly
- Validates JWT authentication manually (ES256 compatibility)
- Fetches user's OAuth token from `user_oauth_tokens` table
- Refreshes expired tokens using Google's OAuth endpoint
- Calls Google Calendar API to fetch events with Meet links
- Syncs meeting data to the `meetings` and `meeting_files` tables
- Returns sync results with proper CORS headers

Key structure:
```text
+------------------------+
|  CORS Headers Setup    |
+------------------------+
         |
         v
+------------------------+
|  OPTIONS Handler       |
+------------------------+
         |
         v
+------------------------+
|  JWT Validation        |
+------------------------+
         |
         v
+------------------------+
|  Get OAuth Token       |
+------------------------+
         |
         v
+------------------------+
|  Refresh if Expired    |
+------------------------+
         |
         v
+------------------------+
|  Fetch Google Calendar |
|  Events with Meet Link |
+------------------------+
         |
         v
+------------------------+
|  Sync to Database      |
+------------------------+
         |
         v
+------------------------+
|  Return Results        |
+------------------------+
```

### File 2: `supabase/config.toml` (MODIFY)

Add configuration for the new function:
```toml
[functions.sync-google-meet]
verify_jwt = false
```

This disables gateway JWT verification (required for ES256 token compatibility) - authentication is handled manually in code.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/sync-google-meet/index.ts` | CREATE | New edge function for syncing Google Meet meetings |
| `supabase/config.toml` | MODIFY | Add function configuration with `verify_jwt = false` |

## Google Calendar API Integration

The function will use these Google APIs:
- **Token Endpoint**: `https://oauth2.googleapis.com/token` (for refreshing tokens)
- **Calendar Events**: `https://www.googleapis.com/calendar/v3/calendars/primary/events` (for fetching meetings)

Filter criteria for Google Meet events:
- Events with `conferenceData.conferenceSolution.key.type === 'hangoutsMeet'`
- Date range: last 30 days by default

## Technical Notes

1. **CORS Headers**: Include all required headers per project standards:
   - `authorization`, `x-client-info`, `apikey`, `content-type`, `x-supabase-client-platform`

2. **OAuth Token Refresh**: Uses org-level credentials from `organization_integrations` table with `provider_id` for Google Meet

3. **Dual-Write Pattern**: Following the existing pattern from `sync-zoom-files`, the function writes to both provider-specific and generic meeting tables for backward compatibility

4. **Error Handling**: All responses (including errors) include CORS headers to prevent browser blocking
