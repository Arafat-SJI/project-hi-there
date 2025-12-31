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
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, folder_id, source_id } = await req.json()

    if (!source_id) {
      return new Response(
        JSON.stringify({ error: 'source_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (action === 'list-files' && folder_id) {
      // List files from Google Drive folder
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folder_id}'+in+parents&key=${GOOGLE_API_KEY}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime)`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch Google Drive files')
      }

      const data = await response.json()

      return new Response(
        JSON.stringify({ success: true, files: data.files || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error: unknown) {
    console.error('Google Drive sync error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
