# Universal AI Agents + RAG Framework Guide

**Document Version:** 2.0
**Last Updated:** January 2025
**Purpose:** Framework-agnostic guide for implementing AI agents with RAG, knowledge bases, and multi-provider support
**Target Platforms:** Any project using Supabase (Lovable Cloud, custom backends, etc.)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [RAG Implementation](#rag-implementation)
5. [Knowledge Base & Files](#knowledge-base--files)
6. [Memory Management (pgVector)](#memory-management-pgvector)
7. [AI Provider Integration](#ai-provider-integration)
8. [Agent Framework](#agent-framework)
9. [Edge Functions Implementation](#edge-functions-implementation)
10. [Frontend Integration](#frontend-integration)
11. [Implementation Patterns](#implementation-patterns)
12. [Deployment Guide](#deployment-guide)

---

## Overview

### What is an AI Agent with RAG?

An **AI Agent with RAG** is an autonomous entity that:

1. **Responds intelligently** to user queries using AI models
2. **Retrieves relevant context** from knowledge bases using semantic search
3. **Maintains conversation memory** using vector embeddings
4. **Supports multiple AI providers** (OpenAI, Google Gemini, Claude)
5. **Processes custom instructions** via system prompts
6. **Learns from interactions** via conversation history

### Key Components

```
User Query
    ↓
[Agent Core]
├── System Prompt (Instructions)
├── Memory (pgVector embeddings)
├── Knowledge Base (RAG context)
└── Provider Integration (OpenAI/Gemini/Claude)
    ↓
Retrieve Context (Semantic Search)
    ↓
Generate Response (AI Provider)
    ↓
Store Memory (Vector Embedding)
    ↓
Return to User
```

### Universal Architecture (Framework-Agnostic)

```
┌──────────────────────────────────────────────┐
│         Any Frontend Framework                │
│    (React, Vue, Svelte, etc.)               │
│    (Web, Mobile, Desktop)                    │
└────────────────┬─────────────────────────────┘
                 ↓ HTTP/WebSocket
┌──────────────────────────────────────────────┐
│         API Layer (any backend)               │
│  • REST endpoints                             │
│  • WebSocket for streaming                    │
│  • File upload handling                       │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│     Agent Orchestration Service              │
│  • Agent configuration                        │
│  • Provider routing                           │
│  • Memory/context management                 │
│  • RAG retrieval                             │
└────────────────┬─────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│         Supabase Infrastructure               │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL DB  │  │  pgVector Store  │  │
│  │                 │  │                  │  │
│  │ • agents        │  │ • embeddings     │  │
│  │ • conversations │  │ • memory chunks  │  │
│  │ • files         │  │ • semantic index │  │
│  │ • knowledge_base│  │                  │  │
│  └─────────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────┐    │
│  │  Storage (Files/PDFs/Documents)     │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  Edge Functions (API routing, RAG)  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
                 ↓
┌──────────────────────────────────────────────┐
│      AI Provider APIs                         │
│  • OpenAI (GPT-4, GPT-3.5)                   │
│  • Google Gemini                              │
│  • Anthropic Claude                           │
└──────────────────────────────────────────────┘
```

---

## Architecture

### Layer Pattern

#### 1. **Presentation Layer** (Any Framework)
```
Frontend → API Client → HTTP Requests
```

#### 2. **API Layer** (Your Backend)
```
Routes/Endpoints → Controllers/Handlers → Business Logic
```

#### 3. **Service Layer** (Core Logic)
```
Agent Service → RAG Service → Provider Service → Memory Service
```

#### 4. **Data Access Layer**
```
Supabase Client → PostgreSQL + pgVector
```

#### 5. **External Integration Layer**
```
AI Provider APIs (OpenAI, Gemini, Claude)
```

### Design Patterns

#### Pattern 1: Service-Oriented Architecture
```
Agent needs context → RAG Service → Knowledge Base
Agent needs response → Provider Service → AI API
Agent needs memory → Memory Service → pgVector Store
```

#### Pattern 2: Event-Driven (Optional)
```
User sends message → Event → RAG retrieval starts
RAG completes → Event → Provider call starts
Provider responds → Event → Save to memory
```

#### Pattern 3: Streaming Pattern
```
Provider Stream → Server → Client (SSE/WebSocket)
                ↓
          Save Message
```

---

## Database Schema

### Core Tables (PostgreSQL + pgVector)

#### 1. Agents Table

```sql
-- Main agents configuration
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(255),  -- Emoji or image URL

  -- AI Configuration
  model VARCHAR(100) NOT NULL,  -- gpt-4, gemini-pro, claude-3-opus
  provider VARCHAR(50) NOT NULL,  -- openai, google, anthropic
  system_prompt TEXT,  -- Custom instructions for the agent

  -- Parameters (stored as JSONB)
  parameters JSONB DEFAULT '{
    "temperature": 0.7,
    "maxTokens": 2000,
    "topK": 40,
    "topP": 0.9
  }'::jsonb,

  -- Tool configuration
  tools JSONB DEFAULT '[]'::jsonb,  -- Array of tool definitions
  tool_code_interpreter BOOLEAN DEFAULT false,
  tool_web_search BOOLEAN DEFAULT false,
  tool_file_search BOOLEAN DEFAULT false,

  -- Knowledge base config
  knowledge_config JSONB DEFAULT '{
    "enabled": false,
    "fileIds": [],
    "searchScope": "all"
  }'::jsonb,

  -- Ownership
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_workspace_user ON agents(workspace_id, user_id);
CREATE INDEX idx_agents_is_default ON agents(user_id, is_default);
```

#### 2. Conversations Table

```sql
-- Conversation threads (multiple conversations per agent)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title VARCHAR(255),
  summary TEXT,  -- Auto-generated summary

  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_agent_user ON conversations(agent_id, user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

#### 3. Messages Table

```sql
-- Individual messages in conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL,  -- user, assistant, system
  content TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,  -- tool use, citations, etc.
  tokens_used INT,  -- For cost tracking
  model_used VARCHAR(100),  -- Which model responded

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_role ON messages(conversation_id, role);
```

#### 4. Knowledge Base Files

```sql
-- Uploaded files for RAG
CREATE TABLE knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),  -- pdf, docx, txt, etc.
  file_size INT,
  file_url TEXT NOT NULL,  -- Supabase Storage path

  status VARCHAR(50) DEFAULT 'processing',  -- processing, ready, failed
  error_message TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_files_workspace ON knowledge_files(workspace_id);
CREATE INDEX idx_knowledge_files_agent ON knowledge_files(agent_id);
CREATE INDEX idx_knowledge_files_status ON knowledge_files(status);
```

#### 5. Knowledge Chunks (for RAG)

```sql
-- Text chunks extracted from files (for RAG retrieval)
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES knowledge_files(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  chunk_index INT,
  content TEXT NOT NULL,  -- The actual text chunk

  -- pgVector embedding (1536 dimensions for OpenAI embeddings)
  embedding vector(1536),

  -- Metadata for citation
  metadata JSONB DEFAULT '{
    "page": null,
    "section": null,
    "source": null
  }'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector index for semantic search (pgvector)
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_knowledge_chunks_agent ON knowledge_chunks(agent_id);
CREATE INDEX idx_knowledge_chunks_file ON knowledge_chunks(file_id);
```

#### 6. Agent Memory (pgVector)

```sql
-- Long-term memory for agents (conversation summaries, patterns)
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  memory_type VARCHAR(50),  -- summary, context, pattern, fact
  content TEXT NOT NULL,  -- What to remember

  -- Vector embedding of the memory
  embedding vector(1536),

  relevance_score DECIMAL(3,2),  -- How important
  access_count INT DEFAULT 0,  -- How often used

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semantic search index
CREATE INDEX idx_agent_memory_embedding ON agent_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_agent_memory_agent ON agent_memory(agent_id);
CREATE INDEX idx_agent_memory_type ON agent_memory(agent_id, memory_type);
```

#### 7. Provider Configurations

```sql
-- Store API keys for different providers per workspace
CREATE TABLE provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  provider VARCHAR(50) NOT NULL,  -- openai, google, anthropic
  api_key TEXT NOT NULL,  -- Encrypted in Supabase
  model_name VARCHAR(100),  -- Default model for this provider

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_provider_credentials_workspace ON provider_credentials(workspace_id);
```

#### 8. RAG Metrics (Optional)

```sql
-- Track RAG performance
CREATE TABLE rag_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  query TEXT,
  retrieved_chunks_count INT,
  top_chunk_similarity DECIMAL(3,2),
  response_time_ms INT,

  was_helpful BOOLEAN,  -- User feedback
  feedback_text TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rag_metrics_agent ON rag_metrics(agent_id);
```

---

## RAG Implementation

### What is RAG?

**Retrieval-Augmented Generation** combines:
1. **Retrieval** - Find relevant documents
2. **Augmentation** - Add context to the prompt
3. **Generation** - Generate response with context

### RAG Flow

```
User Query
    ↓
1. Generate Query Embedding (OpenAI, Gemini, or local model)
    ↓
2. Semantic Search in pgVector (find similar chunks)
    ↓
3. Retrieve Top K Results (similarity > threshold)
    ↓
4. Augment Prompt with Retrieved Context
    ↓
5. Send to AI Provider with Enhanced Prompt
    ↓
Response with Citations
```

### Implementation Steps

#### Step 1: Extract & Chunk Knowledge Base Files

```typescript
// Deno Edge Function or Node.js service
interface ChunkOptions {
  chunkSize: number;  // tokens
  chunkOverlap: number;  // tokens
}

async function chunkDocument(
  fileContent: string,
  options: ChunkOptions = { chunkSize: 500, chunkOverlap: 100 }
): Promise<string[]> {
  // Split by sentences/paragraphs first
  const sentences = fileContent.match(/[^.!?]+[.!?]+/g) || [];

  const chunks: string[] = [];
  let currentChunk = '';
  let tokenCount = 0;

  for (const sentence of sentences) {
    const sentenceTokens = sentence.trim().split(/\s+/).length;

    if (tokenCount + sentenceTokens > options.chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Overlap: keep last sentences
      currentChunk = chunks[chunks.length - 1]
        .split(/[.!?]+/)
        .slice(-2)  // Keep last 2 sentences for overlap
        .join('. ') + '. ';
      tokenCount = currentChunk.split(/\s+/).length;
    }

    currentChunk += sentence;
    tokenCount += sentenceTokens;
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}
```

#### Step 2: Generate Embeddings

```typescript
// Using OpenAI API
async function generateEmbedding(text: string, provider: string = 'openai'): Promise<number[]> {
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',  // or text-embedding-3-large
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  if (provider === 'google') {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': process.env.GOOGLE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'models/embedding-001',
        content: { parts: [{ text }] }
      })
    });

    const data = await response.json();
    return data.embedding.values;
  }

  throw new Error(`Embedding provider ${provider} not supported`);
}
```

#### Step 3: Store Chunks with Embeddings in pgVector

```sql
-- Insert chunks into knowledge_chunks with embeddings
INSERT INTO knowledge_chunks (
  file_id,
  agent_id,
  chunk_index,
  content,
  embedding,
  metadata
) VALUES (
  $1,  -- file_id
  $2,  -- agent_id
  $3,  -- chunk_index
  $4,  -- content (text)
  $5::vector,  -- embedding (1536 dimensions)
  $6  -- metadata (JSON)
)
ON CONFLICT DO NOTHING;
```

#### Step 4: Semantic Search for Relevant Chunks

```sql
-- Find most relevant chunks using cosine similarity
SELECT
  id,
  content,
  metadata,
  1 - (embedding <=> $1::vector) as similarity_score
FROM knowledge_chunks
WHERE agent_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

#### Step 5: Augment Prompt with Retrieved Context

```typescript
async function generateAugmentedPrompt(
  userQuery: string,
  retrievedChunks: string[],
  agentSystemPrompt: string
): Promise<string> {
  const context = retrievedChunks.map((chunk, i) =>
    `[Source ${i + 1}]\n${chunk}`
  ).join('\n\n');

  return `${agentSystemPrompt}

KNOWLEDGE BASE CONTEXT:
${context}

USER QUERY:
${userQuery}

Please respond based on the provided knowledge base context above. If the answer isn't in the context, say so.`;
}
```

---

## Knowledge Base & Files

### File Upload and Processing

```typescript
// Edge Function for file upload
export async function handleFileUpload(
  file: File,
  agentId: string,
  workspaceId: string
): Promise<{ fileId: string; status: string }> {
  // 1. Upload file to Supabase Storage
  const filePath = `knowledge-base/${workspaceId}/${agentId}/${Date.now()}_${file.name}`;

  const { data: uploadData, error: uploadError } = await supabaseClient
    .storage
    .from('knowledge-base')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Insert file metadata
  const { data: fileRecord } = await supabaseClient
    .from('knowledge_files')
    .insert({
      workspace_id: workspaceId,
      agent_id: agentId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: filePath,
      status: 'processing'
    })
    .select()
    .single();

  // 3. Trigger processing (extract text, create chunks)
  await triggerFileProcessing(fileRecord.id, filePath);

  return { fileId: fileRecord.id, status: 'processing' };
}
```

### Text Extraction from Different Formats

```typescript
// Handle PDF, DOCX, TXT, etc.
async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  if (fileType === 'text/plain' || fileType === 'application/json') {
    const file = await supabaseClient.storage.from('knowledge-base').download(filePath);
    return new TextDecoder().decode(file);
  }

  if (fileType === 'application/pdf') {
    // Use PDF library (pdfjs, pdfparse, etc.)
    const PDFParser = require('pdf-parse');
    const file = await supabaseClient.storage.from('knowledge-base').download(filePath);
    const parsed = await PDFParser(file);
    return parsed.text;
  }

  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Use DOCX library
    const mammoth = require('mammoth');
    const file = await supabaseClient.storage.from('knowledge-base').download(filePath);
    const result = await mammoth.extractRawText({ arrayBuffer: file });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
```

### Automatic File Processing Pipeline

```typescript
// Supabase Edge Function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req: Request) => {
  const { fileId, filePath, workspaceId, agentId } = await req.json();

  try {
    // 1. Extract text
    const text = await extractTextFromFile(filePath);

    // 2. Split into chunks
    const chunks = await chunkDocument(text);

    // 3. Generate embeddings for each chunk
    const embeddings = await Promise.all(
      chunks.map(chunk => generateEmbedding(chunk))
    );

    // 4. Store in knowledge_chunks
    for (let i = 0; i < chunks.length; i++) {
      await supabaseClient
        .from('knowledge_chunks')
        .insert({
          file_id: fileId,
          agent_id: agentId,
          chunk_index: i,
          content: chunks[i],
          embedding: embeddings[i],
          metadata: { source: filePath }
        });
    }

    // 5. Update file status
    await supabaseClient
      .from('knowledge_files')
      .update({ status: 'ready' })
      .eq('id', fileId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    // Update with error status
    await supabaseClient
      .from('knowledge_files')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', fileId);

    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

## Memory Management (pgVector)

### Agent Memory Types

```typescript
type MemoryType =
  | 'summary'      // Conversation summaries
  | 'context'      // User preferences, background
  | 'pattern'      // Learned user patterns
  | 'fact'         // Important facts
  | 'decision';    // Previous decisions

interface AgentMemory {
  id: string;
  agentId: string;
  memoryType: MemoryType;
  content: string;
  embedding: number[];  // pgVector
  relevanceScore: number;
  accessCount: number;
  createdAt: Date;
  accessedAt: Date;
}
```

### Store Memory from Conversations

```typescript
// After each conversation, extract and store memories
async function storeConversationMemory(
  agentId: string,
  conversationId: string,
  messages: Message[]
) {
  // 1. Summarize conversation
  const summary = await summarizeConversation(messages);

  // 2. Extract key facts
  const facts = await extractKeyFacts(messages);

  // 3. Generate embeddings
  const summaryEmbedding = await generateEmbedding(summary);
  const factsEmbedding = await generateEmbedding(facts.join(', '));

  // 4. Store memories
  await supabaseClient
    .from('agent_memory')
    .insert([
      {
        agent_id: agentId,
        memory_type: 'summary',
        content: summary,
        embedding: summaryEmbedding,
        relevance_score: 0.8
      },
      {
        agent_id: agentId,
        memory_type: 'fact',
        content: facts.join('; '),
        embedding: factsEmbedding,
        relevance_score: 0.9
      }
    ]);
}
```

### Retrieve Relevant Memories

```typescript
// Before generating response, retrieve relevant memories
async function retrieveRelevantMemories(
  agentId: string,
  query: string,
  limit: number = 3
) {
  // Generate embedding of current query
  const queryEmbedding = await generateEmbedding(query);

  // Search for similar memories
  const { data: memories } = await supabaseClient
    .rpc('match_memories', {
      query_embedding: queryEmbedding,
      agent_id: agentId,
      match_count: limit,
      match_threshold: 0.7
    });

  // Update access count and timestamp
  for (const memory of memories) {
    await supabaseClient
      .from('agent_memory')
      .update({
        access_count: memory.access_count + 1,
        accessed_at: new Date()
      })
      .eq('id', memory.id);
  }

  return memories;
}
```

### Create Custom RPC for Memory Search

```sql
-- Add to your Supabase database
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector,
  agent_id uuid,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  memory_type VARCHAR,
  similarity FLOAT,
  relevance_score DECIMAL
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    am.id,
    am.content,
    am.memory_type,
    1 - (am.embedding <=> query_embedding) as similarity,
    am.relevance_score
  FROM agent_memory am
  WHERE am.agent_id = $2
    AND (1 - (am.embedding <=> query_embedding)) > match_threshold
  ORDER BY am.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## AI Provider Integration

### Multi-Provider Architecture

```typescript
interface AIProvider {
  name: 'openai' | 'google' | 'anthropic';
  sendMessage(params: MessageParams): Promise<string>;
  streamMessage(params: MessageParams): AsyncGenerator<string>;
  getEmbedding(text: string): Promise<number[]>;
}

class OpenAIProvider implements AIProvider {
  name = 'openai';

  async sendMessage(params: MessageParams): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async *streamMessage(params: MessageParams): AsyncGenerator<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        stream: true,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000
      })
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = new TextDecoder().decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.choices[0]?.delta?.content) {
            yield data.choices[0].delta.content;
          }
        }
      }
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}

class GoogleProvider implements AIProvider {
  name = 'google';

  async sendMessage(params: MessageParams): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: params.messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.maxTokens || 2000
          }
        })
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  // Similar for streaming and embeddings...
}

