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

    // Get pending user knowledge files
    const { data: files } = await supabaseClient
      .from('user_knowledge_files')
      .select('*')
      .eq('processing_status', 'pending')
      .limit(5)

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0

    for (const file of files) {
      try {
        // Download file from storage
        const { data: fileData } = await supabaseClient.storage
          .from('user-knowledge')
          .download(file.file_path)

        if (!fileData) continue

        // Extract text (simplified - handle PDF, DOCX, TXT)
        const text = await fileData.text()

        // Generate embeddings
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_type: 'user_knowledge_file',
            entity_id: file.id,
            content: text,
            user_id: file.user_id,
            metadata: {
              file_name: file.file_name,
              source_id: file.source_id,
            },
          }),
        })

        if (response.ok) {
          const result = await response.json()

          // Update file status
          await supabaseClient
            .from('user_knowledge_files')
            .update({
              processing_status: 'completed',
              is_indexed: true,
              indexed_at: new Date().toISOString(),
              embedding_count: result.embeddings_created,
            })
            .eq('id', file.id)

          processedCount++
        } else {
          // Mark as failed
          await supabaseClient
            .from('user_knowledge_files')
            .update({
              processing_status: 'failed',
              error_message: 'Failed to generate embeddings',
            })
            .eq('id', file.id)
        }
      } catch (error) {
        console.error(`Error processing file ${file.id}:`, error)

        await supabaseClient
          .from('user_knowledge_files')
          .update({
            processing_status: 'failed',
            error_message: error.message,
          })
          .eq('id', file.id)
      }

      // Delay to avoid rate limiting
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
    console.error('User knowledge process error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
