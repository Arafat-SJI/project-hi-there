/**
 * Tasks Page
 *
 * Main task listing with view tabs (All, My Tasks, Today, This Week, Overdue, Delegated),
 * filters (status, priority, stream, search), and stats cards.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, CheckSquare, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { useTasksV2, useTaskStats } from "../hooks/useTasksV2";
import { useTaskStreams } from "../hooks/useTaskStreams";
import { useTaskCategories } from "../hooks/useTaskCategories";
import { useUpdateTask, useDeleteTask } from "../hooks/useTasksV2";
import { TasksTable } from "../components/TasksTable";
import { TaskViewTabs } from "../components/TaskViewTabs";
import { TaskFiltersBar } from "../components/TaskFiltersBar";
import { CreateTaskDialog } from "../components/CreateTaskDialog";
import type { TaskView, TaskFilters, TaskStatus } from "../types/tasks";

export default function TasksPage() {
  const [view, setView] = useState<TaskView>("all");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showCreate, setShowCreate] = useState(false);

  const mergedFilters = { ...filters, view };
  const { data: tasks, isLoading } = useTasksV2(mergedFilters);
  const { data: stats } = useTaskStats();
  const { data: streams } = useTaskStreams();
  const { data: categories } = useTaskCategories();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ id: taskId, data: { status } });
  };

  const handleDelete = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's work</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard icon={ListTodo} label="To Do" value={stats.todo} color="text-slate-600" />
          <StatsCard icon={Clock} label="In Progress" value={stats.in_progress} color="text-blue-600" />
          <StatsCard icon={CheckSquare} label="Completed" value={stats.completed} color="text-green-600" />
          <StatsCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="text-red-600" />
        </div>
      )}

      {/* View Tabs */}
      <TaskViewTabs currentView={view} onViewChange={setView} stats={stats} />

      {/* Filters */}
      <TaskFiltersBar filters={filters} onFiltersChange={setFilters} streams={streams} categories={categories} />

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <TasksTable
            tasks={tasks || []}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </div>
      )}

      <CreateTaskDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg bg-muted p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
