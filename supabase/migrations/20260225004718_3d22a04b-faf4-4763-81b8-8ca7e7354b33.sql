-- Insert agency role preferences when matching auth users exist (demo seed)
INSERT INTO public.user_role_preferences (user_id, role, agency_role, is_eos_user)
SELECT v.user_id::uuid, v.role::app_role, v.agency_role, v.is_eos_user
FROM (
  VALUES
    ('78657387-d518-4b2e-88d8-eca802372ad5', 'admin', 'owner', true),
    ('c4642966-5969-4d55-b3a6-ce850c1e2786', 'user',  'owner', true),
    ('e46a6d4e-d69e-4bf5-9341-ba998e8da243', 'user',  'pm',    false),
    ('d2cdb3a0-fd4b-4e05-8fd9-a3135a9f1d39', 'user',  'ic',    false)
) AS v(user_id, role, agency_role, is_eos_user)
JOIN auth.users u ON u.id = v.user_id::uuid
ON CONFLICT (user_id, role) DO UPDATE SET
  agency_role = EXCLUDED.agency_role,
  is_eos_user = EXCLUDED.is_eos_user;
