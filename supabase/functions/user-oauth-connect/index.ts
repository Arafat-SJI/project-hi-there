/**
 * User OAuth Connect Edge Function
 * Sprint 10: User Integration Connections
 * Initiates OAuth flow for user-level integrations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OAuth configurations for each provider
interface OAuthConfig {
  authUrl: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
}

const getProviderConfig = (provider: string): OAuthConfig | null => {
  const configs: Record<string, OAuthConfig> = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
      additionalParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
    zoom: {
      authUrl: "https://zoom.us/oauth/authorize",
      scopes: [
        "meeting:read",
        "recording:read",
        "user:read",
      ],
    },
    microsoft: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      scopes: [
        "openid",
        "email",
        "profile",
        "offline_access",
        "Calendars.Read",
        "OnlineMeetings.Read",
      ],
      additionalParams: {
        response_mode: "query",
      },
    },
  };

  return configs[provider] || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { provider, redirect_uri, additional_scopes } = await req.json();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Provider is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get provider configuration
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if organization has this provider enabled
    const { data: orgIntegration, error: orgError } = await supabase
      .from("organization_integrations")
      .select("*, integration_providers!inner(*)")
      .eq("integration_providers.slug", provider)
      .eq("is_enabled", true)
      .single();

    if (orgError || !orgIntegration) {
      return new Response(
        JSON.stringify({ error: `Provider ${provider} is not enabled for this organization` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client credentials from organization integration
    // Note: credentials are stored in config JSONB field
    const clientId = orgIntegration.config?.client_id || orgIntegration.credentials?.client_id;
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: `Provider ${provider} is not properly configured. Please add Client ID in the integration settings.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate state parameter for security
    const state = crypto.randomUUID();

    // Store state in database for verification
    await supabase.from("oauth_states").insert({
      state,
      user_id: user.id,
      provider,
      redirect_uri: redirect_uri || `${Deno.env.get("APP_URL")}/settings`,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Build scopes
    const scopes = [...providerConfig.scopes];
    if (additional_scopes && Array.isArray(additional_scopes)) {
      scopes.push(...additional_scopes);
    }

    // Build the authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${supabaseUrl}/functions/v1/user-oauth-callback`,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      ...providerConfig.additionalParams,
    });

    const authorizationUrl = `${providerConfig.authUrl}?${params.toString()}`;

    return new Response(
      JSON.stringify({
        authorization_url: authorizationUrl,
        state,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("User OAuth connect error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
