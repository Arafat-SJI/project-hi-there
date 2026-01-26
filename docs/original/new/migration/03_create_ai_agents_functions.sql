-- ============================================
-- AI AGENTS RPC FUNCTIONS
-- ============================================
-- Database functions for RAG retrieval and memory search

-- ============ MATCH KNOWLEDGE CHUNKS ============
-- Find similar knowledge chunks using vector similarity
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector,
  agent_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE(
  id UUID,
  file_id UUID,
  chunk_index INT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB,
  source_file VARCHAR
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    kc.id,
    kc.file_id,
    kc.chunk_index,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.metadata,
    kf.file_name as source_file
  FROM public.knowledge_chunks kc
  LEFT JOIN public.knowledge_files kf ON kc.file_id = kf.id
  WHERE kc.agent_id = $2
    AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============ MATCH AGENT MEMORIES ============
-- Find similar memories using vector similarity
CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector,
  agent_id UUID,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  memory_type VARCHAR,
  similarity FLOAT,
  relevance_score DECIMAL,
  access_count INT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    am.id,
    am.content,
    am.memory_type,
    1 - (am.embedding <=> query_embedding) as similarity,
    am.relevance_score,
    am.access_count
  FROM public.agent_memory am
  WHERE am.agent_id = $2
    AND (1 - (am.embedding <=> query_embedding)) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============ GET AGENT CONVERSATION SUMMARY ============
-- Get a summary of conversation history
CREATE OR REPLACE FUNCTION public.get_conversation_summary(
  conversation_id UUID,
  max_messages INT DEFAULT 50
)
RETURNS TABLE(
  message_count INT,
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  user_message_count INT,
  assistant_message_count INT,
  first_user_message VARCHAR,
  last_user_message VARCHAR
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    COUNT(*)::INT as message_count,
    MIN(m.created_at) as first_message_at,
    MAX(m.created_at) as last_message_at,
    COUNT(CASE WHEN m.role = 'user' THEN 1 END)::INT as user_message_count,
    COUNT(CASE WHEN m.role = 'assistant' THEN 1 END)::INT as assistant_message_count,
    (SELECT m2.content FROM public.messages m2 WHERE m2.conversation_id = $1 AND m2.role = 'user' ORDER BY m2.created_at ASC LIMIT 1)::VARCHAR,
    (SELECT m2.content FROM public.messages m2 WHERE m2.conversation_id = $1 AND m2.role = 'user' ORDER BY m2.created_at DESC LIMIT 1)::VARCHAR
  FROM public.messages m
  WHERE m.conversation_id = $1
  LIMIT max_messages;
$$;

-- ============ SEARCH CONVERSATIONS ============
-- Full-text search in conversations
CREATE OR REPLACE FUNCTION public.search_conversations(
  search_query TEXT,
  agent_id UUID,
  limit_count INT DEFAULT 20
)
RETURNS TABLE(
  conversation_id UUID,
  title VARCHAR,
  message_preview VARCHAR,
  relevance FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL STABLE
AS $$
  SELECT DISTINCT
    c.id,
    c.title,
    LEFT(m.content, 100) || '...' as message_preview,
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', $1))::FLOAT as relevance,
    c.created_at
  FROM public.conversations c
  INNER JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.agent_id = $2
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', $1)
  ORDER BY relevance DESC, c.created_at DESC
  LIMIT limit_count;
$$;

-- ============ GET AGENT STATS ============
-- Get usage statistics for an agent
CREATE OR REPLACE FUNCTION public.get_agent_stats(
  agent_id UUID
)
RETURNS TABLE(
  total_conversations INT,
  total_messages INT,
  user_messages INT,
  assistant_messages INT,
  total_tokens_used INT,
  avg_messages_per_conversation FLOAT,
  first_conversation_at TIMESTAMP WITH TIME ZONE,
  last_conversation_at TIMESTAMP WITH TIME ZONE,
  unique_users INT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    COUNT(DISTINCT c.id)::INT as total_conversations,
    COUNT(m.id)::INT as total_messages,
    COUNT(CASE WHEN m.role = 'user' THEN 1 END)::INT as user_messages,
    COUNT(CASE WHEN m.role = 'assistant' THEN 1 END)::INT as assistant_messages,
    COALESCE(SUM(m.tokens_used), 0)::INT as total_tokens_used,
    (COUNT(m.id)::FLOAT / NULLIF(COUNT(DISTINCT c.id), 0)) as avg_messages_per_conversation,
    MIN(c.created_at) as first_conversation_at,
    MAX(c.created_at) as last_conversation_at,
    COUNT(DISTINCT c.user_id)::INT as unique_users
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.agent_id = $1;
$$;

-- ============ GET TOP AGENT MEMORIES ============
-- Get the most relevant memories for an agent
CREATE OR REPLACE FUNCTION public.get_top_agent_memories(
  agent_id UUID,
  memory_type_filter VARCHAR DEFAULT NULL,
  limit_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  memory_type VARCHAR,
  relevance_score DECIMAL,
  access_count INT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    am.id,
    am.content,
    am.memory_type,
    am.relevance_score,
    am.access_count,
    am.created_at
  FROM public.agent_memory am
  WHERE am.agent_id = $1
    AND (memory_type_filter IS NULL OR am.memory_type = memory_type_filter)
  ORDER BY am.relevance_score DESC, am.access_count DESC
  LIMIT limit_count;
$$;

-- ============ UPDATE MEMORY ACCESS ============
-- Update memory access count and timestamp
CREATE OR REPLACE FUNCTION public.update_memory_access(
  memory_id UUID
)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE public.agent_memory
  SET
    access_count = access_count + 1,
    accessed_at = NOW()
  WHERE id = memory_id;
$$;

-- ============ GET AGENT HEALTH ============
-- Check agent configuration and readiness
CREATE OR REPLACE FUNCTION public.get_agent_health(
  agent_id UUID
)
RETURNS TABLE(
  agent_name VARCHAR,
  provider_configured BOOLEAN,
  has_knowledge_base BOOLEAN,
  knowledge_files_count INT,
  knowledge_chunks_count INT,
  active_conversations INT,
  is_healthy BOOLEAN
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    a.name,
    EXISTS(
      SELECT 1 FROM public.provider_credentials
      WHERE workspace_id = a.workspace_id AND provider = a.provider AND is_active = true
    ) as provider_configured,
    (a.knowledge_config->>'enabled')::BOOLEAN as has_knowledge_base,
    COALESCE(COUNT(DISTINCT kf.id), 0)::INT as knowledge_files_count,
    COALESCE(COUNT(DISTINCT kc.id), 0)::INT as knowledge_chunks_count,
    (SELECT COUNT(*) FROM public.conversations WHERE agent_id = $1 AND is_archived = false)::INT as active_conversations,
    (
      EXISTS(SELECT 1 FROM public.provider_credentials
             WHERE workspace_id = a.workspace_id AND provider = a.provider AND is_active = true)
      AND a.is_active = true
    ) as is_healthy
  FROM public.agents a
  LEFT JOIN public.knowledge_files kf ON kf.agent_id = a.id
  LEFT JOIN public.knowledge_chunks kc ON kc.agent_id = a.id
  WHERE a.id = $1
  GROUP BY a.id, a.name, a.workspace_id, a.provider, a.knowledge_config, a.is_active;
$$;

-- ============ CLEANUP OLD MEMORIES ============
-- Remove old memories to manage storage
CREATE OR REPLACE FUNCTION public.cleanup_old_memories(
  agent_id UUID,
  days_old INT DEFAULT 90,
  min_relevance_score DECIMAL DEFAULT 0.3
)
RETURNS INT
LANGUAGE SQL
AS $$
  WITH deleted AS (
    DELETE FROM public.agent_memory
    WHERE agent_id = $1
      AND created_at < NOW() - INTERVAL '1 day' * $2
      AND (relevance_score IS NULL OR relevance_score < $3)
      AND access_count < 5  -- Don't delete frequently accessed memories
    RETURNING id
  )
  SELECT COUNT(*)::INT FROM deleted;
$$;

-- ============ GRANT PERMISSIONS ============
-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_memories TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_agent_memories TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_memory_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_health TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_memories TO authenticated;
