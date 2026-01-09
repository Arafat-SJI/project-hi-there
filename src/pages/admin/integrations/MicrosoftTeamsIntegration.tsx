/**
 * Microsoft Teams Integration Page
 * Allows users to connect their Microsoft account for Teams integration and SSO
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  initiateAzureLoginRedirect, 
  getStoredMSALResponse, 
  completeAzureLoginFromRedirect 
} from "@/lib/azureAuth";
import { validateMSALConfig } from "@/lib/msalConfig";
import { supabase } from "@/integrations/supabase/client";

export default function MicrosoftTeamsIntegration() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Check if user is connected via Azure AD and handle redirect response
    const checkConnectionAndHandleRedirect = async () => {
      try {
        // First check if we have a stored MSAL response from redirect
        const storedResponse = getStoredMSALResponse();
        if (storedResponse && storedResponse.accessToken) {
          setLoading(true);
          try {
            const result = await completeAzureLoginFromRedirect();
            if (result?.user) {
              setIsConnected(true);
              localStorage.setItem('isAzureADUser', 'true');
              toast({
                title: "Connected successfully!",
                description: "Your Microsoft account has been connected.",
              });
            }
          } catch (err: any) {
            console.error('Error completing redirect login:', err);
            setError(err.message || 'Failed to complete authentication');
          } finally {
            setLoading(false);
          }
        }
        
        // Check connection status
        const isAzureADUser = localStorage.getItem('isAzureADUser') === 'true';
        setIsConnected(isAzureADUser);
      } catch (error) {
        console.error('Error checking connection status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkConnectionAndHandleRedirect();
  }, [user, toast]);

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Validate MSAL configuration
      const configValidation = validateMSALConfig();
      if (!configValidation.valid) {
        throw new Error(`MSAL configuration error: ${configValidation.errors.join(', ')}. Please configure environment variables.`);
      }

      // Initiate redirect-based Azure login
      // This will navigate away from the page
      await initiateAzureLoginRedirect();
      
      // If we reach here, silent auth succeeded (user already logged in)
      const storedResponse = getStoredMSALResponse();
      if (storedResponse) {
        const result = await completeAzureLoginFromRedirect();
        if (result?.user) {
          setIsConnected(true);
          toast({
            title: "Connected successfully!",
            description: "Your Microsoft account has been connected.",
          });
        }
      }
    } catch (err: any) {
      // Don't show error if it's just the redirect happening
      if (err.message?.includes('Redirect initiated')) {
        return;
      }
      console.error("Microsoft connection error:", err);
      setError(err.message || "Failed to connect to Microsoft");
      toast({
        title: "Connection failed",
        description: err.message || "Failed to connect to Microsoft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      // Clear Azure AD connection
      localStorage.removeItem('isAzureADUser');
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Your Microsoft account has been disconnected.",
      });
      
      // Redirect to login
      window.location.href = '/login';
    } catch (err: any) {
      console.error("Disconnect error:", err);
      toast({
        title: "Disconnect failed",
        description: err.message || "Failed to disconnect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Microsoft Teams Integration</h1>
        <p className="text-muted-foreground mt-2">
          Connect your Microsoft account to enable Teams integration and Single Sign-On (SSO)
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Current Microsoft account connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Connected as {user?.email || 'Microsoft user'}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>Not connected</span>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Connect with Microsoft
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {error && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              What you'll get with Microsoft Teams integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Single Sign-On (SSO)</p>
                  <p className="text-sm text-muted-foreground">
                    Sign in once with your Microsoft account and access all integrated services
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Teams Channel Access</p>
                  <p className="text-sm text-muted-foreground">
                    Access and manage Teams channels and messages directly from Control Tower
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Meeting Management</p>
                  <p className="text-sm text-muted-foreground">
                    Schedule and manage Teams meetings, sync calendar events
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">File Sharing</p>
                  <p className="text-sm text-muted-foreground">
                    Share and access files from OneDrive and SharePoint
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Required environment variables for Microsoft integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded bg-muted">
                <span className="font-mono text-xs">VITE_MICROSOFT_CLIENT_ID</span>
                <span className={import.meta.env.VITE_MICROSOFT_CLIENT_ID ? "text-green-600" : "text-destructive"}>
                  {import.meta.env.VITE_MICROSOFT_CLIENT_ID ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted">
                <span className="font-mono text-xs">VITE_MICROSOFT_DIRECTORY_ID</span>
                <span className={import.meta.env.VITE_MICROSOFT_DIRECTORY_ID ? "text-green-600" : "text-destructive"}>
                  {import.meta.env.VITE_MICROSOFT_DIRECTORY_ID ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted">
                <span className="font-mono text-xs">VITE_MICROSOFT_REDIRECT_URI</span>
                <span className={import.meta.env.VITE_MICROSOFT_REDIRECT_URI ? "text-green-600" : "text-destructive"}>
                  {import.meta.env.VITE_MICROSOFT_REDIRECT_URI ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
            </div>
            {!import.meta.env.VITE_MICROSOFT_CLIENT_ID && (
              <p className="mt-4 text-sm text-muted-foreground">
                Please configure the required environment variables to enable Microsoft integration.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

