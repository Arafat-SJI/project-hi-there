-- Strip base64 banner image blobs from launch_lab_sessions (prevents client OOM on load).
-- Metadata (variant, aspect ratio, post copy) is retained; images regenerate in-browser.

UPDATE public.launch_lab_sessions
SET social_banners = jsonb_set(
  jsonb_set(
    social_banners,
    '{linkedin,imageUrl}',
    'null'::jsonb,
    true
  ),
  '{facebook,imageUrl}',
  'null'::jsonb,
  true
)
WHERE social_banners IS NOT NULL
  AND (
    social_banners #>> '{linkedin,imageUrl}' IS NOT NULL
    OR social_banners #>> '{facebook,imageUrl}' IS NOT NULL
  );
