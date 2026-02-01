/**
 * Productivity Module Routes
 *
 * Productivity metrics, employee detail, and process documentation.
 * Gated by the "productivity" module.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

import ProductivityPage from "./pages/ProductivityPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import ProcessPage from "./pages/ProcessPage";

export const productivityRoutes = (
  <Route element={<ModuleRoute module="productivity" />}>
    <Route path="/productivity" element={<ProductivityPage />} />
    <Route path="/productivity/employee/:email" element={<EmployeeDetailPage />} />
    <Route path="/process" element={<ProcessPage />} />
    <Route path="/process/:category" element={<ProcessPage />} />
    <Route path="/process/:category/:slug" element={<ProcessPage />} />
  </Route>
);
