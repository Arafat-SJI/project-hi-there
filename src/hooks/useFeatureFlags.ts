import { useAppConfig } from "./useAppConfig";

/**
 * Hook to check feature flags from app_config
 * Features are cached globally with React Query (staleTime: 10 minutes)
 */
export function useFeatureFlags() {
  const { data: config, isLoading, error } = useAppConfig();

  /**
   * Check if a specific feature is enabled
   * @param featureName - The feature key (e.g., "enableAIChat", "enableMeetings")
   * @returns boolean indicating if the feature is enabled
   */
  const isFeatureEnabled = (featureName: keyof typeof config.features): boolean => {
    if (!config?.features) return false;
    return config.features[featureName] ?? false;
  };

  /**
   * Get all enabled features as an array of keys
   */
  const enabledFeatures = Object.entries(config?.features || {})
    .filter(([_, value]) => value === true)
    .map(([key]) => key);

  /**
   * Get all disabled features as an array of keys
   */
  const disabledFeatures = Object.entries(config?.features || {})
    .filter(([_, value]) => value === false)
    .map(([key]) => key);

  return {
    features: config?.features,
    isFeatureEnabled,
    enabledFeatures,
    disabledFeatures,
    isLoading,
    error,
  };
}