class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  async sendMessage(params: MessageParams): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens || 2000,
        system: params.systemPrompt,
        messages: params.messages
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  // Similar for streaming and embeddings...
}

// Provider Factory
function getProvider(provider: string, apiKey: string): AIProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

---

## Agent Framework

### Agent Configuration

```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: 'openai' | 'google' | 'anthropic';

  parameters: {
    temperature: number;
    maxTokens: number;
    topK?: number;
    topP?: number;
  };

  tools: {
    codeInterpreter: boolean;
    webSearch: boolean;
    fileSearch: boolean;
  };

  knowledgeConfig: {
    enabled: boolean;
    fileIds: string[];
  };

  metadata: Record<string, any>;
}
```

### Core Agent Class

```typescript
class Agent {
  id: string;
  config: Agent;
  provider: AIProvider;
  ragService: RAGService;
  memoryService: MemoryService;

  constructor(config: Agent, provider: AIProvider) {
    this.config = config;
    this.provider = provider;
    this.ragService = new RAGService();
    this.memoryService = new MemoryService();
  }

  async chat(
    userMessage: string,
    conversationId: string
  ): Promise<{ response: string; citations: string[] }> {
    // 1. Retrieve memories
    const memories = await this.memoryService.retrieve(this.id, userMessage);

    // 2. Retrieve knowledge base context
    let context = '';
    let citations: string[] = [];

    if (this.config.knowledgeConfig.enabled) {
      const { chunks, sources } = await this.ragService.retrieve(
        this.id,
        userMessage
      );
      context = chunks.map((c, i) => `[${i+1}] ${c}`).join('\n');
      citations = sources;
    }

    // 3. Build augmented prompt
    const systemPrompt = `${this.config.systemPrompt}

