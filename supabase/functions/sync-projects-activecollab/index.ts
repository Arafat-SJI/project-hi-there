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

interface OpenAIEmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

function slugFromNameAndId(name: string, externalId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 100);
}

function chunkText(text: string, chunkSize = 800): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}

function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function embedTextOpenAI(args: { openAiApiKey: string; input: string }): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: args.input,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI embeddings failed: ${resp.status} - ${text.slice(0, 300)}`);
  }

  const json = (await resp.json()) as OpenAIEmbeddingResponse;
  const embedding = json.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("OpenAI embeddings response missing embedding vector");
  }
  return embedding;
}

async function upsertTaskEmbeddings(args: {
  supabase: any;
  userId: string;
  taskId: string;
  content: string;
  metadata: Record<string, unknown>;
  openAiApiKey: string;
}): Promise<void> {
  const { supabase, userId, taskId, content, metadata, openAiApiKey } = args;

  const { error: deleteError } = await supabase
    .from("embeddings")
    .delete()
    .eq("entity_type", "task")
    .eq("entity_id", taskId)
    .eq("user_id", userId);
  if (deleteError) {
    throw new Error(`Failed deleting prior embeddings: ${deleteError.message}`);
  }

  const rows: Array<Record<string, unknown>> = [];
  const chunks = chunkText(content, 800);
  for (let index = 0; index < chunks.length; index += 1) {
    const embedding = await embedTextOpenAI({ openAiApiKey, input: chunks[index] });
    rows.push({
      entity_type: "task",
      entity_id: taskId,
      user_id: userId,
      content: chunks[index],
      chunk_index: index,
      metadata,
      embedding,
      created_at: new Date().toISOString(),
    });
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("embeddings").insert(rows);
    if (insertError) {
      throw new Error(`Failed inserting embeddings: ${insertError.message}`);
    }
  }
}

function buildTaskEmbeddingContent(input: {
  task: ActiveCollabTask;
  projectName: string;
  projectExternalId: string;
}): string {
  const lines: string[] = [
    `Provider: ActiveCollab`,
    `Project ID: ${input.projectExternalId}`,
    `Project Name: ${input.projectName}`,
    `Task ID: ${String(input.task.id)}`,
    `Task Name: ${input.task.name ?? "ActiveCollab Task"}`,
    input.task.body ? `Description: ${input.task.body}` : "",
    `Completed: ${Boolean(input.task.is_completed)}`,
    input.task.due_on ? `Due Date: ${input.task.due_on}` : "",
    input.task.created_on ? `Created At: ${input.task.created_on}` : "",
    input.task.updated_on ? `Updated At: ${input.task.updated_on}` : "",
    input.task.assignee_id ? `Assignee ID: ${String(input.task.assignee_id)}` : "",
    `Raw Task Payload: ${JSON.stringify(input.task)}`,
  ];
  return lines.filter((line) => line.length > 0).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured (required for task embeddings)");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - startedAt,
          errors: ["Missing authorization header"],
        } as SyncResponse),
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
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - startedAt,
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
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - startedAt,
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
      throw new Error(
        "ActiveCollab Base URL missing on your connection. Disconnect and connect again with your instance URL.",
      );
    }
    const apiUrl = fromMeta.replace(/\/+$/, "");

    const apiHeaders: HeadersInit = {
      Authorization: `Bearer ${tokenRow.access_token}`,
      "X-Angie-AuthApiToken": tokenRow.access_token,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${apiUrl}/api/v1/projects`, {
      method: "GET",
      headers: apiHeaders,
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          projects_synced: 0,
          projects_created: 0,
          projects_updated: 0,
          tasks_synced: 0,
          duration_ms: Date.now() - startedAt,
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
    let embeddedTasks = 0;
    let embeddingFailures = 0;

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
        metadata: {
          source: "activecollab",
          external_id: externalId,
        } as Record<string, unknown>,
        status_id: defaultStatusId,
        owner_id: user.id,
        is_archived: false,
        updated_at: new Date().toISOString(),
      };

      let projectDbId: string | null = null;
      if (existing) {
        const { data: updatedProject, error } = await supabase
          .from("projects")
          .update(row)
          .eq("id", existing.id)
          .select("id")
          .maybeSingle();
        if (error) errors.push(`Update ${ac.name}: ${error.message}`);
        else {
          projectsUpdated++;
          projectDbId = updatedProject?.id ?? existing.id;
        }
      } else {
        const { data: insertedProject, error } = await supabase
          .from("projects")
          .insert({
          ...row,
          created_at: new Date().toISOString(),
          created_by: user.id,
        })
          .select("id")
          .maybeSingle();
        if (error) errors.push(`Insert ${ac.name}: ${error.message}`);
        else {
          projectsCreated++;
          projectDbId = insertedProject?.id ?? null;
        }
      }

      const tasksResp = await fetch(`${apiUrl}/api/v1/projects/${externalId}/tasks`, {
        method: "GET",
        headers: apiHeaders,
      });
      if (!tasksResp.ok) {
        const text = await tasksResp.text();
        errors.push(`Tasks for project ${externalId}: ${tasksResp.status} - ${text.slice(0, 200)}`);
        continue;
      }

      const taskPayload = await tasksResp.json();
      const projectTasks: ActiveCollabTask[] = Array.isArray(taskPayload)
        ? taskPayload
        : Array.isArray(taskPayload?.tasks)
          ? (taskPayload.tasks as ActiveCollabTask[])
          : Array.isArray(taskPayload?.data)
            ? (taskPayload.data as ActiveCollabTask[])
            : [];

      for (const acTask of projectTasks) {
        const externalTaskId = String(acTask.id);
        const taskMetadata = {
          source: "activecollab",
          external_id: externalTaskId,
          project_external_id: externalId,
          synced: true,
          activecollab: {
            raw: acTask,
          },
        } as Record<string, unknown>;

        const { data: existingTask } = await supabase
          .from("tasks")
          .select("id")
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
          if (taskUpdateError) {
            errors.push(`Update task ${externalTaskId}: ${taskUpdateError.message}`);
            continue;
          }
          tasksUpdated++;
          taskDbId = existingTask.id;
        } else {
          const { data: insertedTask, error: taskInsertError } = await supabase
            .from("tasks")
            .insert({
              ...taskRow,
              created_at: new Date().toISOString(),
              created_by: user.id,
            })
            .select("id")
            .maybeSingle();
          if (taskInsertError) {
            errors.push(`Insert task ${externalTaskId}: ${taskInsertError.message}`);
            continue;
          }
          tasksCreated++;
          taskDbId = insertedTask?.id ?? null;
        }

        if (taskDbId) {
          try {
            const content = buildTaskEmbeddingContent({
              task: acTask,
              projectName: ac.name,
              projectExternalId: externalId,
            });
            await upsertTaskEmbeddings({
              supabase,
              userId: user.id,
              taskId: taskDbId,
              content,
              metadata: taskMetadata,
              openAiApiKey,
            });
            embeddedTasks++;
          } catch (embeddingError: unknown) {
            embeddingFailures++;
            const message = embeddingError instanceof Error ? embeddingError.message : "Unknown embedding error";
            errors.push(`Embed task ${externalTaskId}: ${message}`);
          }
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
      request_metadata: {
        triggered_from: "edge_function",
      } as Record<string, unknown>,
      response_metadata: {
        projects_synced: projectsSynced,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        tasks_synced: tasksSynced,
        tasks_embedded: embeddedTasks,
        embedding_failures: embeddingFailures,
      } as Record<string, unknown>,
      error_message: errors.length ? errors.join("; ").slice(0, 500) : null,
      estimated_cost: 0,
    });

    return new Response(
      JSON.stringify({
        success: errors.length === 0 && embeddingFailures === 0,
        projects_synced: projectsSynced,
        projects_created: projectsCreated,
        projects_updated: projectsUpdated,
        tasks_synced: tasksSynced,
        duration_ms: Date.now() - startedAt,
        errors: [
          ...errors,
          `Embedding summary: tasks_embedded=${embeddedTasks}, embedding_failures=${embeddingFailures}`,
        ],
      } as SyncResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    console.error("sync-projects-activecollab error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        projects_synced: 0,
        projects_created: 0,
        projects_updated: 0,
        tasks_synced: 0,
        duration_ms: Date.now() - startedAt,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      } as SyncResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
