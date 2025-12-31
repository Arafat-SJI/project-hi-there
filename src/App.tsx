import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import ClientDetail from "./pages/ClientDetail";
import Meetings from "./pages/Meetings";
import MeetingForm from "./pages/MeetingForm";
import MeetingDetail from "./pages/MeetingDetail";
import Knowledge from "./pages/Knowledge";
import AIChat from "./pages/AIChat";
import Admin from "./pages/Admin";
import DeploymentStatus from "./pages/DeploymentStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected routes with dashboard layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Clients */}
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/new" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/clients/:id/edit" element={<ClientForm />} />

                {/* Meetings */}
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/meetings/new" element={<MeetingForm />} />
                <Route path="/meetings/:id" element={<MeetingDetail />} />
                <Route path="/meetings/:id/edit" element={<MeetingForm />} />

                {/* Knowledge Base */}
                <Route path="/knowledge" element={<Knowledge />} />

                {/* AI */}
                <Route path="/ai" element={<AIChat />} />
                <Route path="/ai/chat" element={<AIChat />} />

                {/* Admin - Protected by AdminRoute */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/deployment" element={<DeploymentStatus />} />
                </Route>
              </Route>
            </Route>

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
