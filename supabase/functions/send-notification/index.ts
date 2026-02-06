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

    const body = await req.json()
    const {
      user_id,
      title,
      message,
      type = 'info',
      channels = ['in_app'],
      metadata = {},
      ping,
    } = body

    // Health check / deployment test - no DB write
    if (ping === true) {
      return new Response(
        JSON.stringify({ success: true, message: 'ok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id, title, and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const results = []

    // In-app notification
    if (channels.includes('in_app')) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .insert([{
          user_id,
          title,
          message,
          type,
          metadata,
          is_read: false,
        }])
        .select()

      if (error) {
        results.push({ channel: 'in_app', success: false, error: error.message })
      } else {
        results.push({ channel: 'in_app', success: true, notification: data[0] })
      }
    }

    // Slack notification (optional)
    if (channels.includes('slack')) {
      const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL')

      if (SLACK_WEBHOOK_URL) {
        try {
          const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `*${title}*\n${message}`,
              username: 'CollabAI Notifications',
            }),
          })

          results.push({
            channel: 'slack',
            success: slackResponse.ok,
            error: slackResponse.ok ? null : 'Slack webhook failed'
          })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({ channel: 'slack', success: false, error: errorMessage })
        }
      } else {
        results.push({ channel: 'slack', success: false, error: 'SLACK_WEBHOOK_URL not configured' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Send notification error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
