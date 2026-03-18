

## Problem

The admin sidebar has overlapping and confusing AI-related sections:

| Current Group | Items |
|---|---|
| **KNOWLEDGE & AI** | AI Hub (7 sub-items), Semantic Search (2), User Memory (4), Knowledge Base (8) |
| **AI & AUTOMATION** | AI Models, AI Usage Analytics, MCP Servers |
| **KNOWLEDGE** (standalone) | 9 items duplicating items already inside KNOWLEDGE & AI |
| **EOS** (standalone) | 5 items duplicating items already inside PEOPLE & PERFORMANCE |

This creates confusion: "Where do I go to manage AI agents? AI Hub or AI & Automation?" and "Which Knowledge section has what I need?"

## Proposed Reorganization

Merge into two clean groups, remove duplicates:

```text
INTELLIGENCE & AI                    (merge of KNOWLEDGE & AI + AI & AUTOMATION)
├─ AI Hub                            (collapsible)
│  ├─ Dashboard
│  ├─ AI Agents
│  ├─ Agent Analytics
│  ├─ Agent Categories
│  ├─ Prompt Templates
│  ├─ Email Drafting
│  └─ Deal Coaching
├─ AI Models & Usage                 (collapsible, was in AI & AUTOMATION)
│  ├─ AI Models
│  ├─ AI Usage Analytics
│  └─ MCP Servers
├─ Semantic Search                   (collapsible)
│  ├─ Search
│  └─ Embeddings
├─ User Memory                       (collapsible)
│  ├─ Memory Dashboard
│  ├─ User Memory Stats
│  ├─ Search Analytics
│  └─ Team Learning Patterns
└─ Knowledge Base                    (collapsible)
   ├─ Common Knowledge
   ├─ Processing Queue
   ├─ Sources
   ├─ Categories
   ├─ Batch Upload
   ├─ Files
   ├─ Sync Status
   └─ Gemini RAG

(Remove standalone KNOWLEDGE and EOS groups — they are duplicates)
```

## Changes

| File | Change |
|------|--------|
| `src/shared/data/navigationStructure.ts` | Merge "AI & AUTOMATION" items into "KNOWLEDGE & AI" (renamed to "INTELLIGENCE & AI"), add "AI Models & Usage" as a collapsible sub-section. Remove duplicate `admin-knowledge` and `admin-eos` groups entirely. |

No other files change — the sidebar component already supports `headerOnly` collapsible children, so the new structure renders automatically.

