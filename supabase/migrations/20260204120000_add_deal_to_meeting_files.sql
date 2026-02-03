ALTER TABLE public.meeting_files
ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

ALTER TABLE public.meeting_files
ADD COLUMN IF NOT EXISTS deal_name text;

CREATE INDEX IF NOT EXISTS idx_meeting_files_deal_id ON public.meeting_files(deal_id);
