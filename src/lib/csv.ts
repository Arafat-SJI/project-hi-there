/**
 * CSV helpers for projects and exports (per PROJECTS-EXACT-FILE-LIST).
 */
import { generateProjectsCSV as generateProjectsCSVFromExport } from "./export-utils";

/** Trigger download of a CSV string with given filename */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Generate and download projects CSV */
export function generateProjectsCSV(
  projects: { name: string; slug: string; start_date: string | null; end_date: string | null; budget: number | null; client_name?: string; status_name?: string; owner_name?: string }[],
  filename = "projects"
): void {
  generateProjectsCSVFromExport(projects, filename);
}

/** Generate and download employees CSV */
export function generateEmployeesCSV(
  employees: {
    full_name: string;
    email: string;
    title?: string | null;
    department?: { name: string } | null;
    location?: string | null;
    employment_type: string;
    is_active: boolean;
  }[],
  filename = "employees"
): void {
  const headers = ["Name", "Email", "Title", "Department", "Location", "Type", "Status"];
  const escape = (v: string | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = employees.map((e) => [
    escape(e.full_name),
    escape(e.email),
    escape(e.title ?? null),
    escape(e.department?.name ?? null),
    escape(e.location ?? null),
    escape(e.employment_type),
    e.is_active ? "Active" : "Inactive",
  ]);
  const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(content, filename);
}

/** Generate and download scorecard metrics CSV */
export function generateScorecardMetricsCSV(
  metrics: {
    scorecard?: { name: string } | null;
    name: string;
    metric_type: string;
    current_value: number;
    target_value?: number | null;
    unit?: string | null;
    week_of?: string | null;
    status: string;
  }[],
  filename = "scorecard-metrics"
): void {
  const headers = ["Scorecard", "Metric", "Type", "Current", "Target", "Week", "Status"];
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = metrics.map((m) => [
    escape(m.scorecard?.name ?? null),
    escape(m.name),
    escape(m.metric_type),
    m.current_value,
    m.target_value ?? "",
    escape(m.week_of ? new Date(m.week_of).toLocaleDateString() : null),
    escape(m.status.replace("_", " ")),
  ]);
  const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(content, filename);
}

/** Generate and download deals CSV */
export function generateDealsCSV(
  deals: { title: string; stage: string; value: number | null; probability: number; client_name?: string; owner_name?: string; expected_close_date?: string | null; updated_at?: string | null }[],
  filename = "deals"
): void {
  const headers = ["Deal Name", "Client", "Stage", "Amount", "Probability", "Owner", "Updated", "Close Date"];
  const escape = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = deals.map((d) => [
    escape(d.title),
    escape(d.client_name),
    escape(d.stage),
    d.value != null ? d.value : "",
    d.probability ?? "",
    escape(d.owner_name),
    escape(d.updated_at ? new Date(d.updated_at).toLocaleDateString() : null),
    escape(d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : null),
  ]);
  const content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(content, filename);
}
