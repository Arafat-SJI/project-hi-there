
# Fix: Google Drive OAuth Callback - Missing Token Endpoint

## Problem

When connecting Google Drive, after granting permissions, users are redirected to `/settings?error=Invalid%20URL%3A%20%27%27`. This happens because the `user-oauth-callback` edge function is missing the `google-drive` provider configuration.

## Root Cause

The `user-oauth-callback/index.ts` has two functions that need `google-drive` support but are missing it:

| Function | Issue |
|----------|-------|
| `getTokenEndpoint()` | Missing `google-drive` entry - returns empty string |
| `getUserInfo()` | Missing `google-drive` case - cannot fetch user profile |

When `getTokenEndpoint("google-drive")` returns `""`, the subsequent `fetch("")` call throws "Invalid URL: ''" error.

## Solution

Add `google-drive` support to both functions in `user-oauth-callback/index.ts`:

### Change 1: Add Token Endpoint

```typescript
const getTokenEndpoint = (provider: string): string => {
  const endpoints: Record<string, string> = {
    google: "https://oauth2.googleapis.com/token",
    "google-meet": "https://oauth2.googleapis.com/token",
    "google-drive": "https://oauth2.googleapis.com/token",  // ADD THIS
    zoom: "https://zoom.us/oauth/token",
    microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  };
  return endpoints[provider] || "";
};
```

### Change 2: Add User Info Handler

```typescript
switch (provider) {
  case "google":
  case "google-meet":
  case "google-drive":  // ADD THIS CASE
    url = "https://www.googleapis.com/oauth2/v2/userinfo";
    break;
  // ... other cases
}

// Also in the response normalization switch:
switch (provider) {
  case "google":
  case "google-meet":
  case "google-drive":  // ADD THIS CASE
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  // ... other cases
}
```

## File Changes

| File | Changes |
|------|---------|
| `supabase/functions/user-oauth-callback/index.ts` | Add `google-drive` to token endpoint and user info handlers |

## Post-Change Action

After code changes, the `user-oauth-callback` edge function needs to be redeployed.

## Expected Result

After fix:
- Google Drive OAuth flow completes successfully
- User is redirected to `/admin/integrations/google-drive?connected=google-drive`
- User tokens are stored in `user_oauth_tokens` table
- Integration shows as connected
