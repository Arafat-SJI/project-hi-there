
# Plan: Update Zoom OAuth Scopes in Edge Function

## Problem
The "Invalid scope" error occurs because the `user-oauth-connect` edge function is requesting **outdated Zoom scopes**. Zoom has migrated to a new granular scope format.

## Current vs Required Scopes

| Current (Invalid) | Required (New Format) |
|-------------------|----------------------|
| `meeting:read` | `meeting:read:meeting` |
| `recording:read` | (removed - not in your Zoom app) |
| `user:read` | `user:read:user` |

## Solution

Update the Zoom configuration in `supabase/functions/user-oauth-connect/index.ts` to use the scopes matching your Zoom app configuration.

### File to Modify
**`supabase/functions/user-oauth-connect/index.ts`** (lines 52-59)

### Change
Replace the Zoom provider config from:
```typescript
zoom: {
  authUrl: "https://zoom.us/oauth/authorize",
  scopes: [
    "meeting:read",
    "recording:read",
    "user:read",
  ],
},
```

To:
```typescript
zoom: {
  authUrl: "https://zoom.us/oauth/authorize",
  scopes: [
    "meeting:read:meeting",
    "meeting:write:meeting",
    "meeting:write:open_app",
    "meeting:write:registrant",
    "user:read:user",
  ],
},
```

---

## Technical Notes

- The scopes must **exactly match** what is configured in your Zoom Marketplace app
- The new format uses a 3-part structure: `resource:permission:sub-resource`
- After updating, the edge function will be deployed automatically

## Expected Result
After this change, clicking "Connect with Zoom" will redirect to Zoom's authorization page without the "Invalid scope" error, allowing users to complete the OAuth flow.
