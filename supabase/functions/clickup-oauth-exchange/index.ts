import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClickUpTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
}

interface ClickUpUserResponse {
  user?: {
    id?: number | string;
    username?: string;
    email?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    const code = body?.code as string | undefined;
    const redirectUri = body?.redirect_uri as string | undefined;

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "code and redirect_uri are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Find ClickUp provider id
    const { data: provider, error: providerError } = await supabase
      .from("integration_providers")
      .select("id")
      .eq("slug", "clickup")
      .single();

    if (providerError || !provider) {
      return new Response(
        JSON.stringify({ error: "ClickUp provider not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get organization integration config (client_id / client_secret).
    // We only require that a config row exists; connection_status may still be "disconnected"
    // depending on how the admin UI was used.
    const { data: orgIntegration, error: orgError } = await supabase
      .from("organization_integrations")
      .select("config")
      .eq("provider_id", provider.id)
      .maybeSingle();

    if (orgError) {
      return new Response(
        JSON.stringify({ error: "Failed to load ClickUp organization integration config", details: orgError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const config = (orgIntegration?.config || {}) as Record<string, any>;
    const clientId = config.client_id as string | undefined;
    const clientSecret = config.client_secret as string | undefined;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "ClickUp client_id and client_secret must be configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Exchange code for access token
    const tokenResp = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      return new Response(
        JSON.stringify({
          error: `ClickUp token exchange failed: ${tokenResp.status}`,
          details: text.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tokenData = (await tokenResp.json()) as ClickUpTokenResponse;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "ClickUp token response missing access_token" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch user info from ClickUp
    const userResp = await fetch("https://api.clickup.com/api/v2/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let userEmail: string | null = null;
    let userName: string | null = null;
    if (userResp.ok) {
      const userJson = (await userResp.json()) as ClickUpUserResponse;
      userEmail = userJson.user?.email ?? null;
      userName = userJson.user?.username ?? null;
    }

    // Compute expires_at if provided
    let expiresAt: string | null = null;
    if (tokenData.expires_in && tokenData.expires_in > 0) {
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    // Upsert into user_oauth_tokens
    const { error: upsertError } = await supabase.from("user_oauth_tokens").upsert(
      {
        user_id: user.id,
        provider_slug: "clickup",
        access_token: accessToken,
        refresh_token: tokenData.refresh_token ?? null,
        token_type: tokenData.token_type ?? "Bearer",
        expires_at: expiresAt,
        scopes: [], // ClickUp OAuth does not currently use scopes
        account_email: userEmail,
        account_name: userName,
        is_active: true,
        error_message: null,
        error_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider_slug" },
    );

    if (upsertError) {
      return new Response(
        JSON.stringify({ error: "Failed to store ClickUp token", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("clickup-oauth-exchange error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