${memories.length > 0 ? `RELEVANT CONTEXT:\n${memories.map(m => m.content).join('\n')}` : ''}

${context ? `KNOWLEDGE BASE:\n${context}` : ''}`;

    // 4. Get messages from conversation
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // 5. Send to provider
    const response = await this.provider.sendMessage({
      model: this.config.model,
      systemPrompt,
      messages: [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ],
      temperature: this.config.parameters.temperature,
      maxTokens: this.config.parameters.maxTokens
    });

    // 6. Save message and response
    await supabaseClient.from('messages').insert([
      { conversation_id: conversationId, role: 'user', content: userMessage },
      { conversation_id: conversationId, role: 'assistant', content: response }
    ]);

    // 7. Store memory from interaction
    await this.memoryService.store(this.id, conversationId, {
      userMessage,
      response,
      timestamp: new Date()
    });

    return { response, citations };
  }

  async *chatStream(
    userMessage: string,
    conversationId: string
  ): AsyncGenerator<string> {
    // Similar to chat but yields chunks
    const { memories } = await this.memoryService.retrieve(this.id, userMessage);
    const { chunks } = await this.ragService.retrieve(this.id, userMessage);

    const systemPrompt = this.buildPrompt(memories, chunks);

    const messages = await this.getMessages(conversationId);

    // Stream from provider
    for await (const chunk of this.provider.streamMessage({
      model: this.config.model,
      systemPrompt,
      messages,
      temperature: this.config.parameters.temperature,
      maxTokens: this.config.parameters.maxTokens
    })) {
      yield chunk;
    }
  }

  private buildPrompt(memories: Memory[], chunks: string[]): string {
    return `${this.config.systemPrompt}
