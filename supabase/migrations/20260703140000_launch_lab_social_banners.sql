-- Persist Launch Lab social banner state (images, aspect ratio, suggested posts)

ALTER TABLE public.launch_lab_sessions
  ADD COLUMN IF NOT EXISTS social_banners JSONB;

COMMENT ON COLUMN public.launch_lab_sessions.social_banners IS
  'Social banner images, aspect ratios, and Gemini-suggested post copy per platform';
