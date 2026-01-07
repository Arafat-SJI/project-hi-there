/**
 * Azure AD SSO Logout Endpoint
 * Handles logout for both Azure AD and regular users
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders, handleCorsPreflight } from '../../cors.ts';

const AZURE_AD_TENANT_ID = Deno.env.get('AZURE_AD_TENANT_ID') || 'common';

interface LogoutRequest {
  isAzureAD?: boolean;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(origin);
  }

  try {
    // Parse request body
    const body: LogoutRequest = await req.json();
    const isAzureAD = body.isAzureAD || false;

    // Generate Azure logout URL if Azure AD user
    let logoutUrl: string | null = null;
    if (isAzureAD) {
      logoutUrl = `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(
        Deno.env.get('VITE_MICROSOFT_LOGOUT_URI') || 'http://localhost:5173/login'
      )}`;
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logout successful',
        logoutUrl,
        isAzureAD,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: `Unexpected error: ${message}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

