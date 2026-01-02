/**
 * Provider Detail Page
 * Dynamic provider configuration with form fields, services, and stats
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  useProviderWithDetails,
  useUpdateIntegration,
  useTestConnection,
  useDisconnectIntegration,
  useToggleService,
  useSetDefaultService,
  useProviderUsageStats,
} from '@/hooks/useIntegrations';
import { ProviderDetailHeader } from '@/components/integrations/ProviderDetailHeader';
import { DynamicFormField } from '@/components/integrations/DynamicFormField';
import { ServiceManagement } from '@/components/integrations/ServiceManagement';
import { UsageStats } from '@/components/integrations/UsageStats';
import { AIModelsSection } from '@/components/integrations/AIModelsSection';
import {
  areRequiredFieldsFilled,
  getSensitiveFieldKeys,
  generateOAuthState,
  storeOAuthState,
  buildOAuthAuthorizationUrl,
} from '@/lib/integration-utils';

export default function ProviderDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  // Fetch data
  const { provider, orgIntegration, fields, services, isLoading, error } = useProviderWithDetails(
    slug || ''
  );
  const { data: usageStats, isLoading: statsLoading } = useProviderUsageStats(
    provider?.id || '',
    30
  );

  // Check if this is an AI provider
  const [isAIProvider, setIsAIProvider] = useState(false);
  const [categorySlug, setCategorySlug] = useState<string>('');

  useEffect(() => {
    const fetchCategory = async () => {
      if (!provider?.category_id) return;

      const { data: category } = await supabase
        .from('integration_categories')
        .select('slug')
        .eq('id', provider.category_id)
        .single();

      if (category) {
        setCategorySlug(category.slug);
        setIsAIProvider(category.slug === 'ai');
      }
    };

    fetchCategory();
  }, [provider?.category_id]);

  // Mutations
  const updateIntegration = useUpdateIntegration();
  const testConnection = useTestConnection();
  const disconnectIntegration = useDisconnectIntegration();
  const toggleService = useToggleService();
  const setDefaultService = useSetDefaultService();

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form values from org integration config
  useEffect(() => {
    if (orgIntegration?.config) {
      setFormValues(orgIntegration.config);
    } else if (fields && fields.length > 0) {
      // Set default values
      const defaults: Record<string, string> = {};
      fields.forEach((field) => {
        if (field.default_value) {
          defaults[field.field_key] = field.default_value;
        }
      });
      setFormValues(defaults);
    }
  }, [orgIntegration, fields]);

  // Handle field change
  const handleFieldChange = (fieldKey: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
    setHasChanges(true);
  };

  // Handle save configuration
  const handleSave = async () => {
    if (!provider) return;

    // Validate required fields
    if (!areRequiredFieldsFilled(fields, formValues)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      await updateIntegration.mutateAsync({
        providerId: provider.id,
        config: formValues,
        enabled: true,
      });

      toast({
        title: 'Configuration Saved',
        description: `${provider.name} configuration has been saved successfully.`,
      });

      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle test connection
  const handleTestConnection = async () => {
    if (!provider || !slug) return;

    // Save first if there are changes
    if (hasChanges) {
      await handleSave();
    }

    try {
      const result = await testConnection.mutateAsync({
        providerSlug: slug,
        credentials: formValues,
      });

      if (result.valid) {
        toast({
          title: 'Connection Successful',
          description: result.message || 'Successfully connected to ' + provider.name,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.message || 'Failed to connect to ' + provider.name,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Failed to test connection',
        variant: 'destructive',
      });
    }
  };

  // Handle OAuth connect
  const handleOAuthConnect = () => {
    if (!provider || !provider.oauth_config) {
      toast({
        title: 'OAuth Configuration Missing',
        description: 'This provider does not have OAuth configuration set up.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. Generate and store state for CSRF protection
      const state = generateOAuthState();
      storeOAuthState(state, provider.id);

      // 2. Build redirect URI
      const redirectUri = `${window.location.origin}/admin/integrations/oauth/callback`;

      // 3. Build authorization URL
      const authUrl = buildOAuthAuthorizationUrl(provider, state, redirectUri);

      // 4. Redirect to provider authorization page
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: 'OAuth Error',
        description: error instanceof Error ? error.message : 'Failed to initiate OAuth flow',
        variant: 'destructive',
      });
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!provider) return;

    try {
      await disconnectIntegration.mutateAsync({
        providerId: provider.id,
      });

      toast({
        title: 'Disconnected',
        description: `${provider.name} has been disconnected.`,
      });

      // Clear form
      setFormValues({});
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Disconnect Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect',
        variant: 'destructive',
      });
    }
  };

  // Handle toggle service
  const handleToggleService = async (serviceId: string, enabled: boolean) => {
    try {
      await toggleService.mutateAsync({ serviceId, enabled });

      toast({
        title: enabled ? 'Service Enabled' : 'Service Disabled',
        description: 'Service status updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update service',
        variant: 'destructive',
      });
    }
  };

  // Handle set default service
  const handleSetDefaultService = async (serviceId: string) => {
    if (!provider) return;

    try {
      await setDefaultService.mutateAsync({
        providerId: provider.id,
        serviceId,
      });

      toast({
        title: 'Default Service Updated',
        description: 'Default service has been set successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to set default service',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !provider) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">Failed to load provider details</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const isOAuth = provider.auth_type === 'oauth2';
  const sensitiveFieldKeys = getSensitiveFieldKeys(fields);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProviderDetailHeader
        provider={provider}
        orgIntegration={orgIntegration}
        onTestConnection={handleTestConnection}
        onDisconnect={handleDisconnect}
        onOAuthConnect={handleOAuthConnect}
        isTesting={testConnection.isPending}
        isDisconnecting={disconnectIntegration.isPending}
      />

      {/* Configuration Form */}
      {!isOAuth && fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Enter your {provider.name} credentials and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {/* Dynamic fields */}
              {fields.map((field) => (
                <DynamicFormField
                  key={field.id}
                  field={field}
                  value={formValues[field.field_key] || ''}
                  onChange={(value) => handleFieldChange(field.field_key, value)}
                  showMasked={!!orgIntegration}
                />
              ))}

              {/* Save button */}
              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" disabled={!hasChanges || isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </Button>

                {hasChanges && (
                  <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                )}
              </div>

              {/* Security note */}
              {sensitiveFieldKeys.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                  <p className="font-medium mb-1">Security Note</p>
                  <p className="text-muted-foreground">
                    Sensitive fields (API keys, passwords) are encrypted and stored securely. They
                    are never displayed in full after saving.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* OAuth Instructions */}
      {isOAuth && !orgIntegration?.connection_status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>OAuth 2.0 Authentication</CardTitle>
            <CardDescription>Connect your {provider.name} account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the "Connect with {provider.name}" button above to authorize this application
                to access your {provider.name} account. You'll be redirected to {provider.name} to
                approve the connection.
              </p>

              {provider.oauth_config?.scopes && (
                <div>
                  <p className="text-sm font-medium mb-2">Required Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {provider.oauth_config.scopes.map((scope) => (
                      <li key={scope}>{scope}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Management */}
      {services.length > 0 && orgIntegration?.connection_status === 'connected' && (
        <ServiceManagement
          services={services}
          onToggleService={handleToggleService}
          onSetDefault={handleSetDefaultService}
          isLoading={toggleService.isPending || setDefaultService.isPending}
        />
      )}

      {/* Usage Statistics */}
      {orgIntegration && (
        <UsageStats stats={usageStats} isLoading={statsLoading} days={30} />
      )}

      {/* AI Models Section - Only for AI providers */}
      {isAIProvider && provider && slug && (
        <AIModelsSection
          providerId={provider.id}
          providerSlug={slug}
          providerName={provider.name}
          isConnected={orgIntegration?.connection_status === 'connected'}
        />
      )}
    </div>
  );
}
