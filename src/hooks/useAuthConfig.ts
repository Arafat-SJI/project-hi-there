/**
 * Auth Configuration Hook
 * Fetches dynamic authentication settings for login page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SSOProvider {
  id: string;
  provider_type: 'google_workspace' | 'azure_ad' | 'saml' | 'oidc';
  display_name: string;
  is_primary: boolean;
  is_enabled: boolean;
  client_id?: string;
  tenant_id?: string;
  domain_restrictions?: string[];
  auto_provision_role?: string;
  auto_create_users?: boolean;
  metadata?: Record<string, any>;
}

export interface AuthConfig {
  allowEmailPassword: boolean;
  allowPublicSignup: boolean;
  requireSSO: boolean;
  defaultSSOProvider: string | null;
  sessionTimeoutHours: number;
  ssoProviders: SSOProvider[];
}

export interface SSODomain {
  id: string;
  domain: string;
  sso_config_id: string;
  is_active: boolean;
}

// Fetch auth configuration for login page
export function useAuthConfig() {
  return useQuery<AuthConfig>({
    queryKey: ['auth-config'],
    queryFn: async () => {
      // Fetch app_config entries
      const { data: configs, error: configError } = await supabase
        .from('app_config')
        .select('key, value')
        .like('key', 'auth.%');

      if (configError) {
        console.error('Error fetching auth config:', configError);
      }

      const configMap = new Map(
        configs?.map((c) => [c.key.replace('auth.', ''), c.value]) || []
      );

      // Fetch enabled SSO providers (using RPC for public access)
      const { data: providers, error: ssoError } = await supabase
        .rpc('get_enabled_sso_providers');

      if (ssoError) {
        console.error('Error fetching SSO providers:', ssoError);
      }

      return {
        allowEmailPassword: configMap.get('allow_email_password') !== 'false',
        allowPublicSignup: configMap.get('allow_public_signup') !== 'false',
        requireSSO: configMap.get('require_sso') === 'true',
        defaultSSOProvider: configMap.get('default_sso_provider') || null,
        sessionTimeoutHours: parseInt(configMap.get('session_timeout_hours') || '24', 10),
        ssoProviders: (providers || []) as SSOProvider[],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch all SSO configurations (admin only)
export function useSSOConfigurations() {
  return useQuery<SSOProvider[]>({
    queryKey: ['sso-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_configurations')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch single SSO configuration
export function useSSOConfiguration(providerType: string) {
  return useQuery<SSOProvider | null>({
    queryKey: ['sso-configuration', providerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_configurations')
        .select('*')
        .eq('provider_type', providerType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!providerType,
  });
}

// Create or update SSO configuration
export function useUpsertSSOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<SSOProvider> & { provider_type: string }) => {
      const { data, error } = await supabase
        .from('sso_configurations')
        .upsert(config, { onConflict: 'provider_type' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sso-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['sso-configuration', data.provider_type] });
      queryClient.invalidateQueries({ queryKey: ['auth-config'] });
      toast.success('SSO configuration saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save SSO configuration: ${error.message}`);
    },
  });
}

// Delete SSO configuration
export function useDeleteSSOConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerType: string) => {
      const { error } = await supabase
        .from('sso_configurations')
        .delete()
        .eq('provider_type', providerType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sso-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['auth-config'] });
      toast.success('SSO configuration deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete SSO configuration: ${error.message}`);
    },
  });
}

// Fetch domain allowlist for a configuration
export function useSSODomains(configId: string) {
  return useQuery<SSODomain[]>({
    queryKey: ['sso-domains', configId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_domain_allowlist')
        .select('*')
        .eq('sso_config_id', configId)
        .order('domain', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!configId,
  });
}

// Add domain to allowlist
export function useAddSSODomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configId, domain }: { configId: string; domain: string }) => {
      const { data, error } = await supabase
        .from('sso_domain_allowlist')
        .insert({ sso_config_id: configId, domain: domain.toLowerCase() })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sso-domains', variables.configId] });
      toast.success('Domain added to allowlist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });
}

// Remove domain from allowlist
export function useRemoveSSODomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ domainId, configId }: { domainId: string; configId: string }) => {
      const { error } = await supabase
        .from('sso_domain_allowlist')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
      return configId;
    },
    onSuccess: (configId) => {
      queryClient.invalidateQueries({ queryKey: ['sso-domains', configId] });
      toast.success('Domain removed from allowlist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove domain: ${error.message}`);
    },
  });
}

// Update auth configuration
export function useUpdateAuthConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<{
      allowEmailPassword: boolean;
      allowPublicSignup: boolean;
      requireSSO: boolean;
      defaultSSOProvider: string | null;
      sessionTimeoutHours: number;
    }>) => {
      const updates = [];

      if (config.allowEmailPassword !== undefined) {
        updates.push({
          key: 'auth.allow_email_password',
          value: String(config.allowEmailPassword),
          category: 'auth',
        });
      }
      if (config.allowPublicSignup !== undefined) {
        updates.push({
          key: 'auth.allow_public_signup',
          value: String(config.allowPublicSignup),
          category: 'auth',
        });
      }
      if (config.requireSSO !== undefined) {
        updates.push({
          key: 'auth.require_sso',
          value: String(config.requireSSO),
          category: 'auth',
        });
      }
      if (config.defaultSSOProvider !== undefined) {
        updates.push({
          key: 'auth.default_sso_provider',
          value: config.defaultSSOProvider || 'null',
          category: 'auth',
        });
      }
      if (config.sessionTimeoutHours !== undefined) {
        updates.push({
          key: 'auth.session_timeout_hours',
          value: String(config.sessionTimeoutHours),
          category: 'auth',
        });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('app_config')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-config'] });
      toast.success('Authentication settings updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}
