import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActiveCollabProject {
  id: number;
  name: string;
  body?: string;
  created_on?: string;
  completed_on?: string;
  budget?: number;
}

interface ActiveCollabTask {
  id: number;
  name?: string;
  body?: string;
  due_on?: string;
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
  queued?: boolean;
  message?: string;
}

interface TokenRow {
  id: string;
  access_token: string;
  metadata: Record<string, unknown> | null;
}

interface SyncCounters {
  projectsCreated: number;
  projectsUpdated: number;
  tasksCreated: number;
  tasksUpdated: number;
  embeddingsQueued: number;
  errors: string[];
}

interface BackgroundSyncContext {
  supabaseUrl: string;
  supabaseServiceKey: string;
  userId: string;
  tokenRow: TokenRow;
}

type SupabaseClient = ReturnType<typeof createClient>;

type UntypedSupabaseClient = SupabaseClient & {
  from: (table: string) => any;
};

function fromTable(supabase: SupabaseClient, table: string) {
  return (supabase as UntypedSupabaseClient).from(table);
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createSyncResponse(startedAt: number, overrides: Partial<SyncResponse> = {}): SyncResponse {
  return {
    success: false,
    projects_synced: 0,
    projects_created: 0,
    projects_updated: 0,
    tasks_synced: 0,
    duration_ms: Date.now() - startedAt,
    errors: [],
    ...overrides,
  };
}

function jsonResponse(startedAt: number, overrides: Partial<SyncResponse>, status = 200): Response {
  return new Response(JSON.stringify(createSyncResponse(startedAt, overrides)), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getActiveCollabBaseUrl(metadata: Record<string, unknown> | null): string {
  const baseUrl = metadata?.activecollab_base_url;

  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    throw new Error(
      "ActiveCollab Base URL missing on your connection. Disconnect and connect again with your instance URL.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

async function fetchJsonWithTimeout(url: string, headers: HeadersInit, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ActiveCollab API error: ${response.status} - ${text.slice(0, 200)}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseProjects(payload: unknown): ActiveCollabProject[] {
  if (Array.isArray(payload)) {
    return payload as ActiveCollabProject[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.projects)) {
    return record.projects as ActiveCollabProject[];
  }

  if (Array.isArray(record.data)) {
    return record.data as ActiveCollabProject[];
  }

  return [];
}

function parseTasks(payload: unknown): ActiveCollabTask[] {
  if (Array.isArray(payload)) {
    return payload as ActiveCollabTask[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.tasks)) {
    return record.tasks as ActiveCollabTask[];
  }

  if (Array.isArray(record.data)) {
    return record.data as ActiveCollabTask[];
  }

  return [];
}

async function runWithConcurrency<T, TResult>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(runners);
  return results;
}

async function updateTokenMetadata(
  supabase: SupabaseClient,
  tokenRow: TokenRow,
  patch: Record<string, unknown>,
): Promise<void> {
  const nextMetadata = {
    ...(tokenRow.metadata ?? {}),
    ...patch,
  };

  const { error } = await fromTable(supabase, "user_oauth_tokens")
    .update({ metadata: nextMetadata })
    .eq("id", tokenRow.id);

  if (error) {
    console.error("Failed updating ActiveCollab token metadata:", error);
    return;
  }

  tokenRow.metadata = nextMetadata;
}

async function insertUsageLog(args: {
  supabase: SupabaseClient;
  providerId: string | null;
  userId: string;
  status: "success" | "error" | "partial";
  errorMessage: string | null;
  responseMetadata: Record<string, unknown>;
}): Promise<void> {
  const { error } = await fromTable(args.supabase, "integration_usage_logs").insert({
    organization_id: null,
    provider_id: args.providerId,
    service_id: null,
    user_id: args.userId,
    action: "sync-activecollab",
    status: args.status,
    request_metadata: { triggered_from: "edge_function", mode: "background" } as Record<string, unknown>,
    response_metadata: args.responseMetadata,
    error_message: args.errorMessage,
    estimated_cost: 0,
  });

  if (error) {
    console.error("Failed inserting ActiveCollab usage log:", error);
  }
}

function combineCounters(results: SyncCounters[]): SyncCounters {
  return results.reduce<SyncCounters>(
    (acc, result) => ({
      projectsCreated: acc.projectsCreated + result.projectsCreated,
      projectsUpdated: acc.projectsUpdated + result.projectsUpdated,
      tasksCreated: acc.tasksCreated + result.tasksCreated,
      tasksUpdated: acc.tasksUpdated + result.tasksUpdated,
      embeddingsQueued: acc.embeddingsQueued + result.embeddingsQueued,
      errors: [...acc.errors, ...result.errors],
    }),
    {
      projectsCreated: 0,
      projectsUpdated: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      embeddingsQueued: 0,
      errors: [],
    },
  );
}

async function syncTask(args: {
  supabase: SupabaseClient;
  userId: string;
  projectDbId: string | null;
  projectExternalId: string;
  task: ActiveCollabTask;
}): Promise<SyncCounters> {
  const { supabase, userId, projectDbId, projectExternalId, task } = args;
  const externalTaskId = String(task.id);
  const taskMetadata = {
    source: "activecollab",
    external_id: externalTaskId,
    project_external_id: projectExternalId,
    synced: true,
    activecollab: { raw: task },
  } as Record<string, unknown>;

  try {
    const { data: existingTask, error: existingTaskError } = await fromTable(supabase, "tasks")
      .select("id")
      .eq("created_by", userId)
      .contains("metadata", { source: "activecollab", external_id: externalTaskId })
      .maybeSingle();

    if (existingTaskError) {
      throw new Error(existingTaskError.message);
    }

    const taskRow = {
      title: task.name ?? "ActiveCollab Task",
      description: task.body ?? null,
      status: task.is_completed ? "completed" : "todo",
      priority: "medium",
      due_date: toIsoOrNull(task.due_on),
      project_id: projectDbId,
      metadata: taskMetadata,
      updated_at: new Date().toISOString(),
    };

    let taskDbId: string | null = null;
    let tasksCreated = 0;
    let tasksUpdated = 0;

    if (existingTask?.id) {
      const { error: updateError } = await fromTable(supabase, "tasks").update(taskRow).eq("id", existingTask.id);
      if (updateError) {
        throw new Error(updateError.message);
      }

      taskDbId = existingTask.id;
      tasksUpdated = 1;
    } else {
      const { data: insertedTask, error: insertError } = await fromTable(supabase, "tasks")
        .insert({
          ...taskRow,
          created_at: new Date().toISOString(),
          created_by: userId,
        })
        .select("id")
        .maybeSingle();

      if (insertError) {
        throw new Error(insertError.message);
      }

      taskDbId = insertedTask?.id ?? null;
      tasksCreated = 1;
    }

    let embeddingsQueued = 0;
    if (taskDbId) {
      const { error: queueError } = await fromTable(supabase, "embedding_queue").insert({
        entity_type: "task",
        entity_id: taskDbId,
        priority: 5,
        status: "pending",
        attempts: 0,
        max_attempts: 3,
        created_at: new Date().toISOString(),
      });

      if (queueError) {
        throw new Error(`Embedding queue: ${queueError.message}`);
      }

      embeddingsQueued = 1;
    }

    return {
      projectsCreated: 0,
      projectsUpdated: 0,
      tasksCreated,
      tasksUpdated,
      embeddingsQueued,
      errors: [],
    };
  } catch (error) {
    return {
      projectsCreated: 0,
      projectsUpdated: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      embeddingsQueued: 0,
      errors: [`Task ${externalTaskId}: ${getErrorMessage(error)}`],
    };
  }
}

async function syncProject(args: {
  supabase: SupabaseClient;
  userId: string;
  apiUrl: string;
  apiHeaders: HeadersInit;
  defaultStatusId: string | null;
  activeCollabUserId: number | null;
  project: ActiveCollabProject;
}): Promise<SyncCounters> {
  const { supabase, userId, apiUrl, apiHeaders, defaultStatusId, activeCollabUserId, project } = args;
  const externalId = String(project.id);
  const slug = slugFromNameAndId(project.name, externalId);

  try {
    const { data: existingProject, error: existingProjectError } = await fromTable(supabase, "projects")
      .select("id")
      .eq("external_provider", "activecollab")
      .eq("external_id", externalId)
      .maybeSingle();

    if (existingProjectError) {
      throw new Error(existingProjectError.message);
    }

    const row = {
      name: project.name,
      slug,
      description: project.body ?? null,
      start_date: project.created_on ?? null,
      end_date: project.completed_on ?? null,
      budget: project.budget ?? null,
      external_provider: "activecollab",
      external_id: externalId,
      metadata: { source: "activecollab", external_id: externalId } as Record<string, unknown>,
      status_id: defaultStatusId,
      owner_id: userId,
      is_archived: false,
      updated_at: new Date().toISOString(),
    };

    let projectDbId: string | null = null;
    let projectsCreated = 0;
    let projectsUpdated = 0;

    if (existingProject?.id) {
      const { data: updatedProject, error: updateError } = await fromTable(supabase, "projects")
        .update(row)
        .eq("id", existingProject.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      projectDbId = updatedProject?.id ?? existingProject.id;
      projectsUpdated = 1;
    } else {
      const { data: insertedProject, error: insertError } = await fromTable(supabase, "projects")
        .insert({
          ...row,
          created_at: new Date().toISOString(),
          created_by: userId,
        })
        .select("id")
        .maybeSingle();

      if (insertError) {
        throw new Error(insertError.message);
      }

      projectDbId = insertedProject?.id ?? null;
      projectsCreated = 1;
    }

    const taskPayload = await fetchJsonWithTimeout(`${apiUrl}/api/v1/projects/${externalId}/tasks`, apiHeaders, 10000);
    const projectTasks = parseTasks(taskPayload);
    const filteredTasks =
      activeCollabUserId == null
        ? projectTasks
        : projectTasks.filter((task) => task.assignee_id === activeCollabUserId);

    const taskResults = await runWithConcurrency(filteredTasks, 5, (task) =>
      syncTask({
        supabase,
        userId,
        projectDbId,
        projectExternalId: externalId,
        task,
      })
    );

    const taskCounters = combineCounters(taskResults);

    return {
      projectsCreated,
      projectsUpdated,
      tasksCreated: taskCounters.tasksCreated,
      tasksUpdated: taskCounters.tasksUpdated,
      embeddingsQueued: taskCounters.embeddingsQueued,
      errors: taskCounters.errors,
    };
  } catch (error) {
    return {
      projectsCreated: 0,
      projectsUpdated: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      embeddingsQueued: 0,
      errors: [`Project ${externalId}: ${getErrorMessage(error)}`],
    };
  }
}

async function performBackgroundSync(context: BackgroundSyncContext): Promise<SyncResponse> {
  const { supabaseUrl, supabaseServiceKey, userId, tokenRow } = context;
  const startedAt = Date.now();
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let providerId: string | null = null;

  try {
    console.log("Starting background ActiveCollab sync", { userId, tokenId: tokenRow.id });

    await updateTokenMetadata(supabase, tokenRow, {
      last_sync_started_at: new Date().toISOString(),
      last_sync_status: "running",
      last_sync_error: null,
    });

    const { data: providerRow, error: providerError } = await fromTable(supabase, "integration_providers")
      .select("id")
      .eq("slug", "activecollab")
      .maybeSingle();

    if (providerError) {
      throw new Error(providerError.message);
    }

    providerId = providerRow?.id ?? null;

    const apiUrl = getActiveCollabBaseUrl(tokenRow.metadata);
    const apiHeaders: HeadersInit = {
      Authorization: `Bearer ${tokenRow.access_token}`,
      "X-Angie-AuthApiToken": tokenRow.access_token,
      "Content-Type": "application/json",
    };

    const mePayload = await fetchJsonWithTimeout(`${apiUrl}/api/v1/users/me`, apiHeaders, 10000);
    let activeCollabUserId: number | null = null;
    if (mePayload && typeof mePayload === "object") {
      const meRecord = mePayload as Record<string, unknown>;
      const single = meRecord.single;
      const source = single && typeof single === "object" ? (single as Record<string, unknown>) : meRecord;
      if (typeof source.id === "number") {
        activeCollabUserId = source.id;
      }
    }

    const payload = await fetchJsonWithTimeout(`${apiUrl}/api/v1/projects`, apiHeaders, 15000);
    const projects = parseProjects(payload);

    const { data: defaultStatus, error: defaultStatusError } = await fromTable(supabase, "project_statuses")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();

    if (defaultStatusError) {
      throw new Error(defaultStatusError.message);
    }

    const defaultStatusId = defaultStatus?.id ?? null;

    const projectResults = await runWithConcurrency(projects, 3, (project) =>
      syncProject({
        supabase,
        userId,
        apiUrl,
        apiHeaders,
        defaultStatusId,
        activeCollabUserId,
        project,
      })
    );

    const counters = combineCounters(projectResults);
    const projectsSynced = counters.projectsCreated + counters.projectsUpdated;
    const tasksSynced = counters.tasksCreated + counters.tasksUpdated;
    const status = counters.errors.length === 0 ? "success" : projectsSynced + tasksSynced === 0 ? "error" : "partial";

    await updateTokenMetadata(supabase, tokenRow, {
      last_sync_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_error: counters.errors[0] ?? null,
      projects_synced: projectsSynced,
      tasks_synced: tasksSynced,
    });

    await insertUsageLog({
      supabase,
      providerId,
      userId,
      status,
      errorMessage: counters.errors.length > 0 ? counters.errors.join("; ").slice(0, 500) : null,
      responseMetadata: {
        projects_synced: projectsSynced,
        projects_created: counters.projectsCreated,
        projects_updated: counters.projectsUpdated,
        tasks_synced: tasksSynced,
        embeddings_queued: counters.embeddingsQueued,
        duration_ms: Date.now() - startedAt,
      },
    });

    console.log("Completed background ActiveCollab sync", {
      userId,
      projectsSynced,
      tasksSynced,
      errors: counters.errors.length,
      durationMs: Date.now() - startedAt,
    });

    return createSyncResponse(startedAt, {
      success: status === "success",
      projects_synced: projectsSynced,
      projects_created: counters.projectsCreated,
      projects_updated: counters.projectsUpdated,
      tasks_synced: tasksSynced,
      errors: counters.errors,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Background ActiveCollab sync failed:", message);

    await updateTokenMetadata(supabase, tokenRow, {
      last_sync_at: new Date().toISOString(),
      last_sync_status: "error",
      last_sync_error: message,
    });

    await insertUsageLog({
      supabase,
      providerId,
      userId,
      status: "error",
      errorMessage: message,
      responseMetadata: {
        projects_synced: 0,
        projects_created: 0,
        projects_updated: 0,
        tasks_synced: 0,
        embeddings_queued: 0,
        duration_ms: Date.now() - startedAt,
      },
    });

    return createSyncResponse(startedAt, {
      success: false,
      errors: [message],
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(startedAt, {
        errors: ["Server misconfigured for ActiveCollab sync"],
      }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(startedAt, {
        errors: ["Missing authorization header"],
      }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const jwt = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return jsonResponse(startedAt, {
        errors: ["Invalid token"],
      }, 401);
    }

    const { data: tokenData, error: tokenError } = await fromTable(supabase, "user_oauth_tokens")
      .select("id, access_token, metadata")
      .eq("user_id", user.id)
      .eq("provider_slug", "activecollab")
      .maybeSingle();

    const tokenRow = tokenData as TokenRow | null;

    if (tokenError || !tokenRow?.access_token) {
      return jsonResponse(startedAt, {
        errors: ["No ActiveCollab connection found for this user"],
      }, 400);
    }

    getActiveCollabBaseUrl(tokenRow.metadata);

    const backgroundTask = performBackgroundSync({
      supabaseUrl,
      supabaseServiceKey,
      userId: user.id,
      tokenRow,
    });

    // Run inline so caller receives real counts immediately and sync is not dropped.
    // If runtime supports waitUntil, it is still safe to await here for deterministic UX.
    const result = await backgroundTask;
    return jsonResponse(startedAt, result, result.success ? 200 : 500);
  } catch (error) {
    return jsonResponse(startedAt, {
      errors: [getErrorMessage(error)],
    }, 500);
  }
});