import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function AdminRoute() {
  const { user, profile, loading } = useAuth();

  // Show loader while auth initializes OR while user is authenticated but profile
  // hasn't been fetched yet. Without this check the component briefly renders
  // "Access Denied" because loading becomes false before fetchProfile resolves.
  if (loading || (user && !profile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin or moderator role
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this area. This section is restricted to administrators only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
