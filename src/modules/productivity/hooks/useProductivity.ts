/**
 * Productivity Hook - Core productivity data queries
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ProductivityRecord, ProductivityFilters, ProductivitySummary, Department } from "../types";

const PRODUCTIVITY_KEY = "productivity";

export function useProductivityRecords(filters?: ProductivityFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [PRODUCTIVITY_KEY, "records", filters],
    queryFn: async (): Promise<ProductivityRecord[]> => {
      let query = supabase
        .from("productivity_records")
        .select("*")
        .order("week_start", { ascending: false });

      if (filters?.department) query = query.eq("department", filters.department);
      if (filters?.location) query = query.eq("location", filters.location);
      if (filters?.week_start) query = query.eq("week_start", filters.week_start);
      if (filters?.search) query = query.ilike("employee_email", `%${filters.search}%`);

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data || []) as ProductivityRecord[];
    },
    enabled: !!user,
  });
}

export function useProductivitySummary(weekStart?: string) {
  return useQuery({
    queryKey: [PRODUCTIVITY_KEY, "summary", weekStart],
    queryFn: async (): Promise<ProductivitySummary> => {
      let query = supabase.from("productivity_records").select("*");
      if (weekStart) query = query.eq("week_start", weekStart);
      else {
        // Get most recent week
        const { data: latest } = await supabase
          .from("productivity_records")
          .select("week_start")
          .order("week_start", { ascending: false })
          .limit(1);
        if (latest?.[0]) query = query.eq("week_start", latest[0].week_start);
      }

      const { data, error } = await query;
      if (error) throw error;

      const records = data || [];
      const deptMap = new Map<string, { sum_util: number; count: number }>();

      let totalUtil = 0;
      let totalEff = 0;
      let totalTasks = 0;

      records.forEach((r: any) => {
        totalUtil += Number(r.utilization_pct) || 0;
        totalEff += Number(r.efficiency_score) || 0;
        totalTasks += r.tasks_completed || 0;

        const dept = r.department || "Unassigned";
        const cur = deptMap.get(dept) || { sum_util: 0, count: 0 };
        cur.sum_util += Number(r.utilization_pct) || 0;
        cur.count++;
        deptMap.set(dept, cur);
      });

      return {
        total_employees: records.length,
        avg_utilization: records.length ? Math.round(totalUtil / records.length) : 0,
        avg_efficiency: records.length ? Math.round(totalEff / records.length) : 0,
        total_tasks_completed: totalTasks,
        departments: Array.from(deptMap.entries()).map(([name, val]) => ({
          name,
          avg_utilization: Math.round(val.sum_util / val.count),
          employee_count: val.count,
        })),
      };
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: [PRODUCTIVITY_KEY, "departments"],
    queryFn: async (): Promise<Department[]> => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as Department[];
    },
  });
}

export function useAvailableWeeks() {
  return useQuery({
    queryKey: [PRODUCTIVITY_KEY, "weeks"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("productivity_records")
        .select("week_start")
        .order("week_start", { ascending: false });
      if (error) throw error;
      const unique = [...new Set((data || []).map((d: any) => d.week_start))];
      return unique as string[];
    },
  });
}
