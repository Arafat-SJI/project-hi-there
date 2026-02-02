import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { query, user_id, include_user_knowledge = true, use_semantic = true } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const baseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Full-text: knowledge_entries
    const { data: entries } = await supabaseClient
      .from('knowledge_entries')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')
      .limit(10)

    let userKnowledgeResults: unknown[] = []
    if (include_user_knowledge && user_id) {
      const { data: userKnowledge } = await supabaseClient
        .from('user_knowledge_files')
        .select('*')
        .eq('user_id', user_id)
        .ilike('file_name', `%${query}%`)
        .limit(10)
      userKnowledgeResults = userKnowledge || []
    }

    // Unified docs (user) by text match on title
    let unifiedResults: unknown[] = []
    if (user_id) {
      const { data: ud } = await supabaseClient
        .from('unified_documents')
        .select('*')
        .eq('owner_type', 'user')
        .eq('owner_id', user_id)
        .ilike('title', `%${query}%`)
        .limit(10)
      unifiedResults = ud || []
    }

    // Semantic search (vector) if enabled
    let semanticResults: unknown[] = []
    if (use_semantic && baseUrl && serviceKey) {
      try {
        const semRes = await fetch(`${baseUrl}/functions/v1/semantic-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            query,
            match_count: 10,
            entity_type: null,
            user_id: include_user_knowledge ? user_id : null,
          }),
        })
        if (semRes.ok) {
          const semBody = await semRes.json()
          semanticResults = semBody.results || []
        }
      } catch {
        // ignore
      }
    }

    return new Response(
      JSON.stringify({
        results: {
          knowledge_entries: entries || [],
          user_knowledge: userKnowledgeResults,
          unified_documents: unifiedResults,
          semantic: semanticResults,
          total:
            (entries?.length || 0) +
            userKnowledgeResults.length +
            unifiedResults.length +
            semanticResults.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Unified knowledge search error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
