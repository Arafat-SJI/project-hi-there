/**
 * Admin Module Routes
 *
 * All /admin/* routes. Protected by AdminRoute guard.
 * These routes grow incrementally as new modules are added.
 */
import { Route, Navigate } from "react-router-dom";

// Admin pages
import Admin from "@/pages/Admin";
import UserManagement from "@/pages/admin/UserManagement";
import RoleManagement from "@/pages/admin/RoleManagement";
import ActivityLogs from "@/pages/admin/ActivityLogs";
import SystemSettings from "@/pages/admin/SystemSettings";
import ProjectStatusSettings from "@/pages/admin/ProjectStatusSettings";
import ProjectModules from "@/pages/admin/ProjectModules";

import Integrations from "@/pages/admin/Integrations";
import SendGrid from "@/pages/admin/integrations/SendGrid";
import ProviderDetail from "@/pages/admin/ProviderDetail";
import OAuthCallback from "@/pages/admin/OAuthCallback";
import MicrosoftTeamsIntegration from "@/pages/admin/integrations/MicrosoftTeamsIntegration";
import TeamsMeetings from "@/pages/admin/integrations/TeamsMeetings";
import ZoomIntegration from "@/pages/admin/integrations/ZoomIntegration";
import ZoomMeetings from "@/pages/admin/integrations/ZoomMeetings";
import ZoomDocumentation from "@/pages/admin/integrations/ZoomDocumentation";
import GoogleMeetIntegration from "@/pages/admin/integrations/GoogleMeetIntegration";
import GoogleMeetMeetings from "@/pages/admin/integrations/GoogleMeetMeetings";
import GoogleDriveIntegration from "@/pages/admin/integrations/GoogleDriveIntegration";
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
import RPTeamSettings from "@/pages/admin/RPTeamSettings";
import PODManagement from "@/pages/admin/PodManagement";
import DepartmentManagement from "@/pages/admin/DepartmentManagement";
import SkillManagement from "@/pages/admin/SkillManagement";
import KnowledgeAnalytics from "@/pages/admin/KnowledgeAnalytics";
import KnowledgeCategories from "@/pages/admin/KnowledgeCategories";
import KnowledgeSources from "@/pages/admin/KnowledgeSources";
import KnowledgeFiles from "@/pages/admin/KnowledgeFiles";
import KnowledgeSyncStatus from "@/pages/admin/KnowledgeSyncStatus";
import CommonKnowledgeManagement from "@/pages/admin/CommonKnowledgeManagement";
import ImplementationStatus from "@/pages/admin/ImplementationStatus";
import DashboardWidgets from "@/pages/admin/DashboardWidgets";
import AgencyRoles from "@/pages/admin/AgencyRoles";
import SeedRunner from "@/pages/admin/SeedRunner";
import GeminiRAGConfig from "@/pages/admin/GeminiRAGConfig";
import MemoryAnalytics from "@/pages/admin/MemoryAnalytics";
import EmbeddingsExplorer from "@/pages/admin/EmbeddingsExplorer";
import AdminEOS from "@/pages/admin/eos/AdminEOS";
import VTOAdmin from "@/pages/admin/eos/VTOAdmin";
import ScorecardWorkspace from "@/pages/admin/eos/ScorecardWorkspace";
import AdminEOSAccountability from "@/pages/admin/eos/AdminEOSAccountability";
import OKRsWorkspace from "@/pages/admin/eos/OKRsWorkspace";
import ProductivityImport from "@/pages/admin/ProductivityImport";
import OAuthClients from "@/pages/admin/OAuthClients";
import ApiKeys from "@/pages/admin/ApiKeys";
import StreamsPage from "@/modules/actions/pages/StreamsPage";
import StreamTasksPage from "@/modules/actions/pages/StreamTasksPage";
import AIDashboard from "@/pages/admin/ai/AIDashboard";
import AgentAnalytics from "@/pages/admin/ai/AgentAnalytics";
import PromptTemplateManagement from "@/pages/admin/ai/PromptTemplateManagement";
import AIAgents from "@/pages/AIAgents";
import AgentCategories from "@/pages/admin/ai/AgentCategories";
import EmailDraftingPerformance from "@/pages/admin/ai/EmailDraftingPerformance";
import DealCoaching from "@/pages/admin/ai/DealCoaching";
import AdminSemanticSearch from "@/pages/admin/ai/AdminSemanticSearch";
import EmbeddingPipelineDashboard from "@/pages/admin/ai/EmbeddingPipelineDashboard";
import MemoryDashboard from "@/pages/admin/memory/MemoryDashboard";
import UserMemoryStats from "@/pages/admin/memory/UserMemoryStats";
import TeamLearningPatterns from "@/pages/admin/memory/TeamLearningPatterns";
import SemanticSearchAnalytics from "@/pages/admin/memory/SemanticSearchAnalytics";

/**
 * Admin routes - require admin role
 */
