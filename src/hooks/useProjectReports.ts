/**
 * Project Reports (mock)
 *
 * Returns dummy aggregated project stats for the admin Reports page until
 * real aggregates from projects/milestones/risks/billing exist.
 */

import { useQuery } from "@tanstack/react-query";

export interface ProjectReportRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  milestones_total: number;
  milestones_done: number;
  risks_open: number;
  budget_spent_pct: number;
}

const MOCK_REPORT_ROWS: ProjectReportRow[] = [
  {
    id: "r1",
    name: "Acme Platform Rollout",
    slug: "acme-platform-rollout",
    status: "Active",
    milestones_total: 4,
    milestones_done: 1,
    risks_open: 1,
    budget_spent_pct: 25,
  },
  {
    id: "r2",
    name: "TechStart AI Integration",
    slug: "techstart-ai-integration",
    status: "Active",
    milestones_total: 4,
    milestones_done: 0,
    risks_open: 0,
    budget_spent_pct: 10,
  },
  {
    id: "r3",
    name: "Enterprise QBR Prep",
    slug: "enterprise-qbr-prep",
    status: "Planning",
    milestones_total: 0,
    milestones_done: 0,
    risks_open: 0,
    budget_spent_pct: 0,
  },
];

export function useProjectReports() {
  return useQuery({
    queryKey: ["project-reports"],
    queryFn: async (): Promise<ProjectReportRow[]> => {
      // Replace with Supabase aggregates when ready
      return MOCK_REPORT_ROWS;
    },
    staleTime: 60 * 1000,
  });
}
