/**
 * Integration Hub Hooks
 * React Query hooks for integration management
 * NOTE: These are placeholder implementations - tables don't exist yet
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  IntegrationCategory,
  IntegrationProvider,
  IntegrationField,
  OrganizationIntegration,
  IntegrationService,
  IntegrationUsageLog,
  sortCategoriesByOrder,
  sortProvidersByOrder,
} from '@/lib/integration-utils';

// ============================================
// MOCK DATA - Until tables are created
// ============================================

const MOCK_CATEGORIES: IntegrationCategory[] = [
  {
    id: '1',
    name: 'AI Providers',
    slug: 'ai',
    description: 'Connect AI and LLM services',
    icon: 'Brain',
    display_order: 1,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Meeting Platforms',
    slug: 'meetings',
    description: 'Video conferencing integrations',
    icon: 'Video',
    display_order: 2,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Email Services',
    slug: 'email',
    description: 'Transactional email providers',
    icon: 'Mail',
    display_order: 3,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_PROVIDERS: IntegrationProvider[] = [
  {
    id: '1',
    category_id: '1',
    name: 'OpenAI',
    slug: 'openai',
    description: 'GPT models for text generation and embeddings',
    logo_url: null,
    docs_url: 'https://platform.openai.com/docs',
    auth_type: 'api_key',
    oauth_config: null,
    is_available: true,
    is_coming_soon: false,
    is_beta: false,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    category_id: '2',
    name: 'Zoom',
    slug: 'zoom',
    description: 'Video conferencing and recording',
    logo_url: null,
    docs_url: 'https://developers.zoom.us/docs',
    auth_type: 'oauth2',
    oauth_config: null,
    is_available: true,
    is_coming_soon: false,
    is_beta: false,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    category_id: '3',
    name: 'SendGrid',
    slug: 'sendgrid',
    description: 'Transactional email delivery',
    logo_url: null,
    docs_url: 'https://docs.sendgrid.com',
    auth_type: 'api_key',
    oauth_config: null,
    is_available: true,
    is_coming_soon: false,
    is_beta: false,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================
// QUERY KEYS
// ============================================
export const integrationKeys = {
  all: ['integrations'] as const,
  categories: () => [...integrationKeys.all, 'categories'] as const,
  providers: () => [...integrationKeys.all, 'providers'] as const,
  providersByCategory: (categoryId: string) =>
    [...integrationKeys.providers(), categoryId] as const,
  provider: (slug: string) => [...integrationKeys.providers(), slug] as const,
  fields: (providerId: string) => [...integrationKeys.all, 'fields', providerId] as const,
  orgIntegrations: () => [...integrationKeys.all, 'org-integrations'] as const,
  orgIntegration: (providerId: string) =>
    [...integrationKeys.orgIntegrations(), providerId] as const,
  services: (providerId: string) => [...integrationKeys.all, 'services', providerId] as const,
  usageLogs: (filters?: any) => [...integrationKeys.all, 'usage-logs', filters] as const,
};

// ============================================
// CATEGORIES
// ============================================

/**
 * Fetch all integration categories
 */
export function useIntegrationCategories() {
  return useQuery({
    queryKey: integrationKeys.categories(),
    queryFn: async () => {
      // Return mock data - tables don't exist yet
      return sortCategoriesByOrder(MOCK_CATEGORIES);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// PROVIDERS
// ============================================

/**
 * Fetch all integration providers
 */
export function useIntegrationProviders(categoryId?: string) {
  return useQuery({
    queryKey: categoryId
      ? integrationKeys.providersByCategory(categoryId)
      : integrationKeys.providers(),
    queryFn: async () => {
      // Return mock data - tables don't exist yet
      let providers = MOCK_PROVIDERS;
      if (categoryId) {
        providers = providers.filter(p => p.category_id === categoryId);
      }
      return sortProvidersByOrder(providers);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch a single provider by slug
 */
export function useIntegrationProvider(slug: string) {
  return useQuery({
    queryKey: integrationKeys.provider(slug),
    queryFn: async () => {
      // Return mock data - tables don't exist yet
      const provider = MOCK_PROVIDERS.find(p => p.slug === slug);
      if (!provider) throw new Error('Provider not found');
      return provider;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

// ============================================
// FIELDS
// ============================================

/**
 * Fetch integration fields for a provider
 */
export function useIntegrationFields(providerId: string) {
  return useQuery({
    queryKey: integrationKeys.fields(providerId),
    queryFn: async (): Promise<IntegrationField[]> => {
      // Return empty array - tables don't exist yet
      return [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!providerId,
  });
}

// ============================================
// ORGANIZATION INTEGRATIONS
// ============================================

/**
 * Fetch all organization integrations with provider details
 */
export function useOrganizationIntegrations() {
  return useQuery({
    queryKey: integrationKeys.orgIntegrations(),
    queryFn: async (): Promise<(OrganizationIntegration & { provider: IntegrationProvider })[]> => {
      // Return empty array - tables don't exist yet
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch organization integration for a specific provider
 */
export function useOrganizationIntegration(providerId: string) {
  return useQuery({
    queryKey: integrationKeys.orgIntegration(providerId),
    queryFn: async (): Promise<OrganizationIntegration | null> => {
      // Return null - tables don't exist yet
      return null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!providerId,
  });
}

/**
 * Save or update integration configuration
 */
export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      config,
      enabled = true,
    }: {
      providerId: string;
      config: Record<string, any>;
      enabled?: boolean;
    }): Promise<OrganizationIntegration> => {
      // Placeholder - tables don't exist yet
      throw new Error('Integration tables not configured. Please run migrations first.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.orgIntegrations() });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.orgIntegration(data.provider_id),
      });
    },
  });
}

/**
 * Test integration connection
 */
export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerSlug,
      credentials,
    }: {
      providerSlug: string;
      credentials: Record<string, any>;
    }) => {
      // Call the validate-api-key edge function
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: {
          provider: providerSlug,
          credentials,
        },
      });

      if (error) throw error;
      return data as { valid: boolean; message: string; details?: Record<string, any> };
    },
  });
}

/**
 * Disconnect integration
 */
export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      // Placeholder - tables don't exist yet
      throw new Error('Integration tables not configured. Please run migrations first.');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.orgIntegrations() });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.orgIntegration(variables.providerId),
      });
    },
  });
}

