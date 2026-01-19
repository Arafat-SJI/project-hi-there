import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MeetingProvider } from "../_shared/meeting-providers.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ZOOM_CLIENT_ID = Deno.env.get('ZOOM_CLIENT_ID')
    const ZOOM_CLIENT_SECRET = Deno.env.get('ZOOM_CLIENT_SECRET')
    const ZOOM_ACCOUNT_ID = Deno.env.get('ZOOM_ACCOUNT_ID')

    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom credentials not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action = 'sync', date_from, date_to, provider = 'zoom' } = await req.json()
    const meetingProvider = provider as MeetingProvider

    if (meetingProvider !== 'zoom') {
      throw new Error(`Unsupported provider: ${meetingProvider}`)
    }

    // Get Zoom OAuth token
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,
        },
      }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Zoom access token')
    }

    const { access_token } = await tokenResponse.json()

    // Get recordings from Zoom
    const fromDate = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate = date_to || new Date().toISOString().split('T')[0]

    const recordingsResponse = await fetch(
      `https://api.zoom.us/v2/users/me/recordings?from=${fromDate}&to=${toDate}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    )

    if (!recordingsResponse.ok) {
      throw new Error('Failed to fetch Zoom recordings')
    }

    const recordingsData = await recordingsResponse.json()
    const meetings = recordingsData.meetings || []

    let syncedCount = 0

    for (const meeting of meetings) {
      // Check if meeting exists
      const { data: existingMeeting } = await supabaseClient
        .from('meetings')
        .select('id')
        .or(`zoom_id.eq.${meeting.uuid},external_id.eq.${meeting.uuid}`)
        .single()

      let meetingId = existingMeeting?.id

      const meetingData = {
        title: meeting.topic,
        zoom_id: meeting.uuid,
        zoom_meeting_id: String(meeting.id),
        zoom_join_url: meeting.join_url,
        zoom_start_url: meeting.start_url,
        scheduled_at: meeting.start_time,
        duration_minutes: meeting.duration,
        status: 'completed',
        provider: meetingProvider,
        external_id: meeting.uuid,
        external_uuid: meeting.uuid,
        external_meeting_id: String(meeting.id),
        join_url: meeting.join_url,
        host_url: meeting.start_url,
      }

      if (!meetingId) {
        const { data: newMeeting } = await supabaseClient
          .from('meetings')
          .insert([meetingData])
          .select()
          .single()

        console.log('[sync-zoom-files] Created meeting with dual-write fields:', meeting.uuid)
        meetingId = newMeeting.id
      } else {
        await supabaseClient
          .from('meetings')
          .update(meetingData)
          .eq('id', meetingId)

        console.log('[sync-zoom-files] Updated meeting with dual-write fields:', meeting.uuid)
      }

      // Sync recording files
      for (const file of meeting.recording_files || []) {
        const { error } = await supabaseClient
          .from('zoom_files')
          .upsert([{
            meeting_id: meetingId,
            zoom_meeting_id: String(meeting.id),
            file_type: file.file_type,
            file_name: file.file_name || `${meeting.topic}_${file.file_type}`,
            file_size: file.file_size,
            download_url: file.download_url,
            play_url: file.play_url,
            meeting_topic: meeting.topic,
            meeting_start_time: meeting.start_time,
            meeting_duration: meeting.duration,
          }], {
            onConflict: 'zoom_meeting_id,file_type',
          })

        const { error: meetingFilesError } = await supabaseClient
          .from('meeting_files')
          .upsert([{
            meeting_id: meetingId,
            external_meeting_id: String(meeting.id),
            provider: meetingProvider,
            file_type: file.file_type,
            file_name: file.file_name || `${meeting.topic}_${file.file_type}`,
            file_size: file.file_size,
            download_url: file.download_url,
            metadata: {
              play_url: file.play_url,
              meeting_topic: meeting.topic,
              meeting_start_time: meeting.start_time,
              meeting_duration: meeting.duration,
            },
          }], {
            onConflict: 'external_meeting_id,file_type',
          })

        if (!error && !meetingFilesError) {
          syncedCount++
          console.log('[sync-zoom-files] Dual-wrote meeting file:', meeting.id, file.file_type)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: syncedCount,
        meetings_found: meetings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    console.error('Sync Zoom files error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
