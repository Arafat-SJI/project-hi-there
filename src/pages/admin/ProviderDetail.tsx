/**
 * Provider Detail Page
 * Dynamic provider configuration with form fields, services, and stats
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  useIntegrationProvider,
  useIntegrationFields,
  useOrganizationIntegration,
  useIntegrationServices,
  useProviderUsageStats,
  useUpdateIntegration,
  useTestConnection,
  useDisconnectIntegration,
  useToggleService,
  useSetDefaultService,
} from '@/hooks/useIntegrations';
import { useSyncProjects } from '@/hooks/useIntegrationSync';
import { DynamicFormField } from '@/components/integrations/DynamicFormField';
import { ServiceManagement } from '@/components/integrations/ServiceManagement';
import { UsageStats } from '@/components/integrations/UsageStats';
import { AIModelsSection } from '@/components/integrations/AIModelsSection';
import {
  areRequiredFieldsFilled,
  generateOAuthState,
  storeOAuthState,
  buildOAuthAuthorizationUrl,
} from '@/lib/integration-utils';

export default function ProviderDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Fetch provider data
  const { data: provider, isLoading, error } = useIntegrationProvider(slug || '');
  const { data: fields = [] } = useIntegrationFields(provider?.id || '');
  const { data: orgIntegration } = useOrganizationIntegration(provider?.id || '');
  const { data: services = [] } = useIntegrationServices(provider?.id || '');
  const { data: usageStats, isLoading: statsLoading } = useProviderUsageStats(
    provider?.id || '',
    30
  );

  // Check if this is an AI provider or Project Management provider with sync
  const [isAIProvider, setIsAIProvider] = useState(false);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const isProjectManagementWithSync =
    categorySlug === 'project-management' &&
    (slug === 'activecollab' || slug === 'jira');
  const syncProjects = useSyncProjects(slug || '');

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
      setFormValues(orgIntegration.config as Record<string, string>);
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
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      await updateIntegration.mutateAsync({
        providerId: provider.id,
        config: formValues,
        enabled: true,
      });

      toast.success(`${provider.name} configuration has been saved successfully.`);
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
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
        toast.success(result.message || 'Successfully connected to ' + provider.name);
      } else {
        toast.error(result.message || 'Failed to connect to ' + provider.name);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to test connection');
    }
  };

  // Handle OAuth connect
  const handleOAuthConnect = () => {
    if (!provider || !provider.oauth_config) {
      toast.error('This provider does not have OAuth configuration set up.');
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
      toast.error(error instanceof Error ? error.message : 'Failed to initiate OAuth flow');
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!provider) return;

    try {
      await disconnectIntegration.mutateAsync({
        providerId: provider.id,
      });

      toast.success(`${provider.name} has been disconnected.`);

      // Clear form
      setFormValues({});
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  // Handle toggle service
  const handleToggleService = async (serviceId: string, enabled: boolean) => {
    try {
      await toggleService.mutateAsync({ serviceId, enabled });
      toast.success('Service status updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update service');
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
      toast.success('Default service has been set successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default service');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Error state or no provider
  if (error || !provider) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/integrations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>
        
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Provider not found</p>
          <Button onClick={() => navigate('/admin/integrations')}>
            View All Integrations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/admin/integrations')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Integrations
      </Button>

      {/* Provider Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {provider.name}
          </CardTitle>
          <CardDescription>{provider.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground capitalize">
                {provider.auth_type.replace('_', ' ')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {provider.is_available ? 'Available' : 'Not Available'}
                {provider.is_beta && ' (Beta)'}
                {provider.is_coming_soon && ' (Coming Soon)'}
              </p>
            </div>
            {provider.docs_url && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Documentation</p>
                <a
                  href={provider.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Docs
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Enter your API credentials to connect {provider.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <DynamicFormField
                key={field.id}
                field={field}
                value={formValues[field.field_key] || ''}
                onChange={(value) => handleFieldChange(field.field_key, value)}
              />
            ))}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Configuration
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testConnection.isPending}
              >
                {testConnection.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Test Connection
              </Button>
              {orgIntegration && (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectIntegration.isPending}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OAuth Connect for OAuth providers */}
      {provider.auth_type === 'oauth' && !orgIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Connect with OAuth</CardTitle>
            <CardDescription>
              Connect your {provider.name} account using OAuth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleOAuthConnect}>
              Connect {provider.name}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{usageStats.totalCalls}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{usageStats.successfulCalls}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{usageStats.failedCalls}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{usageStats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
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

      {/* Sync projects - Only for connected Project Management providers (ActiveCollab, Jira) */}
      {isProjectManagementWithSync && orgIntegration?.connection_status === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle>Sync projects</CardTitle>
            <CardDescription>
              Load projects from {provider.name} into the Projects list. New and updated
              projects will be created or updated; existing projects are matched by external ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => syncProjects.mutate()}
              disabled={syncProjects.isPending}
            >
              {syncProjects.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync projects
            </Button>
            {syncProjects.data && (
              <p className="mt-3 text-sm text-muted-foreground">
                Last sync: {syncProjects.data.projects_synced} project
                {syncProjects.data.projects_synced !== 1 ? 's' : ''} synced
                ({syncProjects.data.projects_created} created, {syncProjects.data.projects_updated}{' '}
                updated).
              </p>
            )}
          </CardContent>
        </Card>
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