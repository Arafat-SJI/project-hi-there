// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateEmbedding } from "../_shared/ai-provider-routing.ts";

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

interface ClickUpList {
  id: string;
  name: string;
}

interface ClickUpTask {
  id: string;
  name: string;
  status?: {
    status?: string;
    type?: string;
  };
  due_date?: string | number | null;
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

function chunkText(text: string, chunkSize = 800): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}

async function upsertTaskEmbeddings(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  taskId: string;
  content: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { supabase, userId, taskId, content, metadata } = args;

  // Clear prior embeddings for this task (idempotent updates)
  await supabase
    .from("embeddings")
    .delete()
    .eq("entity_type", "task")
    .eq("entity_id", taskId)
    .eq("user_id", userId);

  const chunks = chunkText(content, 800);
  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const emb = await generateEmbedding(supabase, chunk);
    rows.push({
      entity_type: "task",
      entity_id: taskId,
      user_id: userId,
      content: chunk,
      chunk_index: i,
      metadata,
      embedding: emb.embedding,
      created_at: new Date().toISOString(),
    });
  }

  if (rows.length > 0) {
    await supabase.from("embeddings").insert(rows);
  }
}

function slugFromNameAndId(name: string, externalId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${externalId}`.slice(0, 100);
}

function mapTaskStatus(rawStatus?: { status?: string; type?: string }): "todo" | "in_progress" | "completed" {
  const statusText = (rawStatus?.status || "").toLowerCase();
  const typeText = (rawStatus?.type || "").toLowerCase();

  if (statusText === "complete" || statusText === "completed" || typeText === "done") {
    return "completed";
  }
  if (statusText.includes("progress") || typeText === "in_progress") {
    return "in_progress";
  }
  return "todo";
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
    let tasksCreated = 0;
    let tasksUpdated = 0;

    // Get default project status (used for imported ClickUp projects)
    let defaultStatusId: string | null = null;
    const { data: defaultStatusRow } = await supabase
      .from("project_statuses")
      .select("id")
      .eq("is_default", true)
      .maybeSingle();
    if (defaultStatusRow?.id) {
      defaultStatusId = defaultStatusRow.id as string;
    }

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

      const nowIso = new Date().toISOString();
      const row: any = {
        name: space.name,
        slug,
        description: null,
        external_provider: "clickup",
        external_id: externalId,
        metadata: {
          source: "clickup",
          team_id: team.id,
        } as Record<string, unknown>,
        status_id: defaultStatusId,
        is_archived: false,
        owner_id: user.id,
        updated_at: nowIso,
      };

      let projectId: string | null = null;

      if (existing) {
        const { data: updated, error } = await supabase
          .from("projects")
          .update(row)
          .eq("id", existing.id)
          .select("id")
          .maybeSingle();
        if (error) {
          errors.push(`Update ${space.name}: ${error.message}`);
        } else {
          projectsUpdated++;
          projectId = updated?.id ?? existing.id;
        }
      } else {
        const insertRow = {
          ...row,
          created_at: nowIso,
          created_by: user.id,
        };
        const { data: inserted, error } = await supabase
          .from("projects")
          .insert(insertRow)
          .select("id")
          .maybeSingle();
        if (error) {
          errors.push(`Insert ${space.name}: ${error.message}`);
        } else {
          projectsCreated++;
          projectId = inserted?.id ?? null;
        }
      }

      // 3) For each space, fetch lists and then tasks
      const listsResp = await fetch(
        `https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`,
        { method: "GET", headers },
      );

      if (!listsResp.ok) {
        const text = await listsResp.text();
        errors.push(`ClickUp /space/${space.id}/list error: ${listsResp.status} - ${text.slice(0, 200)}`);
        continue;
      }

      const listsJson = await listsResp.json();
      const lists: ClickUpList[] = listsJson.lists ?? [];

      for (const list of lists) {
        const tasksResp = await fetch(
          // Include additional task details like time tracking, tags, and custom fields
          `https://api.clickup.com/api/v2/list/${list.id}/task?archived=false&subtasks=false`,
          { method: "GET", headers },
        );

        if (!tasksResp.ok) {
          const text = await tasksResp.text();
          errors.push(`ClickUp /list/${list.id}/task error: ${tasksResp.status} - ${text.slice(0, 200)}`);
          continue;
        }

        const tasksJson = await tasksResp.json();
        const tasks: ClickUpTask[] = tasksJson.tasks ?? [];

        for (const task of tasks) {
          const externalTaskId = String(task.id);

          const { data: existingTask } = await supabase
            .from("tasks")
            .select("id")
            .eq("created_by", user.id)
            .contains("metadata", { source: "clickup", external_id: externalTaskId })
            .maybeSingle();

          // Fetch full task details to get time tracking, tags, points, checklists, etc.
          let detailed: any = task;
          try {
            const detailResp = await fetch(
              `https://api.clickup.com/api/v2/task/${externalTaskId}`,
              { method: "GET", headers },
            );
            if (detailResp.ok) {
              const detailJson = await detailResp.json();
              detailed = detailJson;
            }
          } catch {
            // best-effort; fall back to list task
          }

          const status = mapTaskStatus(detailed.status);
          const due =
            detailed.due_date != null
              ? new Date(Number(detailed.due_date)).toISOString()
              : null;

          const timeEstimateMs =
            detailed.time_estimate != null && detailed.time_estimate !== ""
              ? Number(detailed.time_estimate) || null
              : null;
          const timeSpentMs =
            detailed.time_spent != null && detailed.time_spent !== ""
              ? Number(detailed.time_spent) || null
              : null;

          const rawTags = detailed.tags || [];
          const tags = Array.isArray(rawTags)
            ? rawTags
                .map((t: any) => (typeof t === "string" ? t : t?.name))
                .filter((t: unknown): t is string => typeof t === "string" && !!t)
            : [];

          const points =
            typeof detailed.points === "number"
              ? detailed.points
              : (() => {
                  const customFields = (detailed.custom_fields || []) as Array<{
                    name?: string;
                    type?: string;
                    value?: unknown;
                  }>;
                  const pointsField = customFields.find(
                    (f) =>
                      f.type === "number" &&
                      typeof f.name === "string" &&
                      f.name.toLowerCase().includes("point"),
                  );
                  return (pointsField?.value as number | null) ?? null;
                })();

          const checklists = Array.isArray(detailed.checklists) ? detailed.checklists : [];
          const checklistsCount = checklists.length;

          const attachments =
            Array.isArray(detailed.attachments) && detailed.attachments.length > 0
              ? (detailed.attachments as Array<Record<string, unknown>>)
                  .map((att) => {
                    const id = typeof att.id === "string" ? att.id : null;
                    const name =
                      typeof att.title === "string"
                        ? att.title
                        : typeof att.name === "string"
                        ? att.name
                        : null;
                    const url =
                      typeof att.url === "string"
                        ? att.url
                        : typeof att.url === "string"
                        ? att.url
                        : null;
                    const size =
                      typeof att.size === "number"
                        ? att.size
                        : typeof att.size === "string"
                        ? Number(att.size) || null
                        : null;
                    const extension =
                      typeof att.extension === "string"
                        ? att.extension
                        : typeof att.type === "string"
                        ? att.type
                        : null;

                    if (!id || !name || !url) {
                      return null;
                    }

                    return {
                      id,
                      name,
                      url,
                      size,
                      extension,
                    } as Record<string, unknown>;
                  })
                  .filter((att): att is Record<string, unknown> => att !== null)
              : [];

          // Extract richer ClickUp-specific details for the UI
          const clickupDetails = {
            timeEstimateMs,
            timeSpentMs,
            tags,
            sprintPoints: points,
            checklistsCount,
            hasParent: !!detailed.parent,
            url: detailed.url ?? null,
            attachments,
            // Keep raw payload in case the UI needs other fields later
            raw: detailed,
          };

          const taskRow: any = {
            title: detailed.name || task.name || "ClickUp Task",
            description: null,
            status,
            priority: "medium",
            assigned_to: null,
            meeting_id: null,
            client_id: null,
            due_date: due,
            metadata: {
              source: "clickup",
              external_id: externalTaskId,
              project_external_id: externalId,
              synced: true,
              clickup: clickupDetails,
            },
            updated_at: new Date().toISOString(),
          };

          const ragTextParts: string[] = [
            `Title: ${taskRow.title}`,
            `Status: ${status}`,
            due ? `Due: ${due}` : "",
          ].filter((x) => typeof x === "string" && x.length > 0) as string[];

          if (Array.isArray(tags) && tags.length > 0) {
            ragTextParts.push(`Tags: ${tags.join(", ")}`);
          }
          if (clickupDetails?.url) {
            ragTextParts.push(`ClickUp URL: ${String(clickupDetails.url)}`);
          }
          ragTextParts.push(`Source: ClickUp`);
          ragTextParts.push(`External ID: ${externalTaskId}`);
          ragTextParts.push(`Project External ID: ${externalId}`);

          const ragContent = ragTextParts.join("\n");

          if (existingTask) {
            const { error } = await supabase
              .from("tasks")
              .update(taskRow)
              .eq("id", existingTask.id);
            if (error) {
              errors.push(`Update task ${externalTaskId}: ${error.message}`);
            } else {
              tasksUpdated++;
              try {
                await upsertTaskEmbeddings({
                  supabase,
                  userId: user.id,
                  taskId: existingTask.id,
                  content: ragContent,
                  metadata: taskRow.metadata as Record<string, unknown>,
                });
              } catch (e) {
                errors.push(
                  `Embed task ${externalTaskId}: ${e instanceof Error ? e.message : "Unknown error"}`,
                );
              }
            }
          } else {
            const insertRow = {
              ...taskRow,
              created_at: new Date().toISOString(),
              created_by: user.id,
            };
            const { data: inserted, error } = await supabase
              .from("tasks")
              .insert(insertRow)
              .select("id")
              .maybeSingle();
            if (error || !inserted?.id) {
              errors.push(`Insert task ${externalTaskId}: ${error?.message || "Unknown insert error"}`);
            } else {
              tasksCreated++;
              try {
                await upsertTaskEmbeddings({
                  supabase,
                  userId: user.id,
                  taskId: inserted.id as string,
                  content: ragContent,
                  metadata: taskRow.metadata as Record<string, unknown>,
                });
              } catch (e) {
                errors.push(
                  `Embed task ${externalTaskId}: ${e instanceof Error ? e.message : "Unknown error"}`,
                );
              }
            }
          }
        }
      }
    }

    const projectsSynced = projectsCreated + projectsUpdated;
    const tasksSynced = tasksCreated + tasksUpdated;

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

    try {
      const { data: providerRow } = await supabase
        .from("integration_providers")
        .select("id")
        .eq("slug", "clickup")
        .maybeSingle();

      const providerId = providerRow?.id ?? null;

      await supabase.from("integration_usage_logs").insert({
        organization_id: null,
        provider_id: providerId,
        service_id: null,
        user_id: user.id,
        action: "sync-clickup",
        status: errors.length === 0 ? "success" : errors.length === projectsSynced + tasksSynced ? "error" : "partial",
        request_metadata: {
          triggered_from: "edge_function",
        } as Record<string, unknown>,
        response_metadata: {
          projects_synced: projectsSynced,
          projects_created: projectsCreated,
          projects_updated: projectsUpdated,
          tasks_synced: tasksSynced,
          duration_ms: result.duration_ms,
        } as Record<string, unknown>,
        error_message: errors.length ? errors.join("; ").slice(0, 500) : null,
        estimated_cost: 0,
      });
    } catch (_logError) {
      // Logging failures should not break sync
    }

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

