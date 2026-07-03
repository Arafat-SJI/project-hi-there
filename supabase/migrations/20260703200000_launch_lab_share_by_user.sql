-- Launch Lab: share with users from a directory list (no email typing)

CREATE OR REPLACE FUNCTION public.get_launch_lab_shareable_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.email, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE COALESCE(p.is_active, true) = true
    AND p.id != auth.uid()
  ORDER BY lower(COALESCE(NULLIF(trim(p.full_name), ''), p.email, ''));
$$;

REVOKE ALL ON FUNCTION public.get_launch_lab_shareable_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_launch_lab_shareable_users() TO authenticated;

CREATE OR REPLACE FUNCTION public.share_launch_lab_session_with_user(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User is required');
  END IF;

  SELECT user_id INTO v_owner FROM launch_lab_sessions WHERE id = p_session_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;
  IF v_owner != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the project owner can share');
  END IF;
  IF p_user_id = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot share with yourself');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND COALESCE(is_active, true) = true) THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  INSERT INTO launch_lab_session_shares (session_id, shared_with_user_id, shared_by_user_id)
  VALUES (p_session_id, p_user_id, auth.uid())
  ON CONFLICT (session_id, shared_with_user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.share_launch_lab_session_with_user(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.share_launch_lab_session_with_user(UUID, UUID) TO authenticated;
