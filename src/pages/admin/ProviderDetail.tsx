/**
 * Provider Detail Page
 * Dynamic provider configuration with form fields, services, and stats
 * NOTE: Placeholder - integration tables don't exist yet
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  useIntegrationProvider,
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
  const navigate = useNavigate();

  // Fetch provider data
  const { data: provider, isLoading, error } = useIntegrationProvider(slug || '');
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

      {/* Configuration Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-5 w-5" />
            Integration Tables Not Configured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            The integration hub requires additional database tables to be created before
            provider configuration can be completed. These tables include:
          </p>
          <ul className="mt-2 list-disc list-inside text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <li>integration_categories</li>
            <li>integration_providers</li>
            <li>integration_fields</li>
            <li>organization_integrations</li>
            <li>integration_services</li>
            <li>integration_usage_logs</li>
          </ul>
          <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
            Please run database migrations to create these tables before configuring integrations.
          </p>
        </CardContent>
      </Card>

      {/* Usage Statistics Placeholder */}
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
