-- Register Launch Lab hackathon module in app_modules (sidebar + ModuleRoute access)
INSERT INTO public.app_modules (name, slug, description, icon, category, is_core, is_active, sort_order, dependencies)
VALUES (
  'Launch Lab',
  'launch-lab',
  'Hackathon feature — Pitch Coach and Idea Canvas for startup launch planning',
  'Rocket',
  'intelligence',
  false,
  true,
  11,
  '{platform}'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true;
