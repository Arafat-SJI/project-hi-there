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

    const { file_id } = await req.json()

    if (!file_id) {
      return new Response(
        JSON.stringify({ error: 'file_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get meeting file
    const { data: file } = await supabaseClient
      .from('zoom_files')
      .select('transcript_text, meeting_topic')
      .eq('id', file_id)
      .single()

    if (!file || !file.transcript_text) {
      throw new Error('Transcript not found')
    }

    // Categorize using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Categorize meetings into: client_meeting, internal_meeting, planning, review, standup, or other. Extract key topics and sentiment.'
          },
          {
            role: 'user',
            content: `Categorize this meeting. Respond in JSON format with: primary_category, secondary_categories (array), key_topics (array), sentiment.

Topic: ${file.meeting_topic}
Transcript: ${file.transcript_text.substring(0, 2000)}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to categorize meeting')
    }

    const data = await openaiResponse.json()
    const categorization = JSON.parse(data.choices[0].message.content)

    // Save categorization
    await supabaseClient
      .from('meeting_categorizations')
      .upsert([{
        meeting_file_id: file_id,
        ...categorization,
        category_confidence: 0.85,
      }], {
        onConflict: 'meeting_file_id',
      })

    return new Response(
      JSON.stringify(categorization),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Categorize meeting error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
