import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-zm-signature, x-zm-request-timestamp',
}

interface WebhookEvent {
  event: string;
  payload: Record<string, any>;
  event_ts?: number;
}

// Verify Zoom webhook signature
function verifyZoomWebhook(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  secretToken: string
): boolean {
  if (!signature || !timestamp) return false

  try {
    const message = `v0:${timestamp}:${payload}`
    const encoder = new TextEncoder()
    const key = encoder.encode(secretToken)
    const data = encoder.encode(message)

    // For production, use crypto.subtle for HMAC verification
    // This is a simplified check - implement proper HMAC-SHA256 verification
    return signature.startsWith('v0=')
  } catch {
    return false
  }
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

    const url = new URL(req.url)
    const provider = url.searchParams.get('provider') || 'unknown'

    const body = await req.text()
    let event: WebhookEvent

    try {
      event = JSON.parse(body)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Log webhook event
    await supabaseClient
      .from('webhook_logs')
      .insert({
        provider,
        event_type: event.event || 'unknown',
        payload: event.payload || event,
        received_at: new Date().toISOString(),
      })
      .select()

    // Handle different providers
    switch (provider) {
      case 'zoom':
        return await handleZoomWebhook(event, req, supabaseClient)
      case 'google':
        return await handleGoogleWebhook(event, supabaseClient)
      default:
        console.log(`Received webhook from unknown provider: ${provider}`, event)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleZoomWebhook(
  event: WebhookEvent,
  req: Request,
  supabase: any
): Promise<Response> {
  const ZOOM_WEBHOOK_SECRET = Deno.env.get('ZOOM_WEBHOOK_SECRET')

  // Handle Zoom URL validation challenge
  if (event.event === 'endpoint.url_validation') {
    const plainToken = event.payload?.plainToken
    if (plainToken && ZOOM_WEBHOOK_SECRET) {
      // For production: implement proper HMAC-SHA256
      const encoder = new TextEncoder()
      const data = encoder.encode(plainToken)
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(ZOOM_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', key, data)
      const hashArray = Array.from(new Uint8Array(signature))
      const encryptedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      return new Response(
        JSON.stringify({
          plainToken,
          encryptedToken,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
  }

  // Handle recording completed event
  if (event.event === 'recording.completed') {
    const payload = event.payload?.object
    if (payload) {
      // Trigger sync for this specific recording
      console.log('Recording completed:', payload.uuid)

      // Queue processing
      await supabase.functions.invoke('sync-zoom-files', {
        body: { action: 'sync_single', meeting_uuid: payload.uuid }
      })
    }
  }

  // Handle meeting ended event
  if (event.event === 'meeting.ended') {
    const payload = event.payload?.object
    if (payload) {
      console.log('Meeting ended:', payload.uuid)

      // Update meeting status
      await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('zoom_id', payload.uuid)
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}

async function handleGoogleWebhook(
  event: WebhookEvent,
  supabase: any
): Promise<Response> {
  // Handle Google Drive push notifications
  if (event.event === 'sync') {
    console.log('Google Drive sync notification received')
    // Trigger drive sync
    await supabase.functions.invoke('google-drive-sync', {
      body: { action: 'sync' }
    })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
}
