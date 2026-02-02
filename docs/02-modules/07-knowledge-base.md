# Knowledge Base — Module Blueprint

## Overview
The Knowledge Base module provides organization-wide and personal knowledge management. It includes document storage and categorization, file processing with embeddings for semantic search, RAG (Retrieval-Augmented Generation) for AI-powered queries, Google Drive integration, and meeting knowledge embedding. It serves as the intelligence layer that other modules query for context.

## Module Names
- `Knowledge Base` — Organization knowledge
- `Personal Knowledge` — User-specific knowledge

## Routes Owned
```
/knowledge                              → Knowledge base main (categories, recent)
/knowledge/upload                       → Knowledge file upload
/knowledge/personal                     → Personal knowledge (alias)
/knowledge/search                       → Semantic search UI (vector + text toggle)
/knowledge/category/:slug               → Category detail
/knowledge/new                          → Create knowledge entry
/knowledge/:id                          → Knowledge entry detail
/knowledge/:id/edit                     → Edit knowledge entry
/personal-knowledge                     → Personal knowledge (standalone route)

Admin routes:
/admin/knowledge/analytics              → Knowledge analytics dashboard
/admin/knowledge/categories             → Category management
/admin/knowledge/embeddings             → Embeddings explorer (vector stats, queue, search logs)
/admin/knowledge/queue                  → Processing queue
/admin/knowledge/sources                → Knowledge sources
/admin/knowledge/batch                  → Batch upload
/admin/knowledge/files                  → File management
/admin/knowledge/sync                   → Sync status
/admin/knowledge/gemini                 → Gemini RAG
/admin/knowledge/common                 → Common knowledge management
/admin/ai/semantic-search               → Semantic search (admin)
/admin/ai/embeddings                    → Embedding management
/admin/memory/dashboard                 → Memory dashboard
/admin/memory/user-stats                → User memory stats
/admin/memory/embeddings                → Embedding pipeline monitor
/admin/memory/search                    → Semantic search analytics
/admin/memory/learning                  → Team learning patterns
```

## File Inventory

### Pages (20 files)
User-facing:
- src/pages/Knowledge.tsx — Main knowledge base
- src/pages/KnowledgeCategoryDetail.tsx — Category detail
- src/pages/KnowledgeClientDetail.tsx — Client knowledge
- src/pages/KnowledgeMeetings.tsx — Knowledge-embedded meetings
- src/pages/PersonalKnowledge.tsx — Personal knowledge
- src/pages/projects/ProjectKnowledge.tsx — Project knowledge (cross-module)

Admin:
- src/pages/admin/KnowledgeBase.tsx — Knowledge base admin
- src/pages/admin/KnowledgeBaseAdmin.tsx — KB admin extended
- src/pages/admin/KnowledgeBatchUpload.tsx — Batch upload
- src/pages/admin/KnowledgeCategories.tsx — Categories
- src/pages/admin/KnowledgeDashboard.tsx — Dashboard
- src/pages/admin/KnowledgeSources.tsx — Sources
- src/pages/admin/EmbeddingsExplorer.tsx — Embeddings explorer
- src/pages/admin/GeminiRAG.tsx — Gemini RAG (not in App.tsx but referenced)
- src/pages/admin/ai/EmbeddingManagement.tsx — Embedding management
- src/pages/admin/ai/SemanticSearch.tsx — Semantic search
- src/pages/admin/ai/CommonKnowledgeManagement.tsx — Common knowledge
- src/pages/admin/knowledge/KnowledgeFiles.tsx — File management
- src/pages/admin/knowledge/KnowledgeSyncStatus.tsx — Sync status
- src/pages/admin/memory/EmbeddingPipelineMonitor.tsx — Pipeline monitor
- src/pages/admin/memory/SemanticSearchAnalytics.tsx — Search analytics

### Components — knowledge/ (14 files)
- AttentionNeededPanel.tsx — Items needing attention
- CategoryFilesList.tsx — Files in category
- CategoryGrid.tsx — Category grid display
- CategoryOwnerSelect.tsx — Category owner assignment
- CategorySourcesList.tsx — Sources in category
- ClientKnowledgeList.tsx — Client-specific knowledge
- CostEstimationModal.tsx — Processing cost estimation
- EmbeddingSearchResults.tsx — Search result display
- FileDetailDrawer.tsx — File detail view
- FileUploadModal.tsx — File upload
- GoogleDriveFilePicker.tsx — Google Drive picker
- MeetingsList.tsx — Knowledge-embedded meetings
- ProcessingQueueTab.tsx — Processing queue view
- VectorDBStats.tsx — Vector database statistics

