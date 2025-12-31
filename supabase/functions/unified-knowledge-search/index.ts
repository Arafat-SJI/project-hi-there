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

    const { query, user_id, include_user_knowledge = true } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Search knowledge entries (full-text search)
    const { data: entries } = await supabaseClient
      .from('knowledge_entries')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')
      .limit(10)

    let userKnowledgeResults = []

    // Search user knowledge if requested
    if (include_user_knowledge && user_id) {
      const { data: userKnowledge } = await supabaseClient
        .from('user_knowledge_files')
        .select('*')
        .eq('user_id', user_id)
        .ilike('file_name', `%${query}%`)
        .limit(10)

      userKnowledgeResults = userKnowledge || []
    }

    // Could also call semantic-search for vector similarity
    // const semanticResults = await fetch(...)

    return new Response(
      JSON.stringify({
        results: {
          knowledge_entries: entries || [],
          user_knowledge: userKnowledgeResults,
          total: (entries?.length || 0) + userKnowledgeResults.length,
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
