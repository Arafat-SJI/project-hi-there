/**
 * Productivity Dashboard Page
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";
import { Search, Users, TrendingUp, Clock, CheckSquare, Loader2, BarChart3, Boxes, AlertTriangle } from "lucide-react";
import { useProductivityRecords, useProductivitySummary, useDepartments, useAvailableWeeks, usePodProductivity, useAIProductivityInsights } from "../hooks/useProductivity";

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#22c55e",
  partial: "#f59e0b",
  leave: "#3b82f6",
  absent: "#ef4444",
};

const deptChartConfig: ChartConfig = {
  utilization: { label: "Utilization %", color: "#6366f1" },
};

const attendanceChartConfig: ChartConfig = {
  present: { label: "Present", color: "#22c55e" },
  partial: { label: "Partial", color: "#f59e0b" },
  leave: { label: "Leave", color: "#3b82f6" },
  absent: { label: "Absent", color: "#ef4444" },
};

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
  const { data: podStats = [] } = usePodProductivity(weekStart);
  const { data: insights = [] } = useAIProductivityInsights({
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

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              AI productivity insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.slice(0, 6).map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {insight.title}
                    </p>
                    {insight.confidence_score != null && (
                      <Badge variant="outline" className="text-xs">
                        Confidence {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {insight.content}
                  </p>
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground">
                      {insight.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {insight.employee_email && (
                      <span>Employee: {insight.employee_email}</span>
                    )}
                    {insight.department && (
                      <span>Dept: {insight.department}</span>
                    )}
                    {insight.week_start && (
                      <span>
                        Week: {new Date(insight.week_start).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {/* Pod Breakdown */}
      {podStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Pod Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {podStats.map((pod) => (
                <div key={pod.pod_id} className="flex items-center gap-4 rounded-md border px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pod.pod_name}</span>
                      <Badge variant="outline" className="text-xs">{pod.department_name}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{pod.member_count} members</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className={pod.avg_utilization >= 80 ? "text-green-600 font-medium" : pod.avg_utilization >= 60 ? "text-yellow-600 font-medium" : "text-red-600 font-medium"}>
                          {pod.avg_utilization}%
                        </span>
                      </div>
                      <Progress value={pod.avg_utilization} className="h-1.5" />
                    </div>
                    <div className="text-center w-16">
                      <p className="text-xs text-muted-foreground">Efficiency</p>
                      <p className="font-medium">{pod.avg_efficiency}%</p>
                    </div>
                    <div className="text-center w-16">
                      <p className="text-xs text-muted-foreground">Tasks</p>
                      <p className="font-medium">{pod.total_tasks}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <AlertTriangle
                        className={
                          pod.avg_utilization >= 80
                            ? "h-3 w-3 text-green-500"
                            : pod.avg_utilization >= 60
                            ? "h-3 w-3 text-yellow-500"
                            : "h-3 w-3 text-red-500"
                        }
                      />
                      <span
                        className={
                          pod.avg_utilization >= 80
                            ? "text-green-600"
                            : pod.avg_utilization >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {pod.avg_utilization >= 80
                          ? "Healthy"
                          : pod.avg_utilization >= 60
                          ? "Watch"
                          : "At risk"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Department Utilization Bar Chart */}
          {summary && summary.departments.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Department Utilization</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={deptChartConfig} className="h-[250px] w-full">
                  <BarChart data={summary.departments.map((d) => ({ name: d.name, utilization: d.avg_utilization }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="utilization" fill="var(--color-utilization)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Attendance Donut Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Attendance Distribution</CardTitle></CardHeader>
            <CardContent>
              <AttendanceDonut records={records} />
            </CardContent>
          </Card>
        </div>
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

function AttendanceDonut({ records }: { records: { attendance_status: string }[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { present: 0, partial: 0, leave: 0, absent: 0 };
    records.forEach((r) => {
      const s = r.attendance_status || "absent";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [records]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;

  return (
    <div className="flex flex-col items-center">
      <ChartContainer config={attendanceChartConfig} className="h-[200px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={ATTENDANCE_COLORS[entry.name] || "#6b7280"} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ATTENDANCE_COLORS[d.name] }} />
            <span className="capitalize">{d.name}</span>
            <span className="text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
