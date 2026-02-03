# Plan: Add Zoom Cloud Recording Scopes to OAuth Connect

## Problem

The `sync-zoom-files` function is failing with error:

```
Invalid access token, does not contain scopes:
[cloud_recording:read:list_user_recordings, cloud_recording:read:list_user_recordings:admin]
```

This happens because the `user-oauth-connect` edge function doesn't request cloud recording scopes during the OAuth authorization flow.

## Solution

Update the Zoom provider configuration in `supabase/functions/user-oauth-connect/index.ts` to include the cloud recording scopes that match your Zoom app.

### File to Modify

**`supabase/functions/user-oauth-connect/index.ts`** (lines 52-61)

### Change

Update the Zoom scopes from:

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
    "cloud_recording:read:list_user_recordings",
    "cloud_recording:read:list_recording_files",
    "cloud_recording:read:list_recording_registrants",
  ],
},
```

## Technical Notes

- The scopes must match what's configured in your Zoom Marketplace app (as shown in your screenshot)
- After updating and deploying, **users must reconnect their Zoom account** to get a new token with the updated scopes
- The edge function will be deployed automatically after the code change

## Expected Result

After this change:

1. Users who click "Connect with Zoom" will be prompted to authorize the cloud recording permissions
2. The resulting access token will include the recording scopes
3. The `sync-zoom-files` function will successfully fetch Zoom recordings

**Important**: Existing connected users must **disconnect and reconnect** their Zoom account to get the new scopes.
