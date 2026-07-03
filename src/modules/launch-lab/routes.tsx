import { Navigate, Route, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleRoute } from "@/components/routing/ModuleRoute";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/cache";
import { LaunchLabErrorBoundary } from "./components/LaunchLabErrorBoundary";
import LaunchLabPage from "./pages/LaunchLabPage";
import { loadLaunchLabWorkspace } from "./lib/session-db";

function LaunchLabIndexRedirect() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.launchLab.workspace(userId),
    queryFn: () => loadLaunchLabWorkspace(userId),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

  if (isPending) {
    return (
      <div className="container max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-6xl px-4 py-12 sm:px-6 text-center space-y-3">
        <p className="text-muted-foreground">Could not load your Launch Lab sessions.</p>
        <p className="text-sm text-muted-foreground">Try refreshing the page. If the problem persists, contact support.</p>
      </div>
    );
  }

  return <Navigate to={`/launch-lab/${data.session.id}`} replace />;
}

function LaunchLabProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  return <LaunchLabPage projectId={projectId} />;
}

export const launchLabRoutes = (
  <Route element={<ModuleRoute />}>
    <Route
      path="/launch-lab"
      element={
        <LaunchLabErrorBoundary>
          <LaunchLabIndexRedirect />
        </LaunchLabErrorBoundary>
      }
    />
    <Route
      path="/launch-lab/:projectId"
      element={
        <LaunchLabErrorBoundary>
          <LaunchLabProjectPage />
        </LaunchLabErrorBoundary>
      }
    />
  </Route>
);
