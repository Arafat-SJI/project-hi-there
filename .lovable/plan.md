
# Plan: Fix Google Meet Insufficient Scopes & TypeScript Errors

## Problems Identified

### Problem 1: 403 Insufficient OAuth Scopes
The Google Meet OAuth configuration requests `calendar.readonly` (line 44), but creating calendar events with `Events.Insert` requires **write access**.

**Current scopes** (line 40-45):
```typescript
scopes: [
  "openid",
  "email", 
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",  // READ-ONLY!
  "https://www.googleapis.com/auth/meetings.space.created",
],
```

### Problem 2: TypeScript Build Errors
The `googleMeetMeetingService.ts` file has TypeScript errors at lines 63 and 72-73 because `orgIntegration.config` is typed as `Json` (which is a union type), but the code directly accesses `.client_id` and `.client_secret` properties.

## Solution

### File 1: `supabase/functions/user-oauth-connect/index.ts`

**Change**: Update Google Meet scope from `calendar.readonly` to `calendar.events`

| Line | Before | After |
|------|--------|-------|
| 44 | `https://www.googleapis.com/auth/calendar.readonly` | `https://www.googleapis.com/auth/calendar.events` |

This grants permission to create, edit, and delete calendar events with Google Meet links.

### File 2: `src/lib/googleMeetMeetingService.ts`

**Change**: Add type interface and cast the config object properly

1. Add an interface for the config structure (around line 27)
2. Cast the config object before accessing properties (line 62-63)

```typescript
// Add interface for org integration config
interface OrgIntegrationConfig {
  client_id?: string;
  client_secret?: string;
}

// Cast config when accessing (replace line 62-74)
const config = orgIntegration?.config as OrgIntegrationConfig | null;
if (config?.client_id && config?.client_secret) {
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
      client_id: config.client_id,
      client_secret: config.client_secret,
    }),
  });
  // ... rest of refresh logic
}
```

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/user-oauth-connect/index.ts` | MODIFY | Change `calendar.readonly` to `calendar.events` on line 44 |
| `src/lib/googleMeetMeetingService.ts` | MODIFY | Add `OrgIntegrationConfig` interface and cast config object |

## User Action Required

After deployment, users must **disconnect and reconnect** their Google account to get the new calendar write permissions. Existing tokens only have read-only access.

## Testing Steps

1. Deploy changes
2. Navigate to `/admin/integrations/google-meet`
3. Disconnect Google account (if connected)
4. Reconnect Google account
5. Verify consent screen shows Calendar access (not just read-only)
6. Try creating a Google Meet meeting
7. Confirm meeting is created successfully
