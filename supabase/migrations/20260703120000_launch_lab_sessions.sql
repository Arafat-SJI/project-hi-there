-- Launch Lab: per-user sessions and UI preferences (replaces browser localStorage)

CREATE TABLE IF NOT EXISTS public.launch_lab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step SMALLINT NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 3),
  raw_pitch TEXT NOT NULL DEFAULT '',
  pitch_analysis JSONB,
  canvas JSONB,
  context JSONB NOT NULL DEFAULT '{"pitchType":"investor","audience":"investors","industry":"saas","productName":""}'::jsonb,
  checked_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  launch_board JSONB,
  product_name TEXT NOT NULL DEFAULT '',
  overall_score NUMERIC,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_lab_sessions_user_saved
  ON public.launch_lab_sessions(user_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS public.launch_lab_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_session_id UUID REFERENCES public.launch_lab_sessions(id) ON DELETE SET NULL,
  sidebar_visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_lab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_lab_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own launch lab sessions"
  ON public.launch_lab_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own launch lab sessions"
  ON public.launch_lab_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own launch lab sessions"
  ON public.launch_lab_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own launch lab sessions"
  ON public.launch_lab_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own launch lab preferences"
  ON public.launch_lab_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own launch lab preferences"
  ON public.launch_lab_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own launch lab preferences"
  ON public.launch_lab_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_launch_lab_sessions_updated_at
  BEFORE UPDATE ON public.launch_lab_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_launch_lab_preferences_updated_at
  BEFORE UPDATE ON public.launch_lab_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.launch_lab_sessions IS 'Launch Lab pitch/canvas/board sessions per user';
COMMENT ON TABLE public.launch_lab_preferences IS 'Launch Lab active session and sidebar UI state per user';
