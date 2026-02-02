/**
 * Project Integrations (mock)
 *
 * Returns dummy integration connections for a project until real
 * project_integrations or org integrations are wired.
 */

import { useQuery } from "@tanstack/react-query";

export interface ProjectIntegration {
  id: string;
  project_id: string;
  name: string;
  type: "activecollab" | "jira" | "slack" | "google_calendar" | "weekly_email";
  connected: boolean;
  last_sync_at: string | null;
}

const MOCK_INTEGRATIONS: Omit<ProjectIntegration, "project_id">[] = [
  { id: "mock-int-1", name: "ActiveCollab", type: "activecollab", connected: true, last_sync_at: new Date().toISOString() },
  { id: "mock-int-2", name: "Slack", type: "slack", connected: false, last_sync_at: null },
  { id: "mock-int-3", name: "Google Calendar", type: "google_calendar", connected: false, last_sync_at: null },
  { id: "mock-int-4", name: "Weekly AI Update", type: "weekly_email", connected: false, last_sync_at: null },
];

export function useProjectIntegrations(projectId: string) {
  return useQuery({
    queryKey: ["project-integrations", projectId],
    queryFn: async (): Promise<ProjectIntegration[]> => {
      return MOCK_INTEGRATIONS.map((i) => ({ ...i, project_id: projectId }));
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
}
