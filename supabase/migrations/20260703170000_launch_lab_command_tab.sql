-- Per-session Launch Command tab (flow | banners | brief)

ALTER TABLE public.launch_lab_sessions
  ADD COLUMN IF NOT EXISTS command_tab TEXT NOT NULL DEFAULT 'flow'
  CHECK (command_tab IN ('flow', 'banners', 'brief'));

COMMENT ON COLUMN public.launch_lab_sessions.command_tab IS
  'Active tab in Launch Command step: flow, banners, or brief';
