# Edge Functions

Serverless functions that run on Supabase's Deno runtime.

---

## Overview

Edge functions handle:
- AI processing (chat, embeddings, summaries)
- External API calls (Zoom, Google, Microsoft)
- Webhook handling
- Authentication flows
- Background processing

---

## Files in This Section

| File | Description |
|------|-------------|
| [catalog.md](./catalog.md) | List of all functions |
| [development.md](./development.md) | Creating functions |
| [deployment.md](./deployment.md) | Deploying functions |
| [secrets-management.md](./secrets-management.md) | Managing secrets |
| [testing.md](./testing.md) | Testing functions |

---

## Function Catalog

### AI Functions
| Function | Purpose |
|----------|---------|
| `ai-chat-assistant` | AI chat responses |
| `generate-embeddings` | Create vector embeddings |
| `generate-meeting-summary` | Summarize meeting transcripts |
| `semantic-search` | Vector similarity search |
| `run-ai-agent` | Execute AI agents |

### Integration Functions
| Function | Purpose |
|----------|---------|
| `sync-zoom-files` | Sync Zoom recordings |
| `google-drive-sync` | Sync Google Drive files |
| `microsoft-graph-subscribe` | MS Graph webhooks |
| `oauth-exchange-token` | OAuth token exchange |
| `oauth-refresh-token` | Refresh OAuth tokens |

### Utility Functions
| Function | Purpose |
|----------|---------|
| `send-email` | Send emails via SendGrid |
| `send-notification` | In-app notifications |
| `webhook-handler` | Process incoming webhooks |
| `check-environment` | Validate configuration |

See [Full Catalog](./catalog.md) for complete list.

---

## Quick Commands

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-chat-assistant

# View logs
supabase functions logs ai-chat-assistant

# Test locally
supabase functions serve
```

---

## Function Structure

```
supabase/functions/
├── _shared/              # Shared utilities
│   └── ai-provider-routing.ts
├── ai-chat-assistant/
│   └── index.ts
├── generate-embeddings/
│   └── index.ts
└── ...
```

---

## Creating a Function

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization")!;
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Your logic here
    const result = { success: true };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Managing Secrets

```bash
# Add secret
supabase secrets set OPENAI_API_KEY=sk-xxx

# List secrets
supabase secrets list
```

Or via Supabase Dashboard → Settings → Edge Function Secrets

---

## Common Patterns

### Authentication
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return new Response("Unauthorized", { status: 401 });
}
```

### Database Access
```typescript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("user_id", user.id);
```

### External API Call
```typescript
const response = await fetch("https://api.example.com/endpoint", {
  headers: { Authorization: `Bearer ${Deno.env.get("API_KEY")}` }
});
```

---

## Troubleshooting

### Function not found
- Run `supabase functions deploy function-name`
- Check function name matches folder name

### CORS errors
- Ensure corsHeaders include your origin
- Handle OPTIONS preflight request

### Timeout
- Default timeout is 60s
- Optimize long-running operations
- Consider background processing