### Components — user-knowledge/ (3 files)
- AgentPersonalizationModal.tsx — AI personalization
- UserGoogleDriveFilePicker.tsx — Personal Drive picker
- UserKnowledgeUploadModal.tsx — Personal file upload

### Components — AI (1 file)
- src/components/ai/KnowledgeContextSelector.tsx — Context selection for AI

### Hooks (20 files)
Core:
- useKnowledgeBase.ts — Main knowledge data
- useKnowledgeCategories.ts — Categories CRUD
- useKnowledgeCategoryOwners.ts — Category owners
- useKnowledgeMeetings.ts — Meeting knowledge
- useKnowledgeQueue.ts — Processing queue
- useCategoryKnowledge.ts — Category-specific knowledge
- useUserKnowledge.ts — Personal knowledge

Documents:
- useAvailableKnowledgeFiles.ts — Available files
- useClientsWithKnowledge.ts — Clients with knowledge
- useClientDocuments.ts — Client documents
- useUnifiedDocuments.ts — Unified document view

Embeddings:
- useAutoEmbeddingPipeline.ts — Auto-embedding
- useAutoEmbedMeetings.ts — Meeting embedding
- useEmbeddingPipeline.ts — Embedding pipeline
- useEmbeddingStats.ts — Statistics
- useEmbeddingCleanup.ts — Cleanup
- useContactEmbeddings.ts — Contact embeddings

Search:
- useSemanticMemorySearch.ts — Semantic search

Cost:
- useCostEstimation.ts — Cost estimation

Sync:
- useDealKnowledgeSync.ts — Deal knowledge sync

### Types (1 file)
- src/types/knowledgeBase.ts — KnowledgeBaseCategory, KnowledgeSource, KnowledgeFile

### Edge Functions (22 functions)
Core:
- knowledge-base — Main knowledge API
- api-v1-documents — Documents API
- client-documents — Client document management
- auto-embed-knowledge-files — Auto-embed files
- auto-embed-meetings — Auto-embed meetings

User Knowledge:
- user-knowledge-upload — Personal file upload
- user-knowledge-process — Process personal files
- user-knowledge-drive-sync — Personal Drive sync

Embeddings:
- generate-embeddings — Generate vector embeddings
- process-embedding-queue — Process embedding queue
- process-pending-project-documents — Process project docs

Search:
- semantic-search — Semantic search API
- unified-knowledge-search — Unified search
- gemini-rag-query — Gemini RAG queries

Project/Client Integration:
- project-knowledge-sync — Project knowledge sync
- index-project-document — Index project document
- index-client-document — Index client document
- reindex-project-files — Re-index project files

Research:
- company-research — Company research
- lead-followup-research — Lead research

### API Endpoints
```
KNOWLEDGE.USER_UPLOAD: 'user-knowledge-upload'
KNOWLEDGE.USER_DRIVE_SYNC: 'user-knowledge-drive-sync'
KNOWLEDGE.USER_PROCESS: 'user-knowledge-process'
KNOWLEDGE.PROJECT_SYNC: 'project-knowledge-sync'
KNOWLEDGE.QUEUE_COST_ESTIMATION: 'queue-cost-estimation'
DOCUMENTS.BASE: 'api-v1-documents'
GEMINI.RAG_QUERY: 'gemini-rag-query'
AI.SEMANTIC_SEARCH: 'semantic-search'
```

## Database Tables
- `knowledge_categories` — Category definitions
- `knowledge_sources` — Source definitions (Google Drive, upload, etc.)
- `knowledge_files` — File records with processing status
- `knowledge_embeddings` — Vector embeddings for semantic search
- `user_knowledge_files` — Personal knowledge files
- `user_knowledge_embeddings` — Personal embeddings
- `embedding_queue` — Processing queue
- `common_knowledge` — Shared knowledge items
- `vector_search_logs` — Search analytics

## Cross-Module Dependencies
**Depends on:** Platform Core, Google Drive integration
**Used by:**
- Projects (project knowledge tab, index project documents)
- Business Dev (deal knowledge sync, client documents, company research)
- Meetings (embed meeting transcripts)
- Admin (knowledge management)

## Implementation Notes
- Knowledge uses vector embeddings for semantic search (pgvector)
- Dual embedding backends: Supabase pgvector and optional Gemini RAG
- Files are processed asynchronously via embedding queue
- Google Drive integration for file sourcing
- Personal knowledge is scoped to individual users
- Cost estimation before batch processing
- Category-based organization with owner assignment
- Meeting transcripts can be auto-embedded for knowledge retrieval

