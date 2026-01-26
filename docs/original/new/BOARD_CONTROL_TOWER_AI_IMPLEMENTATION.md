# Board Control Tower - AI Agents Implementation Guide

**Document Version:** 1.0
**Target Application:** Board Control Tower (Lovable Cloud)
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase
**Purpose:** Step-by-step guide to add AI agents + RAG to your existing application

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Database Migration](#database-migration)
3. [Environment Configuration](#environment-configuration)
4. [Backend: Edge Functions](#backend-edge-functions)
5. [Frontend: React Components](#frontend-react-components)
6. [Integration Steps](#integration-steps)
7. [Testing & Deployment](#testing--deployment)
8. [Implementation Checklist](#implementation-checklist)

---

## Prerequisites & Setup

### What You Need

- ✅ Existing Supabase project (for Board Control Tower)
- ✅ React 18 + TypeScript project
- ✅ Supabase CLI installed
- ✅ At least one AI provider API key:
  - OpenAI: `sk-...` from https://platform.openai.com
  - Google Gemini: From https://aistudio.google.com
  - Anthropic Claude: `sk-ant-...` from https://console.anthropic.com

### Installation

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to your Supabase project
supabase link --project-ref=<your-project-id>

# 3. Verify connection
supabase status
```

---

## Database Migration

### Step 1: Add pgvector Extension

Run this in your Supabase SQL Editor:

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname FROM pg_extension WHERE extname = 'vector';
```

### Step 2: Create AI Agent Tables

Create a new migration file:

```bash
supabase migration new add_ai_agents_tables
```

This creates: `supabase/migrations/[timestamp]_add_ai_agents_tables.sql`

Add this content:

```sql
-- ============================================
-- AI AGENTS TABLES
-- ============================================

-- 1. Agents Configuration
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
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

  -- Tools
  tools JSONB DEFAULT '[]'::jsonb,
  tool_code_interpreter BOOLEAN DEFAULT false,
  tool_web_search BOOLEAN DEFAULT false,
  tool_file_search BOOLEAN DEFAULT false,

  -- Knowledge Base Config
  knowledge_config JSONB DEFAULT '{
    "enabled": false,
    "fileIds": [],
    "searchScope": "all"
  }'::jsonb,

  -- Ownership
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

CREATE INDEX idx_agents_workspace_user ON public.agents(workspace_id, user_id);
CREATE INDEX idx_agents_is_default ON public.agents(user_id, is_default);
CREATE INDEX idx_agents_created_at ON public.agents(created_at DESC);

-- 2. Conversations/Threads
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

CREATE INDEX idx_conversations_agent_user ON public.conversations(agent_id, user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);

-- 3. Messages
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

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- 4. Knowledge Base Files
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

CREATE INDEX idx_knowledge_files_workspace ON public.knowledge_files(workspace_id);
CREATE INDEX idx_knowledge_files_agent ON public.knowledge_files(agent_id);
CREATE INDEX idx_knowledge_files_status ON public.knowledge_files(status);

-- 5. Knowledge Chunks (RAG)
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

CREATE INDEX idx_knowledge_chunks_embedding ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_chunks_agent ON public.knowledge_chunks(agent_id);
CREATE INDEX idx_knowledge_chunks_file ON public.knowledge_chunks(file_id);

-- 6. Agent Memory
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

CREATE INDEX idx_agent_memory_embedding ON public.agent_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_agent_memory_agent ON public.agent_memory(agent_id);

-- 7. Provider Credentials
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

CREATE INDEX idx_provider_credentials_workspace ON public.provider_credentials(workspace_id);

-- 8. RAG Metrics (Optional)
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

CREATE INDEX idx_rag_metrics_agent ON public.rag_metrics(agent_id);
```

### Step 3: Add RLS Policies

Create another migration: `supabase migration new add_agent_rls_policies.sql`

```sql
-- ============================================
-- RLS POLICIES FOR AI AGENTS
-- ============================================

-- Agents RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_select_policy" ON public.agents
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "agents_insert_policy" ON public.agents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

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

-- Conversations RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "conversations_insert_policy" ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_policy" ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_policy" ON public.messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Knowledge Files RLS
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_files_select_policy" ON public.knowledge_files
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Agent Memory RLS
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_memory_select_policy" ON public.agent_memory
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE user_id = auth.uid()
    )
  );
```

### Step 4: Apply Migrations

```bash
# Apply all migrations
supabase db push

# Or for a specific migration
supabase db push --file supabase/migrations/[timestamp]_add_ai_agents_tables.sql
```

---

## Environment Configuration

### Step 1: Create `.env.local`

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx

# AI Provider Keys (Optional on client, required on backend)
VITE_OPENAI_API_KEY=sk-xxxxx
VITE_GOOGLE_API_KEY=xxxxx
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx

# Feature Flags
VITE_ENABLE_AI_AGENTS=true
VITE_ENABLE_RAG=true
VITE_ENABLE_MEMORY=true
```

### Step 2: Store Secrets in Supabase

For Edge Functions, store secrets securely:

```bash
supabase secrets set OPENAI_API_KEY=sk-xxxxx
supabase secrets set GOOGLE_API_KEY=xxxxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Backend: Edge Functions

### Step 1: Create Edge Function for Agent Chat

```bash
supabase functions new handle-agent-chat
```

### Step 2: Implement Handler

**File:** `supabase/functions/handle-agent-chat/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  agentId: string;
  userId: string;
  message: string;
  conversationId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { agentId, userId, message, conversationId } =
      (await req.json()) as ChatRequest;

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch agent config
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get provider credentials
    const { data: credentials } = await supabase
      .from("provider_credentials")
      .select("*")
      .eq("workspace_id", agent.workspace_id)
      .eq("provider", agent.provider)
      .single();

    if (!credentials) {
      return new Response(
        JSON.stringify({ error: "Provider credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get or create conversation
    let conversation = null;
    if (conversationId) {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      conversation = data;
    } else {
      const { data } = await supabase
        .from("conversations")
        .insert({
          agent_id: agentId,
          user_id: userId,
          title: message.slice(0, 50) + "...",
        })
        .select()
        .single();
      conversation = data;
    }

    // 4. Retrieve RAG context if enabled
    let ragContext = "";
    if (agent.knowledge_config?.enabled) {
      const queryEmbedding = await generateEmbedding(
        message,
        credentials.api_key_encrypted,
        agent.provider
      );

      const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: queryEmbedding,
        agent_id: agentId,
        match_count: 5,
      });

      if (chunks && chunks.length > 0) {
        ragContext = chunks
          .map((chunk: any, i: number) => `[${i + 1}] ${chunk.content}`)
          .join("\n\n");
      }
    }

    // 5. Get conversation history
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(20); // Last 20 messages for context

    // 6. Build augmented system prompt
    const systemPrompt = `${agent.system_prompt || "You are a helpful assistant."}

${ragContext ? `KNOWLEDGE BASE:\n${ragContext}` : ""}`;

    // 7. Call AI Provider
    const aiResponse = await callAIProvider({
      provider: agent.provider,
      apiKey: decryptApiKey(credentials.api_key_encrypted),
      model: agent.model,
      systemPrompt,
      messages: [
        ...(messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user", content: message },
      ],
      parameters: agent.parameters,
    });

    // 8. Save messages
    await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        role: "user",
        content: message,
        model_used: agent.model,
      },
      {
        conversation_id: conversation.id,
        role: "assistant",
        content: aiResponse,
        model_used: agent.model,
      },
    ]);

    // 9. Update agent usage count
    await supabase
      .from("agents")
      .update({ usage_count: (agent.usage_count || 0) + 1 })
      .eq("id", agentId);

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateEmbedding(
  text: string,
  apiKey: string,
  provider: string
): Promise<number[]> {
  if (provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  if (provider === "google") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/embedding-001",
          content: { parts: [{ text }] },
        }),
      }
    );

    const data = await response.json();
    return data.embedding.values;
  }

  throw new Error(`Embedding provider ${provider} not supported`);
}

async function callAIProvider(options: {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  parameters: any;
}): Promise<string> {
  if (options.provider === "openai") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: "system", content: options.systemPrompt },
          ...options.messages,
        ],
        temperature: options.parameters?.temperature || 0.7,
        max_tokens: options.parameters?.maxTokens || 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    return data.choices[0].message.content;
  }

  if (options.provider === "google") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${options.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...options.messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          ],
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          generationConfig: {
            temperature: options.parameters?.temperature || 0.7,
            maxOutputTokens: options.parameters?.maxTokens || 2000,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Google API error");
    }

    return data.candidates[0].content.parts[0].text;
  }

  if (options.provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": options.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.parameters?.maxTokens || 2000,
        system: options.systemPrompt,
        messages: options.messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Anthropic API error");
    }

    return data.content[0].text;
  }

  throw new Error(`Provider ${options.provider} not supported`);
}

function decryptApiKey(encrypted: string): string {
  // In production, use actual encryption/decryption
  // For now, return as-is (assuming it's stored securely as secrets)
  return encrypted;
}
```

### Step 3: Deploy Edge Function

```bash
supabase functions deploy handle-agent-chat

# Test it
supabase functions invoke handle-agent-chat --local --body '{
  "agentId": "test-id",
  "userId": "test-user",
  "message": "Hello"
}'
```

---

## Frontend: React Components

### Step 1: Create Agent Chat Component

**File:** `client/src/modules/aiAgents/components/AgentChat.tsx`

```typescript
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Send, Loader2 } from "lucide-react";

interface AgentChatProps {
  agentId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({ agentId }) => {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch agent details
  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
      return data;
    },
  });

  // Fetch messages for conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!conversationId,
  });

  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (text: string) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("handle-agent-chat", {
        body: {
          agentId,
          userId: user.data.user.id,
          message: text,
          conversationId,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      // Refetch messages
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });

      // If new conversation, set ID
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      setInput("");
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  };

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="text-2xl">{agent?.avatar || "🤖"}</div>
        <div>
          <h2 className="font-semibold">{agent?.name}</h2>
          <p className="text-sm text-gray-500">{agent?.description}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Start a conversation...</p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### Step 2: Create Agent Selector

**File:** `client/src/modules/aiAgents/components/AgentSelector.tsx`

```typescript
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface AgentSelectorProps {
  onSelect: (agentId: string) => void;
  selectedId?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  provider: string;
  model: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  onSelect,
  selectedId,
}) => {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*");
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <h3 className="font-semibold text-sm text-gray-700">Select Agent</h3>
      <div className="space-y-2">
        {(agents as Agent[]).map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.id)}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
              selectedId === agent.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">{agent.avatar || "🤖"}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{agent.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {agent.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {agent.provider} • {agent.model}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Step 3: Create Knowledge Base Upload

**File:** `client/src/modules/aiAgents/components/KnowledgeBaseUpload.tsx`

```typescript
import React, { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Upload, Loader2 } from "lucide-react";

interface KnowledgeBaseUploadProps {
  agentId: string;
}

export const KnowledgeBaseUpload: React.FC<KnowledgeBaseUploadProps> = ({
  agentId,
}) => {
  const queryClient = useQueryClient();

  const { mutate: uploadFile, isPending } = useMutation({
    mutationFn: async (file: File) => {
      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get workspace_id from agent
      const { data: agent } = await supabase
        .from("agents")
        .select("workspace_id")
        .eq("id", agentId)
        .single();

      // Create file record
      const { data: fileRecord } = await supabase
        .from("knowledge_files")
        .insert({
          workspace_id: agent.workspace_id,
          agent_id: agentId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();

      // Upload to storage
      const filePath = `knowledge-base/${agent.workspace_id}/${agentId}/${fileRecord.id}`;
      await supabase.storage.from("knowledge-base").upload(filePath, file);

      // Trigger processing via Edge Function
      await supabase.functions.invoke("process-knowledge-file", {
        body: {
          fileId: fileRecord.id,
          filePath,
          agentId,
          workspaceId: agent.workspace_id,
        },
      });

      return fileRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-files"] });
    },
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
    >
      <input
        type="file"
        onChange={handleFileSelect}
        disabled={isPending}
        multiple
        className="hidden"
        id="file-input"
        accept=".pdf,.docx,.txt,.md"
      />

      <label htmlFor="file-input" className="cursor-pointer block">
        {isPending ? (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-600">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, DOCX, TXT, MD • Up to 10MB
            </p>
          </>
        )}
      </label>
    </div>
  );
};
```

### Step 4: Create Main Page Component

**File:** `client/src/modules/aiAgents/pages/AIAgentsPage.tsx`

```typescript
import React, { useState } from "react";
import { AgentSelector } from "../components/AgentSelector";
import { AgentChat } from "../components/AgentChat";
import { KnowledgeBaseUpload } from "../components/KnowledgeBaseUpload";

export const AIAgentsPage: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen p-4 bg-gray-50">
      {/* Sidebar: Agent Selector */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow">
        <div className="border-b p-4">
          <h2 className="font-semibold">AI Agents</h2>
        </div>
        <AgentSelector
          selectedId={selectedAgentId || undefined}
          onSelect={setSelectedAgentId}
        />
      </div>

      {/* Main: Chat */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {selectedAgentId ? (
          <>
            <AgentChat key={selectedAgentId} agentId={selectedAgentId} />

            {/* Knowledge Base Toggle */}
            <div className="bg-white rounded-lg shadow p-4">
              <button
                onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {showKnowledgeBase ? "Hide" : "Show"} Knowledge Base
              </button>

              {showKnowledgeBase && (
                <div className="mt-4">
                  <KnowledgeBaseUpload agentId={selectedAgentId} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-white rounded-lg shadow text-gray-400">
            <p>Select an agent to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Integration Steps

### Step 1: Add Route to Your App

**File:** `client/src/App.tsx`

```typescript
import { AIAgentsPage } from "@/modules/aiAgents/pages/AIAgentsPage";

// Add to your router:
<Route path="/ai-agents" element={<AIAgentsPage />} />
```

### Step 2: Add Navigation Link

Add to your navigation menu:

```typescript
<NavLink to="/ai-agents" className="flex items-center gap-2">
  <Sparkles className="w-4 h-4" />
  AI Agents
</NavLink>
```

### Step 3: Create First Agent

```typescript
// In Supabase SQL or via UI
INSERT INTO agents (
  name,
  description,
  model,
  provider,
  system_prompt,
  workspace_id,
  user_id,
  avatar
) VALUES (
  'Board Assistant',
  'Helps with board meeting preparation',
  'gpt-4',
  'openai',
  'You are a helpful assistant for nonprofit board management.',
  '[workspace-id]',
  '[user-id]',
  '📋'
);
```

### Step 4: Configure Provider Credentials

```typescript
// Store provider API keys (backend/secure only)
INSERT INTO provider_credentials (
  workspace_id,
  provider,
  api_key_encrypted,
  model_name,
  is_active
) VALUES (
  '[workspace-id]',
  'openai',
  '[encrypted-api-key]',
  'gpt-4',
  true
);
```

---

## Testing & Deployment

### Step 1: Test Locally

```bash
# Start your dev server
npm run dev

# In another terminal, test Edge Function
supabase functions invoke handle-agent-chat --local --body '{
  "agentId": "[agent-id]",
  "userId": "[user-id]",
  "message": "Hello"
}'
```

### Step 2: Deploy

```bash
# Deploy Edge Functions to Supabase
supabase functions deploy handle-agent-chat

# Deploy frontend
npm run build
```

### Step 3: Set Environment Variables in Production

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GOOGLE_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Implementation Checklist

### Phase 1: Database Setup (1-2 hours)
- [ ] Create Supabase project or use existing
- [ ] Enable pgvector extension
- [ ] Run database migrations
- [ ] Create storage bucket: `knowledge-base`
- [ ] Apply RLS policies
- [ ] Verify tables and indexes

### Phase 2: Backend Setup (2-3 hours)
- [ ] Create `handle-agent-chat` Edge Function
- [ ] Implement AI provider integration (OpenAI/Google/Anthropic)
- [ ] Set environment secrets
- [ ] Test Edge Function locally
- [ ] Deploy Edge Function

### Phase 3: Frontend Setup (2-3 hours)
- [ ] Create `AgentChat` component
- [ ] Create `AgentSelector` component
- [ ] Create `KnowledgeBaseUpload` component
- [ ] Create `AIAgentsPage` page
- [ ] Add routing
- [ ] Add navigation link

### Phase 4: Testing (1-2 hours)
- [ ] Test agent creation
- [ ] Test chat functionality
- [ ] Test file upload
- [ ] Test with different providers
- [ ] Test error handling

### Phase 5: Deployment (1 hour)
- [ ] Deploy Edge Functions
- [ ] Build and deploy frontend
- [ ] Set production secrets
- [ ] Verify RLS policies
- [ ] Monitor logs

### Phase 6: Extensions (2-4 weeks)
- [ ] [ ] Add streaming responses (SSE)
- [ ] [ ] Add RAG semantic search
- [ ] [ ] Add memory management
- [ ] [ ] Add knowledge base management UI
- [ ] [ ] Add agent analytics dashboard
- [ ] [ ] Add conversation export
- [ ] [ ] Add agent sharing
- [ ] [ ] Add performance monitoring

---

## Common Issues & Solutions

### Issue: API Key Not Working
**Solution:** Verify the key is correct and stored in Supabase secrets:
```bash
supabase secrets list
```

### Issue: pgvector Not Found
**Solution:** Ensure extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: RLS Policies Blocking Access
**Solution:** Check RLS policies are correct and user exists in workspace_members table.

### Issue: Edge Function Timeout
**Solution:** Increase timeout in `supabase.json`:
```json
{
  "functions": {
    "handle-agent-chat": {
      "memory": 1024,
      "timeout": 300
    }
  }
}
```

---

## Next Steps After Implementation

1. **Add RAG with Semantic Search**
   - Process knowledge base files
   - Generate embeddings
   - Implement similarity search

2. **Add Memory Management**
   - Extract conversation summaries
   - Store important facts
   - Retrieve relevant memories

3. **Add Streaming Responses**
   - Implement SSE for real-time tokens
   - Show thinking animations
   - Improve UX

4. **Add Agent Analytics**
   - Track usage metrics
   - Monitor performance
   - Show dashboards

5. **Add Agent Sync Between Systems**
   - Export agents from Board Control Tower
   - Import to CollabAI
   - Keep them in sync

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **pgVector:** https://github.com/pgvector/pgvector
- **OpenAI API:** https://platform.openai.com/docs
- **Google Gemini:** https://ai.google.dev/
- **Anthropic Claude:** https://docs.anthropic.com/

