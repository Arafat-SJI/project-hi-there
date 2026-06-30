-- Insert integration fields for Google Drive
INSERT INTO public.integration_fields (
  provider_id, field_key, field_type, label,
  placeholder, help_text, is_required, is_sensitive, display_order
)
SELECT
  p.id,
  v.field_key,
  v.field_type,
  v.label,
  v.placeholder,
  v.help_text,
  v.is_required,
  v.is_sensitive,
  v.display_order
FROM public.integration_providers p
CROSS JOIN (
  VALUES
    ('client_id', 'text', 'Client ID', 'Enter your Google OAuth Client ID', 'Get this from the Google Cloud Console under APIs & Services > Credentials', true, false, 1),
    ('client_secret', 'password', 'Client Secret', 'Enter your Google OAuth Client Secret', 'Get this from the Google Cloud Console under APIs & Services > Credentials', true, true, 2)
) AS v(field_key, field_type, label, placeholder, help_text, is_required, is_sensitive, display_order)
WHERE p.slug = 'google-drive'
ON CONFLICT (provider_id, field_key) DO NOTHING;

NOTIFY pgrst, 'reload schema';