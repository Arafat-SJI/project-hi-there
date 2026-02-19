

## Fix: Create Missing `agent_conversations` and `agent_messages` Tables

### Problem
The AI Chat page crashes because the `agent_conversations` and `agent_messages` tables do not exist in the database. The error message in the screenshot confirms: *"Could not find the table 'public.agent_conversations' in the schema cache"*. Additionally, TypeScript build errors occur because these tables are not in the generated types.

### Solution

**Step 1: Database Migration** -- Create both tables with all columns the hooks expect.

```text
agent_conversations table:
  - id (UUID, PK)
  - agent_id (UUID, FK -> ai_agents)
  - user_id (UUID, FK -> auth.users)
  - title (VARCHAR)
  - summary (TEXT)
  - is_archived (BOOLEAN, default false)
  - is_pinned (BOOLEAN, default false)
  - message_count (INTEGER, default 0)
  - last_message_at (TIMESTAMPTZ)
  - metadata (JSONB, default '{}')
  - created_at, updated_at (TIMESTAMPTZ)

agent_messages table:
  - id (UUID, PK)
  - conversation_id (UUID, FK -> agent_conversations)
  - role (VARCHAR -- user/assistant/system/tool)
  - content (TEXT)
  - model_used, provider_used (VARCHAR)
  - tokens_input, tokens_output (INTEGER)
  - latency_ms (INTEGER)
  - tool_calls, tool_results (JSONB)
  - citations (JSONB, default '[]')
  - metadata (JSONB, default '{}')
  - created_at (TIMESTAMPTZ)
```

RLS policies will be added for both tables:
- Users can only see/modify their own conversations
- Users can only see/modify messages in their own conversations
- A trigger will auto-update `updated_at` on conversations
- A trigger will auto-update `message_count` and `last_message_at` on conversations when messages are inserted

**Step 2: Fix TypeScript Build Errors** -- Update `src/hooks/useAgentConversations.ts` to cast `supabase` as `any` for queries against these tables (the standard type-bridge strategy used throughout this project for tables not yet in the generated schema cache).

### Files Changed
- New migration SQL (auto-created via migration tool)
- `src/integrations/supabase/types.ts` (auto-updated after migration)
- `src/hooks/useAgentConversations.ts` (cast supabase to any for agent_conversations/agent_messages queries)
