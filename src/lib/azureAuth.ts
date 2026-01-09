/**
 * Azure AD Authentication Helper Functions
 * Handles MSAL-based authentication flow with redirect (not popup)
 */

import { 
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { getMSALInstance, loginRequest, getActiveAccount } from './msalConfig';
import { supabase } from '@/integrations/supabase/client';
import { logLogin } from './activity-logger';

// Key for storing pending redirect state
const MSAL_REDIRECT_KEY = 'msal_redirect_pending';
const MSAL_RESPONSE_KEY = 'msal_auth_response';

/**
 * Handle the redirect response after returning from Microsoft login
 * This should be called early in app initialization
 */
export async function handleMSALRedirect(): Promise<AuthenticationResult | null> {
  try {
    const msalInstance = await getMSALInstance();
    const response = await msalInstance.handleRedirectPromise();
    
    if (response) {
      console.log('MSAL redirect response received');
      // Store the response for later processing
      sessionStorage.setItem(MSAL_RESPONSE_KEY, JSON.stringify({
        accessToken: response.accessToken,
        account: response.account,
        idToken: response.idToken,
      }));
      // Clear the pending flag
      sessionStorage.removeItem(MSAL_REDIRECT_KEY);
      return response;
    }
    
    return null;
  } catch (error) {
    console.error('Error handling MSAL redirect:', error);
    sessionStorage.removeItem(MSAL_REDIRECT_KEY);
    return null;
  }
}

/**
 * Check if there's a stored MSAL response from a redirect
 */
export function getStoredMSALResponse(): { accessToken: string; account: any; idToken?: string } | null {
  const stored = sessionStorage.getItem(MSAL_RESPONSE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Clear the stored MSAL response
 */
export function clearStoredMSALResponse(): void {
  sessionStorage.removeItem(MSAL_RESPONSE_KEY);
}

/**
 * Check if a redirect is pending (user initiated login but hasn't returned yet)
 */
export function isRedirectPending(): boolean {
  return sessionStorage.getItem(MSAL_REDIRECT_KEY) === 'true';
}

/**
 * Acquire Azure token silently (if user already logged in)
 */
export async function acquireTokenSilently(): Promise<AuthenticationResult | null> {
  try {
    const msalInstance = await getMSALInstance();
    const account = await getActiveAccount();

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
 * Initiate Azure login with redirect (not popup)
 * This will navigate away from the current page
 */
export async function initiateAzureLoginRedirect(): Promise<void> {
  const msalInstance = await getMSALInstance();

  // Check for existing accounts
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length > 0) {
    // Try silent token acquisition first
    try {
      const silentResult = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      
      // If silent acquisition succeeds, store the result and return
      if (silentResult) {
        sessionStorage.setItem(MSAL_RESPONSE_KEY, JSON.stringify({
          accessToken: silentResult.accessToken,
          account: silentResult.account,
          idToken: silentResult.idToken,
        }));
        return;
      }
    } catch (error) {
      // If silent fails, fall back to redirect
      if (error instanceof InteractionRequiredAuthError) {
        console.log('Silent token acquisition failed, using redirect');
      }
    }
  }

  // Mark that we're about to redirect
  sessionStorage.setItem(MSAL_REDIRECT_KEY, 'true');
  
  // Use redirect for interactive login
  await msalInstance.loginRedirect(loginRequest);
  // Note: This won't return - the page will redirect to Microsoft
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

  // Log login activity
  logLogin('microsoft');

  return {
    user: data.user,
    profile: data.profile,
    magicLink: data.magicLink,
  };
}

/**
 * Complete Azure login flow after redirect
 * Call this when you have a stored MSAL response
 */
export async function completeAzureLoginFromRedirect(): Promise<{
  user: any;
  profile: any;
  magicLink?: string;
} | null> {
  const storedResponse = getStoredMSALResponse();
  
  if (!storedResponse || !storedResponse.accessToken) {
    return null;
  }
  
  // Clear the stored response
  clearStoredMSALResponse();
  
  // Send to backend
  return handleLoginResponse(storedResponse.accessToken);
}

/**
 * Legacy function - now initiates redirect flow
 * @deprecated Use initiateAzureLoginRedirect instead
 */
export async function completeAzureLogin(): Promise<{
  user: any;
  profile: any;
  magicLink?: string;
}> {
  // Check if we have a stored response from redirect
  const storedResponse = getStoredMSALResponse();
  if (storedResponse && storedResponse.accessToken) {
    clearStoredMSALResponse();
    return handleLoginResponse(storedResponse.accessToken);
  }
  
  // Otherwise initiate redirect - this will throw since page navigates away
  await initiateAzureLoginRedirect();
  
  // This won't be reached due to redirect, but TypeScript needs it
  throw new Error('Redirect initiated - page will navigate to Microsoft login');
}

/**
 * Check if user is already logged in with Azure
 */
export async function checkAzureSession(): Promise<boolean> {
  try {
    const account = await getActiveAccount();
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

