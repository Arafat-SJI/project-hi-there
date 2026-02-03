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
import ProjectStatusSettings from "@/pages/admin/ProjectStatusSettings";
import ProjectModules from "@/pages/admin/ProjectModules";
import WorkTypesSettings from "@/pages/admin/WorkTypesSettings";
import Integrations from "@/pages/admin/Integrations";
import ProviderDetail from "@/pages/admin/ProviderDetail";
import OAuthCallback from "@/pages/admin/OAuthCallback";
import MicrosoftTeamsIntegration from "@/pages/admin/integrations/MicrosoftTeamsIntegration";
import TeamsMeetings from "@/pages/admin/integrations/TeamsMeetings";
import ZoomIntegration from "@/pages/admin/integrations/ZoomIntegration";
import ZoomMeetings from "@/pages/admin/integrations/ZoomMeetings";
import GoogleMeetIntegration from "@/pages/admin/integrations/GoogleMeetIntegration";
import GoogleMeetMeetings from "@/pages/admin/integrations/GoogleMeetMeetings";
import IntegrationAnalytics from "@/pages/admin/IntegrationAnalytics";
import ProjectReports from "@/pages/admin/ProjectReports";
import ResourceUtilizationReports from "@/pages/admin/ResourceUtilizationReports";
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
import EmployeeProjection from "@/pages/admin/EmployeeProjection";
import DepartmentManagement from "@/pages/admin/DepartmentManagement";
import KnowledgeAnalytics from "@/pages/admin/KnowledgeAnalytics";
import KnowledgeCategories from "@/pages/admin/KnowledgeCategories";
import ImplementationStatus from "@/pages/admin/ImplementationStatus";
import SeedRunner from "@/pages/admin/SeedRunner";
import EmbeddingsExplorer from "@/pages/admin/EmbeddingsExplorer";
import AdminEOS from "@/pages/admin/eos/AdminEOS";
import VTOAdmin from "@/pages/admin/eos/VTOAdmin";
import ScorecardWorkspace from "@/pages/admin/eos/ScorecardWorkspace";
import AdminEOSAccountability from "@/pages/admin/eos/AdminEOSAccountability";
import ProductivityImport from "@/pages/admin/ProductivityImport";

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
    <Route path="/admin/settings/project-statuses" element={<ProjectStatusSettings />} />
    <Route path="/admin/settings/project-modules" element={<ProjectModules />} />
    <Route path="/admin/settings/work-types" element={<WorkTypesSettings />} />
    <Route path="/admin/integrations" element={<Integrations />} />
    <Route path="/admin/integrations/oauth/callback" element={<OAuthCallback />} />
    <Route path="/admin/integrations/analytics" element={<IntegrationAnalytics />} />
    <Route path="/admin/integrations/microsoft-teams" element={<MicrosoftTeamsIntegration />} />
    <Route path="/admin/integrations/microsoft-teams/meetings" element={<TeamsMeetings />} />
    <Route path="/admin/integrations/zoom" element={<ZoomIntegration />} />
    <Route path="/admin/integrations/zoom/meetings" element={<ZoomMeetings />} />
    <Route path="/admin/integrations/google-meet" element={<GoogleMeetIntegration />} />
    <Route path="/admin/integrations/google-meet/meetings" element={<GoogleMeetMeetings />} />
    <Route path="/admin/integrations/:slug" element={<ProviderDetail />} />

    {/* AI & Automation */}
    <Route path="/admin/ai-models" element={<AIModelManagement />} />
    <Route path="/admin/ai-usage" element={<AIUsageAnalytics />} />
    <Route path="/admin/mcp-servers" element={<MCPServers />} />

    {/* Team & Resources */}
    <Route path="/admin/team/employees" element={<EmployeeManagement />} />
    <Route path="/admin/productivity-import" element={<ProductivityImport />} />
    <Route path="/admin/team/employee_projection" element={<EmployeeProjection />} />
    <Route path="/admin/team/departments" element={<DepartmentManagement />} />

    {/* Knowledge Admin */}
    <Route path="/admin/knowledge/analytics" element={<KnowledgeAnalytics />} />
    <Route path="/admin/knowledge/categories" element={<KnowledgeCategories />} />
    <Route path="/admin/knowledge/embeddings" element={<EmbeddingsExplorer />} />

    {/* EOS Admin */}
    <Route path="/admin/eos" element={<AdminEOS />} />
    <Route path="/admin/eos/vto" element={<VTOAdmin />} />
    <Route path="/admin/eos/scorecards" element={<ScorecardWorkspace />} />
    <Route path="/admin/eos/accountability" element={<AdminEOSAccountability />} />

    {/* Content & Feedback */}
    <Route path="/admin/feedback" element={<FeedbackManagement />} />

    {/* Reports */}
    <Route path="/admin/reports/projects" element={<ProjectReports />} />
    <Route
      path="/admin/reports/resource-utilization"
      element={<ResourceUtilizationReports />}
    />

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
