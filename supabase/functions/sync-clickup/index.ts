// sync-clickup — Sync ClickUp spaces/projects into the projects table
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

    // Get user's ClickUp OAuth token
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_oauth_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider_slug", "clickup")
      .eq("is_active", true)
      .maybeSingle();

    if (tokenError || !tokenData?.access_token) {
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: ["ClickUp not connected. Please connect via Integration Hub."] } as SyncResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clickupToken = tokenData.access_token;
    const headers = { Authorization: clickupToken, "Content-Type": "application/json" };

    // Step 1: Get teams (workspaces)
    const teamsRes = await fetch("https://api.clickup.com/api/v2/team", { headers });
    if (!teamsRes.ok) {
      return new Response(
        JSON.stringify({ success: false, projects_synced: 0, projects_created: 0, projects_updated: 0, errors: [`ClickUp API error fetching teams: ${teamsRes.status}`] } as SyncResponse),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const teamsData = await teamsRes.json();
    const teams = teamsData.teams || [];

    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;

    // Step 2: For each team, get spaces → lists (treat lists as projects)
    for (const team of teams) {
      const spacesRes = await fetch(`https://api.clickup.com/api/v2/team/${team.id}/space?archived=false`, { headers });
      if (!spacesRes.ok) {
        errors.push(`Failed to fetch spaces for team ${team.name}`);
        continue;
      }
      const spacesData = await spacesRes.json();
      const spaces = spacesData.spaces || [];

      for (const space of spaces) {
        // Get folders and folderless lists
        const [foldersRes, listsRes] = await Promise.all([
          fetch(`https://api.clickup.com/api/v2/space/${space.id}/folder?archived=false`, { headers }),
          fetch(`https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`, { headers }),
        ]);

        const allLists: { id: string; name: string }[] = [];

        if (listsRes.ok) {
          const listsData = await listsRes.json();
          allLists.push(...(listsData.lists || []));
        }

        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          for (const folder of foldersData.folders || []) {
            allLists.push(...(folder.lists || []));
          }
        }

        // Upsert each list as a project
        for (const list of allLists) {
          const externalId = list.id;
          const slug = slugFromNameAndId(list.name, externalId);

          const { data: existing } = await supabase
            .from("projects")
            .select("id")
            .eq("external_provider", "clickup")
            .eq("external_id", externalId)
            .maybeSingle();

          const row = {
            name: list.name,
            slug,
            description: `ClickUp List — Space: ${space.name}`,
            external_provider: "clickup",
            external_id: externalId,
            updated_at: new Date().toISOString(),
          };

          if (existing) {
            const { error } = await supabase.from("projects").update(row).eq("id", existing.id);
            if (error) errors.push(`Update ${list.name}: ${error.message}`);
            else projectsUpdated++;
          } else {
            const { error } = await supabase.from("projects").insert({
              ...row,
              created_at: new Date().toISOString(),
              owner_id: user.id,
            });
            if (error) errors.push(`Insert ${list.name}: ${error.message}`);
            else projectsCreated++;
          }
        }
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
    console.error("sync-clickup error:", error);
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
