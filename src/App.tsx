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
import { ProtectedAppRoutes } from "@/components/routing/AppRouteTree";

// Module routes
import { publicRoutes, catchAllRoute } from "@/modules/platform";

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
                {publicRoutes}

                <Route
                  path="/projects/:slug/client-portal/:token"
                  element={<ClientPortalDashboard />}
                />
                <Route path="/client/project/:token" element={<ProjectDashboard />} />

                <Route element={<ProtectedRoute />}>
                  <ProtectedAppRoutes />
                </Route>

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
