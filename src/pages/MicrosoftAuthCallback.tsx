import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Microsoft Auth Callback Page
 * Handles the redirect from Microsoft OAuth and sends the auth code back to the opener window
 * This page MUST be on the same origin as the main app for postMessage to work
 */
export default function MicrosoftAuthCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Please wait while we complete your sign-in.');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  function handleCallback() {
    // Parse query parameters for authorization code (PKCE flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    console.log('Auth callback received:', { 
      hasCode: !!code, 
      state, 
      error,
      origin: window.location.origin,
      openerExists: !!window.opener
    });

    // Check for error
    if (error) {
      setStatus('error');
      setMessage('Authentication Failed');
      setErrorDetail(errorDescription || error);

      sendAuthResult({
        type: 'MSAL_AUTH_ERROR',
        error: errorDescription || error
      });
      
      setTimeout(() => window.close(), 3000);
      return;
    }

    // Check for authorization code (PKCE flow)
    if (code) {
      setStatus('success');
      setMessage('Authentication successful!');
      setErrorDetail('This window will close automatically.');

      sendAuthResult({
        type: 'MSAL_AUTH_CODE',
        code: code,
        state: state
      });
      
      setTimeout(() => window.close(), 500);
      return;
    }

    // Also check hash fragment for implicit flow (fallback)
    const hashParams = parseHashParams();
    
    if (hashParams.access_token) {
      setStatus('success');
      setMessage('Authentication successful!');
      setErrorDetail('This window will close automatically.');

      sendAuthResult({
        type: 'MSAL_AUTH_SUCCESS',
        accessToken: hashParams.access_token,
        idToken: hashParams.id_token,
        account: {}
      });
      
      setTimeout(() => window.close(), 500);
      return;
    }

    // No token or code - wait a bit then show error
    setTimeout(() => {
      if (status === 'processing') {
        setStatus('error');
        setMessage('No Response');
        setErrorDetail('No authentication response received. This window may close automatically.');

        sendAuthResult({
          type: 'MSAL_AUTH_ERROR',
          error: 'No authentication response received'
        });
      }
    }, 5000);
  }

  /**
   * Send auth result to opener window via postMessage
   * This only works if the opener is on the same origin
   */
  function sendAuthResult(data: Record<string, unknown>) {
    console.log('Sending auth result:', data.type, 'to opener:', !!window.opener);
    
    if (window.opener) {
      try {
        // Send to same origin (this is secure and will work)
        window.opener.postMessage(data, window.location.origin);
        console.log('postMessage sent to:', window.location.origin);
      } catch (e) {
        console.error('Failed to postMessage to opener:', e);
      }
    } else {
      console.warn('No opener window found - auth may have been initiated differently');
    }
  }

  function parseHashParams(): Record<string, string> {
    const hash = window.location.hash.substring(1);
    const params: Record<string, string> = {};
    hash.split('&').forEach((part) => {
      const item = part.split('=');
      if (item[0] && item[1]) {
        params[item[0]] = decodeURIComponent(item[1]);
      }
    });
    return params;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
      <div className="text-center text-white p-8">
        {status === 'processing' && (
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
        )}
        {status === 'error' && (
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
        )}
        
        <h2 className="text-2xl font-semibold mb-2">
          {status === 'processing' ? 'Authenticating...' : message}
        </h2>
        
        {status === 'processing' && (
          <p className="opacity-80">{message}</p>
        )}
        
        {errorDetail && (
          <div className={`mt-4 p-4 rounded-lg ${
            status === 'error' 
              ? 'bg-black/20 text-red-200' 
              : 'bg-black/20 text-green-200'
          }`}>
            {errorDetail}
          </div>
        )}
      </div>
    </div>
  );
}
