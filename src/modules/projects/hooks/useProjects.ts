/**
 * Projects Hook - CRUD operations for projects
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Project, ProjectFormData, ProjectFilters, ProjectStatus } from "../types";

const PROJECTS_KEY = "projects";
const STATUSES_KEY = "project-statuses";

export function useProjects(filters?: ProjectFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [PROJECTS_KEY, filters],
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from("projects")
        .select("*")
        .eq("is_archived", filters?.is_archived ?? false)
        .order("updated_at", { ascending: false });

      if (filters?.status_id) query = query.eq("status_id", filters.status_id);
      if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id);
      if (filters?.client_id) query = query.eq("client_id", filters.client_id);
      if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Project[];
    },
    enabled: !!user,
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: [PROJECTS_KEY, slug],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_statuses(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      const row = data as Record<string, unknown>;
      const projectStatuses = row.project_statuses as { name: string; color: string } | null;
      return {
        ...row,
        status: projectStatuses ?? null,
        owner: null, // Resolved separately via profiles in UI when owner_id is set
        project_statuses: undefined,
      } as unknown as Project;
    },
    enabled: !!slug,
  });
}

export function useProjectStatuses() {
  return useQuery({
    queryKey: [STATUSES_KEY],
    queryFn: async (): Promise<ProjectStatus[]> => {
      const { data, error } = await supabase
        .from("project_statuses")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as ProjectStatus[];
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          slug: `${slug}-${Date.now().toString(36)}`,
          description: data.description || null,
          status_id: data.status_id || null,
          client_id: data.client_id || null,
          owner_id: data.owner_id || user?.id || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          budget: data.budget || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      toast.success("Project created");
    },
    onError: (error: Error) => toast.error("Failed to create project", { description: error.message }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectFormData> }) => {
      const { data: project, error } = await supabase
        .from("projects")
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.status_id !== undefined && { status_id: data.status_id || null }),
          ...(data.client_id !== undefined && { client_id: data.client_id || null }),
          ...(data.owner_id !== undefined && { owner_id: data.owner_id || null }),
          ...(data.start_date !== undefined && { start_date: data.start_date || null }),
          ...(data.end_date !== undefined && { end_date: data.end_date || null }),
          ...(data.budget !== undefined && { budget: data.budget || null }),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      toast.success("Project updated");
    },
    onError: (error: Error) => toast.error("Failed to update project", { description: error.message }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROJECTS_KEY] });
      toast.success("Project deleted");
    },
    onError: (error: Error) => toast.error("Failed to delete project", { description: error.message }),
  });
}
