import { Loader2 } from "lucide-react";
import { Route } from "react-router-dom";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { SpaceLayout } from "@/components/layout/SpaceLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { coreProtectedRoutes } from "@/modules/platform";
import { meetingsRoutes } from "@/modules/meetings";
import { actionsRoutes } from "@/modules/actions";
import { knowledgeRoutes } from "@/modules/knowledge";
import { businessDevRoutes } from "@/modules/business-dev";
import { eosRoutes } from "@/modules/eos";
import { projectsRoutes } from "@/modules/projects";
import { productivityRoutes } from "@/modules/productivity";
import { adminRoutes } from "@/modules/admin";
import { spaceRoutes, globalSpaceRoutes } from "@/modules/spaces";

/**
 * Protected route tree — legacy layout or Four Spaces based on feature flag.
 */
export function ProtectedAppRoutes() {
  const { features, isLoading } = useFeatureFlags();
  const fourSpaces = features?.enableFourSpaces === true;

  if (isLoading) {
    return (
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      />
    );
  }

  if (fourSpaces) {
    return (
      <Route element={<SpaceLayout />}>
        {globalSpaceRoutes}
        {spaceRoutes}
      </Route>
    );
  }

  return (
    <>
      <Route element={<DashboardLayout />}>
        {coreProtectedRoutes}
        {businessDevRoutes}
        {meetingsRoutes}
        {actionsRoutes}
        {knowledgeRoutes}
        {eosRoutes}
        {projectsRoutes}
        {productivityRoutes}
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>{adminRoutes}</Route>
      </Route>
    </>
  );
}