${memories.map(m => m.content).join('\n')}
${chunks.join('\n')}`;
  }

  private async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    return data || [];
  }
}
```

---

## Edge Functions Implementation

### Setup Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize
supabase init

# Create new function
supabase functions new handle-agent-chat
```

### Agent Chat Handler (Deno Edge Function)

```typescript
// supabase/functions/handle-agent-chat/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agentId, userId, message, conversationId } = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch agent config
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return new Response('Agent not found', { status: 404, headers: corsHeaders });
    }

    // 2. Get provider credentials
    const { data: credentials } = await supabase
      .from('provider_credentials')
      .select('*')
      .eq('provider', agent.provider)
      .single();

    // 3. Retrieve RAG context if enabled
    let context = '';
    if (agent.knowledge_config?.enabled) {
      const queryEmbedding = await generateEmbedding(message, credentials.api_key, agent.provider);

      const { data: chunks } = await supabase
        .rpc('match_knowledge_chunks', {
          query_embedding: queryEmbedding,
          agent_id: agentId,
          match_count: 5
        });

      context = chunks.map((c: any, i: number) => `[${i+1}] ${c.content}`).join('\n');
    }

    // 4. Retrieve memories
    const queryEmbedding = await generateEmbedding(message, credentials.api_key, agent.provider);
    const { data: memories } = await supabase
      .rpc('match_memories', {
        query_embedding: queryEmbedding,
        agent_id: agentId,
        match_count: 3
      });

    // 5. Build augmented system prompt
    const systemPrompt = `${agent.system_prompt}

${memories.length > 0 ? `AGENT MEMORY:\n${memories.map((m: any) => m.content).join('\n')}` : ''}

${context ? `KNOWLEDGE BASE:\n${context}` : ''}`;

    // 6. Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // 7. Call AI provider
    const response = await callAIProvider({
      provider: agent.provider,
      apiKey: credentials.api_key,
      model: agent.model,
      systemPrompt,
      messages: [
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      temperature: agent.parameters?.temperature || 0.7,
      maxTokens: agent.parameters?.maxTokens || 2000
    });

    // 8. Save messages
    await supabase.from('messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: response }
    ]);

    // 9. Store memory
    const responseEmbedding = await generateEmbedding(response, credentials.api_key, agent.provider);
    await supabase.from('agent_memory').insert({
      agent_id: agentId,
      memory_type: 'context',
      content: `User asked: "${message}", Agent responded about...`,
      embedding: responseEmbedding,
      relevance_score: 0.7
    });

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateEmbedding(
  text: string,
  apiKey: string,
  provider: string
): Promise<number[]> {
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  // Similar for Google Gemini, Anthropic...
  throw new Error(`Provider ${provider} not supported`);
}

