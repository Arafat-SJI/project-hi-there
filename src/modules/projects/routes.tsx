/**
 * Projects Module Routes
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectFormPage from "./pages/ProjectFormPage";
import ProjectKnowledgePage from "./pages/ProjectKnowledgePage";
import ProjectIssuesAIAnalyzePage from "./pages/ProjectIssuesAIAnalyzePage";

export const projectsRoutes = (
  <Route element={<ModuleRoute module="projects" />}>
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/new" element={<ProjectFormPage />} />
    <Route path="/projects/:slug/edit" element={<ProjectFormPage />} />
    <Route path="/projects/:slug/knowledge" element={<ProjectKnowledgePage />} />
    <Route
      path="/projects/:slug/issues/ai/analyze"
      element={<ProjectIssuesAIAnalyzePage />}
    />
    <Route path="/projects/:slug/:tab" element={<ProjectDetailPage />} />
    <Route path="/projects/:slug" element={<ProjectDetailPage />} />
  </Route>
);
