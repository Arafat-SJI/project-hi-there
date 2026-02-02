import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, Building2, Briefcase, Search, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EmployeeProfile, Department, Pod } from "@/modules/productivity/types";

function useEmployeeProjectionData() {
  return useQuery({
    queryKey: ["employee-projection"],
    queryFn: async () => {
      const [empRes, deptRes, podRes, memberRes] = await Promise.all([
        supabase
          .from("employee_profiles")
          .select("id, email, full_name, department_id, title, employment_type, is_active, hire_date, location")
          .order("full_name"),
        supabase.from("departments").select("id, name, is_active").eq("is_active", true).order("name"),
        supabase.from("pods").select("id, name, department_id, is_active").eq("is_active", true).order("name"),
        supabase.from("pod_members").select("id, pod_id, user_id, role"),
      ]);

      return {
        employees: (empRes.data || []) as EmployeeProfile[],
        departments: (deptRes.data || []) as Department[],
        pods: (podRes.data || []) as Pod[],
        podMembers: (memberRes.data || []) as Array<{ id: string; pod_id: string; user_id: string; role: string }>,
      };
    },
  });
}

const employmentBadge: Record<string, { label: string; className: string }> = {
  "full-time": { label: "FT", className: "bg-green-100 text-green-700 border-green-200" },
  "part-time": { label: "PT", className: "bg-amber-100 text-amber-700 border-amber-200" },
  contractor: { label: "Contract", className: "bg-blue-100 text-blue-700 border-blue-200" },
  intern: { label: "Intern", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function EmployeeProjection() {
  const { data, isLoading } = useEmployeeProjectionData();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const { employees = [], departments = [], pods = [], podMembers = [] } = data || {};

  // Build lookup maps
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const podsByDept = useMemo(() => {
    const map = new Map<string, Pod[]>();
    pods.forEach((p) => {
      const key = p.department_id || "none";
      map.set(key, [...(map.get(key) || []), p]);
    });
    return map;
  }, [pods]);
  const membersByPod = useMemo(() => {
    const map = new Map<string, number>();
    podMembers.forEach((m) => map.set(m.pod_id, (map.get(m.pod_id) || 0) + 1));
    return map;
  }, [podMembers]);

  // Filter employees
  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (deptFilter !== "all" && emp.department_id !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          emp.full_name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          (emp.title || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employees, deptFilter, search]);

  // Summary stats
  const activeCount = employees.filter((e) => e.is_active).length;
  const ftCount = employees.filter((e) => e.employment_type === "full-time").length;
  const allocatedCount = new Set(podMembers.map((m) => m.user_id)).size;
  const allocationRate = activeCount > 0 ? Math.round((allocatedCount / activeCount) * 100) : 0;

  // Dept distribution for chart-like display
  const deptDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((emp) => {
      const name = emp.department_id ? deptMap.get(emp.department_id) || "Unknown" : "Unassigned";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, pct: employees.length > 0 ? Math.round((count / employees.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [employees, deptMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Projection</h1>
        <p className="text-muted-foreground">
          Resource allocation, team distribution, and capacity overview
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  Total Employees
                </div>
                <p className="text-2xl font-bold mt-1">{employees.length}</p>
                <p className="text-xs text-muted-foreground">{activeCount} active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Briefcase className="h-4 w-4" />
                  Full-Time
                </div>
                <p className="text-2xl font-bold mt-1">{ftCount}</p>
                <p className="text-xs text-muted-foreground">
                  {employees.length - ftCount} part-time / contractor / intern
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Building2 className="h-4 w-4" />
                  Departments
                </div>
                <p className="text-2xl font-bold mt-1">{departments.length}</p>
                <p className="text-xs text-muted-foreground">{pods.length} pods</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <UserCheck className="h-4 w-4" />
                  Pod Allocation
                </div>
                <p className="text-2xl font-bold mt-1">{allocationRate}%</p>
                <Progress value={allocationRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {allocatedCount} of {activeCount} assigned to pods
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Department Distribution + Pods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Department Distribution</CardTitle>
                <CardDescription>Headcount by department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {deptDistribution.map((d) => (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground">
                        {d.count} ({d.pct}%)
                      </span>
                    </div>
                    <Progress value={d.pct} className="h-2" />
                  </div>
                ))}
                {deptDistribution.length === 0 && (
                  <p className="text-sm text-muted-foreground">No employee data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pods & Teams</CardTitle>
                <CardDescription>Active pods with member counts</CardDescription>
              </CardHeader>
              <CardContent>
                {departments.map((dept) => {
                  const deptPods = podsByDept.get(dept.id) || [];
                  if (deptPods.length === 0) return null;
                  return (
                    <div key={dept.id} className="mb-4 last:mb-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        {dept.name}
                      </p>
                      <div className="space-y-1">
                        {deptPods.map((pod) => (
                          <div
                            key={pod.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <span>{pod.name}</span>
                            <Badge variant="secondary">
                              {membersByPod.get(pod.id) || 0} members
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {pods.length === 0 && (
                  <p className="text-sm text-muted-foreground">No pods configured</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Employee Table with Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employee Roster</CardTitle>
              <CardDescription>
                {filtered.length} of {employees.length} employees shown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, or title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">No employees found</p>
                  <p className="text-sm">Adjust your filters or add employees.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((emp) => {
                      const eb = employmentBadge[emp.employment_type] || employmentBadge["full-time"];
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.full_name}</p>
                              <p className="text-xs text-muted-foreground">{emp.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{emp.title || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {emp.department_id ? deptMap.get(emp.department_id) || "Unknown" : "Unassigned"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={eb.className}>
                              {eb.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{emp.location || "—"}</TableCell>
                          <TableCell>
                            {emp.is_active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
