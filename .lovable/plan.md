
# Plan: Fix Google Meet OAuth Callback - Missing Provider Mapping

## Problem Identified

When users click "Connect with Google" on the Google Meet integration page, the OAuth flow redirects to Google successfully, but after granting permissions, users are redirected to:
```
http://localhost:5173/settings?error=Invalid%20URL%3A%20%27%27
```

### Root Cause

The `user-oauth-callback` edge function is missing the `google-meet` provider in two critical mappings:

1. **Token Endpoint Mapping (line 29-35)**: Returns empty string for `google-meet`
2. **User Info Endpoint (line 38-56)**: Returns empty object for `google-meet`

When the callback receives `provider: "google-meet"` from the oauth_states table, it attempts to fetch tokens from an empty URL, causing the `"Invalid URL: ''"` error.

## Solution

Update the `user-oauth-callback` edge function to handle the `google-meet` provider by mapping it to Google's OAuth endpoints (since Google Meet uses the same Google OAuth infrastructure as regular Google).

## Implementation

### File: supabase/functions/user-oauth-callback/index.ts

**Change 1: Add `google-meet` to token endpoint mapping (lines 29-36)**

```typescript
const getTokenEndpoint = (provider: string): string => {
  const endpoints: Record<string, string> = {
    google: "https://oauth2.googleapis.com/token",
    "google-meet": "https://oauth2.googleapis.com/token",  // ADD THIS LINE
    zoom: "https://zoom.us/oauth/token",
    microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  };
  return endpoints[provider] || "";
};
```

**Change 2: Add `google-meet` case to getUserInfo function (lines 44-56)**

```typescript
switch (provider) {
  case "google":
  case "google-meet":  // ADD THIS CASE
    url = "https://www.googleapis.com/oauth2/v2/userinfo";
    break;
  // ... rest of cases
}
```

**Change 3: Add `google-meet` case to user info normalization (lines 68-75)**

```typescript
switch (provider) {
  case "google":
  case "google-meet":  // ADD THIS CASE
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  // ... rest of cases
}
```

**Change 4: Update redirect logic for Google Meet success (lines 231-239)**

```typescript
let finalRedirect;
if (provider === "zoom") {
  finalRedirect = `${appUrl}/admin/integrations/zoom`;
} else if (provider === "google-meet") {  // ADD THIS CONDITION
  finalRedirect = `${appUrl}/admin/integrations/google-meet`;
} else if (redirect_uri && !redirect_uri.includes("undefined")) {
  finalRedirect = redirect_uri;
} else {
  finalRedirect = `${appUrl}/settings`;
}
```

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/user-oauth-callback/index.ts` | MODIFY | Add google-meet provider support in token endpoint, user info fetch, and redirect logic |

## Testing Steps

After deployment:
1. Navigate to `/admin/integrations/google-meet`
2. Click "Connect with Google"
3. Complete Google OAuth consent flow
4. Verify redirect to `/admin/integrations/google-meet?connected=google-meet`
5. Verify user's Google account shows as connected

## Technical Notes

- Google Meet uses the same Google OAuth2 infrastructure as regular Google services
- The token exchange and user info endpoints are identical
- Only the scopes differ (calendar + meet vs drive), which are already correctly configured in `user-oauth-connect`
