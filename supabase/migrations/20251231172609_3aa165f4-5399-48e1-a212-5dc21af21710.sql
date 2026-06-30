-- Grant admin only when the target user exists (fresh-install safe).
INSERT INTO public.user_roles (user_id, role)
SELECT '2d711b86-45bf-43ae-b216-7eb917668b58'::uuid, 'admin'::app_role
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = '2d711b86-45bf-43ae-b216-7eb917668b58'::uuid
)
ON CONFLICT (user_id, role) DO NOTHING;