async function callAIProvider(options: any): Promise<string> {
  if (options.provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: 'system', content: options.systemPrompt },
          ...options.messages
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // Similar for other providers...
  throw new Error(`Provider ${options.provider} not supported`);
}
```

### Deploy Edge Function

```bash
# Deploy to Supabase
supabase functions deploy handle-agent-chat

# Set environment variables
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GOOGLE_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Frontend Integration

### React Component Example

```typescript
// components/AgentChat.tsx
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AgentChatProps {
  agentId: string;
  conversationId: string;
}

export const AgentChat: React.FC<AgentChatProps> = ({ agentId, conversationId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  // Fetch agent config
  const { data: agent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
      return data;
    }
  });

  // Fetch messages
  const { data: conversationMessages } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at');
      return data || [];
    }
  });

  // Send message
  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (text: string) => {
      const response = await supabase.functions.invoke('handle-agent-chat', {
        body: { agentId, userId: (await supabase.auth.getUser()).data.user?.id, message: text, conversationId }
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
      // Refetch messages
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(conversationMessages || []).map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
```

### Knowledge Base Upload

```typescript
// components/KnowledgeBaseUpload.tsx
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface KnowledgeBaseUploadProps {
  agentId: string;
}

export const KnowledgeBaseUpload: React.FC<KnowledgeBaseUploadProps> = ({ agentId }) => {
  const { mutate: uploadFile, isPending } = useMutation({
    mutationFn: async (file: File) => {
      // Create file record
      const { data: fileRecord } = await supabase
        .from('knowledge_files')
        .insert({
          agent_id: agentId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          status: 'processing'
        })
        .select()
        .single();

      // Upload to storage
      const filePath = `knowledge-base/${agentId}/${fileRecord.id}`;
      await supabase.storage.from('knowledge-base').upload(filePath, file);

      // Trigger processing via Edge Function
      await supabase.functions.invoke('process-knowledge-file', {
        body: { fileId: fileRecord.id, filePath }
      });

      return fileRecord;
    }
  });

  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
      onClick={() => document.getElementById('file-input')?.click()}>
      <input
        id="file-input"
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => uploadFile(file));
        }}
        disabled={isPending}
        className="hidden"
      />
      <p>Drop files here or click to upload</p>
      <p className="text-sm text-gray-500">PDF, DOCX, TXT supported</p>
    </div>
  );
};
```

