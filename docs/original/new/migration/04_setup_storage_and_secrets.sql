-- ============================================
-- STORAGE AND SECRETS SETUP
-- ============================================
-- Note: This script documents the setup needed
-- Some commands must be run via Supabase CLI or dashboard

-- ============ STORAGE BUCKET ============
-- Create storage bucket for knowledge base files
-- Run via Supabase dashboard or:
-- supabase client storage.create_bucket('knowledge-base', { public: false })

-- After creating the bucket, add RLS policies:

-- Allow users to upload files
CREATE POLICY "Users can upload knowledge base files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to read their files
CREATE POLICY "Users can read their knowledge base files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete their files
CREATE POLICY "Users can delete their knowledge base files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'knowledge-base'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- ============ ENVIRONMENT SECRETS ============
-- Set these secrets in your Supabase project
-- Via CLI: supabase secrets set KEY=VALUE
-- Or via dashboard: Project Settings > Secrets

/*
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set GOOGLE_API_KEY=xxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
*/

-- ============ EDGE FUNCTIONS ENVIRONMENT ============
-- Make sure these are available in supabase.json:
/*
{
  "functions": {
    "handle-agent-chat": {
      "memory": 1024,
      "timeout": 300
    },
    "process-knowledge-file": {
      "memory": 2048,
      "timeout": 600
    }
  }
}
*/

-- ============ VERIFY SETUP ============
-- Run these checks to verify everything is set up correctly:

-- Check pgvector extension
SELECT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'vector'
) as pgvector_enabled;

-- Check tables exist
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') as agents_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') as conversations_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') as messages_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_files') as knowledge_files_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_chunks') as knowledge_chunks_exists;
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_memory') as agent_memory_exists;

-- Check functions exist
SELECT COUNT(*) as function_count
FROM pg_proc
WHERE proname IN ('match_knowledge_chunks', 'match_memories', 'get_agent_stats', 'get_agent_health');

-- Check RLS is enabled
SELECT tablename, (
  SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename
) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN ('agents', 'conversations', 'messages', 'knowledge_files', 'knowledge_chunks', 'agent_memory')
ORDER BY tablename;
