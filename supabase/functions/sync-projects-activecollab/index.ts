import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActiveCollabProject {
  id: number;
  name: string;
  body?: string;
  is_completed?: boolean;
  created_on?: string;
  updated_on?: string;
  completed_on?: string;
  budget?: number;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const acUrl = Deno.env.get("ACTIVE_COLLAB_API_URL");
    const acEmail = Deno.env.get("ACTIVE_COLLAB_EMAIL");
    const acPassword = Deno.env.get("ACTIVE_COLLAB_PASSWORD");

    if (!acUrl || !acEmail || !acPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          errors: ["ActiveCollab credentials not configured (ACTIVE_COLLAB_API_URL, ACTIVE_COLLAB_EMAIL, ACTIVE_COLLAB_PASSWORD)"],
        } as SyncResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const credentials = btoa(`${acEmail}:${acPassword}`);
    const apiUrl = acUrl.replace(/\/$/, "");
    const response = await fetch(`${apiUrl}/api/v1/projects`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          errors: [`ActiveCollab API error: ${response.status} - ${text.slice(0, 200)}`],
        } as SyncResponse),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const acProjects: ActiveCollabProject[] = Array.isArray(data) ? data : data?.projects ?? data?.data ?? [];
    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;

    for (const ac of acProjects) {
      const externalId = String(ac.id);
      const slug = slugFromNameAndId(ac.name, externalId);

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("external_provider", "activecollab")
        .eq("external_id", externalId)
        .maybeSingle();

      const row = {
        name: ac.name,
        slug,
        description: ac.body ?? null,
        start_date: ac.created_on ?? null,
        end_date: ac.completed_on ?? null,
        budget: ac.budget ?? null,
        external_provider: "activecollab",
        external_id: externalId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("projects").update(row).eq("id", existing.id);
        if (error) errors.push(`Update ${ac.name}: ${error.message}`);
        else projectsUpdated++;
      } else {
        const { error } = await supabase.from("projects").insert({
          ...row,
          created_at: new Date().toISOString(),
        });
        if (error) errors.push(`Insert ${ac.name}: ${error.message}`);
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("sync-projects-activecollab error:", error);
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
