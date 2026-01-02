import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ModuleRouteProps {
  module?: string;
  requiredRole?: "admin" | "moderator" | "user";
  requiresFeatureFlag?: string;
  children?: React.ReactNode;
}

export function ModuleRoute({
  module,
  requiredRole,
  requiresFeatureFlag,
  children,
}: ModuleRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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

  // Check feature flag if required (placeholder for future implementation)
  if (requiresFeatureFlag) {
    // This would check app_config or user settings for feature flags
    // For now, we'll allow access if user is authenticated
    console.log(`Feature flag check: ${requiresFeatureFlag}`);
  }

  // Check module-specific permissions if needed
  if (module) {
    // This could be extended to check module-specific settings in app_config
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
