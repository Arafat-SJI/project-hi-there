-- ============================================================================
-- Setup Lead Follow-Up System Settings
-- ============================================================================

INSERT INTO system_settings (
  category,
  key,
  value,
  description,
  created_at,
  updated_at
) VALUES
  ('lead_followup', 'min_interval_days', '3'::jsonb, 'Minimum allowed follow-up interval in days', NOW(), NOW()),
  ('lead_followup', 'max_interval_days', '90'::jsonb, 'Maximum allowed follow-up interval in days', NOW(), NOW()),
  ('lead_followup', 'default_interval_days', '7'::jsonb, 'Default follow-up interval in days', NOW(), NOW()),
  ('email_tracking', 'enable_open_tracking', 'true'::jsonb, 'Enable email open tracking via pixels', NOW(), NOW()),
  ('email_tracking', 'enable_click_tracking', 'true'::jsonb, 'Enable email click tracking via link rewriting', NOW(), NOW()),
  ('lead_followup', 'auto_status_enabled', 'true'::jsonb, 'Enable automatic status rule application', NOW(), NOW())
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
