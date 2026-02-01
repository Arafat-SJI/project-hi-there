# Knowledge Base — Module Blueprint

## Overview
The Knowledge Base module provides organization-wide and personal knowledge management. It includes document storage and categorization, file processing with embeddings for semantic search, RAG (Retrieval-Augmented Generation) for AI-powered queries, Google Drive integration, and meeting knowledge embedding. It serves as the intelligence layer that other modules query for context.

## Module Names
- `Knowledge Base` — Organization knowledge
- `Personal Knowledge` — User-specific knowledge

## Routes Owned
```
/knowledge                              → Knowledge base main (categories, recent)
/knowledge/category/:slug               → Category detail
/knowledge/clients/:clientSlug          → Client knowledge detail
/knowledge/meetings                     → Knowledge-embedded meetings
/personal-knowledge                     → Personal knowledge

Admin routes:
/admin/knowledge                        → Knowledge dashboard
/admin/knowledge/queue                  → Processing queue
/admin/knowledge/sources                → Knowledge sources
/admin/knowledge/categories             → Category management
/admin/knowledge/batch                  → Batch upload
/admin/knowledge/files                  → File management
/admin/knowledge/sync                   → Sync status
/admin/knowledge/gemini                 → Gemini RAG
/admin/knowledge/common                 → Common knowledge management
/admin/ai/semantic-search               → Semantic search
/admin/ai/embeddings                    → Embedding management
/admin/ai/embeddings-explorer           → Embeddings explorer
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
