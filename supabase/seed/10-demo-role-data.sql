-- ============================================================
-- SEED: Demo Role Data — PM & IC project/task assignments
-- Ensures PM and IC dashboards show data out of the box.
-- ============================================================

DO $$
DECLARE
  u_pm UUID := (SELECT id FROM auth.users WHERE email = 'demo@collabai.software' LIMIT 1);
  u_ic UUID := (SELECT id FROM auth.users WHERE email = 'ic@collabai.software'   LIMIT 1);
  p_techstart UUID := (SELECT id FROM projects WHERE slug = 'techstart-ai-integration' LIMIT 1);
  p_qbr      UUID := (SELECT id FROM projects WHERE slug = 'enterprise-qbr-prep'      LIMIT 1);
  p_acme     UUID := (SELECT id FROM projects WHERE slug = 'acme-platform-rollout'     LIMIT 1);
  p_finedge  UUID := (SELECT id FROM projects WHERE slug = 'finedge-poc'               LIMIT 1);
BEGIN
  IF u_pm IS NULL THEN
    RAISE NOTICE 'PM user (demo@collabai.software) not found — skipping.';
    RETURN;
  END IF;
  IF u_ic IS NULL THEN
    RAISE NOTICE 'IC user (ic@collabai.software) not found — skipping.';
    RETURN;
  END IF;

  -- ───────────────────────────────────────────────
  -- 1. Assign PM as owner of 2 projects
  -- ───────────────────────────────────────────────
  UPDATE projects SET owner_id = u_pm WHERE id = p_techstart;
  UPDATE projects SET owner_id = u_pm WHERE id = p_qbr;

  INSERT INTO project_members (project_id, user_id, role) VALUES
    (p_techstart, u_pm, 'owner'),
    (p_qbr,      u_pm, 'owner')
  ON CONFLICT DO NOTHING;

  -- ───────────────────────────────────────────────
  -- 2. Assign IC as member on 2 projects
  -- ───────────────────────────────────────────────
  INSERT INTO project_members (project_id, user_id, role) VALUES
    (p_acme,      u_ic, 'member'),
    (p_techstart, u_ic, 'member')
  ON CONFLICT DO NOTHING;

  -- ───────────────────────────────────────────────
  -- 3. Reassign some tasks to PM (~6)
  -- ───────────────────────────────────────────────
  UPDATE tasks SET assigned_to = u_pm
  WHERE slug IN (
    'implement-sso-entra',
    'create-onboarding-flow',
    'configure-rag-pipeline',
    'setup-zoom-integration',
    'build-qbr-dashboard',
    'client-data-migration'
  );

  -- ───────────────────────────────────────────────
  -- 4. Reassign some tasks to IC (~6)
  -- ───────────────────────────────────────────────
  UPDATE tasks SET assigned_to = u_ic
  WHERE slug IN (
    'fix-meeting-sync-bug',
    'write-api-docs',
    'optimize-embedding-search',
    'design-feedback-widget',
    'update-knowledge-categories',
    'test-webhook-handlers'
  );

  RAISE NOTICE 'Demo role data seeded for PM (%) and IC (%)', u_pm, u_ic;
END $$;
