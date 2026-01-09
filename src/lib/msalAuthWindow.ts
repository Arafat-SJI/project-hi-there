/**
 * Microsoft Authentication via New Window
 * Opens a new window for MSAL authentication to avoid iframe restrictions
 */

import { loginRequest } from './msalConfig';

// Key for storing auth window state
const AUTH_WINDOW_KEY = 'msal_auth_window_pending';

interface MSALAuthResult {
  accessToken: string;
  account: {
    username?: string;
    name?: string;
    localAccountId?: string;
  };
  idToken?: string;
}

interface MSALAuthMessage {
  type: 'MSAL_AUTH_SUCCESS' | 'MSAL_AUTH_ERROR';
  accessToken?: string;
  account?: MSALAuthResult['account'];
  idToken?: string;
  error?: string;
}

/**
 * Open Microsoft login in a new window
 * Returns a promise that resolves when authentication completes
 */
export function openMicrosoftAuthWindow(): Promise<MSALAuthResult> {
  return new Promise((resolve, reject) => {
    // Calculate window position (center of screen)
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Build the Microsoft authorization URL
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
    const redirectUri = window.location.origin + '/auth-callback.html';
    const scopes = loginRequest.scopes.join(' ');
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    
    // Store state for validation
    sessionStorage.setItem('msal_state', state);
    sessionStorage.setItem('msal_nonce', nonce);
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'id_token token',
      redirect_uri: redirectUri,
      scope: scopes,
      state: state,
      nonce: nonce,
      response_mode: 'fragment',
    });
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    
    // Open new window directly to Microsoft login
    const authWindow = window.open(
      authUrl,
      'microsoft-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );
    
    if (!authWindow) {
      reject(new Error('Failed to open authentication window. Please allow popups for this site.'));
      return;
    }
    
    // Mark that we have an auth window open
    sessionStorage.setItem(AUTH_WINDOW_KEY, 'true');
    
    // Handle message from auth window
    const handleMessage = (event: MessageEvent<MSALAuthMessage>) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }
      
      if (event.data.type === 'MSAL_AUTH_SUCCESS') {
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        resolve({
          accessToken: event.data.accessToken!,
          account: event.data.account || {},
          idToken: event.data.idToken,
        });
      } else if (event.data.type === 'MSAL_AUTH_ERROR') {
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        reject(new Error(event.data.error || 'Authentication failed'));
      }
    };
    
    // Check if window was closed without completing auth
    const checkWindowClosed = setInterval(() => {
      if (authWindow.closed) {
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        reject(new Error('Authentication window was closed'));
      }
    }, 500);
    
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(checkWindowClosed);
    };
    
    window.addEventListener('message', handleMessage);
  });
}

/**
 * Check if an auth window is currently pending
 */
export function isAuthWindowPending(): boolean {
  return sessionStorage.getItem(AUTH_WINDOW_KEY) === 'true';
}

/**
 * Clear pending auth window state
 */
export function clearAuthWindowState(): void {
  sessionStorage.removeItem(AUTH_WINDOW_KEY);
  sessionStorage.removeItem('msal_state');
  sessionStorage.removeItem('msal_nonce');
}
