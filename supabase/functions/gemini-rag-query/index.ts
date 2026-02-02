/**
 * gemini-rag-query — RAG queries over Gemini corpora.
 * Sends query to Gemini RAG and logs to gemini_query_logs.
 */
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

    const { query, corpus_id, user_id } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const start = Date.now()
    // Placeholder: actual Gemini RAG API call would go here (e.g. Google AI SDK)
    // For now return a stub and log the query
    const resultCount = 0
    const durationMs = Date.now() - start

    await supabaseClient.from('gemini_query_logs').insert({
      corpus_id: corpus_id ?? null,
      user_id: user_id ?? null,
      query_text: query,
      result_count: resultCount,
      duration_ms: durationMs,
      metadata: { stub: true },
    })

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: [],
        result_count: resultCount,
        duration_ms: durationMs,
        message: 'Gemini RAG integration: configure GEMINI_API_KEY and corpus for live results',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('gemini-rag-query error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
