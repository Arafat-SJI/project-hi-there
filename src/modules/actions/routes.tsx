/**
 * Actions Module Routes
 *
 * Standalone task management with streams, views, and detail pages.
 * Gated by the "actions" module / "enableTasks" feature flag.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

// Module-owned pages
import TasksPage from "./pages/TasksPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import StreamsPage from "./pages/StreamsPage";
import StreamTasksPage from "./pages/StreamTasksPage";

// Legacy pages (existing, used for create/edit form until replaced)
import TaskForm from "@/pages/TaskForm";

export const actionsRoutes = (
  <Route element={<ModuleRoute module="actions" requiresFeatureFlag="enableTasks" />}>
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/tasks/new" element={<TaskForm />} />
    <Route path="/tasks/streams" element={<StreamsPage />} />
    <Route path="/tasks/streams/:streamId" element={<StreamTasksPage />} />
    <Route path="/tasks/:id" element={<TaskDetailPage />} />
    <Route path="/tasks/:id/edit" element={<TaskForm />} />
  </Route>
);
