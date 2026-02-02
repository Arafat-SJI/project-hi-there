/**
 * Zoom Integration Page
 * Allows users to connect their Zoom account for meeting integration
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle2, AlertCircle, Loader2, RefreshCw, Eye, Calendar, Settings, Copy, ExternalLink, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSyncZoom } from "@/hooks/useSyncZoom";
import { useUserOAuthToken, useConnectOAuth, useDisconnectOAuth, useHasValidToken } from "@/hooks/useUserIntegrations";
import { useMeetings } from "@/hooks/useMeetings";
import { 
  useIntegrationProvider, 
  useIntegrationFields, 
  useOrganizationIntegration, 
  useUpdateIntegration 
} from "@/hooks/useIntegrations";
import { DynamicFormField } from "@/components/integrations/DynamicFormField";

export default function ZoomIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [orgConfigValues, setOrgConfigValues] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Organization-level integration hooks
  const { data: zoomProvider, isLoading: providerLoading } = useIntegrationProvider("zoom");
  const { data: integrationFields, isLoading: fieldsLoading } = useIntegrationFields(zoomProvider?.id || "");
  const { data: orgIntegration, isLoading: orgIntegrationLoading } = useOrganizationIntegration(zoomProvider?.id || "");
  const updateIntegration = useUpdateIntegration();

  // Check if org-level integration is configured
  const isOrgConfigured = !!orgIntegration && orgIntegration.enabled && orgIntegration.connection_status === 'connected';

  // Check Zoom connection status (user-level)
  const { data: zoomToken } = useUserOAuthToken("zoom");
  const { hasValidToken, isExpired, hasError, errorMessage } = useHasValidToken("zoom");
  const isConnected = !!zoomToken && hasValidToken;

  // OAuth hooks
  const connectOAuth = useConnectOAuth();
  const disconnectOAuth = useDisconnectOAuth();

  // Zoom sync hook
  const syncZoom = useSyncZoom();

  // Get Zoom meetings count
  const { data: meetings } = useMeetings({ meetingType: "zoom" });

  // Get Supabase URL for redirect URL
  const supabaseUrl = "https://tjkqvbxtziheggurtvcz.supabase.co";
  const redirectUrl = `${supabaseUrl}/functions/v1/user-oauth-callback`;

  // Initialize org config values from existing integration
  useEffect(() => {
    if (orgIntegration?.config) {
      const config = orgIntegration.config as Record<string, string>;
      setOrgConfigValues(config);
    }
  }, [orgIntegration]);

  useEffect(() => {
    if (!providerLoading && !fieldsLoading && !orgIntegrationLoading) {
      setCheckingStatus(false);
    }
  }, [providerLoading, fieldsLoading, orgIntegrationLoading, zoomToken]);

  const copyRedirectUrl = () => {
    navigator.clipboard.writeText(redirectUrl);
    toast({
      title: "Copied!",
      description: "Redirect URL copied to clipboard",
    });
  };

  const handleConnect = async () => {
    setLoading(true);
    setError("");
    
    try {
      await connectOAuth.mutateAsync({ provider: "zoom" });
      // The hook will redirect to OAuth, so we don't need to do anything else here
    } catch (err: any) {
      console.error("Zoom connection error:", err);
      setError(err.message || "Failed to connect to Zoom");
      toast({
        title: "Connection failed",
        description: err.message || "Failed to connect to Zoom",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectOAuth.mutateAsync({ provider: "zoom" });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['zoom-files'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['user-oauth-tokens'] });
      
      toast({
        title: "Disconnected",
        description: "Your Zoom account has been disconnected.",
      });
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

  const handleSyncMeetings = async () => {
    try {
      await syncZoom.mutateAsync({
        sync_recordings: true,
        sync_transcripts: true,
      });
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const handleSaveOrgConfig = async () => {
    if (!zoomProvider) return;
    
    setIsSavingConfig(true);
    try {
      await updateIntegration.mutateAsync({
        providerId: zoomProvider.id,
        config: orgConfigValues,
        enabled: true,
      });
      
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      
      toast({
        title: "Configuration saved",
        description: "Zoom organization configuration has been saved successfully.",
      });
    } catch (err: any) {
      console.error("Save config error:", err);
      toast({
        title: "Save failed",
        description: err.message || "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setOrgConfigValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Check if all required fields are filled
  const hasRequiredFields = integrationFields?.every((field) => {
    if (!field.is_required) return true;
    return !!orgConfigValues[field.field_key];
  }) ?? false;

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
            <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zoom Integration</h1>
            <p className="text-muted-foreground mt-1.5">
              Connect your Zoom account to sync meetings, recordings, and transcripts
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Configuration Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              OAuth Configuration
            </CardTitle>
            <CardDescription>
              Configure your Zoom OAuth app with these settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Redirect URL (OAuth Callback)
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Add this URL to your Zoom OAuth app settings in the Zoom Marketplace
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-800">
                    <code className="text-xs font-mono text-blue-900 dark:text-blue-100 flex-1 break-all">
                      {redirectUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyRedirectUrl}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Setup Steps:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://marketplace.zoom.us/develop/create" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Zoom Marketplace <ExternalLink className="h-3 w-3" /></a></li>
                <li>Create or edit your OAuth app</li>
                <li>Add the Redirect URL above to your app settings</li>
                <li>Copy your Client ID and Client Secret</li>
                <li>Go to <Link to="/admin/integrations/zoom" className="text-primary hover:underline">Zoom Integration Settings</Link> and enter your credentials</li>
              </ol>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Make sure to request these scopes in your Zoom app: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">meeting:read</code>, <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">recording:read</code>, and <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">user:read</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Organization Configuration Card */}
        <Card className={`border-2 ${isOrgConfigured ? 'border-green-200 dark:border-green-800' : 'border-amber-200 dark:border-amber-800'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${isOrgConfigured ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <Settings className={`h-5 w-5 ${isOrgConfigured ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
              Organization Configuration
              {isOrgConfigured ? (
                <Badge variant="outline" className="ml-2 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isOrgConfigured 
                ? "Zoom OAuth credentials are configured. Users can now connect their accounts."
                : "Enter your Zoom OAuth credentials to enable user connections."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isOrgConfigured && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Configuration Required</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      You must configure the Zoom OAuth credentials before users can connect their Zoom accounts. 
                      Get your Client ID and Client Secret from the{" "}
                      <a href="https://marketplace.zoom.us/develop/apps" target="_blank" rel="noopener noreferrer" className="underline">
                        Zoom Marketplace
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Credential Fields */}
            {integrationFields && integrationFields.length > 0 ? (
              <div className="space-y-4">
                {integrationFields.map((field) => (
                  <DynamicFormField
                    key={field.id}
                    field={field}
                    value={orgConfigValues[field.field_key] || ""}
                    onChange={(value) => handleFieldChange(field.field_key, value)}
                    showMasked={isOrgConfigured}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Loading configuration fields...
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveOrgConfig}
                disabled={isSavingConfig || !hasRequiredFields}
                size="lg"
              >
                {isSavingConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>

            {isOrgConfigured && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Configuration Active</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Users can now connect their personal Zoom accounts using the connection section below.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Status Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
              Connection Status
            </CardTitle>
            <CardDescription>
              Current Zoom account connection status
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
                        {zoomToken?.account_email || zoomToken?.account_name || 'Zoom account'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={loading || disconnectOAuth.isPending}
                    className="border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    {disconnectOAuth.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                </div>

                {/* Token Status Warnings */}
                {isExpired && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Token Expired</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Please disconnect and reconnect to refresh your connection
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasError && errorMessage && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Connection Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!isOrgConfigured && (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Organization Setup Required</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          An administrator must configure the Zoom OAuth credentials above before you can connect.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Not connected</p>
                      <p className="text-sm text-muted-foreground">
                        {isOrgConfigured 
                          ? "Connect to enable Zoom features"
                          : "Configure organization credentials first"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnect}
                    disabled={loading || connectOAuth.isPending || !isOrgConfigured}
                    size="lg"
                  >
                    {loading || connectOAuth.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Connect with Zoom
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

        {/* Sync Zoom Meetings Card */}
        {isConnected && hasValidToken && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                Sync Zoom Meetings
              </CardTitle>
              <CardDescription>
                Import your Zoom meetings, recordings, and transcripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSyncMeetings}
                disabled={syncZoom.isPending || !hasValidToken}
                variant="secondary"
                size="lg"
              >
                {syncZoom.isPending ? (
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
                Sync and refresh your Zoom meetings, recordings, and transcripts.
              </p>

              {syncZoom.isSuccess && (
                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/30 p-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/50">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-green-900 dark:text-green-100 font-semibold">
                      Meetings synced successfully
                    </span>
                  </div>
                </div>
              )}

              {meetings && meetings.length > 0 && (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/admin/integrations/zoom/meetings">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Synced Meetings ({meetings.length})
                  </Link>
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Requires Zoom OAuth permissions for meeting:read and recording:read.
                If you see a permission error, disconnect and reconnect your Zoom account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Account Information Card */}
        {isConnected && zoomToken && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
                  <Video className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Account Information
              </CardTitle>
              <CardDescription>
                Details about your connected Zoom account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {zoomToken.account_name && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm text-muted-foreground">{zoomToken.account_name}</span>
                </div>
              )}
              {zoomToken.account_email && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Email</span>
                  <span className="text-sm text-muted-foreground">{zoomToken.account_email}</span>
                </div>
              )}
              {zoomToken.scopes && zoomToken.scopes.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium block mb-2">Scopes</span>
                  <div className="flex flex-wrap gap-2">
                    {zoomToken.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {zoomToken.last_used_at && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Last Used</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(zoomToken.last_used_at).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

