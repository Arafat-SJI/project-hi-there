-- Demo data for a fixed dev user UUID — skipped during fresh `db push` (no auth.users yet).
-- Run supabase/seed/*.sql after your first signup for demo content.

DO $$ BEGIN
  RAISE NOTICE 'Skipping legacy demo data migration; use supabase/seed after signup.';
END $$;
