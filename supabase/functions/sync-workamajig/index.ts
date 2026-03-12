// sync-workamajig — Sync Workamajig projects into the projects table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncResponse {
  success: boolean;
  projects_synced: number;
  projects_created: number;
  projects_updated: number;
  errors: string[];
}

function slugFromNameAndId(name: string, externalId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 100);
}

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
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: ["Missing authorization header"] } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: ["Unauthorized"] } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Workamajig org integration credentials
    const { data: orgIntegration, error: orgError } = await supabase
      .from("organization_integrations")
      .select("*, integration_providers!inner(*)")
      .eq("integration_providers.slug", "workamajig")
      .eq("status", "active")
      .maybeSingle();

    if (orgError || !orgIntegration) {
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: ["Workamajig integration not configured by admin"] } as SyncResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = orgIntegration.config || {};
    const baseUrl = (config.base_url || "").replace(/\/$/, "");
    const apiAccessToken = config.api_access_token || config.api_key;
    const userToken = config.user_token;

    if (!baseUrl || !apiAccessToken) {
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: ["Workamajig base_url or api_access_token missing in org config"] } as SyncResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch projects from Workamajig
    const apiHeaders: Record<string, string> = {
      APIAccessToken: apiAccessToken,
      "Content-Type": "application/json",
    };
    if (userToken) {
      apiHeaders.UserToken = userToken;
    }

    const projectsRes = await fetch(`${baseUrl}/api/beta1/projects`, {
      method: "GET",
      headers: apiHeaders,
    });

    if (!projectsRes.ok) {
      const errText = await projectsRes.text();
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: [`Workamajig API error: ${projectsRes.status} - ${errText.slice(0, 200)}`] } as SyncResponse),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData = await projectsRes.json();
    // Workamajig returns { data: [...] } or an array directly
    const projects = Array.isArray(responseData) ? responseData : (responseData.data || responseData.projects || []);

    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;

    for (const wp of projects) {
      const externalId = String(wp.projectId || wp.ProjectID || wp.id || "");
      const projectName = wp.projectName || wp.ProjectName || wp.name || "Untitled";
      if (!externalId) {
        errors.push(`Skipping project with no ID: ${projectName}`);
        continue;
      }

      const slug = slugFromNameAndId(projectName, externalId);

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("external_provider", "workamajig")
        .eq("external_id", externalId)
        .maybeSingle();

      const row = {
        name: projectName,
        slug,
        description: wp.description || wp.Description || null,
        external_provider: "workamajig",
        external_id: externalId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("projects").update(row).eq("id", existing.id);
        if (error) errors.push(`Update ${projectName}: ${error.message}`);
        else projectsUpdated++;
      } else {
        const { error } = await supabase.from("projects").insert({
          ...row,
          created_at: new Date().toISOString(),
          owner_id: user.id,
        });
        if (error) errors.push(`Insert ${projectName}: ${error.message}`);
        else projectsCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        projects_synced: projectsCreated + projectsUpdated,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        errors,
      } as SyncResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-workamajig error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        projects_synced: 0,
        projects_created: 0,
        projects_updated: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      } as SyncResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
