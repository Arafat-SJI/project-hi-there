# Technical Decisions

## AI Streaming Architecture

Decision:
Use SSE (Server-Sent Events) instead of WebSockets for AI streaming responses.

Reason:
- simpler implementation
- easier scaling
- works well for one-way AI token streaming
- lower infrastructure complexity

Status:
Active architecture pattern

## Four Spaces Information Architecture

Decision:
Reorganize navigation into four workspaces (Sales, Knowledge, Operations, EOS) with space-prefixed routes, unified `SpaceLayout`, and legacy redirects. Rollout gated by `features.enableFourSpaces` in `app_config`.

Reason:
- Reduce sidebar complexity and admin/app duplication
- Role-focused discoverability
- Backward-compatible migration via redirects

Status:
Implemented (feature flag off by default). See `docs/specs/four-spaces-ia.md`.