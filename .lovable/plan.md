
## Goal
Restructure the **INTELLIGENCE & AI** sidebar group for clearer grouping. Pure navigation/UI change — no business logic, no DB changes.

## Current structure
```
INTELLIGENCE & AI
├── AI Agents
├── Agent Categories
├── Prompt Templates
├── AI Analytics
├── Deal Coaching
├── Email Drafting
└── AI Hub (group)
    ├── Knowledge Search
    ├── Memory
    └── AI Models
```

## Proposed structure
```
INTELLIGENCE & AI
├── AI Analytics                          ← moved to top
├── AI Agents (group)                     ← Deal Coaching + Email Drafting nested
│   ├── All Agents          /admin/ai/agents
│   ├── Deal Coaching       /admin/ai/deal-coaching
│   └── Email Drafting      /admin/ai/email-drafting
└── AI Configuration (group)              ← renamed from "AI Hub"
    ├── Agent Categories    /admin/ai/agent-categories
    ├── Prompt Templates    /admin/ai/prompt-templates
    ├── Memory              /admin/ai-hub/memory
    └── AI Models           /admin/ai-models
```

### Knowledge Search (Q1)
`Knowledge Search` (`/admin/ai-hub/knowledge-search`) is essentially a semantic-search playground over the knowledge base — it belongs with Knowledge Base, not AI. Move it into the **KNOWLEDGE BASE → Access & Testing** page as a third tab alongside Permissions and Playground:

```
KNOWLEDGE BASE
└── Knowledge Base
    ├── Dashboard
    ├── Content (Categories | Files)
    └── Access & Testing (Permissions | Playground | Knowledge Search)  ← new tab
```

Old route `/admin/ai-hub/knowledge-search` redirects to `/admin/knowledge/access?tab=search`.

## Files to change
1. **`src/shared/data/navigationStructure.ts`** — rewrite the `intelligence-ai` group per above; add `Knowledge Search` tab entry under Knowledge Base (or rely on tab-only, no sidebar entry).
2. **`src/pages/admin/KnowledgeAccess.tsx`** — add third `<TabsTrigger value="search">` rendering the existing `<KnowledgeSearch />` page component.
3. **`src/modules/admin/routes.tsx`** — replace `/admin/ai-hub/knowledge-search` element with `<Navigate to="/admin/knowledge/access?tab=search" replace />`.

## Out of scope
- No changes to page internals beyond the new tab wrapper.
- No DB, RLS, or edge-function changes.
- Underlying URLs for moved leaves (Deal Coaching, Email Drafting, Agent Categories, Prompt Templates, Memory, AI Models) stay the same — only the sidebar nesting changes.
