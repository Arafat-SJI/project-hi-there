/**
 * Path B: Base project productivity hooks
 * Uses EmployeeProductivity table + edge functions (team-productivity-metrics, team-productivity-list)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  EmployeeProductivityWithEmployee,
  ProductivityMetricsResponse,
  EmployeeProductivityListResponse,
  EmployeeBase,
  ActionItemBase,
} from "../types";

export const productivityBaseKeys = {
  all: ["productivity-base"] as const,
  metrics: () => [...productivityBaseKeys.all, "metrics"] as const,
  employeeList: (page?: number, limit?: number) =>
    [...productivityBaseKeys.all, "employee-list", page, limit] as const,
  allEmployees: (weeks?: number) => [...productivityBaseKeys.all, "all-employees", weeks] as const,
  employees: () => [...productivityBaseKeys.all, "employees"] as const,
  employee: (email: string) => [...productivityBaseKeys.employees(), email] as const,
};

function parseTimeString(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return parseFloat(parts[0]) + parseFloat(parts[1]) / 60;
  }
  return parseFloat(timeStr) || 0;
}

async function fetchProductivityMetrics(): Promise<ProductivityMetricsResponse> {
    const { data: response, error } = await supabase.functions.invoke("team-productivity-metrics");

  if (error) throw error;
  if (!response?.success) {
    throw new Error(response?.error || "Failed to fetch metrics");
  }

  const latestMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const { data: productivityData } = await supabase
    .from("EmployeeProductivity")
    .select("productive_time_hr, email")
    .eq("week", response.data?.week || "");

  const avgBillableHours =
    productivityData && productivityData.length > 0
      ? productivityData.reduce(
          (sum: number, p: { productive_time_hr: string | null }) =>
            sum + parseTimeString(p.productive_time_hr),
          0
        ) / productivityData.length
      : 0;

  return {
    success: true,
    data: {
      ...response.data,
      averageBillableHours: Math.round(avgBillableHours * 10) / 10,
      latestMonthForBillableHours: latestMonth,
    },
  };
}

export function useProductivityMetrics() {
  return useQuery({
    queryKey: productivityBaseKeys.metrics(),
    queryFn: fetchProductivityMetrics,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

async function fetchAllEmployeeProductivity(weeksToLoad: number): Promise<{
  data: EmployeeProductivityWithEmployee[];
  latestWeek: string | null;
  lastUpdatedAt: string | null;
  availableWeeks: string[];
}> {
  const { data: weekSnapshots } = await supabase
    .from("EmployeeProductivity")
    .select("week, updatedAt")
    .order("week", { ascending: false })
    .limit(weeksToLoad * 50);

  const seenWeeks = new Set<string>();
  const distinctWeeks: string[] = [];
  let lastUpdatedAt: string | null = null;
  let lastTimestamp = -Infinity;

  (weekSnapshots || []).forEach((s: { week?: string; updatedAt?: string }) => {
    if (s.updatedAt) {
      const t = new Date(s.updatedAt).getTime();
      if (!isNaN(t) && t > lastTimestamp) {
        lastTimestamp = t;
        lastUpdatedAt = s.updatedAt;
      }
    }
    if (s.week && !seenWeeks.has(s.week)) {
      seenWeeks.add(s.week);
      distinctWeeks.push(s.week);
    }
  });

  const latestWeek = distinctWeeks[0] || null;
  if (distinctWeeks.length === 0) {
    return { data: [], latestWeek: null, lastUpdatedAt: null, availableWeeks: [] };
  }

  const { data: prodData, error } = await supabase
    .from("EmployeeProductivity")
    .select("*")
    .in("week", distinctWeeks)
    .order("week", { ascending: false })
    .order("productivity_percentage", { ascending: false });

  if (error) throw error;

  const emails = [...new Set((prodData || []).map((p: { email: string }) => p.email))];

  const { data: employees } = await supabase
    .from("Employee")
    .select("*")
    .in("email", emails)
    .is("deleted_at", null);

  const { data: actionItems } = await supabase
    .from("ActionItem")
    .select("*")
    .in("email", emails)
    .in("week", distinctWeeks);

  const empMap = new Map<string, EmployeeBase & { actionItems?: ActionItemBase[] }>();
  (employees || []).forEach((e: EmployeeBase) => {
    empMap.set(e.email, { ...e, actionItems: [] });
  });

  (actionItems || []).forEach((a: ActionItemBase) => {
    const emp = empMap.get(a.email);
    if (emp && emp.actionItems) emp.actionItems.push(a);
  });

  const transformed: EmployeeProductivityWithEmployee[] = (prodData || []).map((p) => {
    const emp = empMap.get(p.email);
    return {
      ...p,
      Employee: emp || undefined,
      employee: emp || undefined,
    };
  });

  return {
    data: transformed,
    latestWeek,
    lastUpdatedAt,
    availableWeeks: distinctWeeks,
  };
}

export function useAllEmployeeProductivity(weeksToLoad = 12) {
  const query = useQuery({
    queryKey: productivityBaseKeys.allEmployees(weeksToLoad),
    queryFn: () => fetchAllEmployeeProductivity(weeksToLoad),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data?.data,
    latestWeek: query.data?.latestWeek,
    lastUpdatedAt: query.data?.lastUpdatedAt,
    availableWeeks: query.data?.availableWeeks ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export async function fetchEmployeeBase(email: string): Promise<EmployeeBase | null> {
  const { data, error } = await supabase
    .from("Employee")
    .select("*")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return null;
  return data as EmployeeBase | null;
}

export function useEmployeeBase(email: string) {
  return useQuery({
    queryKey: productivityBaseKeys.employee(email),
    queryFn: () => fetchEmployeeBase(email),
    enabled: !!email,
    staleTime: 1000 * 60 * 10,
  });
}

export async function fetchEmployeesBase(): Promise<EmployeeBase[]> {
  const { data, error } = await supabase
    .from("Employee")
    .select("*")
    .is("deleted_at", null);

  if (error) return [];
  return (data || []) as EmployeeBase[];
}

export function useEmployeesBase() {
  return useQuery({
    queryKey: productivityBaseKeys.employees(),
    queryFn: fetchEmployeesBase,
    staleTime: 1000 * 60 * 10,
  });
}
