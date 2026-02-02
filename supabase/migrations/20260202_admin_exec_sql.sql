-- ============================================================================
-- Admin Seed SQL Executor
-- ============================================================================
-- Provides a SECURITY DEFINER function that admins can call (via edge function)
-- to execute seed SQL scripts from the admin UI.
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_exec_sql(sql_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $fn$
BEGIN
  EXECUTE sql_content;
  RETURN jsonb_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'state', SQLSTATE,
    'detail', COALESCE(PG_EXCEPTION_DETAIL, ''),
    'hint', COALESCE(PG_EXCEPTION_HINT, '')
  );
END;
$fn$;

-- Restrict: only callable via service-role (edge functions), not via anon/authenticated
REVOKE ALL ON FUNCTION admin_exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION admin_exec_sql(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION admin_exec_sql(TEXT) TO service_role;
