# AI Agents Implementation Guide - CollabAI

**Document Version:** 1.0
**Last Updated:** January 2025
**Purpose:** Complete reference for implementing AI agents with synchronization capability

---

## Table of Contents

1. [Overview](#overview)
2. [Data Model & Schema](#data-model--schema)
3. [Architecture & Patterns](#architecture--patterns)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [Agent Execution Flow](#agent-execution-flow)
8. [Integration Points](#integration-points)
9. [Synchronization Strategy](#synchronization-strategy)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### What Are AI Agents?

AI Agents in CollabAI are **user-configured AI personas** that:
- Have custom system prompts and instructions
- Support multiple AI providers (OpenAI, Anthropic, Google Gemini)
- Can be shared publicly and rated by users
- Include advanced features: tools (code interpreter, web search, file search, image generation), custom functions, MCP servers, RAG integration
- Maintain conversation threads with history
- Support real-time streaming responses

### Key Characteristics

| Feature | Details |
|---------|---------|
| **Storage** | Supabase PostgreSQL (structured data) |
| **Authentication** | JWT-based, per-user |
| **Streaming** | Server-Sent Events (SSE) for real-time responses |
| **Scope** | User-owned (private) or public (discoverable) |
| **Tools** | Code Interpreter, File Search, Web Search, Image Generation, Custom Functions, MCP |
| **Knowledge Base** | RAG with semantic search and embeddings |
| **Versioning** | Implicit (no version control yet) |

---

## Data Model & Schema

### Core Database Table: `agents`

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar TEXT,  -- Emoji or URL

  -- AI Configuration
  model VARCHAR(100) NOT NULL,  -- e.g., "gpt-4", "claude-3-opus", "gemini-pro"
  provider VARCHAR(50) NOT NULL,  -- "openai" | "anthropic" | "google"
  system_prompt TEXT,  -- Custom system instructions

  -- Parameters (stored as JSON)
  parameters JSONB DEFAULT '{}'::jsonb,
  -- Contains: temperature, maxTokens, topK, etc.

  -- Tools Configuration
  tools JSONB DEFAULT '[]'::jsonb,  -- Array of tool definitions
  tool_code_interpreter BOOLEAN DEFAULT false,
  tool_file_search BOOLEAN DEFAULT false,
  tool_web_search BOOLEAN DEFAULT false,
  tool_image_generation BOOLEAN DEFAULT false,
  tool_mcp BOOLEAN DEFAULT false,

  -- MCP Servers (stored as JSON array)
  mcpServerIds UUID[] DEFAULT '{}',

  -- Knowledge Base Configuration
  knowledge_config JSONB DEFAULT '{}'::jsonb,
  -- Contains: { enabled, fileIds: [], folderIds: [], searchScope }

  -- Categorization
  category_id UUID REFERENCES agent_categories(id),

  -- Ownership & Access
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,  -- Only one per user
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,

  -- Statistics
  usage_count INT DEFAULT 0,
  average_rating DECIMAL(3,2),
  rating_count INT DEFAULT 0,
  duplicate_count INT DEFAULT 0,

  -- Custom Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Contains: conversationStarters, welcomeMessage, etc.

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_is_public ON agents(is_public);
CREATE INDEX idx_agents_is_default ON agents(user_id, is_default);
CREATE INDEX idx_agents_category_id ON agents(category_id);
CREATE INDEX idx_agents_name_tsvector ON agents USING GIN(to_tsvector('english', name));
```

### Related Tables

#### `agent_conversations`
Stores conversation threads per agent:
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),

  -- Messages stored as JSONB array
  messages JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ role: "user"|"assistant", content, timestamp, toolUse }, ...]

  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_conversations_agent_user ON agent_conversations(agent_id, user_id);
CREATE INDEX idx_agent_conversations_created_at ON agent_conversations(created_at DESC);
```

#### `agent_ratings`
User ratings for public agents:
```sql
CREATE TABLE agent_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(agent_id, user_id)  -- One rating per user per agent
);
```

#### `agent_favorites`
User's favorite agents:
```sql
CREATE TABLE agent_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(agent_id, user_id)
);
```

#### `file_chunks` (RAG)
Embeddings for knowledge base files:
```sql
CREATE TABLE file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  chunk_index INT,
  content TEXT NOT NULL,

  -- pgvector embedding (1536 dimensions for OpenAI)
  embedding vector(1536),

  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_file_chunks_agent_id ON file_chunks(agent_id);
CREATE INDEX idx_file_chunks_embedding ON file_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## Architecture & Patterns

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         HTTP Request                    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      AgentRoutes / Middleware           │
│  - Authentication                       │
│  - Validation                           │
│  - Authorization                        │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      AgentController                    │
│  - Extract request parameters           │
│  - Call service methods                 │
│  - Format responses                     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      AgentService                       │
│  - Business logic                       │
│  - Validation                           │
│  - Cross-module coordination            │
│  - AI provider integration              │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      AgentRepository                    │
│  - Database queries                     │
│  - Data mapping (camelCase ↔ snake_case)│
│  - Connection pooling                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      Supabase PostgreSQL                │
│  - agents, conversations, ratings, etc  │
└─────────────────────────────────────────┘
```

### Design Patterns Used

#### 1. Repository Pattern
**Purpose:** Abstract data access layer

```javascript
// Hides database implementation from services
class AgentRepository {
  async create(agentData) { /* ... */ }
  async findById(id, userId) { /* ... */ }
  async update(id, updateData) { /* ... */ }
  async delete(id) { /* ... */ }
}
```

**Benefits:**
- Easy to test with mock repositories
- Database implementation independent
- Centralized query logic
- Reusable across services

#### 2. Service Layer Pattern
**Purpose:** Encapsulate business logic

```javascript
// Service coordinates multiple repositories
class AgentService {
  constructor() {
    this.agentRepository = new AgentRepository();
    this.providerService = new ProviderService();
    this.functionService = new FunctionService();
  }

  async createAgent(agentData, userId) {
    // Validation
    // Cross-module coordination
    // Business logic
  }
}
```

**Responsibilities:**
- Business logic execution
- Cross-module coordination
- External API integration
- Data validation and transformation

#### 3. Controller Pattern
**Purpose:** Handle HTTP requests/responses

```javascript
// Controller maps HTTP to service
class AgentController {
  async getAgents(req, res, next) {
    try {
      const result = await this.agentService.getAgents(req.user.id, options);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

#### 4. Middleware Pattern
**Purpose:** Cross-cutting concerns

```javascript
// Middleware stack
router.post(
  '/agents',
  authenticateToken,           // Auth middleware
  validate(createAgentSchema), // Validation middleware
  controller.createAgent       // Controller
);
```

#### 5. Dependency Injection
**Purpose:** Loose coupling

```javascript
// Dependencies injected via constructor
class AgentService {
  constructor(agentRepository, providerService, functionService) {
    this.agentRepository = agentRepository;
    this.providerService = providerService;
    this.functionService = functionService;
  }
}

// Or auto-injected:
class AgentService {
  constructor() {
    this.agentRepository = new AgentRepository();
    this.providerService = new ProviderService();
  }
}
```

---

## Backend Implementation

### 1. Database Layer (AgentRepository)

```javascript
// server/src/modules/agents/repositories/AgentRepository.js

import { supabase } from '../../../shared/database/supabaseClient.js';

export class AgentRepository {
  constructor() {
    this.table = 'agents';
  }

  // Map DB snake_case rows to camelCase objects
  mapRowToAgent(row) {
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      avatar: row.avatar ?? null,
      model: row.model,
      provider: row.provider,
      systemPrompt: row.system_prompt ?? undefined,
      parameters: this.cleanParameters(row.parameters),
      tools: row.tools ?? [],
      toolCodeInterpreter: row.tool_code_interpreter ?? false,
      toolFileSearch: row.tool_file_search ?? false,
      toolWebSearch: row.tool_web_search ?? false,
      toolImageGeneration: row.tool_image_generation ?? false,
      toolMCP: row.tool_mcp ?? false,
      mcpServerIds: row.mcpServerIds ?? [],
      categoryId: row.category_id ?? null,
      userId: row.user_id,
      isDefault: row.is_default ?? false,
      isActive: row.is_active ?? true,
      isPublic: row.is_public ?? false,
      knowledgeConfig: row.knowledge_config ?? undefined,
      metadata: row.metadata ?? undefined,
      usageCount: row.usage_count ?? 0,
      averageRating: row.average_rating,
      ratingCount: row.rating_count ?? 0,
      duplicateCount: row.duplicate_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Map camelCase objects to DB snake_case
  mapAgentToDb(data) {
    const out = {};
    if (data.name !== undefined) out.name = data.name;
    if (data.description !== undefined) out.description = data.description;
    if (data.model !== undefined) out.model = data.model;
    if (data.provider !== undefined) out.provider = data.provider;
    if (data.systemPrompt !== undefined) out.system_prompt = data.systemPrompt;
    if (data.parameters !== undefined) out.parameters = data.parameters;
    if (data.tools !== undefined) out.tools = data.tools;
    if (data.toolCodeInterpreter !== undefined) out.tool_code_interpreter = data.toolCodeInterpreter;
    if (data.toolFileSearch !== undefined) out.tool_file_search = data.toolFileSearch;
    if (data.toolWebSearch !== undefined) out.tool_web_search = data.toolWebSearch;
    if (data.toolImageGeneration !== undefined) out.tool_image_generation = data.toolImageGeneration;
    if (data.isDefault !== undefined) out.is_default = data.isDefault;
    if (data.isPublic !== undefined) out.is_public = data.isPublic;
    // ... other mappings
    return out;
  }

  // CRUD Operations
  async create(agentData) {
    const insertData = this.mapAgentToDb(agentData);

    const { data, error } = await supabase
      .from(this.table)
      .insert(insertData)
      .select('*')
      .single();

    if (error) throw error;
    return this.mapRowToAgent(data);
  }

  async findById(id, userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 404 is expected
    return data ? this.mapRowToAgent(data) : null;
  }

  async findPublicById(id) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapRowToAgent(data) : null;
  }

  async findByUserId(userId, { skip = 0, limit = 20, search = '', categoryId = null } = {}) {
    let query = supabase
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by category
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Pagination
    query = query.order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      agents: data.map(row => this.mapRowToAgent(row)),
      total: count || 0
    };
  }

  async update(id, userId, updateData) {
    const dbData = this.mapAgentToDb(updateData);

    const { data, error } = await supabase
      .from(this.table)
      .update(dbData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return this.mapRowToAgent(data);
  }

  async delete(id, userId) {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async setAsDefault(id, userId) {
    // Transaction: unset other defaults and set this one
    const { error: unsetError } = await supabase
      .from(this.table)
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (unsetError) throw unsetError;

    return this.update(id, userId, { isDefault: true });
  }

  async getDefaultAgent(userId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapRowToAgent(data) : null;
  }

  async incrementUsageCount(id) {
    const { error } = await supabase
      .from(this.table)
      .update({ usage_count: supabase.raw('usage_count + 1') })
      .eq('id', id);

    if (error) throw error;
  }

  async duplicateAgent(sourceId, userId) {
    // Fetch source agent
    const source = await this.findById(sourceId, userId);
    if (!source) throw new Error('Source agent not found');

    // Create duplicate
    const duplicateData = {
      ...source,
      name: `${source.name} (Copy)`,
      isDefault: false,
      isPublic: false,
      duplicateCount: 0,
      usageCount: 0
    };

    const created = await this.create(duplicateData);

    // Increment duplicate count of original
    await supabase
      .from(this.table)
      .update({ duplicate_count: supabase.raw('duplicate_count + 1') })
      .eq('id', sourceId);

    return created;
  }
}
```

### 2. Service Layer (AgentService)

```javascript
// server/src/modules/agents/services/AgentServiceNew.js

import { AgentRepository } from '../repositories/AgentRepository.js';
import { AgentConversationRepository } from '../repositories/AgentConversationRepository.js';
import { ProviderService } from '../../providers/services/ProviderService.js';
import { OpenAIServiceForAgents } from './OpenAIServiceForAgents.js';
import { FunctionService } from '../../functions/services/FunctionService.js';
import { AgentToolService } from './AgentToolService.js';

export class AgentService {
  constructor() {
    this.agentRepository = new AgentRepository();
    this.agentConversationRepository = new AgentConversationRepository();
    this.providerService = new ProviderService();
    this.openAIService = new OpenAIServiceForAgents();
    this.functionService = new FunctionService();
    this.agentToolService = new AgentToolService();
  }

  /**
   * Create a new agent
   */
  async createAgent(agentData, userId) {
    console.log('Creating agent:', { name: agentData.name, model: agentData.model });

    const agent = await this.agentRepository.create({
      ...agentData,
      userId,
      isActive: true
    });

    console.log('Agent created:', { id: agent.id, name: agent.name });
    return agent;
  }

  /**
   * Get all agents for a user with pagination
   */
  async getAgents(userId, options = {}) {
    const { page = 1, limit = 20, search, categoryId } = options;
    const skip = (page - 1) * limit;

    const result = await this.agentRepository.findByUserId(userId, {
      skip,
      limit,
      search,
      categoryId
    });

    // Fetch custom functions in batch (avoid N+1 problem)
    if (result.agents.length > 0) {
      const agentIds = result.agents.map(a => a.id);

      try {
        const allFunctions = await this.functionService.getAgentFunctionsBatch(agentIds);
        result.agents.forEach(agent => {
          agent.customFunctions = allFunctions[agent.id] || [];
          agent.toolFunctionCalling = agent.customFunctions.length > 0;
        });
      } catch (error) {
        console.warn('Could not fetch functions:', error.message);
        result.agents.forEach(agent => {
          agent.customFunctions = [];
          agent.toolFunctionCalling = false;
        });
      }
    }

    return {
      agents: result.agents,
      total: result.total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    };
  }

  /**
   * Get agent by ID (user's own or public)
   */
  async getAgentById(id, userId) {
    let agent = await this.agentRepository.findById(id, userId);

    if (!agent) {
      agent = await this.agentRepository.findPublicById(id);
    }

    if (!agent) throw new Error('Agent not found');

    // Attach custom functions
    try {
      const functions = await this.functionService.getAgentFunctions(id);
      agent.customFunctions = functions || [];
      agent.toolFunctionCalling = functions && functions.length > 0;
    } catch (error) {
      agent.customFunctions = [];
      agent.toolFunctionCalling = false;
    }

    return agent;
  }

  /**
   * Update agent
   */
  async updateAgent(id, updateData, userId) {
    const agent = await this.agentRepository.findById(id, userId);
    if (!agent) throw new Error('Agent not found');

    // Handle setting as default
    if (updateData.isDefault === true) {
      return await this.agentRepository.setAsDefault(id, userId);
    }

    return await this.agentRepository.update(id, userId, updateData);
  }

  /**
   * Delete agent (prevent deleting default agent)
   */
  async deleteAgent(id, userId) {
    const agent = await this.agentRepository.findById(id, userId);
    if (!agent) throw new Error('Agent not found');
    if (agent.isDefault) throw new Error('Cannot delete default agent');

    await this.agentRepository.delete(id, userId);
  }

  /**
   * Get default agent for user
   */
  async getDefaultAgent(userId) {
    return await this.agentRepository.getDefaultAgent(userId);
  }

  /**
   * Set agent as default
   */
  async setDefaultAgent(id, userId) {
    return await this.agentRepository.setAsDefault(id, userId);
  }

  /**
   * Duplicate an agent
   */
  async duplicateAgent(sourceId, userId) {
    return await this.agentRepository.duplicateAgent(sourceId, userId);
  }

  /**
   * Chat with agent (non-streaming)
   */
  async chat(agentId, userId, { message, threadId }) {
    const agent = await this.getAgentById(agentId, userId);

    // Increment usage
    await this.agentRepository.incrementUsageCount(agentId);

    // Get or create conversation
    const conversation = await this.agentConversationRepository.getOrCreate(
      agentId,
      userId,
      threadId
    );

    // Get AI response
    const response = await this.openAIService.generateAgentResponse(agent, message, conversation.messages);

    // Save to conversation
    conversation.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: response, timestamp: new Date() }
    );

    await this.agentConversationRepository.update(conversation.id, {
      messages: conversation.messages
    });

    return {
      threadId: conversation.id,
      message: response,
      conversationUpdated: true
    };
  }

  /**
   * Stream chat with agent (SSE)
   */
  async streamChat(agentId, userId, { message, threadId }, res) {
    const agent = await this.getAgentById(agentId, userId);

    // Increment usage
    await this.agentRepository.incrementUsageCount(agentId);

    // Get or create conversation
    const conversation = await this.agentConversationRepository.getOrCreate(
      agentId,
      userId,
      threadId
    );

    // Add user message
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    conversation.messages.push(userMessage);

    // Stream response
    let fullResponse = '';

    try {
      await this.openAIService.streamAgentResponse(
        agent,
        message,
        conversation.messages,
        res
      );

      // Save complete response
      conversation.messages.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      });

      await this.agentConversationRepository.update(conversation.id, {
        messages: conversation.messages
      });

      // End stream
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Get conversation threads for agent
   */
  async getThreads(agentId, userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    return await this.agentConversationRepository.findByAgentAndUser(agentId, userId, {
      skip,
      limit
    });
  }

  /**
   * Get chat history for thread
   */
  async getChatHistory(agentId, userId, threadId) {
    const conversation = await this.agentConversationRepository.findById(threadId);

    if (!conversation || conversation.agentId !== agentId || conversation.userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    return conversation.messages;
  }

  /**
   * SSE helper to write data safely
   */
  async writeSse(res, payload) {
    if (!res || res.writableEnded || res.destroyed) return false;

    const data = typeof payload === 'string'
      ? payload
      : `data: ${JSON.stringify(payload)}\n\n`;

    try {
      const ok = res.write(data);
      if (!ok) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
      if (typeof res.flush === 'function') res.flush();
      return true;
    } catch (e) {
      return false;
    }
  }
}
```

### 3. Controller Layer (AgentController)

```javascript
// server/src/modules/agents/controllers/AgentController.js

import { AgentService } from '../services/AgentServiceNew.js';
import { sendSuccess, sendError } from '../../../shared/utils/response.js';
import { HTTP_STATUS } from '../../../shared/constants/index.js';

export class AgentController {
  constructor() {
    this.agentService = new AgentService();
  }

  // Get all agents for user
  getAgents = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const { search, categoryId } = req.query;

      const result = await this.agentService.getAgents(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        categoryId
      });

      return sendSuccess(res, result, 'Agents retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // Get single agent
  getAgent = async (req, res, next) => {
    try {
      const agent = await this.agentService.getAgentById(req.params.id, req.user.id);
      return sendSuccess(res, agent, 'Agent retrieved successfully');
    } catch (error) {
      if (error.message === 'Agent not found') {
        return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
      }
      next(error);
    }
  };

  // Create new agent
  createAgent = async (req, res, next) => {
    try {
      const agentData = {
        ...req.body,
        toolMCP: req.body.toolMCP || false,
        mcpServerIds: req.body.mcpServerIds || []
      };

      const agent = await this.agentService.createAgent(agentData, req.user.id);
      return sendSuccess(res, agent, 'Agent created successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };

  // Update agent
  updateAgent = async (req, res, next) => {
    try {
      const agent = await this.agentService.updateAgent(req.params.id, req.body, req.user.id);
      return sendSuccess(res, agent, 'Agent updated successfully');
    } catch (error) {
      if (error.message === 'Agent not found') {
        return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
      }
      next(error);
    }
  };

  // Delete agent
  deleteAgent = async (req, res, next) => {
    try {
      await this.agentService.deleteAgent(req.params.id, req.user.id);
      return sendSuccess(res, null, 'Agent deleted successfully');
    } catch (error) {
      if (error.message.includes('not found')) {
        return sendError(res, error.message, HTTP_STATUS.NOT_FOUND);
      }
      next(error);
    }
  };

  // Get default agent
  getDefaultAgent = async (req, res, next) => {
    try {
      const agent = await this.agentService.getDefaultAgent(req.user.id);
      if (!agent) {
        return sendError(res, 'Default agent not found', HTTP_STATUS.NOT_FOUND);
      }
      return sendSuccess(res, agent, 'Default agent retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  // Set as default
  setDefaultAgent = async (req, res, next) => {
    try {
      const agent = await this.agentService.setDefaultAgent(req.params.id, req.user.id);
      return sendSuccess(res, agent, 'Default agent set successfully');
    } catch (error) {
      next(error);
    }
  };

  // Duplicate agent
  duplicateAgent = async (req, res, next) => {
    try {
      const agent = await this.agentService.duplicateAgent(req.params.id, req.user.id);
      return sendSuccess(res, agent, 'Agent duplicated successfully', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  };
}
```

### 4. Routes (AgentRoutes)

```javascript
// server/src/modules/agents/routes/AgentRoutes.js

import express from 'express';
import { AgentController } from '../controllers/AgentController.js';
import { AgentChatController } from '../controllers/AgentChatController.js';
import { AgentFavoriteController } from '../controllers/AgentFavoriteController.js';
import { AgentRatingController } from '../controllers/AgentRatingController.js';
import { authenticateToken } from '../../../shared/middlewares/auth.js';
import { validate } from '../../../shared/middlewares/validation.js';
import {
  createAgentSchema,
  updateAgentSchema,
  chatRequestSchema
} from '../middlewares/agentValidation.js';

const router = express.Router();
const controller = new AgentController();
const chatController = new AgentChatController();
const favoriteController = new AgentFavoriteController();
const ratingController = new AgentRatingController();

// Public routes (no auth required)
router.get('/explore', controller.getPublicAgents);
router.get('/explore/stats', controller.getExploreStats);

// User agents (auth required)
router.use(authenticateToken);

router.get('/', controller.getAgents);
router.post('/', validate(createAgentSchema), controller.createAgent);
router.get('/default', controller.getDefaultAgent);
router.get('/most-accessed', controller.getMostAccessedAgents);

router.get('/:id', controller.getAgent);
router.put('/:id', validate(updateAgentSchema), controller.updateAgent);
router.delete('/:id', controller.deleteAgent);
router.post('/:id/default', controller.setDefaultAgent);
router.post('/:id/duplicate', controller.duplicateAgent);

// Chat endpoints
router.post('/:agentId/chat', validate(chatRequestSchema), chatController.chat);
router.post('/:agentId/chat/stream', validate(chatRequestSchema), chatController.streamChat);
router.get('/:agentId/threads', chatController.getThreads);
router.get('/:agentId/chat/:threadId', chatController.getChatHistory);

// Favorites
router.post('/:id/favorite', favoriteController.addFavorite);
router.delete('/:id/favorite', favoriteController.removeFavorite);
router.get('/:id/favorite/status', favoriteController.getFavoriteStatus);

// Ratings
router.post('/:id/rate', validate(ratingSchema), ratingController.rateAgent);
router.get('/:id/rating', ratingController.getUserRating);
router.delete('/:id/rating', ratingController.deleteRating);
router.get('/:id/rating/stats', ratingController.getRatingStats);

export default router;
```

### 5. Validation Schemas

```javascript
// server/src/modules/agents/middlewares/agentValidation.js

import Joi from 'joi';

export const createAgentSchema = Joi.object({
  name: Joi.string().required().max(255),
  description: Joi.string().allow(''),
  avatar: Joi.string().allow(null),
  model: Joi.string().required(),
  provider: Joi.string().valid('openai', 'anthropic', 'google').required(),
  systemPrompt: Joi.string().allow(''),
  parameters: Joi.object({
    temperature: Joi.number().min(0).max(2),
    maxTokens: Joi.number().positive(),
    topK: Joi.number().positive()
  }).unknown(true),
  tools: Joi.array().items(Joi.object().unknown(true)),
  toolCodeInterpreter: Joi.boolean(),
  toolFileSearch: Joi.boolean(),
  toolWebSearch: Joi.boolean(),
  toolImageGeneration: Joi.boolean(),
  toolMCP: Joi.boolean(),
  mcpServerIds: Joi.array().items(Joi.string().uuid()),
  categoryId: Joi.string().uuid().allow(null),
  knowledgeConfig: Joi.object({
    enabled: Joi.boolean(),
    fileIds: Joi.array().items(Joi.string().uuid()),
    folderIds: Joi.array().items(Joi.string().uuid()),
    searchScope: Joi.string()
  }).unknown(true),
  metadata: Joi.object().unknown(true),
  isPublic: Joi.boolean()
});

export const updateAgentSchema = Joi.object({
  name: Joi.string().max(255),
  description: Joi.string(),
  avatar: Joi.string(),
  model: Joi.string(),
  systemPrompt: Joi.string(),
  parameters: Joi.object().unknown(true),
  tools: Joi.array(),
  toolCodeInterpreter: Joi.boolean(),
  toolFileSearch: Joi.boolean(),
  toolWebSearch: Joi.boolean(),
  toolImageGeneration: Joi.boolean(),
  toolMCP: Joi.boolean(),
  categoryId: Joi.string().uuid(),
  knowledgeConfig: Joi.object().unknown(true),
  metadata: Joi.object().unknown(true),
  isPublic: Joi.boolean(),
  isDefault: Joi.boolean()
});

export const chatRequestSchema = Joi.object({
  message: Joi.string().required(),
  threadId: Joi.string().uuid()
});
```

---

## Frontend Implementation

### 1. Type Definitions (TypeScript)

```typescript
// client/src/services/agentService.ts

export interface AgentParameters {
  temperature?: number;
  maxTokens?: number;
  topK?: number;
  topP?: number;
}

export interface AgentTool {
  type: 'code_interpreter' | 'file_search' | 'web_search' | 'image_generation' | 'function';
  enabled: boolean;
  config?: Record<string, any>;
}

export interface KnowledgeConfig {
  enabled: boolean;
  fileIds?: string[];
  folderIds?: string[];
  searchScope?: 'file' | 'all';
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  model: string;
  provider: 'openai' | 'anthropic' | 'google';
  systemPrompt: string;
  parameters?: AgentParameters;
  tools?: AgentTool[];
  toolCodeInterpreter: boolean;
  toolFileSearch: boolean;
  toolWebSearch: boolean;
  toolImageGeneration: boolean;
  toolMCP: boolean;
  mcpServerIds: string[];
  categoryId: string | null;
  userId: string;
  isDefault: boolean;
  isActive: boolean;
  isPublic: boolean;
  knowledgeConfig?: KnowledgeConfig;
  metadata?: Record<string, any>;
  customFunctions?: CustomFunction[];
  toolFunctionCalling?: boolean;
  usageCount: number;
  averageRating?: number;
  ratingCount: number;
  duplicateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  avatar?: string;
  model: string;
  provider: string;
  systemPrompt?: string;
  parameters?: AgentParameters;
  tools?: AgentTool[];
  toolCodeInterpreter?: boolean;
  toolFileSearch?: boolean;
  toolWebSearch?: boolean;
  toolImageGeneration?: boolean;
  toolMCP?: boolean;
  mcpServerIds?: string[];
  categoryId?: string;
  knowledgeConfig?: KnowledgeConfig;
  metadata?: Record<string, any>;
  isPublic?: boolean;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {}

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  toolUse?: Record<string, any>;
}

export interface AgentChatRequest {
  message: string;
  threadId?: string;
}

export interface AgentChatResponse {
  threadId: string;
  message: string;
  conversationUpdated: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

### 2. API Service

```typescript
// client/src/services/agentService.ts

import apiClient from './apiClient';

export const agentService = {
  // CRUD Operations
  async getAgents(page = 1, limit = 20, search = '', categoryId?: string) {
    const response = await apiClient.get<PaginatedResponse<Agent>>('/agents', {
      params: { page, limit, search, categoryId }
    });
    return response.data;
  },

  async getAgent(id: string) {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  async createAgent(data: CreateAgentData) {
    const response = await apiClient.post<Agent>('/agents', data);
    return response.data;
  },

  async updateAgent(id: string, data: UpdateAgentData) {
    const response = await apiClient.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  async deleteAgent(id: string) {
    await apiClient.delete(`/agents/${id}`);
  },

  // Default Agent
  async getDefaultAgent() {
    const response = await apiClient.get<Agent>('/agents/default');
    return response.data;
  },

  async setDefaultAgent(id: string) {
    const response = await apiClient.post<Agent>(`/agents/${id}/default`);
    return response.data;
  },

  // Duplication
  async duplicateAgent(id: string) {
    const response = await apiClient.post<Agent>(`/agents/${id}/duplicate`);
    return response.data;
  },

  // Chat Operations
  async chat(agentId: string, message: string, threadId?: string) {
    const response = await apiClient.post<AgentChatResponse>(
      `/agents/${agentId}/chat`,
      { message, threadId }
    );
    return response.data;
  },

  async streamChat(agentId: string, message: string, threadId?: string) {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(
        `/api/agents/${agentId}/chat/stream?message=${encodeURIComponent(message)}&threadId=${threadId || ''}`
      );

      let fullResponse = '';

      eventSource.addEventListener('token', (event) => {
        const data = JSON.parse(event.data);
        fullResponse += data.token;
      });

      eventSource.addEventListener('complete', () => {
        eventSource.close();
        resolve(fullResponse);
      });

      eventSource.onerror = (error) => {
        eventSource.close();
        reject(error);
      };
    });
  },

  async getThreads(agentId: string, page = 1, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<AgentConversation>>(
      `/agents/${agentId}/threads`,
      { params: { page, limit } }
    );
    return response.data;
  },

  async getChatHistory(agentId: string, threadId: string) {
    const response = await apiClient.get<AgentChatMessage[]>(
      `/agents/${agentId}/chat/${threadId}`
    );
    return response.data;
  },

  // Public Agents
  async getPublicAgents(page = 1, limit = 20, { search = '', categoryId = null, sortBy = 'popular' } = {}) {
    const response = await apiClient.get<PaginatedResponse<ExploreAgent>>(
      '/agents/explore',
      { params: { page, limit, search, categoryId, sortBy } }
    );
    return response.data;
  },

  async getExploreStats() {
    const response = await apiClient.get('/agents/explore/stats');
    return response.data;
  },

  // Favorites
  async addFavorite(id: string) {
    await apiClient.post(`/agents/${id}/favorite`);
  },

  async removeFavorite(id: string) {
    await apiClient.delete(`/agents/${id}/favorite`);
  },

  async getFavorites(page = 1, limit = 20) {
    const response = await apiClient.get<PaginatedResponse<Agent>>('/agents/favorites', {
      params: { page, limit }
    });
    return response.data;
  },

  async getFavoriteStatus(id: string) {
    const response = await apiClient.get<{ isFavorited: boolean }>(
      `/agents/${id}/favorite/status`
    );
    return response.data;
  },

  // Ratings
  async rateAgent(id: string, rating: number) {
    const response = await apiClient.post(`/agents/${id}/rate`, { rating });
    return response.data;
  },

  async getUserRating(id: string) {
    const response = await apiClient.get<{ rating: number | null }>(`/agents/${id}/rating`);
    return response.data;
  },

  async deleteRating(id: string) {
    await apiClient.delete(`/agents/${id}/rating`);
  },

  async getRatingStats(id: string) {
    const response = await apiClient.get<{ average: number; count: number }>(
      `/agents/${id}/rating/stats`
    );
    return response.data;
  }
};
```

### 3. Custom Hook for Agent Management

```typescript
// client/src/modules/agents/hooks/useAgent.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '@/services/agentService';
import { Agent, CreateAgentData } from '@/services/agentService';

export const useAgent = (id?: string) => {
  const queryClient = useQueryClient();

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => (id ? agentService.getAgent(id) : Promise.reject('No ID')),
    enabled: !!id
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAgentData) => agentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Agent> }) =>
      agentService.updateAgent(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => agentService.duplicateAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });

  return {
    agent,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    duplicate: duplicateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
```

### 4. React Component Example

```typescript
// client/src/modules/agents/components/AgentCard.tsx

import React, { useState } from 'react';
import { Agent } from '@/services/agentService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, Copy, Heart } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  onDuplicate?: (agent: Agent) => void;
  onFavorite?: (agent: Agent) => void;
  isFavorited?: boolean;
  isLoading?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  onDuplicate,
  onFavorite,
  isFavorited = false,
  isLoading = false
}) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-2xl mb-2">{agent.avatar || '🤖'}</div>
          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{agent.description}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex gap-4 text-sm">
        {agent.usageCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Uses: {agent.usageCount}</span>
          </div>
        )}
        {agent.averageRating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{agent.averageRating.toFixed(1)}</span>
            <span className="text-gray-600">({agent.ratingCount})</span>
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 inline-block">
        {agent.provider.charAt(0).toUpperCase() + agent.provider.slice(1)} • {agent.model}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onSelect && (
          <Button
            onClick={() => onSelect(agent)}
            className="flex-1"
            disabled={isLoading}
          >
            Use Agent
          </Button>
        )}

        {onDuplicate && (
          <Button
            onClick={() => onDuplicate(agent)}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}

        {onFavorite && (
          <Button
            onClick={() => onFavorite(agent)}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <Heart
              className="w-4 h-4"
              fill={isFavorited ? 'currentColor' : 'none'}
            />
          </Button>
        )}
      </div>
    </Card>
  );
};
```

---

## API Endpoints

### Complete Endpoint Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **GET** | `/api/agents/explore` | Optional | Browse public agents |
| **GET** | `/api/agents/explore/stats` | No | Get explore page statistics |
| **GET** | `/api/agents` | Yes | List user's agents |
| **POST** | `/api/agents` | Yes | Create new agent |
| **GET** | `/api/agents/default` | Yes | Get user's default agent |
| **GET** | `/api/agents/most-accessed` | Yes | Get most used agents |
| **GET** | `/api/agents/:id` | Yes | Get single agent |
| **PUT** | `/api/agents/:id` | Yes | Update agent |
| **DELETE** | `/api/agents/:id` | Yes | Delete agent |
| **POST** | `/api/agents/:id/default` | Yes | Set as default |
| **POST** | `/api/agents/:id/duplicate` | Yes | Duplicate agent |
| **POST** | `/api/agents/:agentId/chat` | Yes | Non-streaming chat |
| **POST** | `/api/agents/:agentId/chat/stream` | Yes | SSE streaming chat |
| **GET** | `/api/agents/:agentId/threads` | Yes | List conversation threads |
| **GET** | `/api/agents/:agentId/chat/:threadId` | Yes | Get chat history |
| **POST** | `/api/agents/:id/favorite` | Yes | Add to favorites |
| **DELETE** | `/api/agents/:id/favorite` | Yes | Remove from favorites |
| **GET** | `/api/agents/:id/favorite/status` | Yes | Check if favorited |
| **POST** | `/api/agents/:id/rate` | Yes | Rate agent (1-5) |
| **GET** | `/api/agents/:id/rating` | Yes | Get user's rating |
| **DELETE** | `/api/agents/:id/rating` | Yes | Delete rating |
| **GET** | `/api/agents/:id/rating/stats` | Yes | Get rating statistics |

---

## Agent Execution Flow

### Chat/Streaming Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client sends chat request                                │
│    POST /api/agents/:agentId/chat/stream                    │
│    { message, threadId? }                                   │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. AgentChatController receives request                     │
│    - Validates auth token                                   │
│    - Validates request body                                 │
│    - Sets SSE response headers                              │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. AgentService.streamChat()                                │
│    - Fetches agent config                                   │
│    - Increments usage count                                 │
│    - Gets or creates conversation thread                    │
│    - Adds user message to conversation                      │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. OpenAIServiceForAgents.streamAgentResponse()            │
│    - Gets provider config (API keys)                        │
│    - Builds system instructions from agent config           │
│    - Injects RAG context (if knowledge base enabled)       │
│    - Builds tools array                                     │
│    - Creates OpenAI Responses API request                   │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Stream to OpenAI / Provider API                          │
│    - Makes streaming request                                │
│    - Receives token-by-token response                       │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. AgentService streams response to client via SSE         │
│    - Writes each token as SSE event                        │
│    - Handles backpressure (drain event)                     │
│    - Collects full response                                 │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Client receives streamed tokens                         │
│    - Parses SSE events                                      │
│    - Appends tokens to UI                                   │
│    - Shows thinking animation during streaming             │
└─────────────────────┬───────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Save conversation to database                           │
│    - Stores complete user message                           │
│    - Stores complete AI response                            │
│    - Updates thread metadata                                │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Send [DONE] signal and close stream                      │
│    event: [DONE]                                            │
└─────────────────────────────────────────────────────────────┘
```

### SSE Response Format

```javascript
// Token event
event: token
data: {"token": "The"}

// Tool use event
event: tool_use
data: {"toolName": "code_interpreter", "toolInput": {...}}

// Completion event
event: complete
data: {"fullMessage": "The complete response text"}

// Done signal
data: [DONE]
```

---

## Integration Points

### 1. Provider Integration

Agents integrate with **ProviderService** to route requests to correct AI provider:

```javascript
// Inside AgentService or OpenAIServiceForAgents
const providerConfig = await this.providerService.getProviderConfig(agent.provider);
// Returns: { apiKey, baseUrl, model, pricing }

// Make request to appropriate API (OpenAI, Anthropic, Google)
const response = await this.openAIService.generateAgentResponse(...);
```

### 2. Knowledge Base (RAG) Integration

```javascript
// AgentRagService handles RAG context
const ragContext = await this.agentRagService.generateContext(
  agent.id,
  userMessage
);
// Returns: { content, citations, fileIds }

// Injected into system prompt
const systemPrompt = `${agent.systemPrompt}\n\nKnowledge Base:\n${ragContext.content}`;
```

### 3. Custom Functions Integration

```javascript
// FunctionService provides custom tools
const customFunctions = await this.functionService.getAgentFunctions(agent.id);
// Merged into tools array for function calling
const toolsArray = [...systemTools, ...customFunctions];
```

### 4. MCP Integration

```javascript
// Model Context Protocol servers
const mcpServers = await this.mcpService.getServers(agent.mcpServerIds);
// Made available to the agent for extended capabilities
```

### 5. File Integration

```javascript
// Knowledge base files
const files = await this.knowledgeService.getAgentFiles(agent.id);
// Used for RAG context and file search tool
```

---

## Synchronization Strategy

### For Multi-System Synchronization

When syncing agents between two systems:

#### 1. **Agent Export**

```javascript
// Source System: Export agent
async function exportAgent(agentId, userId) {
  const agent = await agentService.getAgentById(agentId, userId);

  return {
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      avatar: agent.avatar,
      model: agent.model,
      provider: agent.provider,
      systemPrompt: agent.systemPrompt,
      parameters: agent.parameters,
      tools: agent.tools,
      toolCodeInterpreter: agent.toolCodeInterpreter,
      toolFileSearch: agent.toolFileSearch,
      toolWebSearch: agent.toolWebSearch,
      toolImageGeneration: agent.toolImageGeneration,
      toolMCP: agent.toolMCP,
      mcpServerIds: agent.mcpServerIds,
      categoryId: agent.categoryId,
      knowledgeConfig: agent.knowledgeConfig,
      metadata: agent.metadata,
      isPublic: agent.isPublic
    },
    exportedAt: new Date().toISOString(),
    sourceSystem: 'collabai-main',
    version: '1.0'
  };
}
```

#### 2. **Agent Import**

```javascript
// Target System: Import agent
async function importAgent(exportedData, targetUserId) {
  const { agent, sourceSystem } = exportedData;

  // Map to local IDs if needed
  const localAgent = {
    ...agent,
    categoryId: await mapCategoryId(agent.categoryId, sourceSystem),
    mcpServerIds: await mapMcpServerIds(agent.mcpServerIds, sourceSystem),
    knowledgeConfig: await mapKnowledgeConfig(agent.knowledgeConfig, sourceSystem)
  };

  // Create or update
  return await agentService.createAgent(localAgent, targetUserId);
}
```

#### 3. **Sync Metadata**

```javascript
// Track synchronization
const syncRecord = {
  sourceAgentId: source.id,
  targetAgentId: target.id,
  sourceSystem: 'collabai-main',
  targetSystem: 'custom-project',
  lastSyncedAt: new Date(),
  syncStatus: 'success',
  version: '1.0'
};

// Store for future updates
await syncRepository.create(syncRecord);
```

#### 4. **Chat History Sync** (Optional)

```javascript
// Export conversations
async function exportConversations(agentId, userId) {
  const threads = await agentService.getThreads(agentId, userId);

  return threads.map(thread => ({
    id: thread.id,
    title: thread.title,
    messages: thread.messages,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt
  }));
}

// Import conversations
async function importConversations(agentId, threads, targetUserId) {
  for (const thread of threads) {
    await agentConversationRepository.create({
      agentId,
      userId: targetUserId,
      title: thread.title,
      messages: thread.messages
    });
  }
}
```

### Sync Conflict Resolution

When both systems modify the same agent:

```javascript
const syncResolver = {
  // Last-write-wins strategy
  lww: (source, target, lastSync) => {
    return source.updatedAt > target.updatedAt ? source : target;
  },

  // Keep local changes
  keepLocal: (source, target, lastSync) => {
    return target;
  },

  // Merge fields
  merge: (source, target, lastSync) => {
    return {
      ...target,
      // But update these from source
      systemPrompt: source.systemPrompt,
      parameters: { ...target.parameters, ...source.parameters },
      tools: source.tools,
      lastSyncedAt: new Date()
    };
  }
};
```

---

## Implementation Checklist

### Backend Setup

- [ ] Create `agents` table in Supabase with schema above
- [ ] Create related tables: `agent_conversations`, `agent_ratings`, `agent_favorites`
- [ ] Implement `AgentRepository` with all CRUD operations
- [ ] Implement `AgentConversationRepository` for thread management
- [ ] Implement `AgentRatingRepository` for ratings
- [ ] Implement `AgentFavoriteRepository` for favorites
- [ ] Implement `AgentService` with business logic
- [ ] Implement `AgentController` for HTTP handling
- [ ] Implement `AgentChatController` for streaming
- [ ] Implement validation schemas with Joi
- [ ] Create routes and integrate with Express
- [ ] Implement SSE streaming for chat
- [ ] Integrate with ProviderService for AI providers
- [ ] Implement RAG context injection
- [ ] Add logging and error handling
- [ ] Create database indexes for performance
- [ ] Write unit tests for services
- [ ] Write integration tests for API endpoints

### Frontend Setup

- [ ] Define TypeScript interfaces for Agent types
- [ ] Implement `agentService` with all API calls
- [ ] Create custom hook `useAgent` for state management
- [ ] Create `AgentCard` component for display
- [ ] Create `AgentEditor` component for creation/editing
- [ ] Create `AgentChat` component for chatting
- [ ] Create `ExploreAgents` page for browsing public agents
- [ ] Implement SSE event streaming for chat
- [ ] Add React Query for data fetching and caching
- [ ] Implement pagination and search
- [ ] Add favorite and rating UI
- [ ] Add loading skeletons
- [ ] Add error handling and toast notifications
- [ ] Write component tests
- [ ] Implement Zod schemas for form validation

### Additional Features

- [ ] Agent analytics and usage tracking
- [ ] Agent versioning (optional)
- [ ] Agent templates
- [ ] Bulk export/import
- [ ] Sync mechanism for multi-system scenarios
- [ ] Agent performance metrics
- [ ] Agent marketplace/store
- [ ] Agent sharing via links
- [ ] Conversation export (PDF, JSON)
- [ ] Prompt templates integration
- [ ] Webhook notifications for agent updates

### DevOps & Deployment

- [ ] Configure environment variables
- [ ] Setup logging (Winston/Pino)
- [ ] Configure error tracking (Sentry)
- [ ] Setup monitoring (DataDog/Prometheus)
- [ ] Database migration scripts
- [ ] Backup strategy
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Rate limiting on chat endpoints
- [ ] API documentation (Swagger/OpenAPI)

---

## Questions I Have For You

To make this guide even more complete, please answer:

1. **Tech Stack Confirmation**
   - Is your target system Node.js/Express-based or different?
   - What database systems are you planning to use?
   - Are you using PostgreSQL, MongoDB, or both?

2. **Synchronization Depth**
   - Do you need bidirectional sync (both systems update each other)?
   - Should sync happen in real-time or batch?
   - Do you need conflict resolution for simultaneous edits?
   - Should chat histories also sync?

3. **Feature Scope**
   - Do you need all tools (code interpreter, file search, web search, image generation)?
   - Is RAG (knowledge base) critical for your use case?
   - Do you need MCP server support?
   - Do you need agent sharing and ratings?

4. **Scaling Requirements**
   - How many agents per user?
   - How many concurrent streaming chats?
   - Expected message volume per day?

5. **Timeline & Priorities**
   - Which features are MVP vs. nice-to-have?
   - Do you need all frontend components or just backend APIs?
   - Any deadline or deployment date?

6. **Integration Points**
   - Do you have existing user/auth systems to integrate?
   - Do you have existing file storage (S3, Supabase)?
   - Do you have existing AI provider integrations?

Once you answer these, I can create:
- System-specific implementation guides
- Database migration scripts
- Sync service implementation
- Testing strategies
- Deployment guides

Would you like me to create additional detailed documents for any specific area?
