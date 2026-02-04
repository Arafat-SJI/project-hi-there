
# Plan: Fix Google Meet OAuth Scopes and TypeScript Errors

## Problems Identified

### Problem 1: Insufficient OAuth Scopes (403 Error)

The error message indicates:
```
"message": "Request had insufficient authentication scopes."
"reason": "ACCESS_TOKEN_SCOPE_INSUFFICIENT"
"method": "calendar.v3.Events.Insert"
```

**Root Cause**: The `user-oauth-connect` edge function requests `calendar.readonly` scope for Google Meet (line 44), but creating calendar events with Google Meet links requires **write access** to the calendar.

Current scopes in `user-oauth-connect/index.ts` (lines 40-46):
```typescript
"google-meet": {
  scopes: [
    "openid",
    "email", 
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",  // READ-ONLY - WRONG!
    "https://www.googleapis.com/auth/meetings.space.created",
  ],
}
```

**Fix**: Change `calendar.readonly` to `calendar.events` (or `calendar`) to allow creating events:
- `https://www.googleapis.com/auth/calendar.events` - Allows creating/editing events
- `https://www.googleapis.com/auth/calendar` - Full calendar access (includes events)

### Problem 2: TypeScript Build Errors

The `googleMeetMeetingService.ts` file has TypeScript errors because `orgIntegration.config` is typed as `Json` (which could be string, number, array, etc.), but the code accesses `client_id` and `client_secret` properties directly.

**Fix**: Cast the `config` to the expected type or use type assertion.

## Implementation

### File 1: `supabase/functions/user-oauth-connect/index.ts` (MODIFY)

Update Google Meet scopes to include write access:

| Line | Change |
|------|--------|
| 44 | Change `calendar.readonly` to `calendar.events` |

```typescript
"google-meet": {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  scopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",  // WRITE access for creating meetings
    "https://www.googleapis.com/auth/meetings.space.created",
  ],
  additionalParams: {
    access_type: "offline",
    prompt: "consent",
  },
},
```

### File 2: `src/lib/googleMeetMeetingService.ts` (MODIFY)

Fix TypeScript errors by properly typing the config object:

| Lines | Change |
|-------|--------|
| 55-61 | Add interface for config type |
| 63-73 | Cast config to proper type |

```typescript
// Define the expected config structure
interface OrgIntegrationConfig {
  client_id?: string;
  client_secret?: string;
}

// Cast config to the expected type
const config = orgIntegration?.config as OrgIntegrationConfig | null;

if (config?.client_id && config?.client_secret) {
  // Use config.client_id and config.client_secret
}
```

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/user-oauth-connect/index.ts` | MODIFY | Update Google Meet scopes from `calendar.readonly` to `calendar.events` |
| `src/lib/googleMeetMeetingService.ts` | MODIFY | Fix TypeScript errors by adding proper type casting for config object |

## User Action Required

After this fix is deployed, users who have already connected their Google account will need to **disconnect and reconnect** their Google account to grant the new calendar write permissions. The existing token only has read-only access.

## Technical Notes

1. **Scope Options**:
   - `calendar.events` - Create/edit/delete events (recommended, minimal permissions)
   - `calendar` - Full calendar access (more than needed)
   - `calendar.readonly` - Read only (current, insufficient)

2. **Token Refresh**: When users reconnect, they'll go through the consent screen again which will include the new scope. Their refresh token will then have the correct permissions.
