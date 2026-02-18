/**
 * Employees Hook - Queries the Employee table (PascalCase)
 * Used for RP Settings team member selection
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  location: string | null;
  title: string | null;
  role: string | null;
  reportingManagerName: string | null;
  reportingManagerEmail: string | null;
  status: string;
  deleted_at: string | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await (supabase as any)
        .from("Employee")
        .select("*")
        .is("deleted_at", null)
        .order("name");
      
      if (error) throw error;
      return (data || []) as Employee[];
    },
  });
}
