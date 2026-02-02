
# Plan: Add Organization-Level Zoom Configuration to the Zoom Integration Page

## Current Problem

The Zoom integration page at `/admin/integrations/zoom` only shows user-level OAuth connection options. However, before users can connect their personal Zoom accounts, an **administrator must first configure the organization-level Zoom OAuth credentials** (Client ID and Client Secret).

Currently, these credentials should be configured via the generic ProviderDetail page at `/admin/integrations/zoom`, but because there's a specific route for `ZoomIntegration.tsx` that matches first, admins cannot access the configuration form.

## Solution Overview

Add an **Admin Configuration section** to the existing `ZoomIntegration.tsx` page that allows administrators to:
1. View the current organization-level Zoom configuration status
2. Enter and save the Zoom Client ID and Client Secret
3. Test the connection
4. Only show user-level "Connect with Zoom" button once organization config is complete

## Implementation Details

### Changes to `src/pages/admin/integrations/ZoomIntegration.tsx`

1. **Add new imports and hooks**:
   - Import `useIntegrationProvider`, `useIntegrationFields`, `useOrganizationIntegration`, `useUpdateIntegration` from the existing integrations hooks
   - Import `DynamicFormField` component for rendering credential fields

2. **Add organization config state**:
   - Fetch Zoom provider data and fields (client_id, client_secret)
   - Fetch current organization integration config
   - Track form state for credentials

3. **Add Admin Configuration Card** (new section before the user connection card):
   - Show configuration form with Client ID and Client Secret fields
   - Save Configuration button that calls `useUpdateIntegration`
   - Display connection status (configured/not configured)
   - Only show "Connect with Zoom" user button when org config exists and is enabled

4. **Conditional rendering**:
   - If org integration is not configured → Show only admin config card with setup instructions
   - If org integration is configured → Show both admin config card (collapsed/summary) and user connection options

### UI Flow After Implementation

1. Admin navigates to `/admin/integrations/zoom`
2. Admin sees "Organization Configuration" card at top with:
   - Client ID input field
   - Client Secret input field (masked)
   - "Save Configuration" button
   - "Test Connection" button
3. After saving credentials, the user-level connection section becomes active
4. Users can then click "Connect with Zoom" to link their personal accounts

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/integrations/ZoomIntegration.tsx` | Add organization config section with credential form |

### Hooks to Use (already exist)

- `useIntegrationProvider('zoom')` - Get Zoom provider info
- `useIntegrationFields(providerId)` - Get Client ID/Secret field definitions  
- `useOrganizationIntegration(providerId)` - Get current org config
- `useUpdateIntegration()` - Save credentials mutation
- `useTestConnection()` - Test connection mutation

### New UI Components Needed

None - will reuse existing `DynamicFormField` component from `@/components/integrations/DynamicFormField`

### Database State Required

The migration you already approved has added the necessary records:
- `integration_fields` table has `client_id` and `client_secret` entries for Zoom
- `integration_providers` table has Zoom with `oauth_config` populated

After entering credentials via the new form, a row will be created/updated in `organization_integrations` with:
- `provider_id`: Zoom's provider ID
- `config`: `{ "client_id": "...", "client_secret": "..." }`
- `enabled`: true
- `connection_status`: 'connected'