---

## Implementation Patterns

### Pattern 1: Simple AI Chat (No RAG)

```typescript
// Minimal setup: just agent + AI provider
async function simpleChat(agentId: string, message: string): Promise<string> {
  const agent = await getAgent(agentId);
  const provider = getProvider(agent.provider, apiKey);

  const response = await provider.sendMessage({
    model: agent.model,
    systemPrompt: agent.systemPrompt,
    messages: [{ role: 'user', content: message }],
    temperature: agent.parameters.temperature
  });

  return response;
}
```

### Pattern 2: AI Chat + RAG

```typescript
// Add knowledge base retrieval
async function chatWithRAG(agentId: string, message: string): Promise<string> {
  const agent = await getAgent(agentId);

  // Get RAG context
  const queryEmbedding = await generateEmbedding(message);
  const chunks = await retrieveKnowledgeChunks(agentId, queryEmbedding, 5);
  const context = chunks.map((c, i) => `[${i+1}] ${c.content}`).join('\n');

  // Build prompt
  const systemPrompt = `${agent.systemPrompt}\n\nKNOWLEDGE BASE:\n${context}`;

  // Get response
  const provider = getProvider(agent.provider, apiKey);
  return await provider.sendMessage({
    model: agent.model,
    systemPrompt,
    messages: [{ role: 'user', content: message }],
    temperature: agent.parameters.temperature
  });
}
```

