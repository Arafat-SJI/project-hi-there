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

    const {
      user_id,
      action,
      entity_type,
      entity_id,
      metadata
    } = await req.json()

    // Validate required fields
    if (!action || !entity_type) {
      return new Response(
        JSON.stringify({ error: 'Action and entity_type are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Insert audit log
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .insert([{
        user_id: user_id || null,
        action,
        entity_type,
        entity_id: entity_id || null,
        metadata: metadata || {},
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      }])
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, log: data[0] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Audit log error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
