import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
  simplified?: boolean;
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

    const jiraHost = Deno.env.get("JIRA_HOST");
    const jiraEmail = Deno.env.get("JIRA_EMAIL");
    const jiraApiToken = Deno.env.get("JIRA_API_TOKEN");

    if (!jiraHost || !jiraEmail || !jiraApiToken) {
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          errors: [
            "Jira credentials not configured (JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN)",
          ],
        } as SyncResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const baseUrl = jiraHost.replace(/\/$/, "");
    const auth = btoa(`${jiraEmail}:${jiraApiToken}`);
    const response = await fetch(`${baseUrl}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
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
          errors: [`Jira API error: ${response.status} - ${text.slice(0, 200)}`],
        } as SyncResponse),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const acProjects: JiraProject[] = await response.json();
    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;

    for (const jp of acProjects) {
      const externalId = jp.id;
      const slug = slugFromNameAndId(jp.name, externalId);

      const { data: existing } = await supabase
        .from("projects")
        .select("id")
        .eq("external_provider", "jira")
        .eq("external_id", externalId)
        .maybeSingle();

      const row = {
        name: jp.name,
        slug,
        description: null,
        external_provider: "jira",
        external_id: externalId,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase.from("projects").update(row).eq("id", existing.id);
        if (error) errors.push(`Update ${jp.name}: ${error.message}`);
        else projectsUpdated++;
      } else {
        const { error } = await supabase.from("projects").insert({
          ...row,
          created_at: new Date().toISOString(),
        });
        if (error) errors.push(`Insert ${jp.name}: ${error.message}`);
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("sync-projects-jira error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        projects_synced: 0,
        projects_created: 0,
        projects_updated: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      } as SyncResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
