/**
 * OAuth Token Manager
 * Handles OAuth token refresh and validation
 */

import { supabase } from '@/lib/supabase';

export interface OAuthTokens {
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  expires_at: string | null;
  scope: string | null;
}

/**
 * Check if OAuth access token is expired or about to expire
 * @param expiresAt - ISO timestamp of token expiration
 * @param bufferMinutes - Minutes before expiration to consider token expired (default: 5)
 */
export function isTokenExpired(expiresAt: string | null, bufferMinutes = 5): boolean {
  if (!expiresAt) {
    // If no expiration time, assume token doesn't expire
    return false;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
  const now = Date.now();

  return now >= (expirationTime - bufferTime);
}

/**
 * Refresh OAuth access token using refresh token
 * @param providerId - Provider ID
 * @param refreshToken - Refresh token
 */
export async function refreshOAuthToken(
  providerId: string,
  refreshToken: string
): Promise<{ success: boolean; tokens?: OAuthTokens; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('oauth-refresh-token', {
      body: {
        providerId,
        refreshToken,
      },
    });

    if (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh token',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.message || 'Token refresh failed',
      };
    }

    return {
      success: true,
      tokens: data.tokens,
    };
  } catch (error) {
    console.error('Unexpected token refresh error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get valid OAuth access token, refreshing if necessary
 * @param orgIntegrationId - Organization integration ID
 */
export async function getValidAccessToken(
  orgIntegrationId: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    // Fetch current integration
    const { data: integration, error: fetchError } = await supabase
      .from('organization_integrations')
      .select('provider_id, oauth_tokens')
      .eq('id', orgIntegrationId)
      .single();

    if (fetchError || !integration) {
      return {
        success: false,
        error: 'Integration not found',
      };
    }

    const tokens = integration.oauth_tokens as OAuthTokens | null;

    if (!tokens?.access_token) {
      return {
        success: false,
        error: 'No access token available',
      };
    }

    // Check if token is expired
    if (isTokenExpired(tokens.expires_at)) {
      // Token is expired, try to refresh
      if (!tokens.refresh_token) {
        return {
          success: false,
          error: 'Access token expired and no refresh token available',
        };
      }

      const refreshResult = await refreshOAuthToken(
        integration.provider_id,
        tokens.refresh_token
      );

      if (!refreshResult.success || !refreshResult.tokens) {
        return {
          success: false,
          error: refreshResult.error || 'Failed to refresh token',
        };
      }

      // Update integration with new tokens
      const { error: updateError } = await supabase
        .from('organization_integrations')
        .update({
          oauth_tokens: refreshResult.tokens,
          last_tested_at: new Date().toISOString(),
        })
        .eq('id', orgIntegrationId);

      if (updateError) {
        console.error('Failed to update tokens:', updateError);
        // Still return the new token even if update failed
      }

      return {
        success: true,
        accessToken: refreshResult.tokens.access_token,
      };
    }

    // Token is still valid
    return {
      success: true,
      accessToken: tokens.access_token,
    };
  } catch (error) {
    console.error('Get valid access token error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revoke OAuth access (disconnect)
 * Some providers support token revocation endpoints
 * @param providerId - Provider ID
 * @param accessToken - Access token to revoke
 */
export async function revokeOAuthToken(
  providerId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('oauth-revoke-token', {
      body: {
        providerId,
        accessToken,
      },
    });

    if (error) {
      console.error('Token revocation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke token',
      };
    }

    return {
      success: data?.success ?? true,
      error: data?.error,
    };
  } catch (error) {
    console.error('Unexpected token revocation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build authorization header for OAuth API requests
 * @param accessToken - Access token
 * @param tokenType - Token type (default: Bearer)
 */
export function buildAuthorizationHeader(
  accessToken: string,
  tokenType: string = 'Bearer'
): string {
  return `${tokenType} ${accessToken}`;
}

/**
 * Check if integration has valid OAuth configuration
 * @param tokens - OAuth tokens object
 */
export function hasValidOAuthConfig(tokens: OAuthTokens | null): boolean {
  return !!(tokens && tokens.access_token);
}
