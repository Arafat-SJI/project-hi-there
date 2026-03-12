<<<<<<< HEAD
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
=======
// clickup-oauth-exchange — Exchange ClickUp OAuth authorization code for access token
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
<<<<<<< HEAD
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
=======
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

<<<<<<< HEAD
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
=======
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    let body: { code: string; redirect_uri?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code, redirect_uri } = body;
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Authorization code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get ClickUp org integration for client_id / client_secret
    const { data: orgIntegration, error: orgError } = await supabase
      .from("organization_integrations")
      .select("*, integration_providers!inner(*)")
      .eq("integration_providers.slug", "clickup")
      .eq("status", "active")
      .maybeSingle();

    if (orgError || !orgIntegration) {
      return new Response(
        JSON.stringify({ error: "ClickUp integration not configured by admin" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = orgIntegration.config?.client_id;
    const clientSecret = orgIntegration.config?.client_secret;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "ClickUp client_id or client_secret missing in org config" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
<<<<<<< HEAD
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
=======
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("ClickUp token exchange failed:", errText);
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokens = await tokenResponse.json();

    // ClickUp OAuth returns { access_token } (no refresh_token, no expiry — tokens are long-lived)
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
    const { error: upsertError } = await supabase.from("user_oauth_tokens").upsert(
      {
        user_id: user.id,
        provider_slug: "clickup",
<<<<<<< HEAD
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
=======
        access_token: tokens.access_token,
        refresh_token: null,
        expires_at: null,
        is_active: true,
        error_message: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider_slug" }
    );

    if (upsertError) {
      console.error("Failed to store ClickUp token:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
      );
    }

    return new Response(
<<<<<<< HEAD
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
=======
      JSON.stringify({ success: true, message: "ClickUp connected successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
    );
  } catch (error) {
    console.error("clickup-oauth-exchange error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
<<<<<<< HEAD
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

=======
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
>>>>>>> d3796081c698739752a1bbb5bbed78f6fd248aae
