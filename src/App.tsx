import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ThemeSync } from "@/components/ThemeSync";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Module routes
import { publicRoutes, coreProtectedRoutes, catchAllRoute } from "@/modules/platform";
import { meetingsRoutes } from "@/modules/meetings";
import { actionsRoutes } from "@/modules/actions";
import { knowledgeRoutes } from "@/modules/knowledge";
import { businessDevRoutes } from "@/modules/business-dev";
import { eosRoutes } from "@/modules/eos";
import { projectsRoutes } from "@/modules/projects";
import { productivityRoutes } from "@/modules/productivity";
import { adminRoutes } from "@/modules/admin";

// Client portal (public, no layout)
import ClientPortalDashboard from "@/pages/client/ClientPortalDashboard";
import ProjectDashboard from "@/pages/client/ProjectDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ThemeSync />
        <BrandingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes (login, signup, auth callbacks) */}
              {publicRoutes}
              

              {/* Client portal: token + password, no layout */}
              <Route
                path="/projects/:slug/client-portal/:token"
                element={<ClientPortalDashboard />}
              />

              {/* Legacy-style client project dashboard (optional) */}
              <Route
                path="/client/project/:token"
                element={<ProjectDashboard />}
              />

              {/* Protected routes with dashboard layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  {/* Core platform routes (dashboard, profile, settings, etc.) */}
                  {coreProtectedRoutes}

                  {/* Feature module routes */}
                  {businessDevRoutes}
                  {meetingsRoutes}
                  {actionsRoutes}
                  {knowledgeRoutes}
                  {eosRoutes}
                  {projectsRoutes}
                  {productivityRoutes}
                </Route>
              </Route>

              {/* Admin panel routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    {adminRoutes}
                  </Route>
                </Route>
              </Route>

              {/* 404 catch-all */}
              {catchAllRoute}
            </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
