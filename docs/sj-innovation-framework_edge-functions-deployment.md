# SJ Innovation Framework - Edge Functions Deployment Guide

> **Complete guide for deploying edge functions to new projects**

---

## 📋 Overview

This guide helps you deploy V1 framework edge functions to new Supabase projects with proper configuration and schema handling.

---

## 🎯 Deployment Strategy Options

### **Option A: Edge Function Copy Tool** ⭐ **EASIEST!** **NEW!**

**Best for:** Everyone! Non-technical users, fastest setup

**Pros:**
- ✅ No CLI installation required
- ✅ Point-and-click web interface
- ✅ Copy all 31 functions in one click
- ✅ Real-time progress tracking
- ✅ Works in 15 minutes
- ✅ Built-in error handling
- ✅ No manual file copying needed

**Cons:**
- ⚠️ Requires running local dev server
- ⚠️ Need API tokens from both projects

**How it works:**
1. Run the copy tool: `npm run dev`
2. Open browser to http://localhost:5173/edge-function-copy
3. Enter source & target project credentials
4. Select functions (or click "Select All V1")
5. Click "Copy" and wait for completion!

**See:** [`EDGE_FUNCTION_COPY_TOOL.md`](./EDGE_FUNCTION_COPY_TOOL.md) for complete guide

---

### **Option B: Lovable.dev (Good for Beginners)**

**Best for:** Getting started quickly with AI assistance

**Pros:**
- ✅ No CLI installation required
- ✅ AI-assisted deployment
- ✅ Auto-deployment on file upload
- ✅ Built-in environment variable UI
- ✅ Automatic bundling and testing
- ✅ Works great with Claude Code

**Cons:**
- ⚠️ Requires Lovable.dev account
- ⚠️ Manual file upload for each function

**How it works:**
1. Upload function files to Lovable
2. Set environment variables in UI
3. Lovable auto-deploys to Supabase
4. Test in Lovable preview environment

**See:** [`QUICKSTART_LOVABLE.md`](./QUICKSTART_LOVABLE.md) for complete guide

---

### **Option C: Supabase CLI (Recommended for Developers)** ⭐

**Best for:** Developers comfortable with terminal, production deployments

**Pros:**
- ✅ Fast bulk deployment
- ✅ Automatic bundling
- ✅ Version control friendly
- ✅ Scriptable/automatable
- ✅ Official Supabase tooling

**Cons:**
- ⚠️ Requires CLI installation
- ⚠️ Terminal knowledge needed