### Pattern 3: AI Chat + RAG + Memory

```typescript
// Full-featured with memory management
async function chatWithMemory(agentId: string, conversationId: string, message: string): Promise<string> {
  const agent = await getAgent(agentId);

  // 1. Retrieve memories
  const queryEmbedding = await generateEmbedding(message);
  const memories = await retrieveAgentMemories(agentId, queryEmbedding, 3);

  // 2. Retrieve RAG context
  const chunks = await retrieveKnowledgeChunks(agentId, queryEmbedding, 5);
  const context = chunks.map((c, i) => `[${i+1}] ${c.content}`).join('\n');

  // 3. Build augmented prompt
  const systemPrompt = `${agent.systemPrompt}
${memories.length > 0 ? `AGENT MEMORY:\n${memories.map(m => m.content).join('\n')}` : ''}
${context ? `KNOWLEDGE BASE:\n${context}` : ''}`;

  // 4. Get conversation history
  const history = await getConversationHistory(conversationId);

  // 5. Generate response
  const provider = getProvider(agent.provider, apiKey);
  const response = await provider.sendMessage({
    model: agent.model,
    systemPrompt,
    messages: [...history, { role: 'user', content: message }],
    temperature: agent.parameters.temperature
  });

  // 6. Save interaction and memories
  await saveMessage(conversationId, 'user', message);
  await saveMessage(conversationId, 'assistant', response);
  await saveMemory(agentId, { content: `User: ${message}`, embedding: queryEmbedding });

  return response;
}
```

