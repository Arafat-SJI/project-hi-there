import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClickUpTeam {
  id: string;
  name: string;
}

interface ClickUpSpace {
  id: string;
  name: string;
}

interface SyncResult {
  success: boolean;
  projects_synced: number;
  projects_created: number;
  projects_updated: number;
  tasks_synced: number;
  duration_ms: number;
  errors: string[];
}

function slugFromNameAndId(name: string, externalId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get ClickUp OAuth token for this user
    const { data: tokenRow, error: tokenError } = await supabase
      .from("user_oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider_slug", "clickup")
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return new Response(
        JSON.stringify({ error: "No ClickUp connection found for this user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = tokenRow.access_token as string;
    const headers: HeadersInit = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;

    // 1) Get teams for this user
    const teamsResp = await fetch("https://api.clickup.com/api/v2/team", {
      method: "GET",
      headers,
    });

    if (!teamsResp.ok) {
      const text = await teamsResp.text();
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - started,
          errors: [`ClickUp /team error: ${teamsResp.status} - ${text.slice(0, 200)}`],
        } satisfies SyncResult),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const teamsJson = await teamsResp.json();
    const teams: ClickUpTeam[] = teamsJson.teams ?? [];

    if (teams.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - started,
          errors: [],
        } satisfies SyncResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // For now, use the first team as the primary workspace
    const team = teams[0];

    // 2) Get spaces (we treat each Space as a Project in our system)
    const spacesResp = await fetch(
      `https://api.clickup.com/api/v2/team/${team.id}/space?archived=false`,
      { method: "GET", headers },
    );

    if (!spacesResp.ok) {
      const text = await spacesResp.text();
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - started,
          errors: [`ClickUp /space error: ${spacesResp.status} - ${text.slice(0, 200)}`],
        } satisfies SyncResult),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const spacesJson = await spacesResp.json();
    const spaces: ClickUpSpace[] = spacesJson.spaces ?? [];

    for (const space of spaces) {
      const externalId = String(space.id);
      const slug = slugFromNameAndId(space.name, externalId);

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("external_provider", "clickup")
        .eq("external_id", externalId)
        .maybeSingle();

      const row = {
        name: space.name,
        slug,
        description: null,
        external_provider: "clickup",
        external_id: externalId,
        metadata: {
          source: "clickup",
          team_id: team.id,
        } as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("projects").update(row).eq("id", existing.id);
        if (error) {
          errors.push(`Update ${space.name}: ${error.message}`);
        } else {
          projectsUpdated++;
        }
      } else {
        const { error } = await supabase.from("projects").insert({
          ...row,
          created_at: new Date().toISOString(),
        });
        if (error) {
          errors.push(`Insert ${space.name}: ${error.message}`);
        } else {
          projectsCreated++;
        }
      }
    }

    const projectsSynced = projectsCreated + projectsUpdated;
    const tasksSynced = 0; // Tasks sync can be added later; for now we only sync projects.

    // Update metadata on user_oauth_tokens with last sync info
    const newMetadata = {
      ...(tokenRow.metadata || {}),
      last_sync_at: new Date().toISOString(),
      last_sync_status: errors.length === 0 ? "success" : "partial",
      last_sync_error: errors.length ? errors[0] : null,
      projects_synced: projectsSynced,
      tasks_synced: tasksSynced,
    };

    await supabase
      .from("user_oauth_tokens")
      .update({ metadata: newMetadata })
      .eq("id", tokenRow.id);

    const result: SyncResult = {
      success: errors.length === 0,
      projects_synced: projectsSynced,
      projects_created: projectsCreated,
      projects_updated: projectsUpdated,
      tasks_synced: tasksSynced,
      duration_ms: Date.now() - started,
      errors,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sync-clickup error:", error);
    const result: SyncResult = {
      success: false,
      projects_synced: 0,
      projects_created: 0,
      projects_updated: 0,
      tasks_synced: 0,
      duration_ms: Date.now() - started,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

