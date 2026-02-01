/**
 * Productivity Dashboard Page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, TrendingUp, Clock, CheckSquare, Loader2, BarChart3 } from "lucide-react";
import { useProductivityRecords, useProductivitySummary, useDepartments, useAvailableWeeks } from "../hooks/useProductivity";

export default function ProductivityPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [weekStart, setWeekStart] = useState<string | undefined>();

  const { data: summary } = useProductivitySummary(weekStart);
  const { data: departments = [] } = useDepartments();
  const { data: weeks = [] } = useAvailableWeeks();
  const { data: records = [], isLoading } = useProductivityRecords({
    search: search || undefined,
    department: department !== "all" ? department : undefined,
    week_start: weekStart,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Productivity</h1>
        <p className="text-muted-foreground">Team and individual productivity metrics</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Employees</p></div>
              <p className="text-2xl font-bold mt-1">{summary.total_employees}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Avg Utilization</p></div>
              <p className="text-2xl font-bold mt-1">{summary.avg_utilization}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Avg Efficiency</p></div>
              <p className="text-2xl font-bold mt-1">{summary.avg_efficiency}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">Tasks Completed</p></div>
              <p className="text-2xl font-bold mt-1">{summary.total_tasks_completed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.departments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Department Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {summary.departments.map((dept) => (
                <div key={dept.name} className="text-center p-3 border rounded-lg">
                  <p className="text-sm font-medium truncate">{dept.name}</p>
                  <p className="text-2xl font-bold mt-1">{dept.avg_utilization}%</p>
                  <p className="text-xs text-muted-foreground">{dept.employee_count} employees</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {weeks.length > 0 && (
          <Select value={weekStart || "latest"} onValueChange={(v) => setWeekStart(v === "latest" ? undefined : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Week" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Week</SelectItem>
              {weeks.slice(0, 12).map((w) => (
                <SelectItem key={w} value={w}>{new Date(w).toLocaleDateString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No productivity records found</p>
          <p className="text-sm">Import productivity data via CSV or HR sync.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="w-[120px]">Department</TableHead>
                <TableHead className="w-[100px] text-right">Hours</TableHead>
                <TableHead className="w-[100px] text-right">Utilization</TableHead>
                <TableHead className="w-[100px] text-right">Efficiency</TableHead>
                <TableHead className="w-[80px] text-right">Tasks</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/productivity/employee/${encodeURIComponent(r.employee_email)}`)}
                >
                  <TableCell><p className="font-medium text-sm">{r.employee_email}</p></TableCell>
                  <TableCell><span className="text-sm">{r.department || "—"}</span></TableCell>
                  <TableCell className="text-right"><span className="text-sm">{r.total_hours}h</span></TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-medium ${r.utilization_pct >= 80 ? "text-green-600" : r.utilization_pct >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                      {r.utilization_pct}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right"><span className="text-sm">{r.efficiency_score}%</span></TableCell>
                  <TableCell className="text-right"><span className="text-sm">{r.tasks_completed}/{r.tasks_assigned}</span></TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      r.attendance_status === "present" ? "border-green-500 text-green-600" :
                      r.attendance_status === "leave" ? "border-blue-500 text-blue-600" :
                      r.attendance_status === "partial" ? "border-yellow-500 text-yellow-600" :
                      "border-red-500 text-red-600"
                    }>
                      {r.attendance_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
