/**
 * Admin Module Routes
 *
 * All /admin/* routes. Protected by AdminRoute guard.
 * These routes grow incrementally as new modules are added.
 */
import { Route } from "react-router-dom";

// Admin pages
import Admin from "@/pages/Admin";
import UserManagement from "@/pages/admin/UserManagement";
import RoleManagement from "@/pages/admin/RoleManagement";
import ActivityLogs from "@/pages/admin/ActivityLogs";
import SystemSettings from "@/pages/admin/SystemSettings";
import Integrations from "@/pages/admin/Integrations";
import ProviderDetail from "@/pages/admin/ProviderDetail";
import OAuthCallback from "@/pages/admin/OAuthCallback";
import MicrosoftTeamsIntegration from "@/pages/admin/integrations/MicrosoftTeamsIntegration";
import TeamsMeetings from "@/pages/admin/integrations/TeamsMeetings";
import IntegrationAnalytics from "@/pages/admin/IntegrationAnalytics";
import AIModelManagement from "@/pages/admin/AIModelManagement";
import AIUsageAnalytics from "@/pages/admin/AIUsageAnalytics";
import EnvironmentValidator from "@/pages/admin/EnvironmentValidator";
import OnboardingWizard from "@/pages/admin/OnboardingWizard";
import DeploymentChecklist from "@/pages/admin/DeploymentChecklist";
import SSOSettings from "@/pages/admin/SSOSettings";
import MeetingAnalytics from "@/pages/admin/MeetingAnalytics";
import FeedbackManagement from "@/pages/admin/FeedbackManagement";
import ProductRoadmap from "@/pages/admin/ProductRoadmap";
import DeploymentStatus from "@/pages/DeploymentStatus";
import MCPServers from "@/pages/MCPServers";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import DepartmentManagement from "@/pages/admin/DepartmentManagement";
import KnowledgeAnalytics from "@/pages/admin/KnowledgeAnalytics";
import KnowledgeCategories from "@/pages/admin/KnowledgeCategories";
import ImplementationStatus from "@/pages/admin/ImplementationStatus";
import SeedRunner from "@/pages/admin/SeedRunner";
import EmbeddingsExplorer from "@/pages/admin/EmbeddingsExplorer";

/**
 * Admin routes - require admin role
 */
export const adminRoutes = (
  <>
    {/* Dashboard */}
    <Route path="/admin" element={<Admin />} />
    <Route path="/admin/implementation-status" element={<ImplementationStatus />} />

    {/* Users & Access */}
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/roles" element={<RoleManagement />} />
    <Route path="/admin/logs" element={<ActivityLogs />} />

    {/* System */}
    <Route path="/admin/settings" element={<SystemSettings />} />
    <Route path="/admin/integrations" element={<Integrations />} />
    <Route path="/admin/integrations/oauth/callback" element={<OAuthCallback />} />
    <Route path="/admin/integrations/analytics" element={<IntegrationAnalytics />} />
    <Route path="/admin/integrations/microsoft-teams" element={<MicrosoftTeamsIntegration />} />
    <Route path="/admin/integrations/microsoft-teams/meetings" element={<TeamsMeetings />} />
    <Route path="/admin/integrations/:slug" element={<ProviderDetail />} />

    {/* AI & Automation */}
    <Route path="/admin/ai-models" element={<AIModelManagement />} />
    <Route path="/admin/ai-usage" element={<AIUsageAnalytics />} />
    <Route path="/admin/mcp-servers" element={<MCPServers />} />

    {/* Team & Resources */}
    <Route path="/admin/team/employees" element={<EmployeeManagement />} />
    <Route path="/admin/team/departments" element={<DepartmentManagement />} />

    {/* Knowledge Admin */}
    <Route path="/admin/knowledge/analytics" element={<KnowledgeAnalytics />} />
    <Route path="/admin/knowledge/categories" element={<KnowledgeCategories />} />
    <Route path="/admin/knowledge/embeddings" element={<EmbeddingsExplorer />} />

    {/* Content & Feedback */}
    <Route path="/admin/feedback" element={<FeedbackManagement />} />

    {/* Deployment & Config */}
    <Route path="/admin/deployment" element={<DeploymentStatus />} />
    <Route path="/admin/environment" element={<EnvironmentValidator />} />
    <Route path="/admin/onboarding" element={<OnboardingWizard />} />
    <Route path="/admin/checklist" element={<DeploymentChecklist />} />
    <Route path="/admin/sso-settings" element={<SSOSettings />} />
    <Route path="/admin/meeting-analytics" element={<MeetingAnalytics />} />
    <Route path="/admin/roadmap" element={<ProductRoadmap />} />
    <Route path="/admin/roadmap/seed" element={<SeedRunner />} />
  </>
);
