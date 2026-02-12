

# Fix 3 Build Errors + Supabase Client Onboarding Requirements

## Part 1: Supabase Information Needed from the Client

The previous onboarding checklist missed Supabase entirely. Here is what you need to collect or decide for each new client deployment:

### A. Supabase Project Setup
- **Deployment model**: Will the client get their own dedicated Supabase project, or share the existing one with tenant isolation?
- **Region preference**: Which Supabase region (US West, US East, EU, Asia, etc.) for data residency compliance?
- **Plan tier**: Free, Pro, or Team? (affects storage limits, edge function invocations, and database size)

### B. Database Credentials (if client brings their own Supabase)
- **Project URL**: `https://<project-ref>.supabase.co`
- **Anon (publishable) key**: For frontend client
- **Service Role key**: For edge functions (server-side only, never exposed to browser)
- **Database connection string**: For direct DB access or migrations

### C. Authentication Configuration
- **Auth providers to enable**: Email/password, Microsoft SSO (Azure AD), Google OAuth, Magic Link?
- **Azure AD details** (if using Microsoft SSO):
  - Tenant (Directory) ID
  - Application (Client) ID
  - Redirect URI (production domain)
  - Post-logout redirect URI
- **Google OAuth details** (if using Google login):
  - Client ID and Client Secret from Google Cloud Console
- **Custom domain**: Will the client use a custom domain (e.g., `app.clientname.com`)? This affects redirect URIs for all OAuth providers.

### D. Edge Function Secrets
These must be configured in the Supabase Dashboard under Settings > Edge Functions > Secrets:

| Secret | Purpose | Required? |
|--------|---------|-----------|
| `OPENAI_API_KEY` | AI features (deal coach, meeting summaries, embeddings) | Yes -- core AI |
| `GEMINI_API_KEY` | Alternative AI provider | Optional |
| `SENDGRID_API_KEY` | Email notifications and contact outreach | If using email features |
| `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` / `ZOOM_ACCOUNT_ID` | Zoom meeting sync | If using Zoom integration |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_API_KEY` | Google Drive integration | If using Drive/Docs |
| `SLACK_WEBHOOK_URL` | Slack notifications | If using Slack |

### E. Storage Buckets
- Confirm whether the client needs:
  - `knowledge-files` (for knowledge base uploads)
  - `meeting-recordings` (for meeting audio/video)
  - `user-knowledge` (for personal documents)
- **Storage limits**: How much storage does the client expect to use?

### F. Row-Level Security (RLS) / Multi-Tenancy
- If sharing a Supabase project across clients, you need a **tenant isolation strategy** (e.g., `organization_id` column on all tables with RLS policies filtering by tenant).
- If dedicated project per client, standard user-based RLS is sufficient.

### G. Backup and Data Retention
- **Point-in-time recovery**: Does the client require PITR? (Pro plan and above)
- **Data retention policy**: How long should deleted records be kept?
- **Export requirements**: Does the client need periodic data exports?

---

## Part 2: Fix 3 Build Errors

### Error 1: `deal-coach/index.ts` -- Wrong `chatCompletion` call signature

The `chatCompletion` function signature is:
```
chatCompletion(supabase, request: ChatCompletionRequest, modelId?: string)
```

But the current code passes `model` (an AIModel object) as the second argument. 

**Fix** (line 124): Swap the arguments -- pass the request object as the second arg and `model.model_id` as the third:
```typescript
const result = await chatCompletion(supabase, {
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `...` },
  ],
  temperature: 0.7,
  max_tokens: 1500,
}, model.model_id);
```

Since `chatCompletion` internally calls `getModel()` again with the modelId, the earlier `getModel()` call on line 115 is now only used for the null check and final response. This is fine.

### Error 2: `AppSidebar.tsx` -- `.count` on `never` type

Line 377 accesses `dealStageCounts[stageMatch[1]]?.count`, but TypeScript infers `dealStageCounts` as `Record<string, never>` because `by_stage` in `DealPipelineStats` is not explicitly typed in the return.

**Fix** (line 377): Add a type assertion to the access:
```typescript
const stageCount = stageMatch
  ? (dealStageCounts as Record<string, { count: number; value: number }>)[stageMatch[1]]?.count
  : undefined;
```

### Error 3: `useDeals.ts` -- `title` not in Insert type

Line 182 passes `title` directly to `.insert()`, but the Supabase `deals` Insert type expects `title: string` and `slug: string` as required fields. The issue is that the insert object includes `title` which IS a valid field. The real error is that TypeScript expects the argument to be typed as a single object, not an array.

Looking at the error message: "'title' does not exist in type `{...}[]`" -- the problem is that `.insert()` is receiving or being inferred as expecting an **array** of objects. 

**Fix** (line 181): Add explicit single-object typing by wrapping with `as any` or using a typed variable:
```typescript
const { data: deal, error } = await supabase.from("deals").insert({
  title: data.title,
  slug: `${slug}-${Date.now().toString(36)}`,
  ...rest
} as any).select().single();
```

Alternatively, extract the insert payload into a typed const first to help TypeScript infer correctly.