// ============================================
// SERVICES
// ============================================

/**
 * Fetch services for a provider
 */
export function useIntegrationServices(providerId: string) {
  return useQuery({
    queryKey: integrationKeys.services(providerId),
    queryFn: async (): Promise<IntegrationService[]> => {
      // Return empty array - tables don't exist yet
      return [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!providerId,
  });
}

/**
 * Toggle service enable/disable
 */
export function useToggleService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceId,
      enabled,
    }: {
      serviceId: string;
      enabled: boolean;
    }): Promise<IntegrationService> => {
      // Placeholder - tables don't exist yet
      throw new Error('Integration tables not configured. Please run migrations first.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.services(data.provider_id),
      });
    },
  });
}

/**
 * Set default service
 */
export function useSetDefaultService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerId,
      serviceId,
    }: {
      providerId: string;
      serviceId: string;
    }): Promise<IntegrationService> => {
      // Placeholder - tables don't exist yet
      throw new Error('Integration tables not configured. Please run migrations first.');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: integrationKeys.services(data.provider_id),
      });
    },
  });
}

// ============================================
// USAGE LOGS
// ============================================

interface UsageLogsFilters {
  providerId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'success' | 'error' | 'partial';
  limit?: number;
}

/**
 * Fetch integration usage logs
 */
export function useIntegrationUsageLogs(filters: UsageLogsFilters = {}) {
  return useQuery({
    queryKey: integrationKeys.usageLogs(filters),
    queryFn: async (): Promise<(IntegrationUsageLog & {
      provider: { name: string; slug: string };
      service: { name: string; service_key: string };
      user: { email: string };
    })[]> => {
      // Return empty array - tables don't exist yet
      return [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get usage statistics for a provider
 */
export function useProviderUsageStats(providerId: string, days: number = 30) {
  return useQuery({
    queryKey: [...integrationKeys.usageLogs({ providerId }), 'stats', days],
    queryFn: async () => {
      // Return empty stats - tables don't exist yet
      return {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalCost: 0,
        successRate: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!providerId,
  });
}

// ============================================
// GROUPED DATA
// ============================================

interface GroupedProviders {
  category: IntegrationCategory;
  providers: (IntegrationProvider & { orgIntegration?: OrganizationIntegration })[];
  stats: {
    totalProviders: number;
    connectedProviders: number;
  };
}

/**
 * Get all providers grouped by category with connection status
 */
export function useProvidersGroupedByCategory() {
  const categoriesQuery = useIntegrationCategories();
  const providersQuery = useIntegrationProviders();
  const orgIntegrationsQuery = useOrganizationIntegrations();

  const isLoading =
    categoriesQuery.isLoading || providersQuery.isLoading || orgIntegrationsQuery.isLoading;
  const error = categoriesQuery.error || providersQuery.error || orgIntegrationsQuery.error;

  const grouped: GroupedProviders[] | undefined = categoriesQuery.data?.map((category) => {
    const categoryProviders =
      providersQuery.data?.filter((p) => p.category_id === category.id) || [];

    // Attach org integration to each provider
    const providersWithIntegration = categoryProviders.map((provider) => ({
      ...provider,
      orgIntegration: orgIntegrationsQuery.data?.find((i) => i.provider_id === provider.id),
    }));

    const connectedProviders = providersWithIntegration.filter(
      (p) => p.orgIntegration?.connection_status === 'connected'
    ).length;

    return {
      category,
      providers: providersWithIntegration,
      stats: {
        totalProviders: categoryProviders.length,
        connectedProviders,
      },
    };
  });

  return {
    grouped,
    isLoading,
    error,
  };
}
