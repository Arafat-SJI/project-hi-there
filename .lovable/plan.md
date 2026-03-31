

# Fix: ClickUp Sync "Unexpected token" Error

## Problem

The `syncClickupLocal()` function in `src/lib/clickupLocalSync.ts` makes HTTP requests to `/api/clickup/...` and `/api/openai/...` paths. These work only in local Vite dev server via proxy rules in `vite.config.ts`. In production/preview builds (including Lovable preview), no proxy exists — the SPA serves back `index.html`, which starts with `<!doctype`, causing the JSON parse error.

Both the `/admin/integrations/clickup` "Sync Now" button and the `/settings` "Sync Data" button call `syncClickupLocal()`, so both break.

## Root Cause

```text
vite.config.ts proxy:
  /api/clickup → https://api.clickup.com/api/v2
  /api/openai  → https://api.openai.com/v1

These only work during `npm run dev`. In production builds, these paths
hit the SPA fallback → index.html → "<!doctype" JSON parse error.
```

## Solution

Replace the client-side proxy calls with a **Supabase Edge Function** that proxies ClickUp API requests server-side. This also solves a security issue: the current approach exposes the user's ClickUp access token and OpenAI API key to the browser's network tab.

### 1. Create Edge Function `clickup-api-proxy`
**File:** `supabase/functions/clickup-api-proxy/index.ts`

- Accepts `{ path: string, method?: string, body?: object }` from the frontend
- Authenticates the caller via JWT
- Fetches the user's ClickUp access token from `user_oauth_tokens`
- Proxies the request to `https://api.clickup.com/api/v2/{path}`
- Returns the ClickUp API JSON response

### 2. Create Edge Function `openai-embeddings-proxy`
**File:** `supabase/functions/openai-embeddings-proxy/index.ts`

- Accepts `{ input: string, model?: string }` from the frontend
- Uses the `OPENAI_API_KEY` secret (already configured)
- Calls OpenAI embeddings API server-side
- Returns the embedding vector

### 3. Update `src/lib/clickupLocalSync.ts`

Replace all `fetch("/api/clickup/...")` calls with:
```typescript
const { data, error } = await supabase.functions.invoke("clickup-api-proxy", {
  body: { path: "team" }
});
```

Replace `fetch("/api/openai/embeddings")` with:
```typescript
const { data, error } = await supabase.functions.invoke("openai-embeddings-proxy", {
  body: { input: content }
});
```

### 4. Add config.toml entries

```toml
[functions.clickup-api-proxy]
verify_jwt = false

[functions.openai-embeddings-proxy]
verify_jwt = false
```

### 5. Remove Vite proxy config

Remove the `proxy` block from `vite.config.ts` since it's no longer needed and was masking this production bug.

---

## Technical Details

- No new secrets needed — `OPENAI_API_KEY` is already set, ClickUp token comes from `user_oauth_tokens`
- No database migration needed
- Both edge functions use in-code JWT validation for security
- The edge functions handle CORS properly following project patterns
- ~15 `fetch("/api/clickup/...")` calls and 1 `fetch("/api/openai/...")` call need updating in `clickupLocalSync.ts`