### Pattern 4: Streaming Chat

```typescript
// Real-time streaming response
async function *chatStream(agentId: string, message: string): AsyncGenerator<string> {
  const agent = await getAgent(agentId);
  const provider = getProvider(agent.provider, apiKey);

  const queryEmbedding = await generateEmbedding(message);
  const chunks = await retrieveKnowledgeChunks(agentId, queryEmbedding, 5);
  const context = chunks.map((c, i) => `[${i+1}] ${c.content}`).join('\n');

  const systemPrompt = `${agent.systemPrompt}\n\nKNOWLEDGE BASE:\n${context}`;

  // Stream tokens
  for await (const token of provider.streamMessage({
    model: agent.model,
    systemPrompt,
    messages: [{ role: 'user', content: message }],
    temperature: agent.parameters.temperature
  })) {
    yield token;
  }
}
```

---

## Deployment Guide

### Deploy to Supabase (Recommended for Lovable Cloud)

```bash
# 1. Clone your project
git clone <your-repo>
cd <your-project>

# 2. Install Supabase CLI
npm install -g supabase

# 3. Link to your project
supabase link --project-ref=<your-project-id>

# 4. Run migrations
supabase db push

# 5. Deploy Edge Functions
supabase functions deploy handle-agent-chat
supabase functions deploy process-knowledge-file

# 6. Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GOOGLE_API_KEY=...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# 7. Start development
npm run dev
```

### Environment Variables (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# AI Providers (client-side optional, backend required)
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Feature flags
VITE_ENABLE_RAG=true
VITE_ENABLE_MEMORY=true
```

### Row-Level Security (RLS) Policies

```sql
-- Agents: Users can only see their own agents
CREATE POLICY "Users can view their own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Conversations: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Messages: Users can only see messages from their conversations
CREATE POLICY "Users can view their conversation messages"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- Knowledge files: Users can only see their workspace files
CREATE POLICY "Users can view workspace knowledge files"
  ON knowledge_files FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid()
  ));

-- Agent memory: Users can only access their agent memories
CREATE POLICY "Users can access their agent memories"
  ON agent_memory FOR SELECT
  USING (agent_id IN (
    SELECT id FROM agents WHERE user_id = auth.uid()
  ));
```

---

## Quick Start Checklist

### Phase 1: Setup (Week 1)
- [ ] Create Supabase project or use existing
- [ ] Run database migrations (all SQL above)
- [ ] Create pgvector extension in PostgreSQL
- [ ] Setup RLS policies
- [ ] Create storage buckets (knowledge-base)

### Phase 2: Backend (Week 2-3)
- [ ] Implement provider integration (OpenAI, Gemini, Claude)
- [ ] Create embedding service (text → vectors)
- [ ] Implement RAG retrieval functions
- [ ] Deploy Edge Functions
- [ ] Create agent service logic

### Phase 3: Frontend (Week 2-3 parallel)
- [ ] Build Agent Chat component
- [ ] Build Knowledge Base upload
- [ ] Build Agent management UI
- [ ] Integrate with React Query
- [ ] Add streaming UI updates

### Phase 4: Testing & Optimization (Week 4)
- [ ] Test RAG retrieval accuracy
- [ ] Optimize vector search performance
- [ ] Add error handling and retry logic
- [ ] Performance testing
- [ ] Security audit

---

## Summary

This framework is **completely framework-agnostic** and can be:

✅ Used with **any frontend** (React, Vue, Svelte, etc.)
✅ Used with **any backend** (Node.js, Python, Java, etc.)
✅ Applied to **any Supabase project** (Lovable Cloud, custom)
✅ Integrated with **any AI provider** (OpenAI, Gemini, Claude)
✅ Extended with **custom features** (memory, RAG, tools)

The examples shown are for React + TypeScript + Supabase Edge Functions, but the concepts apply universally.

**Next Steps:**
1. Answer the remaining questions in my previous message
2. Create system-specific implementation (Board Control Tower)
3. Build sync mechanism for multi-system scenarios
4. Deploy and test with real data
