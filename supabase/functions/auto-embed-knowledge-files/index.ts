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

    const { data: setting } = await supabaseClient
      .from('system_settings')
      .select('value')
      .eq('category', 'ai')
      .eq('key', 'embedding_processing_enabled')
      .maybeSingle()
    const enabled = setting?.value === true || setting?.value === 'true' || setting?.value === '"true"'
    if (!enabled) {
      return new Response(
        JSON.stringify({ error: 'Embedding pipeline is disabled', code: 'PIPELINE_DISABLED' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      )
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const body = await req.json().catch(() => ({}))
    const batchSize = Math.min(Math.max(1, Number(body?.batch_size) || 10), 50)
    const retryFailed = Boolean(body?.retry_failed)

    let query = supabaseClient
      .from('knowledge_files')
      .select('*')
      .limit(batchSize)

    if (retryFailed) {
      query = query.or('processing_status.eq.pending,processing_status.eq.failed')
    } else {
      query = query.or('processing_status.eq.pending,processing_status.is.null')
    }

    const { data: files } = await query

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0

    for (const file of files) {
      try {
        // Download file and extract text
        // This is simplified - would need file type handling

        const { data: fileData } = await supabaseClient.storage
          .from('knowledge-files')
          .download(file.file_path)

        if (!fileData) continue

        const text = await fileData.text()

        // Generate embeddings
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_type: 'knowledge_file',
            entity_id: file.id,
            content: text,
            metadata: {
              file_name: file.file_name,
              source_id: file.source_id,
            },
          }),
        })

        if (response.ok) {
          const result = await response.json()

          await supabaseClient
            .from('knowledge_files')
            .update({
              is_indexed: true,
              indexed_at: new Date().toISOString(),
              embedding_count: result.embeddings_created,
              processing_status: 'completed',
            })
            .eq('id', file.id)

          processedCount++
        }
      } catch (error: unknown) {
        console.error(`Error processing file ${file.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        await supabaseClient
          .from('knowledge_files')
          .update({
            processing_status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', file.id)
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: processedCount,
        total_found: files.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Auto embed knowledge files error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
