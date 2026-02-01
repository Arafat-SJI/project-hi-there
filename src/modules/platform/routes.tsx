/**
 * Platform Module Routes
 *
 * Core user-facing routes: dashboard, profile, settings, feedback,
 * notifications, and auth callbacks.
 * These are always available regardless of module configuration.
 */
import { Route } from "react-router-dom";
import { ModuleRoute } from "@/components/routing/ModuleRoute";

// Public pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AuthCallback from "@/pages/AuthCallback";
import MicrosoftAuthCallback from "@/pages/MicrosoftAuthCallback";
import NotFound from "@/pages/NotFound";

// Core protected pages (always available)
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Feedback from "@/pages/Feedback";
import AIChat from "@/pages/AIChat";
import AIAgents from "@/pages/AIAgents";
import PersonalKnowledge from "@/pages/PersonalKnowledge";

/**
 * Public routes - no auth required
 */
export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth-callback" element={<MicrosoftAuthCallback />} />
  </>
);

/**
 * Core protected routes - always available to authenticated users
 */
export const coreProtectedRoutes = (
  <>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/feedback" element={<Feedback />} />

    {/* Feature-flag gated but part of platform */}
    <Route element={<ModuleRoute requiresFeatureFlag="enableNotifications" />}>
      <Route path="/notifications" element={<Notifications />} />
    </Route>

    {/* AI features */}
    <Route element={<ModuleRoute requiresFeatureFlag="enableAIAgents" />}>
      <Route path="/ai-agents" element={<AIAgents />} />
    </Route>
    <Route element={<ModuleRoute requiresFeatureFlag="enableAIChat" />}>
      <Route path="/ai-chat" element={<AIChat />} />
    </Route>

    {/* Personal knowledge */}
    <Route path="/personal-knowledge" element={<PersonalKnowledge />} />
  </>
);

/**
 * 404 catch-all
 */
export const catchAllRoute = <Route path="*" element={<NotFound />} />;
