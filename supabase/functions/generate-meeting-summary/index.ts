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

    const { file_id, meeting_id } = await req.json()

    if (!file_id && !meeting_id) {
      return new Response(
        JSON.stringify({ error: 'file_id or meeting_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get meeting transcript
    let transcript = ''
    if (file_id) {
      const { data: file } = await supabaseClient
        .from('zoom_files')
        .select('transcript_text, meeting_topic')
        .eq('id', file_id)
        .single()

      transcript = file?.transcript_text || ''
    } else {
      const { data: meeting } = await supabaseClient
        .from('meetings')
        .select('description')
        .eq('id', meeting_id)
        .single()

      transcript = meeting?.description || ''
    }

    if (!transcript) {
      throw new Error('No transcript found')
    }

    // Generate summary using OpenAI
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
            content: 'You are an AI assistant that creates concise meeting summaries. Extract key decisions, action items, and follow-up topics.'
          },
          {
            role: 'user',
            content: `Please analyze this meeting transcript and provide:
1. A brief executive summary (2-3 sentences)
2. Key decisions made (bullet points)
3. Action items (bullet points)
4. Follow-up topics (bullet points)

Transcript:
${transcript}

Respond in JSON format with keys: executive_summary, key_decisions, action_items, follow_up_topics`
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate summary')
    }

    const data = await openaiResponse.json()
    const summary = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Generate meeting summary error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
