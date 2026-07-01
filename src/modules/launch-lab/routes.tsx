import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";
import LaunchLabPage from "./pages/LaunchLabPage";

export const launchLabRoutes = (
  <Route element={<ModuleRoute />}>
    <Route path="/launch-lab" element={<LaunchLabPage />} />
  </Route>
);
