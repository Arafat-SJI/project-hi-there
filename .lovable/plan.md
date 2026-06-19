## Promote `ceo@collabai.software` to admin

Steps:
1. Look up the user in `auth.users` / `profiles` by email to get their `user_id`.
2. Resolve the admin role's `role_id` from `public.roles` (slug = `admin`, default tenant).
3. Upsert a row into `public.user_roles` with `role = 'admin'` and the resolved `role_id` for this user (on conflict update `role_id`).
4. Call `public.sync_user_app_role(user_id)` to consolidate role rows and ensure the legacy enum + catalog role are aligned.
5. Verify by selecting from `user_roles` joined with `roles` for this user, and confirm `has_role(user_id, 'admin')` returns true.

If the user doesn't exist yet in `auth.users`, I'll stop and ask you to have them sign up first (we can't create auth users from SQL safely here).
