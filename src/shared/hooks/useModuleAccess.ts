import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isModuleBundled, type ModuleId, MODULE_REGISTRY } from "@/shared/config/modules";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface ModuleAccessResult {
  /** Check if a module is accessible to the current user */
  hasModule: (moduleId: ModuleId) => boolean;
  /** All module IDs accessible to the current user */
  enabledModules: ModuleId[];
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook to check module access for the current user.
 *
 * Resolution order:
 * 1. Build-time: Is the module bundled? (env vars)
 * 2. Runtime: Is the module active in app_modules? (admin toggle)
 * 3. Legacy: Are the corresponding feature flags enabled? (app_config)
 * 4. Per-user: Does the user have access? (user_module_permissions, future)
 *
 * Core modules (platform, admin) are always accessible.
 */
export function useModuleAccess(): ModuleAccessResult {
  const { user } = useAuth();
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();

  // Fetch active modules from app_modules table
  const { data: dbModules, isLoading: modulesLoading } = useQuery({
    queryKey: ["app_modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_modules")
        .select("slug, is_active")
        .order("sort_order");

      // If table doesn't exist yet (pre-migration), return null to fall back to feature flags
      if (error) {
        console.debug("app_modules table not available, using feature flags:", error.message);
        return null;
      }

      return data as Array<{ slug: string; is_active: boolean }>;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry if table doesn't exist
  });

  const hasModule = (moduleId: ModuleId): boolean => {
    const mod = MODULE_REGISTRY[moduleId];
    if (!mod) return false;

    // Core modules always enabled
    if (mod.isCore) return true;

    // Layer 1: Build-time check
    if (!isModuleBundled(moduleId)) return false;

    // Layer 2: Runtime DB check (if app_modules table exists)
    if (dbModules !== null && dbModules !== undefined) {
      const dbEntry = dbModules.find((m) => m.slug === moduleId);
      if (dbEntry) return dbEntry.is_active;
      // If module not in DB yet, fall through to feature flags
    }

    // Layer 3: Legacy feature flag check
    // Map module to its feature flags and check if at least one primary flag is enabled
    const primaryFlagMap: Partial<Record<ModuleId, string>> = {
      actions: "enableTasks",
      meetings: "enableMeetings",
      knowledge: "enableKnowledgeBase",
      "business-dev": "enableClients",
    };

    const primaryFlag = primaryFlagMap[moduleId];
    if (primaryFlag) {
      return isFeatureEnabled(primaryFlag as any);
    }

    // Modules without feature flags default to enabled
    return true;
  };

  const enabledModules = Object.keys(MODULE_REGISTRY).filter((id) =>
    hasModule(id as ModuleId)
  ) as ModuleId[];

  return {
    hasModule,
    enabledModules,
    isLoading: flagsLoading || modulesLoading,
  };
}
