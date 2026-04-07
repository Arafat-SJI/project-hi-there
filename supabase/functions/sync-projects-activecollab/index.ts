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

interface ActiveCollabTask {
  id: number;
  name?: string;
  body?: string;
  due_on?: string;
  created_on?: string;
  updated_on?: string;
  is_completed?: boolean;
  assignee_id?: number | null;
}

interface SyncResponse {
  success: boolean;
  projects_synced: number;
  projects_created: number;
  projects_updated: number;
  tasks_synced: number;
  duration_ms: number;
  errors: string[];
}

interface TokenRow {
  id: string;
  access_token: string;
  metadata: Record<string, unknown> | null;
}

function slugFromNameAndId(name: string, externalId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 100);
}

function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false, projects_synced: 0, projects_created: 0, projects_updated: 0,
          tasks_synced: 0, duration_ms: Date.now() - startedAt,
          errors: ["Missing authorization header"],
        } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false, projects_synced: 0, projects_created: 0, projects_updated: 0,
          tasks_synced: 0, duration_ms: Date.now() - startedAt,
          errors: ["Invalid token"],
        } as SyncResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from("user_oauth_tokens")
      .select("id, access_token, metadata")
      .eq("user_id", user.id)
      .eq("provider_slug", "activecollab")
      .maybeSingle<TokenRow>();

    if (tokenError || !tokenRow?.access_token) {
      return new Response(
        JSON.stringify({
          success: false, projects_synced: 0, projects_created: 0, projects_updated: 0,
          tasks_synced: 0, duration_ms: Date.now() - startedAt,
          errors: ["No ActiveCollab connection found for this user"],
        } as SyncResponse),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: providerRow, error: providerError } = await supabase
      .from("integration_providers")
      .select("id")
      .eq("slug", "activecollab")
      .single();

    if (providerError || !providerRow?.id) {
      throw new Error("ActiveCollab provider record not found");
    }

    const meta = tokenRow.metadata ?? {};
    const fromMeta = meta.activecollab_base_url;
    if (typeof fromMeta !== "string" || fromMeta.trim().length === 0) {
      throw new Error("ActiveCollab Base URL missing on your connection. Disconnect and connect again with your instance URL.");
    }
    const apiUrl = fromMeta.replace(/\/+$/, "");

    const apiHeaders: HeadersInit = {
      Authorization: `Bearer ${tokenRow.access_token}`,
      "X-Angie-AuthApiToken": tokenRow.access_token,
      "Content-Type": "application/json",
    };

    // Fetch projects with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/v1/projects`, {
        method: "GET",
        headers: apiHeaders,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({
          success: false, projects_synced: 0, projects_created: 0, projects_updated: 0,
          tasks_synced: 0, duration_ms: Date.now() - startedAt,
          errors: [`ActiveCollab API error: ${response.status} - ${text.slice(0, 200)}`],
        } as SyncResponse),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const acProjects: ActiveCollabProject[] = Array.isArray(data) ? data : data?.projects ?? data?.data ?? [];
    const errors: string[] = [];
    let projectsCreated = 0;
    let projectsUpdated = 0;
    let tasksCreated = 0;
    let tasksUpdated = 0;
    let embeddingsQueued = 0;

    let defaultStatusId: string | null = null;
    const { data: defaultStatus } = await supabase
      .from("project_statuses")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    if (defaultStatus?.id) {
      defaultStatusId = defaultStatus.id as string;
    }

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
        metadata: { source: "activecollab", external_id: externalId } as Record<string, unknown>,
        status_id: defaultStatusId,
        owner_id: user.id,
        is_archived: false,
        updated_at: new Date().toISOString(),
      };

      let projectDbId: string | null = null;
      if (existing) {
        const { data: updatedProject, error } = await supabase
          .from("projects").update(row).eq("id", existing.id).select("id").maybeSingle();
        if (error) errors.push(`Update ${ac.name}: ${error.message}`);
        else { projectsUpdated++; projectDbId = updatedProject?.id ?? existing.id; }
      } else {
        const { data: insertedProject, error } = await supabase
          .from("projects").insert({ ...row, created_at: new Date().toISOString(), created_by: user.id })
          .select("id").maybeSingle();
        if (error) errors.push(`Insert ${ac.name}: ${error.message}`);
        else { projectsCreated++; projectDbId = insertedProject?.id ?? null; }
      }

      // Fetch tasks with timeout
      const taskCtrl = new AbortController();
      const taskTimeout = setTimeout(() => taskCtrl.abort(), 10000);
      let tasksResp: Response;
      try {
        tasksResp = await fetch(`${apiUrl}/api/v1/projects/${externalId}/tasks`, {
          method: "GET", headers: apiHeaders, signal: taskCtrl.signal,
        });
      } catch (fetchErr) {
        clearTimeout(taskTimeout);
        errors.push(`Tasks fetch timeout for project ${externalId}`);
        continue;
      } finally {
        clearTimeout(taskTimeout);
      }

      if (!tasksResp.ok) {
        const text = await tasksResp.text();
        errors.push(`Tasks for project ${externalId}: ${tasksResp.status} - ${text.slice(0, 200)}`);
        continue;
      }

      const taskPayload = await tasksResp.json();
      const projectTasks: ActiveCollabTask[] = Array.isArray(taskPayload)
        ? taskPayload
        : Array.isArray(taskPayload?.tasks) ? taskPayload.tasks as ActiveCollabTask[]
        : Array.isArray(taskPayload?.data) ? taskPayload.data as ActiveCollabTask[]
        : [];

      for (const acTask of projectTasks) {
        const externalTaskId = String(acTask.id);
        const taskMetadata = {
          source: "activecollab",
          external_id: externalTaskId,
          project_external_id: externalId,
          synced: true,
          activecollab: { raw: acTask },
        } as Record<string, unknown>;

        const { data: existingTask } = await supabase
          .from("tasks").select("id")
          .eq("created_by", user.id)
          .contains("metadata", { source: "activecollab", external_id: externalTaskId })
          .maybeSingle();

        const taskRow = {
          title: acTask.name ?? "ActiveCollab Task",
          description: acTask.body ?? null,
          status: acTask.is_completed ? "completed" : "todo",
          priority: "medium",
          due_date: toIsoOrNull(acTask.due_on),
          project_id: projectDbId,
          metadata: taskMetadata,
          updated_at: new Date().toISOString(),
        };

        let taskDbId: string | null = null;
        if (existingTask?.id) {
          const { error: taskUpdateError } = await supabase.from("tasks").update(taskRow).eq("id", existingTask.id);
          if (taskUpdateError) { errors.push(`Update task ${externalTaskId}: ${taskUpdateError.message}`); continue; }
          tasksUpdated++;
          taskDbId = existingTask.id;
        } else {
          const { data: insertedTask, error: taskInsertError } = await supabase
            .from("tasks").insert({ ...taskRow, created_at: new Date().toISOString(), created_by: user.id })
            .select("id").maybeSingle();
          if (taskInsertError) { errors.push(`Insert task ${externalTaskId}: ${taskInsertError.message}`); continue; }
          tasksCreated++;
          taskDbId = insertedTask?.id ?? null;
        }

        // Queue embedding instead of doing it inline (prevents timeout)
        if (taskDbId) {
          const { error: queueError } = await supabase.from("embedding_queue").insert({
            entity_type: "task",
            entity_id: taskDbId,
            priority: 5,
            status: "pending",
            attempts: 0,
            max_attempts: 3,
            created_at: new Date().toISOString(),
          });
          if (!queueError) embeddingsQueued++;
        }
      }
    }

    const projectsSynced = projectsCreated + projectsUpdated;
    const tasksSynced = tasksCreated + tasksUpdated;

    const tokenMetadata = {
      ...(tokenRow.metadata ?? {}),
      last_sync_at: new Date().toISOString(),
      last_sync_status: errors.length === 0 ? "success" : "partial",
      last_sync_error: errors.length > 0 ? errors[0] : null,
      projects_synced: projectsSynced,
      tasks_synced: tasksSynced,
    };
    await supabase.from("user_oauth_tokens").update({ metadata: tokenMetadata }).eq("id", tokenRow.id);

    const status = errors.length === 0 ? "success" : projectsSynced + tasksSynced === 0 ? "error" : "partial";
    await supabase.from("integration_usage_logs").insert({
      organization_id: null,
      provider_id: providerRow.id,
      service_id: null,
      user_id: user.id,
      action: "sync-activecollab",
      status,
      request_metadata: { triggered_from: "edge_function" } as Record<string, unknown>,
      response_metadata: {
        projects_synced: projectsSynced,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        tasks_synced: tasksSynced,
        embeddings_queued: embeddingsQueued,
      } as Record<string, unknown>,
      error_message: errors.length ? errors.join("; ").slice(0, 500) : null,
      estimated_cost: 0,
    });

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        projects_synced: projectsSynced,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        tasks_synced: tasksSynced,
        duration_ms: Date.now() - startedAt,
        errors,
      } as SyncResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    console.error("sync-projects-activecollab error:", error);
    return new Response(
      JSON.stringify({
        success: false, projects_synced: 0, projects_created: 0, projects_updated: 0,
        tasks_synced: 0, duration_ms: Date.now() - startedAt,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      } as SyncResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
