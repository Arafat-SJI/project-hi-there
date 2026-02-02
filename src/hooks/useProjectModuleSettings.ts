/**
 * Project Module Settings (skeleton)
 *
 * Simplified version of sj-control-main's useProjectModuleSettings.
 * In this framework it provides:
 * - PROJECT_MODULES: static list of potential detail tabs
 * - useProjectModuleSettings(): returns all modules marked enabled (no DB yet)
 * - useEnabledProjectModules(): returns a map of enabled modules for ProjectDetail
 *
 * You can later wire this to `system_settings` (category = 'project_modules')
 * if you want Admin-configurable tabs.
 */

import { useQuery } from "@tanstack/react-query";

export interface ProjectModule {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export interface ProjectModuleSetting extends ProjectModule {
  enabled: boolean;
}

// Static module definitions - mirrors sj-control-main, but you can trim/extend
export const PROJECT_MODULES: ProjectModule[] = [
  { key: "tasks", label: "Tasks", description: "Task management and external PM sync", icon: "CheckSquare" },
  { key: "integrations", label: "Integrations", description: "External service connections", icon: "Network" },
  { key: "client_portal", label: "Client Portal", description: "Client-facing project portal", icon: "Users" },
  { key: "checklist", label: "Checklist", description: "Project checklists and tracking", icon: "ClipboardList" },
  { key: "risks", label: "Risks", description: "Risk identification and management", icon: "AlertTriangle" },
  { key: "files", label: "Docs & Meetings", description: "Files and meeting transcripts", icon: "FileText" },
  { key: "finance", label: "Billing", description: "Invoices, payments, and billing info", icon: "DollarSign" },
];

// Admin view - currently returns all modules as enabled from static config.
export function useProjectModuleSettings() {
  return useQuery({
    queryKey: ["project-module-settings"],
    queryFn: async (): Promise<ProjectModuleSetting[]> => {
      // In a future iteration, replace this with a SELECT from system_settings.
      return PROJECT_MODULES.map((module) => ({
        ...module,
        enabled: true,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Detail view - simple enabled/disabled map for tabs.
export function useEnabledProjectModules() {
  return useQuery({
    queryKey: ["enabled-project-modules"],
    queryFn: async (): Promise<Record<string, boolean>> => {
      // Default all known modules to enabled; overview is always on.
      const enabledModules: Record<string, boolean> = {
        overview: true,
        tasks: true,
        integrations: true,
        client_portal: true,
        checklist: true,
        risks: true,
        files: true,
        finance: true,
      };

      // Hook left here for future system_settings integration; for now we just
      // return the static map.
      return enabledModules;
    },
    staleTime: 1000 * 60 * 5,
  });
}

