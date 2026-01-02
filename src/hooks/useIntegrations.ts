/**
 * Integration Hub Hooks
 * React Query hooks for integration management
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
      const { data, error } = await supabase
        .from('integration_categories')
        .select('*')
        .eq('enabled', true)
        .order('display_order');

      if (error) throw error;
      return sortCategoriesByOrder(data as IntegrationCategory[]);
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
      let query = supabase.from('integration_providers').select('*');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('display_order');

      if (error) throw error;
      return sortProvidersByOrder(data as IntegrationProvider[]);
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
      const { data, error } = await supabase
        .from('integration_providers')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as IntegrationProvider;
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_fields')
        .select('*')
        .eq('provider_id', providerId)
        .order('display_order');

      if (error) throw error;
      return data as IntegrationField[];
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .select(
          `
          *,
          provider:integration_providers(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (OrganizationIntegration & { provider: IntegrationProvider })[];
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('*')
        .eq('provider_id', providerId)
        .maybeSingle();

      if (error) throw error;
      return data as OrganizationIntegration | null;
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
    }) => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .upsert(
          {
            provider_id: providerId,
            organization_id: null, // Single org for now
            config,
            enabled,
            connection_status: 'disconnected',
          },
          {
            onConflict: 'organization_id,provider_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as OrganizationIntegration;
    },
    onSuccess: (data) => {
      // Invalidate queries
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
    onSuccess: async (result, variables) => {
      // Get provider ID
      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('slug', variables.providerSlug)
        .single();

      if (provider) {
        // Update connection status
        await supabase
          .from('organization_integrations')
          .update({
            connection_status: result.valid ? 'connected' : 'error',
            connection_message: result.message,
            last_tested_at: new Date().toISOString(),
          })
          .eq('provider_id', provider.id);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: integrationKeys.orgIntegrations() });
        queryClient.invalidateQueries({
          queryKey: integrationKeys.orgIntegration(provider.id),
        });
      }
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
      const { error } = await supabase
        .from('organization_integrations')
        .update({
          enabled: false,
          connection_status: 'disconnected',
          config: {},
          oauth_tokens: null,
        })
        .eq('provider_id', providerId);

      if (error) throw error;
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_services')
        .select('*')
        .eq('provider_id', providerId)
        .order('display_order');

      if (error) throw error;
      return data as IntegrationService[];
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
    }) => {
      const { data, error } = await supabase
        .from('integration_services')
        .update({ enabled })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data as IntegrationService;
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
    }) => {
      // First, unset all defaults for this provider
      await supabase
        .from('integration_services')
        .update({ is_default: false })
        .eq('provider_id', providerId);

      // Then set the selected service as default
      const { data, error } = await supabase
        .from('integration_services')
        .update({ is_default: true })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data as IntegrationService;
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
    queryFn: async () => {
      let query = supabase
        .from('integration_usage_logs')
        .select(
          `
          *,
          provider:integration_providers(name, slug),
          service:integration_services(name, service_key),
          user:auth.users(email)
        `
        )
        .order('created_at', { ascending: false });

      if (filters.providerId) {
        query = query.eq('provider_id', filters.providerId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (IntegrationUsageLog & {
        provider: { name: string; slug: string };
        service: { name: string; service_key: string };
        user: { email: string };
      })[];
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
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('integration_usage_logs')
        .select('status, estimated_cost, created_at')
        .eq('provider_id', providerId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const logs = data as IntegrationUsageLog[];

      // Calculate statistics
      const totalCalls = logs.length;
      const successfulCalls = logs.filter((log) => log.status === 'success').length;
      const failedCalls = logs.filter((log) => log.status === 'error').length;
      const totalCost = logs.reduce((sum, log) => sum + log.estimated_cost, 0);
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      return {
        totalCalls,
        successfulCalls,
        failedCalls,
        totalCost,
        successRate: Math.round(successRate * 100) / 100,
      };
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!providerId,
  });
}

// ============================================
// COMBINED HOOKS
// ============================================

/**
 * Get provider with its organization integration and fields
 */
export function useProviderWithDetails(slug: string) {
  const provider = useIntegrationProvider(slug);
  const orgIntegration = useOrganizationIntegration(provider.data?.id || '');
  const fields = useIntegrationFields(provider.data?.id || '');
  const services = useIntegrationServices(provider.data?.id || '');

  return {
    provider: provider.data,
    orgIntegration: orgIntegration.data,
    fields: fields.data || [],
    services: services.data || [],
    isLoading:
      provider.isLoading || orgIntegration.isLoading || fields.isLoading || services.isLoading,
    error: provider.error || orgIntegration.error || fields.error || services.error,
  };
}

/**
 * Get providers grouped by category with their org integrations
 */
export function useProvidersGroupedByCategory() {
  const categories = useIntegrationCategories();
  const providers = useIntegrationProviders();
  const orgIntegrations = useOrganizationIntegrations();

  const grouped = categories.data?.map((category) => {
    const categoryProviders = providers.data?.filter(
      (p) => p.category_id === category.id
    ) || [];

    const providersWithIntegrations = categoryProviders.map((provider) => {
      const orgIntegration = orgIntegrations.data?.find(
        (oi) => oi.provider_id === provider.id
      );

      return {
        ...provider,
        orgIntegration,
      };
    });

    // Calculate category stats
    const totalProviders = providersWithIntegrations.length;
    const connectedProviders = providersWithIntegrations.filter(
      (p) => p.orgIntegration?.connection_status === 'connected'
    ).length;

    return {
      category,
      providers: providersWithIntegrations,
      stats: {
        totalProviders,
        connectedProviders,
      },
    };
  });

  return {
    grouped,
    isLoading: categories.isLoading || providers.isLoading || orgIntegrations.isLoading,
    error: categories.error || providers.error || orgIntegrations.error,
  };
}
