
# Plan: Fix Missing Google Meet Integration Fields in Database

## Problem Identified

The Google Meet integration page shows "Loading configuration fields..." because **no rows exist in the `integration_fields` table** for the Google Meet provider.

**Root Cause Analysis:**
- The query `SELECT * FROM integration_fields WHERE provider_id = '815ebb95-78cd-4fcf-a90e-7087006b3ea7'` returns an empty array `[]`
- The component checks `integrationFields && integrationFields.length > 0` (line 316), which fails since the array is empty
- This causes the fallback message "Loading configuration fields..." to display instead of the actual form fields

**Database Evidence:**
- Google Meet provider exists with ID: `815ebb95-78cd-4fcf-a90e-7087006b3ea7`
- Zoom provider has fields configured: `client_id` (text) and `client_secret` (password)
- Google Meet has no corresponding field entries

## Solution

Insert the missing `integration_fields` rows for Google Meet, matching the same pattern as Zoom since both use OAuth2 with client ID and client secret.

## Implementation

### Database Migration

Execute an SQL migration to insert the missing fields:

```sql
-- Insert Google Meet integration fields (client_id and client_secret)
INSERT INTO integration_fields (
  provider_id,
  field_key,
  label,
  field_type,
  is_required,
  display_order,
  placeholder,
  help_text
)
VALUES
  (
    '815ebb95-78cd-4fcf-a90e-7087006b3ea7',
    'client_id',
    'Client ID',
    'text',
    true,
    1,
    'Enter your Google OAuth Client ID',
    'Get this from the Google Cloud Console under APIs & Services > Credentials'
  ),
  (
    '815ebb95-78cd-4fcf-a90e-7087006b3ea7',
    'client_secret',
    'Client Secret',
    'password',
    true,
    2,
    'Enter your Google OAuth Client Secret',
    'Get this from the Google Cloud Console under APIs & Services > Credentials'
  );
```

## Result After Fix

After executing this migration:
1. The Google Meet integration page will display two input fields:
   - **Client ID** - Text input for the OAuth client ID
   - **Client Secret** - Password input (masked) for the OAuth client secret
2. The "Loading configuration fields..." message will be replaced with the actual form
3. Users can save their Google OAuth credentials and connect their Google accounts

## Files Changed

| File | Action |
|------|--------|
| Database migration | **CREATE** - Insert missing `integration_fields` rows |

No frontend code changes required - the existing component already handles displaying fields dynamically.

## Technical Notes

- The field structure matches Zoom's OAuth configuration pattern
- `field_type: 'password'` ensures the client secret is masked in the UI
- The `DynamicFormField` component already handles both `text` and `password` field types correctly
