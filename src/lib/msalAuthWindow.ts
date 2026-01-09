/**
 * Microsoft Authentication via New Window with PKCE
 * Opens a new window for MSAL authentication using Authorization Code + PKCE flow
 */

import { loginRequest } from './msalConfig';

// Key for storing auth window state
const AUTH_WINDOW_KEY = 'msal_auth_window_pending';
const CODE_VERIFIER_KEY = 'msal_code_verifier';

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
  type: 'MSAL_AUTH_SUCCESS' | 'MSAL_AUTH_ERROR' | 'MSAL_AUTH_CODE';
  accessToken?: string;
  account?: MSALAuthResult['account'];
  idToken?: string;
  code?: string;
  error?: string;
}

/**
 * Generate a cryptographically random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (no padding, URL-safe characters)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<MSALAuthResult> {
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
  const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope: loginRequest.scopes.join(' '),
    code: code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
  }

  const tokenResponse = await response.json();
  
  // Parse the ID token to get account info
  let account: MSALAuthResult['account'] = {};
  if (tokenResponse.id_token) {
    try {
      const payload = tokenResponse.id_token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      account = {
        username: decoded.preferred_username || decoded.email,
        name: decoded.name,
        localAccountId: decoded.oid || decoded.sub,
      };
    } catch (e) {
      console.warn('Failed to parse ID token:', e);
    }
  }

  return {
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    account,
  };
}

/**
 * Open Microsoft login in a new window using PKCE flow
 * Returns a promise that resolves when authentication completes
 */
export async function openMicrosoftAuthWindow(): Promise<MSALAuthResult> {
  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store code verifier for token exchange
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  return new Promise((resolve, reject) => {
    // Calculate window position (center of screen)
    const width = 500;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Build the Microsoft authorization URL
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';
    // Use env var for consistent redirect URI across environments
    const baseUri = import.meta.env.VITE_MICROSOFT_REDIRECT_URI || window.location.origin;
    // Use React route instead of static HTML for better deployment compatibility
    const redirectUri = baseUri + '/auth-callback';
    const scopes = loginRequest.scopes.join(' ');
    const state = crypto.randomUUID();
    
    // Store state for validation
    sessionStorage.setItem('msal_state', state);
    
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_mode: 'query',
    });
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
    
    // Open new window directly to Microsoft login
    const authWindow = window.open(
      authUrl,
      'microsoft-auth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );
    
    if (!authWindow) {
      sessionStorage.removeItem(CODE_VERIFIER_KEY);
      reject(new Error('Failed to open authentication window. Please allow popups for this site.'));
      return;
    }
    
    // Mark that we have an auth window open
    sessionStorage.setItem(AUTH_WINDOW_KEY, 'true');
    
    // Clear any previous auth result from localStorage
    localStorage.removeItem('msal_auth_result');
    
    // Handle message from auth window
    const handleMessage = async (event: MessageEvent<MSALAuthMessage>) => {
      // Accept messages from same origin or from production domain
      const allowedOrigins = [
        window.location.origin,
        import.meta.env.VITE_MICROSOFT_REDIRECT_URI || ''
      ].filter(Boolean);
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }
      
      if (event.data.type === 'MSAL_AUTH_CODE') {
        // Received authorization code, exchange for tokens
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        
        const storedVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
        sessionStorage.removeItem(CODE_VERIFIER_KEY);
        
        if (!storedVerifier) {
          reject(new Error('Code verifier not found'));
          return;
        }
        
        try {
          const result = await exchangeCodeForTokens(
            event.data.code!,
            storedVerifier,
            redirectUri
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else if (event.data.type === 'MSAL_AUTH_SUCCESS') {
        // Direct token response (shouldn't happen with PKCE, but handle it)
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        sessionStorage.removeItem(CODE_VERIFIER_KEY);
        resolve({
          accessToken: event.data.accessToken!,
          account: event.data.account || {},
          idToken: event.data.idToken,
        });
      } else if (event.data.type === 'MSAL_AUTH_ERROR') {
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        sessionStorage.removeItem(CODE_VERIFIER_KEY);
        reject(new Error(event.data.error || 'Authentication failed'));
      }
    };
    
    // Poll localStorage for cross-origin auth result
    const checkLocalStorage = async () => {
      try {
        const resultStr = localStorage.getItem('msal_auth_result');
        if (resultStr) {
          const result = JSON.parse(resultStr);
          // Only process if recent (within last 30 seconds)
          if (result.timestamp && Date.now() - result.timestamp < 30000) {
            localStorage.removeItem('msal_auth_result');
            
            if (result.type === 'MSAL_AUTH_CODE') {
              cleanup();
              sessionStorage.removeItem(AUTH_WINDOW_KEY);
              
              const storedVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
              sessionStorage.removeItem(CODE_VERIFIER_KEY);
              
              if (!storedVerifier) {
                reject(new Error('Code verifier not found'));
                return true;
              }
              
              try {
                const tokenResult = await exchangeCodeForTokens(
                  result.code,
                  storedVerifier,
                  redirectUri
                );
                resolve(tokenResult);
              } catch (error) {
                reject(error);
              }
              return true;
            } else if (result.type === 'MSAL_AUTH_SUCCESS') {
              cleanup();
              sessionStorage.removeItem(AUTH_WINDOW_KEY);
              sessionStorage.removeItem(CODE_VERIFIER_KEY);
              resolve({
                accessToken: result.accessToken,
                account: result.account || {},
                idToken: result.idToken,
              });
              return true;
            } else if (result.type === 'MSAL_AUTH_ERROR') {
              cleanup();
              sessionStorage.removeItem(AUTH_WINDOW_KEY);
              sessionStorage.removeItem(CODE_VERIFIER_KEY);
              reject(new Error(result.error || 'Authentication failed'));
              return true;
            }
          }
        }
      } catch (e) {
        console.warn('Error checking localStorage for auth result:', e);
      }
      return false;
    };
    
    // Check if window was closed without completing auth
    const checkWindowClosed = setInterval(async () => {
      // First check localStorage for cross-origin result
      const foundResult = await checkLocalStorage();
      if (foundResult) {
        return;
      }
      
      if (authWindow.closed) {
        cleanup();
        sessionStorage.removeItem(AUTH_WINDOW_KEY);
        sessionStorage.removeItem(CODE_VERIFIER_KEY);
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
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
}
