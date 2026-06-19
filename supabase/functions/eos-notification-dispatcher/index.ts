import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { event_type, dry_run = false } = await req.json().catch(() => ({}));
    const results: Record<string, number> = {};

    // Rock overdue notifications
    if (!event_type || event_type === "rock_overdue") {
      const today = new Date().toISOString().split("T")[0];
      const { data: overdueRocks } = await supabase
        .from("okrs")
        .select("id, title, owner_id, end_date")
        .lt("end_date", today)
        .neq("rock_status", "completed")
        .not("owner_id", "is", null);

      results.rock_overdue = overdueRocks?.length ?? 0;

      if (!dry_run) {
        for (const rock of overdueRocks || []) {
          await supabase.from("notifications").insert({
            user_id: rock.owner_id,
            title: "Rock Overdue",
            message: `"${rock.title}" is past its due date.`,
            type: "warning",
            metadata: { module: "eos", entity_type: "rock", entity_id: rock.id },
            is_read: false,
          });
        }
      }
    }

    // Meeting reminders (L10 in next 24h)
    if (!event_type || event_type === "meeting_reminder") {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const { data: meetings } = await supabase
        .from("meetings")
        .select("id, title, scheduled_at, created_by")
        .eq("meeting_type", "l10")
        .gte("scheduled_at", now.toISOString())
        .lte("scheduled_at", tomorrow.toISOString());

      results.meeting_reminder = meetings?.length ?? 0;

      if (!dry_run) {
        for (const m of meetings || []) {
          if (!m.created_by) continue;
          await supabase.from("notifications").insert({
            user_id: m.created_by,
            title: "L10 Meeting Reminder",
            message: `"${m.title}" is scheduled within 24 hours.`,
            type: "info",
            metadata: { module: "eos", entity_type: "meeting", entity_id: m.id },
            is_read: false,
          });
        }
      }
    }

    // Scorecard off-track
    if (!event_type || event_type === "scorecard_missed") {
      const { data: metrics } = await supabase
        .from("eos_scorecard_metrics")
        .select("id, name, scorecard_id, status")
        .eq("status", "off_track");

      results.scorecard_missed = metrics?.length ?? 0;

      if (!dry_run && metrics?.length) {
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        for (const admin of admins || []) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "Scorecard Target Missed",
            message: `${metrics.length} metric(s) are off track this week.`,
            type: "warning",
            metadata: { module: "eos", entity_type: "scorecard" },
            is_read: false,
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results, dry_run }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
