import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Kanban, Loader2, RefreshCw, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DynamicFormField } from "@/components/integrations/DynamicFormField";
import { useToast } from "@/hooks/use-toast";
import {
  useIntegrationFields,
  useIntegrationProvider,
  useOrganizationIntegration,
  useUpdateIntegration,
} from "@/hooks/useIntegrations";
import { useDisconnectOAuth, useUserOAuthToken, useConnectOAuth } from "@/hooks/useUserIntegrations";
import { useSyncProjects } from "@/hooks/useIntegrationSync";

export default function ActiveCollabIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orgConfigValues, setOrgConfigValues] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const { data: provider, isLoading: providerLoading } = useIntegrationProvider("activecollab");
  const { data: integrationFields, isLoading: fieldsLoading } = useIntegrationFields(provider?.id ?? "");
  const { data: orgIntegration, isLoading: orgIntegrationLoading } = useOrganizationIntegration(provider?.id ?? "");
  const updateIntegration = useUpdateIntegration();

  const { data: userToken } = useUserOAuthToken("activecollab");
  const connectOAuth = useConnectOAuth();
  const disconnectOAuth = useDisconnectOAuth();
  const syncProjects = useSyncProjects("activecollab");

  const isUserConnected = Boolean(userToken?.is_active);
  const isOrgConfigured = Boolean(
    orgIntegration && orgIntegration.enabled && orgIntegration.connection_status === "connected",
  );

  useEffect(() => {
    if (orgIntegration?.config) {
      setOrgConfigValues(orgIntegration.config as Record<string, string>);
    }
  }, [orgIntegration]);

  const hasRequiredFields = useMemo((): boolean => {
    return (
      integrationFields?.every((field) => {
        if (!field.is_required) return true;
        return Boolean(orgConfigValues[field.field_key]);
      }) ?? false
    );
  }, [integrationFields, orgConfigValues]);

  const handleFieldChange = (fieldKey: string, value: string): void => {
    setOrgConfigValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleSaveOrgConfig = async (): Promise<void> => {
    if (!provider) return;
    setIsSavingConfig(true);
    try {
      await updateIntegration.mutateAsync({
        providerId: provider.id,
        config: orgConfigValues,
        enabled: true,
      });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({
        title: "Configuration saved",
        description: "ActiveCollab organization configuration has been saved successfully.",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save configuration";
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleConnect = (): void => {
    connectOAuth.mutate({
      provider: "activecollab",
      redirect_uri: `${window.location.origin}/admin/integrations/activecollab`,
    });
  };

  const handleDisconnect = (): void => {
    disconnectOAuth.mutate(
      { provider: "activecollab" },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["user-oauth-tokens"] });
          toast({
            title: "Disconnected",
            description: "Your ActiveCollab account has been disconnected.",
          });
        },
      },
    );
  };

  const isLoading = providerLoading || fieldsLoading || orgIntegrationLoading;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div>
        <Link
          to="/admin/integrations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <Kanban className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ActiveCollab Integration</h1>
            <p className="text-muted-foreground mt-1">
              Configure ActiveCollab for your organization and let users connect their own accounts.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Organization Configuration
            {isOrgConfigured ? (
              <Badge variant="outline" className="ml-2 border-green-200 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2 border-amber-200 text-amber-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enter ActiveCollab Base URL, Client ID and Client Secret. These are stored on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrationFields?.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              value={orgConfigValues[field.field_key] ?? ""}
              onChange={(value) => handleFieldChange(field.field_key, value)}
              showMasked={isOrgConfigured}
            />
          ))}

          <Separator />

          <Button onClick={handleSaveOrgConfig} disabled={isSavingConfig || !hasRequiredFields}>
            {isSavingConfig ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Kanban className="h-5 w-5 text-primary" />
            User OAuth & Sync
          </CardTitle>
          <CardDescription>
            Users connect their personal ActiveCollab account from this page or Settings. After connection, you can run
            sync to import projects and tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleConnect} disabled={!isOrgConfigured || connectOAuth.isPending}>
              {connectOAuth.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect with ActiveCollab"
              )}
            </Button>
            {!isOrgConfigured && (
              <p className="text-sm text-muted-foreground">
                Save the organization configuration before users can connect.
              </p>
            )}
          </div>

          {isUserConnected && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleDisconnect} disabled={disconnectOAuth.isPending}>
                {disconnectOAuth.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect"
                )}
              </Button>
              <Button variant="secondary" onClick={() => syncProjects.mutate()} disabled={syncProjects.isPending}>
                {syncProjects.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
