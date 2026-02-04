/**
 * Project Tasks — real Supabase queries
 *
 * Fetches tasks associated with the same client as the project.
 * Tasks link to projects indirectly via client_id, and can also
 * be identified by the project's external_id for synced sources.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  source: "internal" | "activecollab" | "jira";
  external_id: string | null;
  created_at: string;
}

function mapTaskStatus(status: string): "todo" | "in_progress" | "done" {
  if (status === "completed" || status === "done") return "done";
  if (status === "in_progress") return "in_progress";
  return "todo";
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async (): Promise<ProjectTask[]> => {
      // Get the project to find its client_id
      const { data: project, error: projError } = await supabase
        .from("projects")
        .select("id, client_id, external_id, external_provider")
        .eq("id", projectId)
        .single();

      if (projError) throw projError;
      if (!project?.client_id) return [];

      // Fetch tasks linked to the same client
      const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, assigned_to, metadata, created_at")
        .eq("client_id", project.client_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (taskError) throw taskError;
      if (!tasks) return [];

      return tasks.map((t) => {
        const meta = (t as any).metadata || {};
        const rawSource = (meta.source as string) || "internal";
        const source: ProjectTask["source"] =
          rawSource === "activecollab" || rawSource === "jira" ? rawSource : "internal";
        const externalId = (meta.external_id as string) || null;

        return {
          id: t.id,
          project_id: projectId,
          title: t.title,
          status: mapTaskStatus(t.status),
          priority: t.priority || "medium",
          due_date: t.due_date,
          assigned_to: t.assigned_to,
          source,
          external_id: externalId,
          created_at: t.created_at,
        };
      });
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}
