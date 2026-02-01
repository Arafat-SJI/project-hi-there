/**
 * Actions Module Routes
 *
 * Standalone task management.
 * Gated by the "actions" module / "enableTasks" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import Tasks from "@/pages/Tasks";
import TaskForm from "@/pages/TaskForm";
import TaskDetail from "@/pages/TaskDetail";

export const actionsRoutes = (
  <Route element={<ModuleRoute module="actions" requiresFeatureFlag="enableTasks" />}>
    <Route path="/tasks" element={<Tasks />} />
    <Route path="/tasks/new" element={<TaskForm />} />
    <Route path="/tasks/:id" element={<TaskDetail />} />
    <Route path="/tasks/:id/edit" element={<TaskForm />} />
  </Route>
);
