-- Fix infinite RLS recursion between launch_lab_sessions and launch_lab_session_shares

DROP POLICY IF EXISTS "Collaborators can view shared launch lab sessions"
  ON public.launch_lab_sessions;

DROP POLICY IF EXISTS "Owners manage launch lab session shares"
  ON public.launch_lab_session_shares;

DROP POLICY IF EXISTS "Recipients view launch lab session shares"
  ON public.launch_lab_session_shares;

CREATE OR REPLACE FUNCTION public.is_launch_lab_session_shared_with_me(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.launch_lab_session_shares sh
    WHERE sh.session_id = p_session_id
      AND sh.shared_with_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_launch_lab_session_shared_with_me(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_launch_lab_session_shared_with_me(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.owns_launch_lab_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.launch_lab_sessions s
    WHERE s.id = p_session_id
      AND s.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.owns_launch_lab_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_launch_lab_session(UUID) TO authenticated;

CREATE POLICY "Collaborators can view shared launch lab sessions"
  ON public.launch_lab_sessions FOR SELECT
  TO authenticated
  USING (public.is_launch_lab_session_shared_with_me(id));

CREATE POLICY "Owners manage launch lab session shares"
  ON public.launch_lab_session_shares FOR ALL
  TO authenticated
  USING (shared_by_user_id = auth.uid() OR public.owns_launch_lab_session(session_id))
  WITH CHECK (public.owns_launch_lab_session(session_id));

CREATE POLICY "Recipients view launch lab session shares"
  ON public.launch_lab_session_shares FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());
