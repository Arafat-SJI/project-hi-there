/**
 * User Integration Hooks
 * Sprint 10: User Integration Connections
 * Handles individual user OAuth connections to external services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserOAuthToken {
  id: string;
  user_id: string;
  provider_slug: string;
  // Sensitive fields (access_token, refresh_token) excluded from client queries
  token_type: string;
  expires_at: string | null;
  scopes: string[];
  account_email: string | null;
  account_name: string | null;
  account_id: string | null;
  account_avatar_url: string | null;
  is_active: boolean;
  last_used_at: string | null;
  last_refreshed_at: string | null;
  error_message: string | null;
  error_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Non-sensitive columns to select (explicitly excludes access_token, refresh_token)
const SAFE_TOKEN_COLUMNS = `
  id,
  user_id,
  provider_slug,
  token_type,
  expires_at,
  scopes,
  account_email,
  account_name,
  account_id,
  account_avatar_url,
  is_active,
  last_used_at,
  last_refreshed_at,
  error_message,
  error_at,
  metadata,
  created_at,
  updated_at
`;

export interface AvailableProvider {
  provider_slug: string;
  provider_name: string;
  description: string;
  icon: string;
  scopes: string[];
  oauth_enabled: boolean;
}

// Fetch user's connected services (excludes sensitive token fields)
export function useUserOAuthTokens() {
  const { user } = useAuth();

  return useQuery<UserOAuthToken[]>({
    queryKey: ['user-oauth-tokens', user?.id],
    queryFn: async (): Promise<UserOAuthToken[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_oauth_tokens')
        .select(SAFE_TOKEN_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserOAuthToken[];
    },
    enabled: !!user,
  });
}

// Fetch a specific provider connection (excludes sensitive token fields)
export function useUserOAuthToken(providerSlug: string) {
  const { user } = useAuth();

  return useQuery<UserOAuthToken | null>({
    queryKey: ['user-oauth-token', user?.id, providerSlug],
    queryFn: async (): Promise<UserOAuthToken | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_oauth_tokens')
        .select(SAFE_TOKEN_COLUMNS)
        .eq('user_id', user.id)
        .eq('provider_slug', providerSlug)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserOAuthToken | null;
    },
    enabled: !!user && !!providerSlug,
  });
}

// Check if a provider is available for user connection (admin enabled it)
export function useAvailableUserProviders() {
  return useQuery<AvailableProvider[]>({
    queryKey: ['available-user-providers'],
    queryFn: async () => {
      // Get organization integrations that support user connections
      const { data: orgIntegrations, error } = await supabase
        .from('organization_integrations')
        .select(`
          *,
          integration_providers (
            slug,
            name,
            description,
            icon,
            oauth_config,
            auth_type
          )
        `)
        .eq('connection_status', 'connected');

      if (error) throw error;

      // Filter to providers that support OAuth and are configured
      const providers: AvailableProvider[] = (orgIntegrations || [])
        .filter((oi) => {
          const provider = (oi as any).integration_providers;
          return provider && provider.auth_type === 'oauth' && provider.oauth_config;
        })
        .map((oi) => {
          const provider = (oi as any).integration_providers;
          const config = provider.oauth_config || {};
          return {
            provider_slug: provider.slug,
            provider_name: provider.name,
            description: provider.description,
            icon: provider.icon,
            scopes: config.default_scopes || [],
            oauth_enabled: true,
          };
        });

      return providers;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Initiate OAuth connection for a provider
export function useConnectOAuth() {
  return useMutation({
    mutationFn: async ({ provider, redirect_uri }: { provider: string; redirect_uri?: string }) => {
      // Call edge function to get OAuth URL
      const body: { provider: string; redirect_uri?: string } = { provider };
      if (redirect_uri != null && redirect_uri !== '') body.redirect_uri = redirect_uri;
      const { data, error } = await supabase.functions.invoke('user-oauth-connect', {
        body,
      });

      if (error) throw error;

      // Redirect to OAuth URL
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }

      return data;
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });
}

// Disconnect a provider
export function useDisconnectOAuth() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Call edge function to revoke and disconnect
      const { data, error } = await supabase.functions.invoke('user-oauth-disconnect', {
        body: { provider },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-oauth-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['user-oauth-token', user?.id, variables.provider] });
      // Invalidate available providers in case admin disabled this provider mid-session
      queryClient.invalidateQueries({ queryKey: ['available-user-providers'] });
      toast.success('Service disconnected successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });
}

// Refresh an OAuth token
export function useRefreshOAuthToken() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      const { data, error } = await supabase.functions.invoke('user-oauth-refresh', {
        body: { provider },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-oauth-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['user-oauth-token', user?.id, variables.provider] });
      // Invalidate available providers in case admin disabled this provider mid-session
      queryClient.invalidateQueries({ queryKey: ['available-user-providers'] });
      toast.success('Token refreshed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh token: ${error.message}`);
    },
  });
}

// Check if user has a valid (non-expired) token for a provider
// Google Drive files interface
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface DriveListResponse {
  success: boolean;
  files: DriveFile[];
  folders: DriveFile[];
  total: number;
}

// Hook to list Google Drive files
export function useDriveFiles(folderId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['drive-files', user?.id, folderId],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('user-drive-list', {
        body: { folder_id: folderId },
      });

      if (error) throw error;
      return data as DriveListResponse;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useHasValidToken(providerSlug: string) {
  const { data: token, isLoading } = useUserOAuthToken(providerSlug);

  const isValid =
    token?.is_active &&
    (!token.expires_at || new Date(token.expires_at) > new Date()) &&
    !token.error_message;

  return {
    hasValidToken: isValid,
    token,
    isLoading,
    isExpired: token?.expires_at && new Date(token.expires_at) <= new Date(),
    hasError: !!token?.error_message,
    errorMessage: token?.error_message,
  };
}