export const adminRoutes = (
  <>
    {/* Dashboard */}
    <Route path="/admin" element={<Admin />} />
    <Route path="/admin/ai" element={<AIDashboard />} />
    <Route path="/admin/ai/agent-analytics" element={<AgentAnalytics />} />
    <Route path="/admin/ai/agent-categories" element={<AgentCategories />} />
    <Route path="/admin/ai/agents" element={<AIAgents />} />
    <Route path="/admin/ai/prompt-templates" element={<PromptTemplateManagement />} />
    <Route path="/admin/ai/email-drafting" element={<EmailDraftingPerformance />} />
    <Route path="/admin/ai/deal-coaching" element={<DealCoaching />} />
    <Route path="/admin/ai/semantic-search" element={<AdminSemanticSearch />} />
    <Route path="/admin/ai/embeddings" element={<EmbeddingPipelineDashboard />} />
    <Route path="/admin/implementation-status" element={<ImplementationStatus />} />

    {/* Memory Dashboard – admin only, data from Supabase only */}
    <Route path="/admin/memory" element={<Navigate to="/admin/memory/dashboard" replace />} />
    <Route path="/admin/memory/dashboard" element={<MemoryDashboard />} />
    <Route path="/admin/memory/team-learning-patterns" element={<TeamLearningPatterns />} />
    <Route path="/admin/memory/user-stats" element={<UserMemoryStats />} />
    <Route path="/admin/memory/search" element={<SemanticSearchAnalytics />} />

    {/* Users & Access */}
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/roles" element={<RoleManagement />} />
    <Route path="/admin/logs" element={<ActivityLogs />} />

    {/* System */}
    <Route path="/admin/settings" element={<SystemSettings />} />
    <Route path="/admin/settings/project-statuses" element={<ProjectStatusSettings />} />
    <Route path="/admin/settings/project-modules" element={<ProjectModules />} />
    <Route path="/admin/settings/dashboard-widgets" element={<DashboardWidgets />} />
    <Route path="/admin/settings/agency-roles" element={<AgencyRoles />} />
    
    <Route path="/admin/integrations" element={<Integrations />} />
    <Route path="/admin/integrations/oauth/callback" element={<OAuthCallback />} />
    <Route path="/admin/integrations/analytics" element={<IntegrationAnalytics />} />
    <Route path="/admin/integrations/microsoft-teams" element={<MicrosoftTeamsIntegration />} />
    <Route path="/admin/integrations/microsoft-teams/meetings" element={<TeamsMeetings />} />
    <Route path="/admin/integrations/zoom" element={<ZoomIntegration />} />
    <Route path="/admin/integrations/zoom/meetings" element={<ZoomMeetings />} />
    <Route path="/admin/integrations/zoom/documentation" element={<ZoomDocumentation />} />
    <Route path="/admin/integrations/google-meet" element={<GoogleMeetIntegration />} />
    <Route path="/admin/integrations/google-meet/meetings" element={<GoogleMeetMeetings />} />
    <Route path="/admin/integrations/google-drive" element={<GoogleDriveIntegration />} />
    <Route path="/admin/integrations/sendgrid" element={<SendGrid />} />
    <Route path="/admin/integrations/:slug" element={<ProviderDetail />} />

    {/* AI & Automation */}
    <Route path="/admin/ai-models" element={<AIModelManagement />} />
    <Route path="/admin/ai-usage" element={<AIUsageAnalytics />} />
    <Route path="/admin/mcp-servers" element={<MCPServers />} />

    {/* Task Streams (Admin) */}
    <Route path="/admin/tasks/streams" element={<StreamsPage />} />
    <Route path="/admin/tasks/streams/:streamId" element={<StreamTasksPage />} />

    {/* Team & Resources */}
    <Route path="/admin/team/employees" element={<EmployeeManagement />} />
    <Route path="/admin/productivity-import" element={<ProductivityImport />} />
    <Route path="/admin/team/pods" element={<PODManagement />} />
    <Route path="/admin/team/employee_projection" element={<RPTeamSettings />} />
    <Route path="/admin/team/departments" element={<DepartmentManagement />} />
    <Route path="/admin/skillmanagement" element={<SkillManagement />} />

    {/* Knowledge Admin */}
    <Route path="/admin/knowledge/analytics" element={<KnowledgeAnalytics />} />
    <Route path="/admin/knowledge/categories" element={<KnowledgeCategories />} />
    <Route path="/admin/knowledge/sources" element={<KnowledgeSources />} />
    <Route path="/admin/knowledge/files" element={<KnowledgeFiles />} />
    <Route path="/admin/knowledge/sync-status" element={<KnowledgeSyncStatus />} />
    <Route path="/admin/knowledge/common" element={<CommonKnowledgeManagement />} />
    <Route path="/admin/knowledge/embeddings" element={<EmbeddingsExplorer />} />
    <Route path="/admin/knowledge/gemini" element={<GeminiRAGConfig />} />
    <Route path="/admin/knowledge/memory-analytics" element={<MemoryAnalytics />} />

    {/* EOS Admin */}
    <Route path="/admin/eos" element={<AdminEOS />} />
    <Route path="/admin/eos/vto" element={<VTOAdmin />} />
    <Route path="/admin/eos/scorecards" element={<ScorecardWorkspace />} />
    <Route path="/admin/eos/accountability" element={<AdminEOSAccountability />} />
    <Route path="/admin/eos/okrs" element={<OKRsWorkspace />} />

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

    {/* OAuth & API Access */}
    <Route path="/admin/oauth-clients" element={<OAuthClients />} />
    <Route path="/admin/api-keys" element={<ApiKeys />} />
    <Route path="/admin/meeting-analytics" element={<MeetingAnalytics />} />
    <Route path="/admin/roadmap" element={<ProductRoadmap />} />
    <Route path="/admin/roadmap/seed" element={<SeedRunner />} />
  </>
);
