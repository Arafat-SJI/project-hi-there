-- Add suspend/reactivate support to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
