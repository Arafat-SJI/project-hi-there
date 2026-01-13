/**
 * Microsoft Teams Integration Page
 * Allows users to connect their Microsoft account for Teams integration and SSO
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, AlertCircle, Loader2, Play, User, Clock, Key, Users, RefreshCw, ChevronDown, ChevronRight, Hash, Lock, Share2, Calendar, Video, Plus, MessageSquare, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  initiateAzureLoginRedirect, 
  getStoredMSALResponse, 
  completeAzureLoginFromRedirect 
} from "@/lib/azureAuth";
import { validateMSALConfig, getMSALInstance } from "@/lib/msalConfig";
import { supabase } from "@/integrations/supabase/client";
import { 
  testGraphConnection, 
  GraphUser, 
  TokenMetadata,
  GraphError,
  getAccessToken 
} from "@/lib/microsoftGraphClient";
import { useMicrosoftTeams } from "@/hooks/useMicrosoftTeams";
import { useMicrosoftTeamsChannels } from "@/hooks/useMicrosoftTeamsChannels";
import { useSyncTeamsMeetings } from "@/hooks/useSyncTeamsMeetings";
import { CreateTeamsMeetingDialog } from "@/components/meetings/CreateTeamsMeetingDialog";
import { SendTeamsMessageDialog } from "@/components/integrations/SendTeamsMessageDialog";
import { ChannelMessagesSection } from "@/components/integrations/ChannelMessagesSection";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  
  // Graph API test state
  const [testingGraph, setTestingGraph] = useState(false);
  const [graphResult, setGraphResult] = useState<GraphTestResult | null>(null);

  // Microsoft Teams hook
  const { 
    teams, 
    isLoading: teamsLoading, 
    syncTeams, 
    isSyncing,
    syncError,
    lastSynced 
  } = useMicrosoftTeams();

  // Microsoft Teams Channels hook
  const {
    channels,
    syncTeamChannels,
    isSyncingTeam,
    syncTeamError,
    getChannelsForTeam,
  } = useMicrosoftTeamsChannels();

  // Teams Meetings Sync hook
  const syncTeamsMeetings = useSyncTeamsMeetings();

  const [syncingTeamId, setSyncingTeamId] = useState<string | null>(null);
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleSyncChannels = async (teamId: string) => {
    setSyncingTeamId(teamId);
    try {
      await syncTeamChannels(teamId);
      setExpandedTeams(prev => new Set(prev).add(teamId));
      toast({
        title: "Channels synced",
        description: "Team channels have been synced successfully.",
      });
    } catch (err) {
      console.error('Failed to sync channels:', err);
      toast({
        title: "Sync failed",
        description: err instanceof Error ? err.message : "Failed to sync channels",
        variant: "destructive",
      });
    } finally {
      setSyncingTeamId(null);
    }
  };

  // Check token validity when connected
  useEffect(() => {
    const validateToken = async () => {
      if (isConnected) {
        try {
          await getAccessToken();
          setHasValidToken(true);
        } catch {
          setHasValidToken(false);
        }
      }
    };
    validateToken();
  }, [isConnected]);

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
              setHasValidToken(true);
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

  const handleRefreshConnection = async () => {
    setRefreshingToken(true);
    try {
      const authResult = await initiateAzureLoginRedirect();
      if (authResult) {
        const result = await completeAzureLoginFromRedirect();
        if (result?.user) {
          setHasValidToken(true);
          toast({
            title: "Connection Refreshed",
            description: "Your Microsoft session has been renewed.",
          });
        }
      }
    } catch (err: any) {
      console.error("Refresh connection error:", err);
      toast({
        title: "Refresh Failed",
        description: "Please try disconnecting and reconnecting your account.",
        variant: "destructive",
      });
    } finally {
      setRefreshingToken(false);
    }
  };


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
      // 1. Clear MSAL cache and accounts (only MSAL-related, not main app session)
      try {
        const msalInstance = await getMSALInstance();
        const accounts = msalInstance.getAllAccounts();
        
        // Clear MSAL cache (removeAccount doesn't exist, use clearCache or logout)
        if (accounts.length > 0) {
          // Clear the MSAL cache to remove stored tokens
          await msalInstance.clearCache();
        }
      } catch (error) {
        console.error('Error clearing MSAL accounts:', error);
        // Continue even if MSAL cleanup fails
      }

      // 2. Clear only MSAL-related sessionStorage items (not all sessionStorage)
      sessionStorage.removeItem('msal_auth_response');
      sessionStorage.removeItem('msal_redirect_pending');
      sessionStorage.removeItem('msal_auth_window_pending');
      sessionStorage.removeItem('msal_code_verifier');
      sessionStorage.removeItem('msal_state');
      sessionStorage.removeItem('msal_auth_result');
      
      // Clear MSAL cache from sessionStorage (MSAL stores cache with specific keys)
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('msal.') || key.startsWith('msal-')) {
          sessionStorage.removeItem(key);
        }
      });

      // 3. Delete Microsoft Teams data from database
      if (user?.id) {
        // Delete Teams channels first (foreign key constraint)
        await supabase
          .from('user_microsoft_teams_channels')
          .delete()
          .eq('user_id', user.id);
        
        // Delete Teams
        await supabase
          .from('user_microsoft_teams')
          .delete()
          .eq('user_id', user.id);
      }

      // 4. Disconnect OAuth token if it exists in user_oauth_tokens
      try {
        await supabase.functions.invoke('user-oauth-disconnect', {
          body: { provider: 'microsoft' },
        });
      } catch (error) {
        // Log but don't fail - token might not exist
        console.log('No OAuth token to disconnect or error:', error);
      }

      // 5. Invalidate React Query cache to refresh UI
      queryClient.invalidateQueries({ queryKey: ['microsoft-teams'] });
      queryClient.invalidateQueries({ queryKey: ['microsoft-teams-channels'] });
      queryClient.invalidateQueries({ queryKey: ['user-oauth-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['user-oauth-token', user?.id, 'microsoft'] });

      // 6. Update UI state
      setIsConnected(false);
      setGraphResult(null);
      
      toast({
        title: "Disconnected",
        description: "Your Microsoft Teams account has been disconnected. You remain logged in.",
      });
      
      // 7. DO NOT redirect to login - user should stay on the page
      
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
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Microsoft Teams Integration</h1>
            <p className="text-muted-foreground mt-1.5">
              Connect your Microsoft account to enable Teams integration and Single Sign-On (SSO)
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Connection Status Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Connection Status
            </CardTitle>
            <CardDescription>
              Current Microsoft account connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Connected</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {user?.email || 'Microsoft user'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Not connected</p>
                      <p className="text-sm text-muted-foreground">
                        Connect to enable Teams features
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={loading}
                    size="lg"
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
              </div>
            )}
            
            {error && (
              <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-destructive">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph API Test Card */}
        {isConnected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30">
                  <Play className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
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
                size="lg"
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
                <div className={`rounded-xl border-2 p-5 ${
                  graphResult.success 
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/30' 
                    : 'border-destructive/30 bg-destructive/5'
                }`}>
                  {graphResult.success ? (
                    <div className="space-y-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                          <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 dark:text-green-100 text-base">
                            {graphResult.user?.displayName}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                            {graphResult.user?.mail || graphResult.user?.userPrincipalName}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-2 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">
                            ID: {graphResult.user?.id}
                          </p>
                        </div>
                      </div>

                      {/* Token Info */}
                      {graphResult.tokenMetadata && (
                        <div className="border-t border-green-200 dark:border-green-800 pt-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-800 dark:text-green-200 font-medium">
                              Token expires in {graphResult.tokenMetadata.expiresInMinutes} minutes
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Key className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-green-800 dark:text-green-200 font-medium">Scopes: </span>
                              <span className="font-mono text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded block mt-1">
                                {graphResult.tokenMetadata.scopes.join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="font-semibold text-destructive">
                          {graphResult.errorType || 'Error'}
                        </p>
                      </div>
                      <p className="text-sm text-destructive/90 pl-7">
                        {graphResult.error}
                      </p>
                      {graphResult.errorType === 'UnauthorizedError' && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-muted">
                          <p className="text-xs text-muted-foreground">
                            💡 Try disconnecting and reconnecting your Microsoft account to refresh permissions.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Teams Meetings Card */}
        {isConnected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Sync Teams Meetings
              </CardTitle>
              <CardDescription>
                Import your Microsoft Teams online meetings to the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Token expired warning */}
              {hasValidToken === false && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Session Expired</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Refresh your connection to sync meetings
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRefreshConnection}
                    disabled={refreshingToken}
                    className="border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
                  >
                    {refreshingToken ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Connection
                      </>
                    )}
                  </Button>
                </div>
              )}

              <Button
                onClick={() => syncTeamsMeetings.mutate({ source: 'both' })}
                disabled={syncTeamsMeetings.isPending || hasValidToken === false}
                variant="secondary"
                size="lg"
              >
                {syncTeamsMeetings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync All Meetings
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Sync and refresh your Teams meetings from Microsoft Graph.
              </p>

              {syncTeamsMeetings.data && (
                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/30 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/50">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-green-900 dark:text-green-100 font-semibold">
                        {syncTeamsMeetings.data.updated > 0 
                          ? `${syncTeamsMeetings.data.updated} meeting${syncTeamsMeetings.data.updated !== 1 ? 's' : ''} refreshed`
                          : 'Meetings up to date'}
                      </span>
                    </div>
                    {syncTeamsMeetings.data.errors > 0 && (
                      <p className="text-amber-700 dark:text-amber-400 ml-8 text-sm font-medium">
                        {syncTeamsMeetings.data.errors} error{syncTeamsMeetings.data.errors !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button variant="outline" size="lg" asChild>
                <Link to="/admin/integrations/microsoft-teams/meetings">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Synced Meetings
                </Link>
              </Button>

              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Requires the <code className="bg-muted px-1 rounded">OnlineMeetings.ReadWrite</code> permission.
                If you see a permission error, disconnect and reconnect your Microsoft account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create Teams Meeting Card */}
        {isConnected && (
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Create Teams Meeting
              </CardTitle>
              <CardDescription>
                Schedule a new Microsoft Teams meeting directly from the app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateTeamsMeetingDialog 
                trigger={
                  <Button size="lg" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    New Teams Meeting
                  </Button>
                }
              />
              
              <div className="rounded-lg bg-muted/50 p-3 border border-muted">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <Video className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Create meetings with title, time, and optional attendees. The meeting will be saved locally and attendees will receive email invites.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Channel Messages Card */}
        {isConnected && (
          <ChannelMessagesSection 
            teams={teams}
            getChannelsForTeam={getChannelsForTeam}
          />
        )}

        {/* Your Teams Card */}
        {isConnected && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                      <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Your Teams
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Teams you're a member of in Microsoft Teams
                    {lastSynced && (
                      <span className="ml-2 text-xs">
                        · Last synced: {new Date(lastSynced).toLocaleString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => syncTeams().catch(console.error)}
                  disabled={isSyncing}
                  variant="secondary"
                  size="sm"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Teams
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {syncError && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive">
                    {syncError instanceof Error ? syncError.message : 'Sync failed'}
                  </p>
                  {syncError instanceof Error && syncError.message?.includes('permission') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You may need to disconnect and reconnect to grant Teams access.
                    </p>
                  )}
                </div>
              )}

              {teamsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : teams.length > 0 ? (
                <div className="space-y-2">
                  {teams.map((team) => {
                    const teamChannels = getChannelsForTeam(team.team_id);
                    const isExpanded = expandedTeams.has(team.team_id);
                    const isSyncingThisTeam = syncingTeamId === team.team_id;
                    
                    return (
                      <Collapsible key={team.id} open={isExpanded}>
                        <div className="rounded-lg border bg-card hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-between p-4">
                            <CollapsibleTrigger 
                              onClick={() => toggleTeamExpanded(team.team_id)}
                              className="flex items-center gap-3 flex-1 text-left hover:bg-muted/50 -m-2 p-2 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-base">{team.display_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {teamChannels.length} channel{teamChannels.length !== 1 ? 's' : ''} synced
                                  {team.description && ` · ${team.description.slice(0, 50)}${team.description.length > 50 ? '...' : ''}`}
                                </p>
                              </div>
                            </CollapsibleTrigger>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSyncChannels(team.team_id);
                                }}
                                disabled={isSyncingThisTeam}
                                title="Sync channels"
                                className="h-8 w-8 p-0"
                              >
                                <RefreshCw className={cn(
                                  "h-4 w-4",
                                  isSyncingThisTeam && "animate-spin"
                                )} />
                              </Button>
                              {team.visibility && (
                                <Badge variant="outline" className="text-xs">
                                  {team.visibility}
                                </Badge>
                              )}
                              {team.is_archived && (
                                <Badge variant="secondary" className="text-xs">Archived</Badge>
                              )}
                            </div>
                          </div>
                          
                          <CollapsibleContent>
                            <div className="border-t px-4 py-3 space-y-1.5 bg-muted/20">
                              {teamChannels.length > 0 ? (
                                teamChannels.map(channel => (
                                  <div 
                                    key={channel.id}
                                    className="flex items-center gap-2.5 py-2 px-3 rounded-md hover:bg-muted/70 transition-colors"
                                  >
                                    {channel.membership_type === 'private' ? (
                                      <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    ) : channel.membership_type === 'shared' ? (
                                      <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="text-sm font-medium flex-1">{channel.display_name}</span>
                                    {channel.is_favorite && (
                                      <Badge variant="secondary" className="text-xs">Favorite</Badge>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground py-3 text-center">
                                  Click the sync button to fetch channels
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No teams synced yet. Click "Sync Teams" to fetch your teams.
                </p>
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

