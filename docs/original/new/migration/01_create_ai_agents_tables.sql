-- ============================================
-- AI AGENTS TABLES MIGRATION
-- ============================================
-- Apply this migration to enable AI agents in your Supabase project
-- Run: supabase db push --file migrations/01_create_ai_agents_tables.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(255),

  -- AI Configuration
  model VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'google', 'anthropic')),
  system_prompt TEXT,

  -- Parameters (JSON)
  parameters JSONB DEFAULT '{
    "temperature": 0.7,
    "maxTokens": 2000,
    "topK": 40,
    "topP": 0.9
  }'::jsonb,

  -- Tools Configuration
  tools JSONB DEFAULT '[]'::jsonb,
  tool_code_interpreter BOOLEAN DEFAULT false,
  tool_web_search BOOLEAN DEFAULT false,
  tool_file_search BOOLEAN DEFAULT false,

  -- Knowledge Base Configuration
  knowledge_config JSONB DEFAULT '{
    "enabled": false,
    "fileIds": [],
    "searchScope": "all"
  }'::jsonb,

  -- Ownership & Access
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_workspace_user ON public.agents(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_default ON public.agents(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON public.agents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agents_provider ON public.agents(provider);

-- 2. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title VARCHAR(255),
  summary TEXT,
  is_archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_agent_user ON public.conversations(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INT,
  model_used VARCHAR(100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(conversation_id, role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 4. KNOWLEDGE BASE FILES TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  file_url TEXT NOT NULL,

  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  error_message TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge files
CREATE INDEX IF NOT EXISTS idx_knowledge_files_workspace ON public.knowledge_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_agent ON public.knowledge_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_status ON public.knowledge_files(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_created_at ON public.knowledge_files(created_at DESC);

-- 5. KNOWLEDGE CHUNKS TABLE (FOR RAG)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,

  chunk_index INT,
  content TEXT NOT NULL,
  embedding vector(1536),

  metadata JSONB DEFAULT '{
    "page": null,
    "section": null,
    "source": null
  }'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector index for semantic search (pgvector)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent ON public.knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_file ON public.knowledge_chunks(file_id);

-- 6. AGENT MEMORY TABLE
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  memory_type VARCHAR(50) CHECK (memory_type IN ('summary', 'context', 'pattern', 'fact', 'decision')),
  content TEXT NOT NULL,
  embedding vector(1536),

  relevance_score DECIMAL(3,2),
  access_count INT DEFAULT 0,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector index for memory search
CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON public.agent_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent ON public.agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory(agent_id, memory_type);

-- 7. PROVIDER CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'google', 'anthropic')),
  api_key_encrypted TEXT NOT NULL,
  model_name VARCHAR(100),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_credentials_workspace ON public.provider_credentials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_provider ON public.provider_credentials(workspace_id, provider);

-- 8. RAG METRICS TABLE (Optional - for tracking RAG performance)
CREATE TABLE IF NOT EXISTS public.rag_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  query TEXT,
  retrieved_chunks_count INT,
  top_chunk_similarity DECIMAL(3,2),
  response_time_ms INT,

  was_helpful BOOLEAN,
  feedback_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rag_metrics_agent ON public.rag_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_rag_metrics_created_at ON public.rag_metrics(created_at DESC);
