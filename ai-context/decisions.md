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