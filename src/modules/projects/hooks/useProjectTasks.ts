/**
 * Project Tasks (mock)
 *
 * Returns dummy task list for a project until real task tables/ActiveCollab sync exist.
 * Replace queryFn with Supabase or Edge Function when ready.
 */

import { useQuery } from "@tanstack/react-query";

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  source?: "internal" | "activecollab" | "jira";
  external_id?: string | null;
}

const MOCK_TASKS: ProjectTask[] = [
  {
    id: "mock-task-1",
    project_id: "",
    title: "Kickoff meeting and scope confirmation",
    status: "done",
    due_date: null,
    source: "internal",
  },
  {
    id: "mock-task-2",
    project_id: "",
    title: "Design review and sign-off",
    status: "in_progress",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    source: "internal",
  },
  {
    id: "mock-task-3",
    project_id: "",
    title: "Sprint 1 development",
    status: "todo",
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    source: "activecollab",
  },
];

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async (): Promise<ProjectTask[]> => {
      // Replace with: supabase.from('project_tasks').select('*').eq('project_id', projectId)
      return MOCK_TASKS.map((t) => ({ ...t, project_id: projectId }));
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}
