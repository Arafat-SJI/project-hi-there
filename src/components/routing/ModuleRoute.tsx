import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { isModuleBundled, type ModuleId } from "@/shared/config/modules";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface ModuleRouteProps {
  /** Module ID from the registry. Checks build-time bundling. */
  module?: ModuleId;
  /** Required user role */
  requiredRole?: "admin" | "moderator" | "user";
  /** Legacy feature flag check (runtime, from app_config) */
  requiresFeatureFlag?: "enableMeetings" | "enableTasks" | "enableKnowledgeBase" | "enableAIChat" | "enableNotifications" | "enableClients" | "enableAIAgents" | "enableFeedback";
  children?: React.ReactNode;
}

export function ModuleRoute({
  module,
  requiredRole,
  requiresFeatureFlag,
  children,
}: ModuleRouteProps) {
  const { user, profile, loading } = useAuth();
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const toastShownRef = useRef(false);

  // Build-time module check (synchronous, no loading needed)
  if (module && !isModuleBundled(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show toast when feature is disabled (only once)
  useEffect(() => {
    if (!flagsLoading && requiresFeatureFlag && !isFeatureEnabled(requiresFeatureFlag) && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error("This feature is currently disabled", {
        description: "Contact your administrator to enable this module.",
      });
    }
  }, [flagsLoading, requiresFeatureFlag, isFeatureEnabled]);

  if (loading || flagsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check feature flag if required
  if (requiresFeatureFlag && !isFeatureEnabled(requiresFeatureFlag)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const hasRole = checkRole(profile?.role, requiredRole);
    if (!hasRole) {
      return (
        <div className="flex h-screen items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have the required permissions to access this module.
              Required role: {requiredRole}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
}

// Helper function to check role hierarchy
function checkRole(
  userRole: string | undefined,
  requiredRole: "admin" | "moderator" | "user"
): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<string, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  };

  const userRoleLevel = roleHierarchy[userRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}
