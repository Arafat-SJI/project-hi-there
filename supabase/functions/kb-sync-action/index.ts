import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncItem {
  entity_type: 'knowledge_file' | 'unified_document'
  entity_id: string
}

async function applySyncAction(
  supabase: ReturnType<typeof createClient>,
  item: SyncItem,
  action: 'retry' | 'requeue'
) {
  const now = new Date().toISOString()

  if (item.entity_type === 'knowledge_file') {
    await supabase
      .from('knowledge_files')
      .update({
        processing_status: 'pending',
        processing_error: null,
        last_sync_attempt_at: now,
      })
      .eq('id', item.entity_id)

    if (action === 'requeue') {
      await supabase.from('embedding_queue').insert({
        entity_type: 'knowledge_file',
        entity_id: item.entity_id,
        status: 'pending',
        priority: 5,
      })
    }
  } else if (item.entity_type === 'unified_document') {
    await supabase
      .from('unified_documents')
      .update({
        processing_status: 'pending',
        last_sync_attempt_at: now,
      })
      .eq('id', item.entity_id)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const adminCheck = await requireAdmin(req, supabase, corsHeaders)
    if (adminCheck instanceof Response) return adminCheck
    const { userId } = adminCheck

    const { action, items } = await req.json() as { action: 'retry' | 'requeue'; items: SyncItem[] }

    if (!action || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'action and items[] required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    for (const item of items) {
      await applySyncAction(supabase, item, action)
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `kb_sync_${action}`,
      resource_type: 'knowledge_sync',
      details: { count: items.length, items },
    })

    return new Response(JSON.stringify({ success: true, processed: items.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
