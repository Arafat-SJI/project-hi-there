import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ModuleRoute } from "@/components/routing/ModuleRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

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
import KnowledgeForm from "./pages/KnowledgeForm";
import KnowledgeDetail from "./pages/KnowledgeDetail";
import KnowledgeUpload from "./pages/KnowledgeUpload";
import AIChat from "./pages/AIChat";
import Admin from "./pages/Admin";
import DeploymentStatus from "./pages/DeploymentStatus";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import SystemSettings from "./pages/admin/SystemSettings";
import Integrations from "./pages/admin/Integrations";
import AIModelManagement from "./pages/admin/AIModelManagement";
import AIUsageAnalytics from "./pages/admin/AIUsageAnalytics";
import EnvironmentValidator from "./pages/admin/EnvironmentValidator";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Feedback from "./pages/Feedback";
import AIAgents from "./pages/AIAgents";
import Tasks from "./pages/Tasks";
import PersonalKnowledge from "./pages/PersonalKnowledge";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
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
                <Route element={<ModuleRoute requiresFeatureFlag="enableMeetings" />}>
                  <Route path="/meetings" element={<Meetings />} />
                  <Route path="/meetings/new" element={<MeetingForm />} />
                  <Route path="/meetings/:id" element={<MeetingDetail />} />
                  <Route path="/meetings/:id/edit" element={<MeetingForm />} />
                </Route>

                {/* Tasks */}
                <Route element={<ModuleRoute requiresFeatureFlag="enableTasks" />}>
                  <Route path="/tasks" element={<Tasks />} />
                </Route>

                {/* Knowledge Base */}
                <Route element={<ModuleRoute requiresFeatureFlag="enableKnowledgeBase" />}>
                  <Route path="/knowledge" element={<Knowledge />} />
                  <Route path="/knowledge/upload" element={<KnowledgeUpload />} />
                  <Route path="/knowledge/personal" element={<PersonalKnowledge />} />
                  <Route path="/knowledge/new" element={<KnowledgeForm />} />
                  <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
                  <Route path="/knowledge/:id/edit" element={<KnowledgeForm />} />
                </Route>

                {/* User Pages */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route element={<ModuleRoute requiresFeatureFlag="enableNotifications" />}>
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
                <Route path="/feedback" element={<Feedback />} />

                {/* AI routes (admin only but uses regular layout) */}
                <Route element={<AdminRoute />}>
                  <Route element={<ModuleRoute requiresFeatureFlag="enableAIChat" />}>
                    <Route path="/ai" element={<AIChat />} />
                    <Route path="/ai/chat" element={<AIChat />} />
                    <Route path="/ai/agents" element={<AIAgents />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            {/* Admin Panel routes with dedicated admin layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                  <Route path="/admin/roles" element={<RoleManagement />} />
                  <Route path="/admin/logs" element={<ActivityLogs />} />
                  <Route path="/admin/settings" element={<SystemSettings />} />
                  <Route path="/admin/integrations" element={<Integrations />} />
                  <Route path="/admin/ai-models" element={<AIModelManagement />} />
                  <Route path="/admin/ai-usage" element={<AIUsageAnalytics />} />
                  <Route path="/admin/deployment" element={<DeploymentStatus />} />
                  <Route path="/admin/environment" element={<EnvironmentValidator />} />
                </Route>
              </Route>
            </Route>

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