**See:** [Deployment steps below](#-deployment-steps-cli) for CLI workflow

---

### **Option D: Management API (Advanced)**

**Best for:** Custom automation, CI/CD pipelines

**Pros:**
- ✅ Fully programmatic
- ✅ Can copy from existing project
- ✅ Scriptable/automatable

**Cons:**
- ⚠️ More complex to set up
- ⚠️ Requires API tokens
- ⚠️ Still requires env var setup

**Note:** The **Edge Function Copy Tool** (Option A) uses this API under the hood with a user-friendly interface!

---

## ✅ Recommended Approaches

**Choose based on your needs:**

| Your Situation | Recommended Option |
|----------------|-------------------|
| **Want easiest/fastest method** | **Edge Function Copy Tool** ⭐ |
| **Non-technical user** | **Edge Function Copy Tool** ⭐ |
| **Copying from existing project** | **Edge Function Copy Tool** ⭐ |
| New to coding, want AI help | **Lovable.dev** |
| Using Claude Code for development | **Lovable.dev** |
| Comfortable with terminal | **Supabase CLI** |
| Need automation scripts | **Supabase CLI** |
| Production deployment | **CLI or Copy Tool** |

**This guide covers all workflows: Copy Tool, Lovable, CLI, and API.**

---

## 📦 V1 Edge Functions List

### **Foundation (4 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `validate-api-key` | API key validation | None | None |
| `audit-log-writer` | Activity logging | `audit_logs` | None |
| `send-email` | Email sending | None | `SENDGRID_API_KEY` |
| `send-notification` | Multi-channel notifications | `notifications` | `SLACK_WEBHOOK_URL` (optional) |

---

### **Authentication & Users (2 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `admin-users` | User management | `profiles`, `user_roles`, `roles` | None |
| `admin-delete-user` | User deletion | `profiles` (cascade deletes) | None |

---

### **Clients Module (1 function)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `api-v1-clients` | Client CRUD operations | `clients` | None |

---

### **Meetings & Zoom (6 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `sync-zoom-files` | Sync Zoom recordings | `meetings`, `zoom_files` | `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID` |
| `zoom-transcript-processing` | Parse VTT transcripts | `zoom_files` | None |
| `generate-meeting-summary` | AI summarization | `zoom_files`, `meeting_transcripts` | `OPENAI_API_KEY` |
| `auto-embed-meetings` | Generate embeddings | `zoom_files`, `embeddings` | `OPENAI_API_KEY` |
| `categorize-meeting` | Auto-categorize | `zoom_files`, `meeting_categorizations` | `OPENAI_API_KEY` |
| `api-v1-meetings` | Meeting CRUD | `meetings`, `meeting_assignments` | None |

---

### **Knowledge Base (7 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `google-drive-sync` | Admin Google Drive sync | `knowledge_sources`, `knowledge_files` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `google-drive-upload` | Upload to Drive | `knowledge_files` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `user-knowledge-upload` | User file upload | `user_knowledge_files` | None |
| `user-knowledge-drive-sync` | User Drive sync | `user_knowledge_sources`, `user_knowledge_files` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `user-knowledge-process` | Process user knowledge | `user_knowledge_files`, `embeddings` | `OPENAI_API_KEY` or `GEMINI_API_KEY` |
| `auto-embed-knowledge-files` | Batch embedding generation | `knowledge_files`, `embeddings` | `OPENAI_API_KEY` |
| `unified-knowledge-search` | Search all knowledge | `knowledge_entries`, `embeddings` | None |

---

### **AI Agents (8 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `ai-chat-assistant` | General chat | `ai_chat_history` | `OPENAI_API_KEY` |
| `semantic-search` | Vector search | `embeddings` | None |
| `run-ai-agent` | Execute agents | `ai_agents`, `ai_agent_runs`, `user_agent_personalizations` | `OPENAI_API_KEY`, `GEMINI_API_KEY` (optional) |
| `generate-embeddings` | Create embeddings | `embeddings` | `OPENAI_API_KEY` or `GEMINI_API_KEY` |
| `gemini-corpus-sync` | Gemini corpus | `gemini_corpora` | `GEMINI_API_KEY` |
| `gemini-rag-query` | Gemini RAG | `gemini_corpora` | `GEMINI_API_KEY` |
| `generate-business-doc` | Document generation | None | `OPENAI_API_KEY` |
| `generate-sow` | SOW generation | None | `OPENAI_API_KEY` |

---

### **Notifications (2 functions)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `send-notification` | Send notifications | `notifications` | `SLACK_WEBHOOK_URL` (optional) |
| `send-slack-message` | Slack integration | None | `SLACK_WEBHOOK_URL` |

---

### **Feedback (1 function)**

| Function | Purpose | DB Dependencies | Env Variables |
|----------|---------|-----------------|---------------|
| `send-feedback-notification` | Feedback alerts | `feedback` | None |

---

### **Shared Utilities**

The `_shared/` folder contains common utilities used across functions:

```
_shared/
├── cors.ts              # CORS headers
├── supabaseAdmin.ts     # Admin client
├── openai.ts           # OpenAI client
├── gemini.ts           # Gemini client
├── zoom.ts             # Zoom API helpers
├── googleDrive.ts      # Google Drive helpers
└── validation.ts       # Input validation
```

---

## 📊 Summary by Module

| Module | Function Count | Critical Env Vars |
|--------|----------------|-------------------|
| **Foundation** | 4 | `SENDGRID_API_KEY` |
| **Auth & Users** | 2 | None |
| **Clients** | 1 | None |
| **Meetings** | 6 | `ZOOM_*`, `OPENAI_API_KEY` |
| **Knowledge Base** | 7 | `GOOGLE_*`, `OPENAI_API_KEY` |
| **AI Agents** | 8 | `OPENAI_API_KEY`, `GEMINI_API_KEY` |
| **Notifications** | 2 | `SLACK_WEBHOOK_URL` |
| **Feedback** | 1 | None |
| **TOTAL V1** | **31** | |

---

## 🚀 Deployment Steps

### **Step 1: Copy Edge Functions to New Project**

```bash
# From your framework source
cd /path/to/sj-control-main

# Copy to new project
cp -r supabase/functions/_shared /path/to/new-project/supabase/functions/
cp -r supabase/functions/validate-api-key /path/to/new-project/supabase/functions/
cp -r supabase/functions/audit-log-writer /path/to/new-project/supabase/functions/
# ... copy each V1 function listed above
```

**Or use this script:**

```bash
# See deploy-edge-functions.sh script below
```

---

### **Step 2: Install Supabase CLI**

```bash
npm install -g supabase
```

---

### **Step 3: Link to New Project**

```bash
cd /path/to/new-project
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

---

### **Step 4: Set Environment Variables**

```bash
# Required for all AI features
supabase secrets set OPENAI_API_KEY=sk-...

# Optional: Gemini as alternative/fallback
supabase secrets set GEMINI_API_KEY=...

# Zoom integration
supabase secrets set ZOOM_CLIENT_ID=...
supabase secrets set ZOOM_CLIENT_SECRET=...
supabase secrets set ZOOM_ACCOUNT_ID=...

# Google Drive
supabase secrets set GOOGLE_CLIENT_ID=...
supabase secrets set GOOGLE_CLIENT_SECRET=...

# SendGrid (email)
supabase secrets set SENDGRID_API_KEY=...

# Slack (optional)
supabase secrets set SLACK_WEBHOOK_URL=...

# Supabase (auto-set, but verify)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

**List current secrets:**
```bash
supabase secrets list
```

---

### **Step 5: Deploy Functions**

**Option A: Deploy All at Once**
```bash
supabase functions deploy --no-verify-jwt
```

**Option B: Deploy One by One**
```bash
supabase functions deploy validate-api-key
supabase functions deploy audit-log-writer
supabase functions deploy send-email
# ... etc
```

**Option C: Deploy by Module**
```bash
# Foundation
supabase functions deploy validate-api-key
supabase functions deploy audit-log-writer
supabase functions deploy send-email
supabase functions deploy send-notification

# Meetings
supabase functions deploy sync-zoom-files
supabase functions deploy zoom-transcript-processing
supabase functions deploy generate-meeting-summary
supabase functions deploy auto-embed-meetings
supabase functions deploy categorize-meeting
supabase functions deploy api-v1-meetings

# ... etc
```

---

### **Step 6: Verify Deployment**

```bash
# List deployed functions
supabase functions list

# Test a function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/validate-api-key \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## 🔧 Handling Database Schema Differences

### **Problem:**

Edge functions often reference specific table/column names:

```typescript
// In edge function code
const { data } = await supabase
  .from('meetings')  // ← Table name hardcoded
  .select('id, title, zoom_id')  // ← Column names hardcoded
```

If your new project has different schema, functions will break.

---

### **Solution 1: Use Schema Configuration (Recommended)**

Create a shared configuration file:

**`supabase/functions/_shared/schema-config.ts`**

```typescript
// Schema configuration for database access
export const SCHEMA_CONFIG = {
  tables: {
    meetings: 'meetings',
    zoom_files: 'zoom_files',
    clients: 'clients',
    knowledge_entries: 'knowledge_entries',
    embeddings: 'embeddings',
    ai_agents: 'ai_agents',
    // ... all tables used by edge functions
  },
  columns: {
    meetings: {
      id: 'id',
      title: 'title',
      zoom_id: 'zoom_id',
      scheduled_at: 'scheduled_at',
      // ... all columns
    },
    // ... other tables
  }
};

// Helper to get table name
export const getTable = (table: keyof typeof SCHEMA_CONFIG.tables) => {
  return SCHEMA_CONFIG.tables[table];
};

// Helper to get column name
export const getColumn = (table: string, column: string) => {
  return SCHEMA_CONFIG.columns[table]?.[column] || column;
};
```

**Update edge functions to use config:**

```typescript
import { SCHEMA_CONFIG, getTable } from '../_shared/schema-config.ts';

// Before:
const { data } = await supabase.from('meetings').select('*');

// After:
const { data } = await supabase.from(getTable('meetings')).select('*');
```

**Benefits:**
- ✅ Single place to change schema mappings
- ✅ Easy to adapt to different projects
- ✅ Type-safe with TypeScript

---

### **Solution 2: Environment-Based Mapping**

Use environment variables for table names:

```bash
# Set in Supabase secrets
supabase secrets set TABLE_MEETINGS=meetings
supabase secrets set TABLE_CLIENTS=clients
```

```typescript
// In edge function
const MEETINGS_TABLE = Deno.env.get('TABLE_MEETINGS') || 'meetings';
const { data } = await supabase.from(MEETINGS_TABLE).select('*');
```

**Benefits:**
- ✅ No code changes needed
- ✅ Different configs per environment

**Drawbacks:**
- ❌ More environment variables to manage
- ❌ Less type-safe

---

### **Solution 3: Keep Schema Consistent**

**Best approach:** When creating new project database schema, **use the same table/column names** as the framework.

**How:**
1. Copy migration files from framework
2. Run migrations in new project
3. Schema is identical
4. Edge functions work without changes

```bash
# Copy migrations
cp -r /framework/supabase/migrations/*.sql /new-project/supabase/migrations/

# Run migrations
supabase db push
```

**Benefits:**
- ✅ Zero edge function modifications needed
- ✅ Consistency across projects
- ✅ Easier maintenance

**This is the RECOMMENDED approach for V1 framework.**

---

## 📜 Deployment Scripts

### **`deploy-edge-functions.sh`**

Automated deployment script:

```bash
#!/bin/bash

# Edge Functions Deployment Script for SJ Innovation Framework V1

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SJ Innovation Framework - Edge Functions Deployment     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if in correct directory
if [ ! -d "supabase/functions" ]; then
    echo -e "${RED}Error: Must run from project root with supabase/functions/ directory${NC}"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not installed${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Check if linked to project
if [ ! -f ".git/config" ] && [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}Warning: Project may not be linked to Supabase${NC}"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Select deployment option:"
echo "  1) Deploy all V1 functions (31 functions)"
echo "  2) Deploy by module (select which modules)"
echo "  3) Deploy specific function"
echo ""
read -p "Choice (1-3): " CHOICE

case $CHOICE in
    1)
        echo -e "${GREEN}Deploying all V1 edge functions...${NC}"

        # Foundation
        supabase functions deploy validate-api-key
        supabase functions deploy audit-log-writer
        supabase functions deploy send-email
        supabase functions deploy send-notification

        # Auth & Users
        supabase functions deploy admin-users
        supabase functions deploy admin-delete-user

        # Clients
        supabase functions deploy api-v1-clients

        # Meetings
        supabase functions deploy sync-zoom-files
        supabase functions deploy zoom-transcript-processing
        supabase functions deploy generate-meeting-summary
        supabase functions deploy auto-embed-meetings
        supabase functions deploy categorize-meeting
        supabase functions deploy api-v1-meetings

        # Knowledge Base
        supabase functions deploy google-drive-sync
        supabase functions deploy google-drive-upload
        supabase functions deploy user-knowledge-upload
        supabase functions deploy user-knowledge-drive-sync
        supabase functions deploy user-knowledge-process
        supabase functions deploy auto-embed-knowledge-files
        supabase functions deploy unified-knowledge-search

        # AI Agents
        supabase functions deploy ai-chat-assistant
        supabase functions deploy semantic-search
        supabase functions deploy run-ai-agent
        supabase functions deploy generate-embeddings
        supabase functions deploy gemini-corpus-sync
        supabase functions deploy gemini-rag-query
        supabase functions deploy generate-business-doc
        supabase functions deploy generate-sow

        # Notifications
        supabase functions deploy send-slack-message

        # Feedback
        supabase functions deploy send-feedback-notification

        echo -e "${GREEN}✓ All functions deployed!${NC}"
        ;;

    2)
        echo "Select modules to deploy (space-separated, e.g., '1 3 5'):"
        echo "  1) Foundation (4 functions)"
        echo "  2) Auth & Users (2 functions)"
        echo "  3) Clients (1 function)"
        echo "  4) Meetings (6 functions)"
        echo "  5) Knowledge Base (7 functions)"
        echo "  6) AI Agents (8 functions)"
        echo "  7) Notifications (2 functions)"
        echo "  8) Feedback (1 function)"
        echo ""
        read -p "Modules: " MODULES

        for MODULE in $MODULES; do
            case $MODULE in
                1)
                    echo -e "${GREEN}Deploying Foundation...${NC}"
                    supabase functions deploy validate-api-key
                    supabase functions deploy audit-log-writer
                    supabase functions deploy send-email
                    supabase functions deploy send-notification
                    ;;
                2)
                    echo -e "${GREEN}Deploying Auth & Users...${NC}"
                    supabase functions deploy admin-users
                    supabase functions deploy admin-delete-user
                    ;;
                3)
                    echo -e "${GREEN}Deploying Clients...${NC}"
                    supabase functions deploy api-v1-clients
                    ;;
                4)
                    echo -e "${GREEN}Deploying Meetings...${NC}"
                    supabase functions deploy sync-zoom-files
                    supabase functions deploy zoom-transcript-processing
                    supabase functions deploy generate-meeting-summary
                    supabase functions deploy auto-embed-meetings
                    supabase functions deploy categorize-meeting
                    supabase functions deploy api-v1-meetings
                    ;;
                5)
                    echo -e "${GREEN}Deploying Knowledge Base...${NC}"
                    supabase functions deploy google-drive-sync
                    supabase functions deploy google-drive-upload
                    supabase functions deploy user-knowledge-upload
                    supabase functions deploy user-knowledge-drive-sync
                    supabase functions deploy user-knowledge-process
                    supabase functions deploy auto-embed-knowledge-files
                    supabase functions deploy unified-knowledge-search
                    ;;
                6)
                    echo -e "${GREEN}Deploying AI Agents...${NC}"
                    supabase functions deploy ai-chat-assistant
                    supabase functions deploy semantic-search
                    supabase functions deploy run-ai-agent
                    supabase functions deploy generate-embeddings
                    supabase functions deploy gemini-corpus-sync
                    supabase functions deploy gemini-rag-query
                    supabase functions deploy generate-business-doc
                    supabase functions deploy generate-sow
                    ;;
                7)
                    echo -e "${GREEN}Deploying Notifications...${NC}"
                    supabase functions deploy send-slack-message
                    ;;
                8)
                    echo -e "${GREEN}Deploying Feedback...${NC}"
                    supabase functions deploy send-feedback-notification
                    ;;
            esac
        done
        echo -e "${GREEN}✓ Selected modules deployed!${NC}"
        ;;

    3)
        read -p "Enter function name: " FUNC_NAME
        echo -e "${GREEN}Deploying $FUNC_NAME...${NC}"
        supabase functions deploy "$FUNC_NAME"
        echo -e "${GREEN}✓ Function deployed!${NC}"
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify: supabase functions list"
echo "2. Set secrets if not done: supabase secrets set KEY=value"
echo "3. Test functions with curl or Postman"
echo ""
```

Save as `deploy-edge-functions.sh` and make executable:

```bash
chmod +x deploy-edge-functions.sh
```

---

### **`copy-edge-functions.sh`**

Copy functions from framework to new project:

```bash
#!/bin/bash

# Copy Edge Functions from Framework

set -e

if [ -z "$1" ]; then
    echo "Usage: ./copy-edge-functions.sh <destination-project-path>"
    exit 1
fi

DEST="$1"
SOURCE="$(pwd)"

# V1 Functions to copy
V1_FUNCTIONS=(
    "_shared"
    "validate-api-key"
    "audit-log-writer"
    "send-email"
    "send-notification"
    "admin-users"
    "admin-delete-user"
    "api-v1-clients"
    "sync-zoom-files"
    "zoom-transcript-processing"
    "generate-meeting-summary"
    "auto-embed-meetings"
    "categorize-meeting"
    "api-v1-meetings"
    "google-drive-sync"
    "google-drive-upload"
    "user-knowledge-upload"
    "user-knowledge-drive-sync"
    "user-knowledge-process"
    "auto-embed-knowledge-files"
    "unified-knowledge-search"
    "ai-chat-assistant"
    "semantic-search"
    "run-ai-agent"
    "generate-embeddings"
    "gemini-corpus-sync"
    "gemini-rag-query"
    "generate-business-doc"
    "generate-sow"
    "send-slack-message"
    "send-feedback-notification"
)

echo "Copying V1 edge functions to $DEST/supabase/functions/"

mkdir -p "$DEST/supabase/functions"

for FUNC in "${V1_FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$FUNC" ]; then
        cp -r "supabase/functions/$FUNC" "$DEST/supabase/functions/"
        echo "✓ Copied $FUNC"
    else
        echo "⚠ Warning: $FUNC not found"
    fi
done

echo ""
echo "Copy complete! ${#V1_FUNCTIONS[@]} functions copied."
echo ""
echo "Next steps:"
echo "1. cd $DEST"
echo "2. Review functions in supabase/functions/"
echo "3. Run ./deploy-edge-functions.sh"
```

---

## ⚠️ Important Considerations

### **1. Environment Variables Are Critical**

Edge functions will fail silently or with cryptic errors if env vars are missing.

**Always verify:**
```bash
supabase secrets list
```

---

### **2. Database Schema Must Match**

**Before deploying functions:**
1. Deploy database migrations first
2. Verify tables exist: `SELECT * FROM ai_agents LIMIT 1;`
3. Verify columns match what functions expect

---

### **3. Shared Utilities Must Be Copied First**

`_shared/` folder contains common code. Deploy issues if missing.

**Always copy `_shared/` before other functions.**

---

### **4. Test After Deployment**

```bash
# Test validate-api-key (no auth needed)
curl https://YOUR_PROJECT.supabase.co/functions/v1/validate-api-key

# Test authenticated function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat-assistant \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "test"}'
```

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Managing Secrets](https://supabase.com/docs/guides/functions/secrets)

---

**Last Updated:** 2025-12-25
**Version:** 1.0.0
