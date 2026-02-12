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
