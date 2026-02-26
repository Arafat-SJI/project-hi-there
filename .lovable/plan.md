

## Diagnosis

The CEO (`ceo@collabai.software`) and IC (`ic@collabai.software`) quick login buttons fail because **these users don't exist in Supabase Auth**. Only `demo@collabai.software` exists (confirmed by network logs showing 400 for CEO/IC and 200 for demo).

The seed scripts never created these auth users — they were referenced in the Login page code but never provisioned in Supabase.

## Fix

You need to create these two users in Supabase Auth, then seed their profiles, roles, and agency role preferences.

### Step 1: Create auth users via Supabase Dashboard

Go to **Supabase Dashboard → Authentication → Users** and manually create:

| Email | Password |
|-------|----------|
| `ceo@collabai.software` | `Demo@123` |
| `ic@collabai.software` | `Demo@123` |

Set "Auto Confirm" to true for both.

### Step 2: Migration to seed profiles + roles + agency preferences

After creating the auth users, note their UUIDs from the dashboard. Then run a migration that:

1. Inserts into `profiles` (full_name, email, avatar_url) for both users
2. Inserts into `user_roles` (user_id, role) — both as `user` role
3. Inserts into `user_role_preferences`:
   - CEO user: `agency_role = 'owner'`, `is_eos_user = true`
   - IC user: `agency_role = 'ic'`, `is_eos_user = false`

The migration will use the UUIDs from step 1.

### Alternative: Single Edge Function approach

Instead of manual dashboard work, create a one-time edge function that uses the service role to call `supabase.auth.admin.createUser()` for both accounts, then seeds profiles/roles/preferences. This is fully automatable.

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Insert profiles, user_roles, user_role_preferences for CEO and IC users |
| *(Optional)* Edge function | Auto-create auth users + seed data in one step |

