

# Fix: Google Drive Integration Fields & Build Error

## Issue Summary

Two issues need to be addressed:

1. **Google Drive config fields not showing** - The `integration_fields` table has no records for Google Drive provider, causing "Loading configuration fields..." to display indefinitely
2. **Build error** - TypeScript error in `retrieve-agent-memories/index.ts` where `.catch()` is improperly used on a Supabase query builder

---

## Root Cause Analysis

### Issue 1: Missing Database Records

The page queries `integration_fields` for the Google Drive provider ID (`b5c092ce-f08f-4510-8299-0369e6195477`), but this table has **zero matching records**. Compare with working integrations:

| Provider | Fields Present |
|----------|----------------|
| Zoom | client_id, client_secret |
| Google Meet | client_id, client_secret |
| **Google Drive** | **NONE** |

### Issue 2: TypeScript Error

```typescript
// Current (line 206) - INVALID
await supabaseClient.rpc('boost_memory_importance', {...}).catch(() => {...})
```

The Supabase client returns a `PostgrestFilterBuilder`, not a Promise. Using `.catch()` directly is invalid.

---

## Solution

### Step 1: Add Google Drive Integration Fields

Create a migration to insert the missing `client_id` and `client_secret` fields:

```sql
-- Insert integration fields for Google Drive
INSERT INTO integration_fields (
  id, provider_id, field_key, field_type, label, 
  placeholder, help_text, is_required, is_sensitive, display_order
) VALUES 
  (
    gen_random_uuid(),
    'b5c092ce-f08f-4510-8299-0369e6195477',
    'client_id',
    'text',
    'Client ID',
    'Enter your Google OAuth Client ID',
    'Get this from the Google Cloud Console under APIs & Services > Credentials',
    true,
    false,
    1
  ),
  (
    gen_random_uuid(),
    'b5c092ce-f08f-4510-8299-0369e6195477',
    'client_secret',
    'password',
    'Client Secret',
    'Enter your Google OAuth Client Secret',
    'Get this from the Google Cloud Console under APIs & Services > Credentials',
    true,
    true,
    2
  );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

### Step 2: Fix Edge Function Build Error

Update `supabase/functions/retrieve-agent-memories/index.ts` to properly handle the async call:

```typescript
// Change from:
await supabaseClient.rpc('boost_memory_importance', {
  p_memory_id: memoryIds[0],
  p_boost_amount: 0.01
}).catch(() => {
  // Ignore if boost function doesn't exist yet
})

// Change to:
try {
  await supabaseClient.rpc('boost_memory_importance', {
    p_memory_id: memoryIds[0],
    p_boost_amount: 0.01
  })
} catch {
  // Ignore if boost function doesn't exist yet
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| New migration SQL | Add `client_id` and `client_secret` fields for Google Drive |
| `supabase/functions/retrieve-agent-memories/index.ts` | Fix `.catch()` to use try/catch block |

---

## Expected Outcome

After implementation:
- The Google Drive integration page will display the Client ID and Client Secret input fields
- The build error will be resolved
- Users can configure their Google OAuth credentials for Drive integration

