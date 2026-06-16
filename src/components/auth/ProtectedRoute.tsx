import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading, profileLoading } = useAuth();

  // Wait for both auth session AND profile (including role) to finish loading.
  // Rendering child routes while profileLoading is true would let role-gated
  // components briefly render with an incomplete profile, causing access flickers.
  if (loading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
