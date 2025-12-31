import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseVTT(vttContent: string): string {
  const lines = vttContent.split('\n')
  const textLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip VTT header, timestamps, and empty lines
    if (line &&
        !line.startsWith('WEBVTT') &&
        !line.includes('-->') &&
        !line.match(/^\d+$/)) {
      textLines.push(line)
    }
  }

  return textLines.join('\n')
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

    const { file_id } = await req.json()

    if (!file_id) {
      return new Response(
        JSON.stringify({ error: 'file_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get zoom file
    const { data: file, error: fetchError } = await supabaseClient
      .from('zoom_files')
      .select('*')
      .eq('id', file_id)
      .single()

    if (fetchError) throw fetchError

    if (!file.download_url || file.file_type !== 'TRANSCRIPT') {
      throw new Error('File is not a transcript or download URL is missing')
    }

    // Download VTT file from Zoom
    const vttResponse = await fetch(file.download_url)
    if (!vttResponse.ok) {
      throw new Error('Failed to download transcript')
    }

    const vttContent = await vttResponse.text()
    const transcriptText = parseVTT(vttContent)

    // Update zoom_files with processed transcript
    const { error: updateError } = await supabaseClient
      .from('zoom_files')
      .update({
        transcript_text: transcriptText,
        transcript_content: { vtt: vttContent },
        is_processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', file_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        transcript_length: transcriptText.length,
        segments_count: transcriptText.split('\n').length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Zoom transcript processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
