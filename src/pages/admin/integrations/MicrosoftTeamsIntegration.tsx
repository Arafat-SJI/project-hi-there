/**
 * Microsoft Teams Integration Page
 * Allows users to connect their Microsoft account for Teams integration and SSO
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle2, AlertCircle, Loader2, Play, User, Clock, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  initiateAzureLoginRedirect, 
  getStoredMSALResponse, 
  completeAzureLoginFromRedirect 
} from "@/lib/azureAuth";
import { validateMSALConfig } from "@/lib/msalConfig";
import { supabase } from "@/integrations/supabase/client";
import { 
  testGraphConnection, 
  GraphUser, 
  TokenMetadata,
  GraphError 
} from "@/lib/microsoftGraphClient";

interface GraphTestResult {
  success: boolean;
  user?: GraphUser;
  tokenMetadata?: TokenMetadata;
  error?: string;
  errorType?: string;
}

export default function MicrosoftTeamsIntegration() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Graph API test state
  const [testingGraph, setTestingGraph] = useState(false);
  const [graphResult, setGraphResult] = useState<GraphTestResult | null>(null);

  useEffect(() => {
    const checkConnectionAndHandleRedirect = async () => {
      try {
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
      const configValidation = validateMSALConfig();
      if (!configValidation.valid) {
        throw new Error(`MSAL configuration error: ${configValidation.errors.join(', ')}. Please configure environment variables.`);
      }

      const authResult = await initiateAzureLoginRedirect();
      
      if (authResult) {
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
      localStorage.removeItem('isAzureADUser');
      sessionStorage.clear();
      await supabase.auth.signOut();
      setIsConnected(false);
      setGraphResult(null);
      toast({
        title: "Disconnected",
        description: "Your Microsoft account has been disconnected.",
      });
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

  const handleTestGraphAPI = async () => {
    setTestingGraph(true);
    setGraphResult(null);
    
    try {
      const result = await testGraphConnection();
      setGraphResult(result);
      
      if (result.success) {
        console.log('[Graph Test] Success:', result);
        toast({
          title: "Graph API Test Successful",
          description: `Connected as ${result.user?.displayName}`,
        });
      } else {
        console.error('[Graph Test] Failed:', result);
        toast({
          title: "Graph API Test Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('[Graph Test] Exception:', err);
      setGraphResult({
        success: false,
        error: err.message || "Test failed",
        errorType: err instanceof GraphError ? err.name : 'UnknownError',
      });
    } finally {
      setTestingGraph(false);
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

        {/* Graph API Test Card */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Test Graph API
              </CardTitle>
              <CardDescription>
                Validate your Microsoft Graph API connection by calling GET /me
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleTestGraphAPI}
                disabled={testingGraph}
                variant="secondary"
              >
                {testingGraph ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Test GET /me
                  </>
                )}
              </Button>

              {graphResult && (
                <div className={`rounded-lg border p-4 ${
                  graphResult.success 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                    : 'border-destructive/20 bg-destructive/5'
                }`}>
                  {graphResult.success ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {graphResult.user?.displayName}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {graphResult.user?.mail || graphResult.user?.userPrincipalName}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-1">
                            ID: {graphResult.user?.id}
                          </p>
                        </div>
                      </div>

                      {/* Token Info */}
                      {graphResult.tokenMetadata && (
                        <div className="border-t border-green-200 dark:border-green-800 pt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 dark:text-green-300">
                              Token expires in {graphResult.tokenMetadata.expiresInMinutes} minutes
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Key className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <span className="text-green-700 dark:text-green-300">Scopes: </span>
                              <span className="font-mono text-xs text-green-600 dark:text-green-400">
                                {graphResult.tokenMetadata.scopes.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-destructive">
                        {graphResult.errorType || 'Error'}
                      </p>
                      <p className="text-sm text-destructive/80">
                        {graphResult.error}
                      </p>
                      {graphResult.errorType === 'UnauthorizedError' && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Try disconnecting and reconnecting your Microsoft account.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

