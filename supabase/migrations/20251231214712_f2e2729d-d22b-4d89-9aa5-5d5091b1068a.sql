-- Superseded by 20251231002142_app_config, 02143_user_invites, 02144_user_status (idempotent no-op).

DO $$ BEGIN
  RAISE NOTICE 'Skipping duplicate app_config/user_invites migration (already applied).';
END $$;
