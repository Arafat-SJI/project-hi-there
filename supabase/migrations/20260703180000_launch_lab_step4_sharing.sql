-- Launch Lab Step 4 (completion) + project sharing with other users

ALTER TABLE public.launch_lab_sessions
  DROP CONSTRAINT IF EXISTS launch_lab_sessions_step_check;

ALTER TABLE public.launch_lab_sessions
  ADD CONSTRAINT launch_lab_sessions_step_check CHECK (step BETWEEN 1 AND 4);

ALTER TABLE public.launch_lab_sessions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.launch_lab_sessions.completed_at IS
  'Timestamp when the user completed Step 4 (Launch Complete).';

CREATE TABLE IF NOT EXISTS public.launch_lab_session_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.launch_lab_sessions(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_launch_lab_session_shares_recipient
  ON public.launch_lab_session_shares(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_launch_lab_session_shares_session
  ON public.launch_lab_session_shares(session_id);

ALTER TABLE public.launch_lab_session_shares ENABLE ROW LEVEL SECURITY;

-- Session owners can share; recipients can see shares granted to them
CREATE POLICY "Owners manage launch lab session shares"
  ON public.launch_lab_session_shares FOR ALL
  TO authenticated
  USING (
    shared_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.launch_lab_sessions s
      WHERE s.id = launch_lab_session_shares.session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.launch_lab_sessions s
      WHERE s.id = launch_lab_session_shares.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Recipients view launch lab session shares"
  ON public.launch_lab_session_shares FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());

-- Collaborators can read shared sessions (read-only via app)
CREATE POLICY "Collaborators can view shared launch lab sessions"
  ON public.launch_lab_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.launch_lab_session_shares sh
      WHERE sh.session_id = launch_lab_sessions.id
        AND sh.shared_with_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.share_launch_lab_session(p_session_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_target UUID;
  v_email TEXT;
BEGIN
  v_email := lower(trim(p_email));
  IF v_email = '' THEN
    RETURN jsonb_build_object('error', 'Email is required');
  END IF;

  SELECT user_id INTO v_owner FROM launch_lab_sessions WHERE id = p_session_id;
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;
  IF v_owner != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Only the project owner can share');
  END IF;

  SELECT id INTO v_target FROM profiles WHERE lower(email) = v_email LIMIT 1;
  IF v_target IS NULL THEN
    RETURN jsonb_build_object('error', 'No user found with that email');
  END IF;
  IF v_target = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot share with yourself');
  END IF;

  INSERT INTO launch_lab_session_shares (session_id, shared_with_user_id, shared_by_user_id)
  VALUES (p_session_id, v_target, auth.uid())
  ON CONFLICT (session_id, shared_with_user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', v_target,
    'email', v_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.share_launch_lab_session(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.share_launch_lab_session(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_launch_lab_session_shares(p_session_id UUID)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  shared_with_user_id UUID,
  shared_with_email TEXT,
  shared_with_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM launch_lab_sessions s
    WHERE s.id = p_session_id AND s.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sh.id,
    sh.session_id,
    sh.shared_with_user_id,
    p.email,
    p.full_name,
    sh.created_at
  FROM launch_lab_session_shares sh
  JOIN profiles p ON p.id = sh.shared_with_user_id
  WHERE sh.session_id = p_session_id
  ORDER BY sh.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_launch_lab_session_shares(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_launch_lab_session_shares(UUID) TO authenticated;

COMMENT ON TABLE public.launch_lab_session_shares IS
  'Launch Lab projects shared with other authenticated users (view access).';
