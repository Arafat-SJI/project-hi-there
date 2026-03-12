

## Apply ClickUp & Workamajig Integration Providers SQL

### What This Does
- Enables the **ClickUp** integration provider (OAuth2-based) with client_id and client_secret fields
- Creates a new **Workamajig** integration provider (API key-based) with base_url, api_access_token, and user_token fields
- All inserts use `ON CONFLICT DO NOTHING` so it's safe to re-run

### Implementation
Create a migration file containing the provided SQL and apply it via the migration tool. The SQL is a data-seeding operation wrapped in a `DO` block that:

1. Looks up the `project-management` category (exits safely if not found)
2. Upserts the ClickUp provider with OAuth2 config
3. Inserts the Workamajig provider if it doesn't exist
4. Adds configuration fields for both providers

### Existing Build Errors (Unrelated)
There are pre-existing TypeScript errors in `useAuthConfig.ts` and `usePodHealth.ts` caused by Supabase type mismatches. These are separate from this SQL operation and can be addressed afterward if needed.

