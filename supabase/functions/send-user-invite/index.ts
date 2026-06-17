import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requirePermission } from "../_shared/permission-auth.ts";
import { sendEmailViaSendGrid } from "../_shared/sendgrid-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TENANT = "00000000-0000-0000-0000-000000000001";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appUrl = Deno.env.get("APP_URL") || Deno.env.get("VITE_APP_URL") || "http://localhost:8080";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const authResult = await requirePermission(
      req,
      userClient,
      corsHeaders,
      "users.create"
    );
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const body = await req.json();
    const {
      email,
      role_id,
      role,
      department_id,
      pod_id,
      welcome_message,
      invite_id,
      resend,
    } = body;

    let invite;

    if (resend && invite_id) {
      const { data: existing } = await serviceClient
        .from("user_invites")
        .select("*")
        .eq("id", invite_id)
        .single();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Invite not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updated, error } = await serviceClient
        .from("user_invites")
        .update({
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        })
        .eq("id", invite_id)
        .select()
        .single();

      if (error) throw error;
      invite = updated;
    } else {
      if (!email) {
        return new Response(JSON.stringify({ error: "email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: created, error } = await serviceClient
        .from("user_invites")
        .insert({
          email: email.toLowerCase().trim(),
          role: role || "user",
          role_id: role_id || null,
          department_id: department_id || null,
          pod_id: pod_id || null,
          welcome_message: welcome_message || null,
          invited_by: userId,
          tenant_id: DEFAULT_TENANT,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      invite = created;

      if (!invite.role_id && role) {
        const slugMap: Record<string, string> = {
          admin: "admin",
          moderator: "manager",
          user: "member",
        };
        const slug = slugMap[role] || role;
        const { data: roleRow } = await serviceClient
          .from("roles")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (roleRow?.id) {
          await serviceClient
            .from("user_invites")
            .update({ role_id: roleRow.id })
            .eq("id", invite.id);
          invite.role_id = roleRow.id;
        }
      }
    }

    const acceptUrl = `${appUrl}/invite/accept?token=${invite.token}`;
    const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@sjinnovation.com";
    const html = `
      <h2>You've been invited to Control Tower</h2>
      ${welcome_message || invite.welcome_message ? `<p>${welcome_message || invite.welcome_message}</p>` : ""}
      <p>Click the link below to accept your invitation and set up your account:</p>
      <p><a href="${acceptUrl}">Accept Invitation</a></p>
      <p>This invitation expires in 7 days.</p>
    `;

    const emailResult = await sendEmailViaSendGrid({
      to: invite.email,
      subject: "You're invited to Control Tower",
      html,
      from: { email: fromEmail, name: "Control Tower" },
    });

    await serviceClient.from("activity_logs").insert({
      user_id: userId,
      action: resend ? "invite.resent" : "invite.sent",
      resource_type: "user_invite",
      resource_id: invite.id,
      details: { email: invite.email, email_sent: emailResult.success },
    });

    return new Response(
      JSON.stringify({
        invite,
        email_sent: emailResult.success,
        email_error: emailResult.error,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-user-invite error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
