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

    const { feedback_id, user_id, type, message, rating } = await req.json()

    if (!user_id || !type || !message) {
      return new Response(
        JSON.stringify({ error: 'user_id, type, and message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Save feedback to database
    let feedbackRecord
    if (feedback_id) {
      const { data } = await supabaseClient
        .from('feedback')
        .select('*')
        .eq('id', feedback_id)
        .single()

      feedbackRecord = data
    } else {
      const { data, error } = await supabaseClient
        .from('feedback')
        .insert([{
          user_id,
          type,
          message,
          rating: rating || null,
          status: 'new',
        }])
        .select()
        .single()

      if (error) throw error
      feedbackRecord = data
    }

    // Send notification to admins
    const { data: adminRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    const adminIds = adminRoles?.map(r => r.user_id) || []

    // Create notifications for all admins
    if (adminIds.length > 0) {
      await supabaseClient
        .from('notifications')
        .insert(
          adminIds.map(admin_id => ({
            user_id: admin_id,
            title: `New ${type} Feedback`,
            message: `User submitted ${type} feedback${rating ? ` (${rating}/5 stars)` : ''}`,
            type: 'feedback',
            metadata: {
              feedback_id: feedbackRecord.id,
              rating,
              preview: message.substring(0, 100),
            },
          }))
        )
    }

    // Send Slack notification if configured
    const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL')
    if (SLACK_WEBHOOK_URL) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*New ${type} Feedback*\nRating: ${rating || 'N/A'}\n${message.substring(0, 200)}`,
        }),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        feedback_id: feedbackRecord.id,
        notifications_sent: adminIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Send feedback notification error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