## Implementation Status (this repo)

### Database
- **unified_documents** — Polymorphic owner_type/owner_id; RLS for user/org.
- **embeddings** — Optional `unified_document_id`; `match_embeddings` supports `filter_entity_type`, `filter_user_id`, `p_user_id`.
- **knowledge_categories** — Optional `owner_id` for "My Categories."
- **processing_queue_history** — Batch run logs.
- **gemini_corpora**, **gemini_sync_logs**, **gemini_query_logs** — Gemini RAG logging.
- **app_modules** — Personal Knowledge module with `page_route` `/personal-knowledge`.
- **user_agent_personalizations** — Optional `attached_unified_document_ids`.

### Edge Functions
- **knowledge-base** — Admin API for categories, sources, files, stats.
- **api-v1-documents** — REST over `unified_documents`.
- **client-documents** — Client-scoped documents.
- **user-knowledge-upload** — Creates `unified_documents` (owner_type=user) and falls back to `user_knowledge_files`.
- **user-knowledge-process** — Processes pending `unified_documents` and `user_knowledge_files`; calls `generate-embeddings` with `unified_document_id`.
- **semantic-search** — Uses `match_embeddings` with optional `filter_entity_type`, `filter_user_id`.
- **unified-knowledge-search** — Aggregates entries, user knowledge, unified docs, and semantic results.
- **gemini-rag-query** — Stub; logs to `gemini_query_logs`.
- **generate-embeddings** — Accepts `unified_document_id` and `chunk_index`.
- **agent-conversation-chat** — RAG via `semantic-search`; user personalization (relevance_threshold, max_context_files, use_all_knowledge).

### Frontend
- **Routes:** `/knowledge`, `/knowledge/upload`, `/knowledge/personal`, `/knowledge/search`, `/personal-knowledge`, `/knowledge/category/:slug`, `/knowledge/new`, `/knowledge/:id`, `/knowledge/:id/edit`.
- **Admin Routes:** `/admin/knowledge/analytics`, `/admin/knowledge/categories`, `/admin/knowledge/embeddings` (Embeddings Explorer).
- **Semantic Search page** — Toggle between vector (semantic) and text search; calls `semantic-search` edge function; color-coded similarity scores; search history.
- **Embeddings Explorer admin page** — Overview stats (total embeddings, coverage, queue, searches); embedding queue table; vector search logs; batch trigger.
- **Personal Knowledge page** — Stats, Process Pending, upload, list (unified_documents + user_knowledge_files), delete.
- **Hooks:** `useUserKnowledgeFiles`, `useUserKnowledgeSources`, `useUnifiedUserDocuments`, `useUserKnowledgeStats`, `useUserFileStats`, `useProcessAllPendingFiles`, `useUploadUserKnowledgeFile`, `useDeleteUserKnowledgeFile`, `useDeleteUnifiedDocument`, `useCreateUserKnowledgeSource`, `useSemanticMemorySearch`, `useKnowledgeBaseStats`, `useKnowledgeBaseCategories`, `useKnowledgeBaseSources`, `useKnowledgeBaseFiles`, `useAllAgentPersonalizations`, `useUpdateAgentPersonalization`, `useUpsertAgentPersonalization`.
- **Types:** `src/types/knowledgeBase.ts` (UnifiedDocument, KnowledgeBaseStats, SemanticSearchResult, UserAgentPersonalization, etc.).
- **Navigation:** Knowledge Base, Semantic Search, and Personal Knowledge (module: knowledge) in sidebar; BookMarked icon for Personal Knowledge; Embeddings Explorer in admin sidebar.
- **KnowledgeContextSelector** — AI context selection (personal, categories) in `src/components/ai/KnowledgeContextSelector.tsx`.

### Testing
- **Manual flows:** Org KB — create category, attach sources, upload files; verify processing and search in `/knowledge` and `/knowledge/category/:slug`. Personal — upload files (or use user-knowledge-upload with FormData), run Process Pending, verify unified_documents and embeddings; check Personal Knowledge page and AI chat RAG. Admin — call knowledge-base edge for stats/categories/sources/files.
- **Unit tests (optional):** Mock Supabase and edge responses for hooks (e.g. `useSemanticMemorySearch`, `useUserKnowledgeStats`); assert query keys and derived state. Integration tests for edge functions: RLS, queue processing, semantic-search filters.
