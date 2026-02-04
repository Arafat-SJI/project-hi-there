

# Plan: Fix CORS Error by Creating Edge Function Proxy for Zoom Meeting Creation

## Problem
The `createZoomMeeting` function in `src/lib/zoomMeetingService.ts` is calling the Zoom API directly from the browser:
```typescript
const response = await fetch('https://api.zoom.us/v2/users/me/meetings', { ... });
```

This fails with a CORS error because Zoom's API is designed for server-to-server communication and doesn't include CORS headers for browser requests.

## Solution
Create a new Edge Function `create-zoom-meeting` that acts as a proxy between the frontend and the Zoom API. This follows the same pattern as the existing `sync-zoom-files` function.

## Implementation

### 1. Create Edge Function: `supabase/functions/create-zoom-meeting/index.ts`

This function will:
- Authenticate the user via JWT validation
- Retrieve the user's Zoom OAuth token from the database
- Handle token refresh if expired
- Make the server-to-server request to Zoom API
- Return the response with proper CORS headers

```text
Request Flow:
Browser → Edge Function → Zoom API
                ↓
         (CORS headers added)
                ↓
Browser ← Edge Function ← Zoom API Response
```

### 2. Update `supabase/config.toml`

Add the new function with `verify_jwt = false` to support ES256 token validation (as per project standards).

### 3. Update `src/lib/zoomMeetingService.ts`

Change from direct Zoom API call to calling the edge function:
```typescript
// Before (CORS error)
const response = await fetch('https://api.zoom.us/v2/users/me/meetings', { ... });

// After (works via proxy)
const { data, error } = await supabase.functions.invoke('create-zoom-meeting', {
  body: { topic, start_time, duration, timezone, agenda, settings, registrants }
});
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/create-zoom-meeting/index.ts` | **Create** - New edge function proxy |
| `supabase/config.toml` | **Modify** - Add function config |
| `src/lib/zoomMeetingService.ts` | **Modify** - Use edge function instead of direct API call |

## Technical Details

### Edge Function Implementation

The edge function will:
1. Handle CORS preflight (OPTIONS) requests
2. Validate the user's JWT token manually (ES256 compatibility)
3. Retrieve user's Zoom OAuth token from `user_oauth_tokens` table
4. Refresh token if expired using org credentials from `organization_integrations`
5. Make POST request to `https://api.zoom.us/v2/users/me/meetings`
6. Return Zoom's response with CORS headers

### Security Considerations

- User authentication validated via JWT before any Zoom API calls
- Zoom OAuth tokens retrieved server-side (never exposed to browser)
- Token refresh handled automatically with proper credential management
- CORS headers only added for authenticated responses

## Expected Result

After implementation:
1. User clicks "Create Zoom Meeting" in the app
2. Frontend calls `create-zoom-meeting` edge function
3. Edge function authenticates user, retrieves Zoom token, calls Zoom API
4. Meeting is created successfully without CORS errors
5. Response returned to frontend with meeting details

