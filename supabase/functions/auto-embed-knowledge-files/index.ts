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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get unprocessed knowledge files
    const { data: files } = await supabaseClient
      .from('knowledge_files')
      .select('*')
      .eq('is_indexed', false)
      .limit(10)

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
      } catch (error) {
        console.error(`Error processing file ${file.id}:`, error)

        await supabaseClient
          .from('knowledge_files')
          .update({
            processing_status: 'failed',
            error_message: error.message,
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
  } catch (error) {
    console.error('Auto embed knowledge files error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
