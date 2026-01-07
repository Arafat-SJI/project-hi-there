/**
 * Azure AD Authentication Helper Functions
 * Handles MSAL-based authentication flow
 */

import { 
  PublicClientApplication, 
  AccountInfo, 
  AuthenticationResult,
  InteractionRequiredAuthError,
  InteractionStatus,
} from '@azure/msal-browser';
import { getMSALInstance, loginRequest, getActiveAccount } from './msalConfig';
import { supabase } from '@/integrations/supabase/client';
import { logLogin } from './activity-logger';

/**
 * Acquire Azure token silently (if user already logged in)
 */
export async function acquireTokenSilently(): Promise<AuthenticationResult | null> {
  try {
    const msalInstance = getMSALInstance();
    const account = getActiveAccount();

    if (!account) {
      return null;
    }

    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    return response;
  } catch (error) {
    // If silent token acquisition fails, return null to trigger interactive login
    if (error instanceof InteractionRequiredAuthError) {
      console.log('Silent token acquisition failed, user interaction required');
      return null;
    }
    console.error('Error acquiring token silently:', error);
    return null;
  }
}

/**
 * Handle Azure login with MSAL
 */
export async function handleAzureLogin(): Promise<AuthenticationResult> {
  const msalInstance = getMSALInstance();

  // Check for existing accounts
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length > 0) {
    // Try silent token acquisition first
    try {
      const silentResult = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return silentResult;
    } catch (error) {
      // If silent fails, fall back to popup
      if (error instanceof InteractionRequiredAuthError) {
        console.log('Silent token acquisition failed, using popup');
      }
    }
  }

  // Use popup for interactive login
  try {
    const response = await msalInstance.loginPopup(loginRequest);
    return response;
  } catch (error: any) {
    // Handle interaction_in_progress error
    if (error.errorCode === 'interaction_in_progress') {
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return msalInstance.loginPopup(loginRequest);
    }
    throw error;
  }
}

/**
 * Send Azure token to backend and get application JWT
 */
export async function handleLoginResponse(azureToken: string): Promise<{
  user: any;
  profile: any;
  magicLink?: string;
}> {
  // Call backend login endpoint
  const { data, error } = await supabase.functions.invoke('azure-auth-login', {
    body: {
      azureToken,
    },
  });

  if (error) {
    throw new Error(error.message || 'Failed to authenticate with backend');
  }

  if (!data.success) {
    throw new Error(data.message || 'Authentication failed');
  }

  // Store authentication data
  const isAzureADUser = data.user?.isAzureAD || false;
  
  // Store in localStorage
  localStorage.setItem('isAzureADUser', String(isAzureADUser));
  localStorage.setItem('userEmail', data.user?.email || '');
  localStorage.setItem('userName', data.user?.userName || '');

  // For Azure AD users, we need to create a Supabase session
  // Since we've validated the user with Microsoft Graph, we can use Supabase OAuth
  // The user account is already created, so we'll trigger a sign-in
  // Note: This is a workaround - ideally we'd create a session directly
  // For now, we'll use the existing Supabase OAuth flow as fallback

  // Log login activity
  logLogin('microsoft');

  return {
    user: data.user,
    profile: data.profile,
    magicLink: data.magicLink,
  };
}

/**
 * Complete Azure login flow
 */
export async function completeAzureLogin(): Promise<{
  user: any;
  profile: any;
  magicLink?: string;
}> {
  // Get Azure token
  const azureResult = await handleAzureLogin();
  
  if (!azureResult || !azureResult.accessToken) {
    throw new Error('Failed to obtain Azure access token');
  }

  // Send to backend
  return handleLoginResponse(azureResult.accessToken);
}

/**
 * Check if user is already logged in with Azure
 */
export async function checkAzureSession(): Promise<boolean> {
  try {
    const account = getActiveAccount();
    if (!account) {
      return false;
    }

    // Try to acquire token silently
    const token = await acquireTokenSilently();
    return token !== null;
  } catch (error) {
    return false;
  }
}

