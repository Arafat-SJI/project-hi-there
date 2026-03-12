// user-integration-clear-data — Clear user's OAuth tokens and synced data for a provider
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    let body: { provider_slug: string; clear_synced_data?: boolean };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { provider_slug, clear_synced_data = false } = body;
    if (!provider_slug) {
      return new Response(
        JSON.stringify({ error: "provider_slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, string> = {};

    // 1. Remove OAuth token
    const { error: tokenError } = await supabase
      .from("user_oauth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("provider_slug", provider_slug);

    if (tokenError) {
      console.error("Failed to delete token:", tokenError);
      results.token = `error: ${tokenError.message}`;
    } else {
      results.token = "cleared";
    }

    // 2. Optionally clear synced data (projects with this external_provider owned by user)
    if (clear_synced_data) {
      // Map provider slugs to external_provider values
      const providerMap: Record<string, string> = {
        clickup: "clickup",
        workamajig: "workamajig",
        jira: "jira",
        activecollab: "activecollab",
      };

      const externalProvider = providerMap[provider_slug];
      if (externalProvider) {
        const { error: projectsError, count } = await supabase
          .from("projects")
          .delete({ count: "exact" })
          .eq("external_provider", externalProvider)
          .eq("owner_id", user.id);

        if (projectsError) {
          console.error("Failed to delete synced projects:", projectsError);
          results.synced_projects = `error: ${projectsError.message}`;
        } else {
          results.synced_projects = `${count || 0} removed`;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, provider_slug, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("user-integration-clear-data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
