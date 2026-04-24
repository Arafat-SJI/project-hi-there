## Goal

Generate a single, reusable Markdown document — `AI_FRAMEWORK_BLUEPRINT.md` — delivered as a downloadable artifact in `/mnt/documents/`. It documents the generic AI-first admin/platform framework derived from this Control Tower codebase, scoped to the **Core baseline** (Auth/Admin/AI Agentic Layer/Knowledge Base/Integrations Hub) plus an **edtech adaptation appendix**. No app code changes.

## Approach

Read-only synthesis from the existing codebase + memory files into one self-contained spec. Stack written as **React + TypeScript + Supabase (Postgres + RLS + Edge Functions + pgvector) as the reference implementation**, with patterns described generically so they port to other stacks.

## Document structure (target: 25–35 pages)

1. **Executive Summary** — what the framework is, who it's for, when to use it.
2. **Architectural Principles** — AI-first, modular, RLS-by-default, admin-configurable, integration-pluggable.
3. **Reference Stack** — React 18 + TS + Vite + Tailwind/shadcn + Supabase (Postgres, Auth, Storage, Edge Functions, pgvector); notes on swapping each layer.
4. **High-Level Architecture Diagram** (ASCII) — frontend shell, module registry, admin panel, AI layer, KB, integrations hub, backend services.
5. **Module 1 — Auth & Identity**
   - Email/password + OAuth (Google, Microsoft/Azure AD)
   - `profiles` table + auto-create trigger
   - Separate `user_roles` table + `has_role()` SECURITY DEFINER
   - RLS policy templates
6. **Module 2 — Admin Panel**
   - Layout pattern (sidebar + topnav, gated by `AdminRoute`)
   - Domain areas: Users, Roles, System Settings, Feature Flags, Integrations, AI, Knowledge, Logs, Analytics
   - `app_config` flat KV pattern + `useAppConfig` hook pattern
   - Feature flag system (build-time `VITE_MODULE_*` + runtime `app_modules` + per-user `user_module_permissions`)
   - Activity logging pattern
7. **Module 3 — AI Agentic Layer**
   - Configurable agents (`ai_agents`)
   - Execution + history (`ai_agent_runs`, `ai_chat_history`)
   - RAG pipeline (`embeddings` + pgvector + ingestion edge functions)
   - Memory lifecycle (extract/retrieve/consolidate)
   - Multi-agent orchestration, guardrails + HITL, MCP, streaming, multi-provider routing
8. **Module 4 — Knowledge Base**
   - Schema, ingestion, auto-embedding, semantic + unified search, personal vs org separation
9. **Module 5 — Integrations Hub**
   - Catalog model (`integration_categories`, `integration_providers`, `integration_fields`)
   - Two-tier credential model (org vs user OAuth)
   - Provider card UI pattern
   - `validate-api-key` polymorphic pattern
   - Background sync pattern + RAG sync integrity
   - Reference provider list
10. **Cross-Cutting Concerns** — DB conventions, migration policy, edge function conventions, type safety, caching, security
11. **Folder Structure Template**
12. **Environment Variables Reference**
13. **Replication Checklist**
14. **Appendix A — Edtech Adaptation** (Learners/Instructors/Courses, AI tutor agents, LMS integrations, suggested tables sketch)
15. **Appendix B — Glossary**
16. **Appendix C — Reference Edge Function Catalog**

## Deliverables

- `/mnt/documents/AI_FRAMEWORK_BLUEPRINT.md`
- `<lov-artifact>` download link in the final reply
- No changes to project source, DB, or migrations

## Out of scope

- No code generation in the project repo
- No new migrations or edge functions
- No SQL beyond conceptual sketches in the edtech appendix
- No images/screenshots (Markdown + ASCII only)