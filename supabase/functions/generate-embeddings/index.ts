import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

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
      chunk_size = 800
    } = await req.json()

    if (!entity_type || !entity_id || !content) {
      return new Response(
        JSON.stringify({ error: 'entity_type, entity_id, and content are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Chunk the content
    const chunks = chunkText(content, chunk_size)
    const embeddings = []

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      })

      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate embedding')
      }

      const embeddingData = await embeddingResponse.json()
      const embedding = embeddingData.data[0].embedding

      embeddings.push({
        entity_type,
        entity_id,
        user_id: user_id || null,
        content: chunk,
        metadata,
        embedding,
        embedding_status: 'completed',
      })

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

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
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Generate embeddings error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
