-- ============================================
-- AI AGENTS RLS POLICIES
-- ============================================
-- Security policies for AI agents tables
-- Ensures users can only access their own agents and data

-- ============ AGENTS RLS ============
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Users can view agents from their workspace
CREATE POLICY "agents_select_policy" ON public.agents
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create agents in their workspace
CREATE POLICY "agents_insert_policy" ON public.agents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own agents or workspace admin can update any agent
CREATE POLICY "agents_update_policy" ON public.agents
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can delete their own agents
CREATE POLICY "agents_delete_policy" ON public.agents
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============ CONVERSATIONS RLS ============
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations from their agents
CREATE POLICY "conversations_select_policy" ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR agent_id IN (
      SELECT id FROM public.agents WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create conversations
CREATE POLICY "conversations_insert_policy" ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND agent_id IN (
      SELECT id FROM public.agents
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update their conversations
CREATE POLICY "conversations_update_policy" ON public.conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their conversations
CREATE POLICY "conversations_delete_policy" ON public.conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============ MESSAGES RLS ============
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages from their conversations
CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Users can update their messages
CREATE POLICY "messages_update_policy" ON public.messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Users can delete their messages
CREATE POLICY "messages_delete_policy" ON public.messages
  FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- ============ KNOWLEDGE FILES RLS ============
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Users can view files from their workspace
CREATE POLICY "knowledge_files_select_policy" ON public.knowledge_files
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create files in their workspace
CREATE POLICY "knowledge_files_insert_policy" ON public.knowledge_files
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Workspace admin can update files
CREATE POLICY "knowledge_files_update_policy" ON public.knowledge_files
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Workspace admin can delete files
CREATE POLICY "knowledge_files_delete_policy" ON public.knowledge_files
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============ KNOWLEDGE CHUNKS RLS ============
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Users can view chunks from their agents
CREATE POLICY "knowledge_chunks_select_policy" ON public.knowledge_chunks
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============ AGENT MEMORY RLS ============
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Users can view memories from their agents
CREATE POLICY "agent_memory_select_policy" ON public.agent_memory
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============ PROVIDER CREDENTIALS RLS ============
ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

-- Only workspace admin can view credentials
CREATE POLICY "provider_credentials_select_policy" ON public.provider_credentials
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Only workspace admin can create credentials
CREATE POLICY "provider_credentials_insert_policy" ON public.provider_credentials
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Only workspace admin can update credentials
CREATE POLICY "provider_credentials_update_policy" ON public.provider_credentials
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Only workspace admin can delete credentials
CREATE POLICY "provider_credentials_delete_policy" ON public.provider_credentials
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- ============ RAG METRICS RLS ============
ALTER TABLE public.rag_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view metrics for their agents
CREATE POLICY "rag_metrics_select_policy" ON public.rag_metrics
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- System can insert metrics
CREATE POLICY "rag_metrics_insert_policy" ON public.rag_metrics
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM public.agents
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid()
      )
    )
  );
