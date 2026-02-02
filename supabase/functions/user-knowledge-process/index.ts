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

    // Prefer pending unified_documents (owner_type = user), then user_knowledge_files
    const { data: unifiedFiles } = await supabaseClient
      .from('unified_documents')
      .select('*')
      .eq('owner_type', 'user')
      .eq('processing_status', 'pending')
      .limit(5)

    let files: Array<{ id: string; user_id: string; file_path?: string; file_name: string; source_id?: string; storage_path?: string }> = []
    let table = 'unified_documents'

    if (unifiedFiles && unifiedFiles.length > 0) {
      files = unifiedFiles.map((f) => ({
        id: f.id,
        user_id: f.owner_id,
        file_path: f.storage_path ?? f.file_name,
        file_name: f.file_name ?? f.title,
        source_id: f.source_id,
        storage_path: f.storage_path,
      }))
    } else {
      const { data: ukFiles } = await supabaseClient
        .from('user_knowledge_files')
        .select('*')
        .eq('processing_status', 'pending')
        .limit(5)
      if (ukFiles && ukFiles.length > 0) {
        table = 'user_knowledge_files'
        files = ukFiles.map((f) => ({
          id: f.id,
          user_id: f.user_id,
          file_path: f.file_path,
          file_name: f.file_name,
          source_id: f.source_id,
        }))
      }
    }

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No files to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0

    for (const file of files) {
      try {
        const storagePath = (file as { storage_path?: string; file_path?: string }).storage_path ?? (file as { file_path?: string }).file_path
        if (!storagePath) continue

        const { data: fileData } = await supabaseClient.storage
          .from('user-knowledge')
          .download(storagePath)

        if (!fileData) continue

        const text = await fileData.text()

        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_type: table === 'unified_documents' ? 'unified_document' : 'user_knowledge_file',
            entity_id: file.id,
            content: text,
            user_id: file.user_id,
            unified_document_id: table === 'unified_documents' ? file.id : undefined,
            metadata: {
              file_name: file.file_name,
              source_id: file.source_id,
            },
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const updatePayload: Record<string, unknown> = {
            processing_status: 'completed',
            chunk_count: result.embeddings_created ?? result.chunks_processed ?? 0,
            processed_at: new Date().toISOString(),
          }
          if (table === 'user_knowledge_files') {
            await supabaseClient.from('user_knowledge_files').update(updatePayload).eq('id', file.id)
          } else {
            await supabaseClient.from('unified_documents').update(updatePayload).eq('id', file.id)
          }
          processedCount++
        } else {
          await supabaseClient
            .from(table)
            .update({
              processing_status: 'failed',
              processing_error: 'Failed to generate embeddings',
            })
            .eq('id', file.id)
        }
      } catch (error: unknown) {
        console.error(`Error processing file ${file.id}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await supabaseClient
          .from(table)
          .update({
            processing_status: 'failed',
            processing_error: errorMessage,
          })
          .eq('id', file.id)
      }

      await new Promise((r) => setTimeout(r, 1000))
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
    console.error('User knowledge process error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
