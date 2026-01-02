/**
 * Provider Detail Page
 * Dynamic provider configuration with form fields, services, and stats
 * NOTE: Placeholder - integration tables don't exist yet
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import {
  useIntegrationProvider,
  useProviderUsageStats,
} from '@/hooks/useIntegrations';

export default function ProviderDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Fetch provider data
  const { data: provider, isLoading, error } = useIntegrationProvider(slug || '');
  const { data: usageStats, isLoading: statsLoading } = useProviderUsageStats(
    provider?.id || '',
    30
  );

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
    </div>
  );
}
