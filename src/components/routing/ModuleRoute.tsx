import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface ModuleRouteProps {
  module?: string;
  requiredRole?: "admin" | "moderator" | "user";
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

  // Check module-specific permissions if needed
  if (module) {
    console.log(`Module access check: ${module}`);
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
