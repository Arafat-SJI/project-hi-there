/**
 * RP Team Settings Hook
 * Provides all queries and mutations for managing RP teams (pods with show_in_resource_projection)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseErrorMessage, typedQuery } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface RPTeam {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  is_active: boolean;
  show_in_resource_projection: boolean;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
}

export interface RPTeamMember {
  id: string;
  employee_id: string;
  is_primary: boolean;
  Employee: {
    id: string;
    name: string;
    email: string;
    department?: string | null;
    location?: string | null;
    title?: string | null;
  };
}

export interface RPTeamWithMembers extends RPTeam {
  members: RPTeamMember[];
  memberCount: number;
}

// Cache keys
export const rpTeamKeys = {
  all: ["rp-teams"] as const,
  lists: () => [...rpTeamKeys.all, "list"] as const,
  detail: (id: string) => [...rpTeamKeys.all, "detail", id] as const,
  allocations: (teamId: string) => [...rpTeamKeys.all, "allocations", teamId] as const,
};

// Cache invalidation keys (broad invalidation pattern)
const invalidateKeys = [
  rpTeamKeys.all,
  ["teams"],
  ["team-resources"],
  ["all-resources-projection"],
  ["resource-projection-rows"],
];

/**
 * Fetch all active pods with nested employee_pods -> Employee join
 */
export function useRPTeams() {
  return useQuery({
    queryKey: rpTeamKeys.lists(),
    queryFn: async (): Promise<RPTeamWithMembers[]> => {
      // Query pods with employee_pods join
      // Note: Using type assertion for columns that may not be in generated types yet
      const { data, error } = await supabase
        .from("pods")
        .select(`
          id, name, description, color, is_active,
          show_in_resource_projection, created_at, updated_at, created_by,
          employee_pods (
            id, employee_id, is_primary,
            Employee:Employee (id, name, email, department, location, title)
          )
        `)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      // Post-process: filter out members without valid Employee join
      return (data || []).map((team: any) => {
        const members = (team.employee_pods || [])
          .filter((m: any) => m.Employee)
          .map((m: any) => ({
            id: m.id,
            employee_id: m.employee_id,
            is_primary: m.is_primary,
            Employee: m.Employee,
          }));

        return {
          ...team,
          members,
          memberCount: members.length,
        } as RPTeamWithMembers;
      });
    },
  });
}

/**
 * Fetch single team with members
 */
export function useRPTeam(id: string | undefined) {
  return useQuery({
    queryKey: rpTeamKeys.detail(id || ""),
    queryFn: async (): Promise<RPTeamWithMembers | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("pods")
        .select(`
          id, name, description, color, is_active,
          show_in_resource_projection, created_at, updated_at, created_by,
          employee_pods (
            id, employee_id, is_primary,
            Employee:Employee (id, name, email, department, location, title)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const members = (data.employee_pods || [])
        .filter((m: any) => m.Employee)
        .map((m: any) => ({
          id: m.id,
          employee_id: m.employee_id,
          is_primary: m.is_primary,
          Employee: m.Employee,
        }));

      return {
        ...data,
        members,
        memberCount: members.length,
      } as RPTeamWithMembers;
    },
    enabled: !!id,
  });
}

/**
 * Create a new pod with bulk member inserts
 */
export function useCreateRPTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      show_in_resource_projection?: boolean;
      memberIds?: string[];
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create pod (using type assertion for columns that may not be in generated types)
      const { data: pod, error: podError } = await supabase
        .from("pods")
        .insert({
          name: data.name,
          description: data.description || null,
          show_in_resource_projection: data.show_in_resource_projection ?? true,
          created_by: user?.id || null,
          is_active: true,
          color: "#3b82f6",
        } as any)
        .select()
        .single();

      if (podError) throw podError;
      if (!pod) throw new Error("Failed to create pod");

      // Bulk insert members if provided
      if (data.memberIds && data.memberIds.length > 0) {
        const memberInserts = data.memberIds.map((employeeId) => ({
          pod_id: pod.id,
          employee_id: employeeId,
          is_primary: false,
          synced_from_hr: false,
        }));

        const { error: membersError } = await supabase
          .from("employee_pods")
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      return pod;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Team created successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Update pod fields
 */
export function useUpdateRPTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      show_in_resource_projection?: boolean;
    }) => {
      // Update pod (using type assertion for columns that may not be in generated types)
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.show_in_resource_projection !== undefined) updateData.show_in_resource_projection = data.show_in_resource_projection;

      const { data: updated, error } = await supabase
        .from("pods")
        .update(updateData)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Team updated successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Soft delete (sets is_active = false)
 */
export function useDeleteRPTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pods")
        .update({ is_active: false } as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Add one employee_pods row
 */
export function useAddRPTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { podId: string; employeeId: string; isPrimary?: boolean }) => {
      const { data: member, error } = await supabase
        .from("employee_pods")
        .insert({
          pod_id: data.podId,
          employee_id: data.employeeId,
          is_primary: data.isPrimary || false,
          synced_from_hr: false,
        })
        .select()
        .single();

      if (error) throw error;
      return member;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Member added successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Remove one employee_pods row by membership ID
 */
export function useRemoveRPTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("employee_pods")
        .delete()
        .eq("id", membershipId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Member removed successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Bulk insert multiple members at once
 */
export function useBulkAddRPTeamMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { podId: string; employeeIds: string[] }) => {
      const memberInserts = data.employeeIds.map((employeeId) => ({
        pod_id: data.podId,
        employee_id: employeeId,
        is_primary: false,
        synced_from_hr: false,
      }));

      const { error } = await supabase
        .from("employee_pods")
        .insert(memberInserts);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Members added successfully");
    },
    onError: (error) => {
      toast.error(getSupabaseErrorMessage(error));
    },
  });
}

/**
 * Check projection_rows for active allocations (used for warnings)
 * Note: This assumes projection_rows table exists. If it doesn't, this will need to be adjusted.
 */
export function useTeamActiveAllocations(teamId: string | undefined) {
  return useQuery({
    queryKey: rpTeamKeys.allocations(teamId || ""),
    queryFn: async (): Promise<Array<{ id: string; project_id?: string; resource_id?: string }>> => {
      if (!teamId) return [];

      // Try to query projection_rows table
      // If it doesn't exist, return empty array (graceful degradation)
      try {
        const { data, error } = await (supabase as any)
          .from("projection_rows")
          .select("id, project_id, resource_id")
          .eq("team_id", teamId);

        if (error) {
          // If table doesn't exist, return empty array
          if (error.code === "42P01") return [];
          throw error;
        }

        return (data || []) as Array<{ id: string; project_id?: string; resource_id?: string }>;
      } catch (error: any) {
        // If table doesn't exist, return empty array
        if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!teamId,
  });
}

/**
 * Validate team name uniqueness among active pods
 */
export function useCheckTeamNameExists() {
  return useMutation({
    mutationFn: async (data: { name: string; excludeId?: string }): Promise<boolean> => {
      let query = typedQuery("pods")
        .select("id")
        .eq("is_active", true)
        .eq("name", data.name);

      if (data.excludeId) {
        query = query.neq("id", data.excludeId);
      }

      const { data: existing, error } = await query;

      if (error) throw error;
      return (existing || []).length > 0;
    },
  });
}

