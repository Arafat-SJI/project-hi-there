# Deploy Latest Edge Functions

Deploy the 11 edge functions modified in recent commits using `supabase--deploy_edge_functions`. All functions that depend on the updated `_shared/` helpers are already in this set, so no extra deploys are needed.

## Functions to deploy
1. admin-memory-actions
2. gemini-rag-query
3. generate-embeddings
4. import-productivity-csv
5. integration-settings
6. kb-bulk-reembed
7. kb-chunk-preview
8. kb-rag-playground
9. kb-sync-action
10. process-embedding-queue
11. semantic-search

## Steps
1. Call `supabase--deploy_edge_functions` with all 11 function names in a single call.
2. Report deployment results back to the user (success/failure per function).
3. If any function fails, fetch its logs via `supabase--edge_function_logs` to diagnose.

## Out of scope
- No code changes to any function.
- No DB migrations (recent KB RAG migration already applied via standard flow).
- No redeploy of unchanged functions.
