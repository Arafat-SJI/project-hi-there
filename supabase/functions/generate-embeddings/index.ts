import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateEmbedding, getModel, logUsage, calculateCost } from '../_shared/ai-provider-routing.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function chunkText(text: string, chunkSize = 800): string[] {
  const chunks = []
  let start = 0

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize))
    start += chunkSize
  }

  return chunks
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

    const {
      entity_type,
      entity_id,
      content,
      metadata = {},
      user_id,
      model_id,
      chunk_size = 800,
      unified_document_id,
    } = await req.json()

    if (!entity_type || !entity_id || !content) {
      return new Response(
        JSON.stringify({ error: 'entity_type, entity_id, and content are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the embedding model
    const model = await getModel(supabaseClient, model_id, 'embedding')
    if (!model) {
      throw new Error('No valid embedding model found')
    }

    // Chunk the content
    const chunks = chunkText(content, chunk_size)
    const embeddings = []
    let totalTokens = 0
    let totalCost = 0

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const response = await generateEmbedding(supabaseClient, chunk, model_id)

      embeddings.push({
        entity_type,
        entity_id,
        user_id: user_id || null,
        unified_document_id: unified_document_id || null,
        content: chunk,
        chunk_index: i,
        metadata,
        embedding: response.embedding,
      })

      totalTokens += response.tokens

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Calculate total cost
    totalCost = calculateCost(model, 0, 0, totalTokens)

    // Log usage
    await logUsage(
      supabaseClient,
      user_id,
      model.id,
      'generate-embeddings',
      0,
      0,
      totalTokens,
      totalCost
    )

    // Insert embeddings into database
    const { data, error } = await supabaseClient
      .from('embeddings')
      .insert(embeddings)
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        embeddings_created: data.length,
        chunks_processed: chunks.length,
        total_tokens: totalTokens,
        estimated_cost: totalCost,
        model_used: model.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Generate embeddings error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
