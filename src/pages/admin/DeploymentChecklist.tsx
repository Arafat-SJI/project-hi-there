/**
 * Deployment Checklist Dashboard
 * Tracks deployment readiness and configuration status
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Rocket,
  Settings,
  Shield,
  Database,
  Plug,
  Users,
  Palette,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'required' | 'recommended' | 'optional';
  status: 'complete' | 'incomplete' | 'warning';
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon: React.ElementType;
}

interface ChecklistCategory {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export default function DeploymentChecklist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch checklist status
  const { data: checklist, isLoading, refetch } = useQuery({
    queryKey: ['deployment-checklist'],
    queryFn: async (): Promise<ChecklistCategory[]> => {
      // Fetch app config
      const { data: configs } = await supabase
        .from('app_config')
        .select('key, value');

      const configMap = new Map(configs?.map((c) => [c.key, c.value]) || []);

      // Fetch environment status
      let envStatus = { overallStatus: 'unknown', checks: [] };
      try {
        const { data } = await supabase.functions.invoke('check-environment');
        envStatus = data || envStatus;
      } catch (e) {
        // Ignore error, use default status
      }

      // Fetch integrations
      const { data: integrations } = await supabase
        .from('organization_integrations')
        .select('provider_id, connection_status')
        .eq('connection_status', 'connected');

      // Fetch users
      const { data: users, count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      // Build checklist
      const categories: ChecklistCategory[] = [
        {
          id: 'core',
          title: 'Core Configuration',
          items: [
            {
              id: 'onboarding',
              title: 'Platform Setup',
              description: 'Complete the initial platform configuration wizard',
              category: 'required',
              status: configMap.get('system.onboardingCompleted') ? 'complete' : 'incomplete',
              action: {
                label: 'Run Setup',
                href: '/admin/onboarding',
              },
              icon: Settings,
            },
            {
              id: 'branding',
              title: 'Branding Configured',
              description: 'Set platform name, colors, and logo',
              category: 'recommended',
              status: configMap.get('branding.platformName') ? 'complete' : 'incomplete',
              action: {
                label: 'Configure',
                href: '/admin/system-settings',
              },
              icon: Palette,
            },
            {
              id: 'environment',
              title: 'Environment Validated',
              description: 'All critical environment checks pass',
              category: 'required',
              status: envStatus.overallStatus === 'pass' ? 'complete' :
                     envStatus.overallStatus === 'warning' ? 'warning' : 'incomplete',
              action: {
                label: 'Validate',
                href: '/admin/environment-validator',
              },
              icon: FileCheck,
            },
          ],
        },
        {
          id: 'security',
          title: 'Security & Access',
          items: [
            {
              id: 'admin-user',
              title: 'Admin User Created',
              description: 'At least one admin user exists',
              category: 'required',
              status: 'complete', // If we're viewing this, an admin exists
              icon: Shield,
            },
            {
              id: 'roles',
              title: 'Roles Configured',
              description: 'Define custom roles and permissions',
              category: 'recommended',
              status: 'complete', // Default roles exist
              action: {
                label: 'Manage Roles',
                href: '/admin/role-management',
              },
              icon: Users,
            },
          ],
        },
        {
          id: 'integrations',
          title: 'Integrations',
          items: [
            {
              id: 'ai-provider',
              title: 'AI Provider Connected',
              description: 'Configure at least one AI provider for chat and embeddings',
              category: 'recommended',
              status: integrations?.some((i) =>
                ['openai', 'anthropic', 'google-gemini'].some((p) =>
                  String(i.provider_id).includes(p)
                )
              ) ? 'complete' : 'incomplete',
              action: {
                label: 'Configure AI',
                href: '/admin/integrations',
              },
              icon: Plug,
            },
            {
              id: 'email-provider',
              title: 'Email Provider (Optional)',
              description: 'Configure SendGrid for email notifications',
              category: 'optional',
              status: (envStatus as any).checks?.some((c: any) =>
                c.name.includes('SendGrid') && c.status === 'pass'
              ) ? 'complete' : 'incomplete',
              action: {
                label: 'Configure',
                href: '/admin/integrations',
              },
              icon: Plug,
            },
          ],
        },
        {
          id: 'data',
          title: 'Data & Content',
          items: [
            {
              id: 'template-data',
              title: 'Template Data Seeded',
              description: 'AI agents and knowledge categories created',
              category: 'recommended',
              status: configMap.get('system.templateDataSeeded') ? 'complete' : 'incomplete',
              action: {
                label: 'Seed Data',
                onClick: () => seedTemplateData(),
              },
              icon: Database,
            },
            {
              id: 'storage-buckets',
              title: 'Storage Buckets',
              description: 'Required storage buckets exist',
              category: 'required',
              status: (envStatus as any).checks?.some((c: any) =>
                c.name.includes('Storage Bucket') && c.status === 'fail'
              ) ? 'incomplete' : 'complete',
              action: {
                label: 'View Status',
                href: '/admin/environment-validator',
              },
              icon: Database,
            },
          ],
        },
      ];

      return categories;
    },
    staleTime: 30000,
  });

  // Seed template data mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seed-template-data', {
        body: {
          options: {
            seedAIAgents: true,
            seedKnowledgeCategories: true,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deployment-checklist'] });
      toast.success(`Seeded: ${data.seeded?.join(', ') || 'data'}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to seed data: ${error.message}`);
    },
  });

  const seedTemplateData = () => {
    seedMutation.mutate();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Calculate stats
  const allItems = checklist?.flatMap((c) => c.items) || [];
  const requiredItems = allItems.filter((i) => i.category === 'required');
  const completedRequired = requiredItems.filter((i) => i.status === 'complete');
  const completedAll = allItems.filter((i) => i.status === 'complete');

  const requiredProgress = requiredItems.length > 0
    ? (completedRequired.length / requiredItems.length) * 100
    : 0;
  const totalProgress = allItems.length > 0
    ? (completedAll.length / allItems.length) * 100
    : 0;

  const isDeploymentReady = requiredProgress === 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'required':
        return <Badge variant="destructive">Required</Badge>;
      case 'recommended':
        return <Badge variant="default">Recommended</Badge>;
      default:
        return <Badge variant="secondary">Optional</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Checklist</h1>
          <p className="text-muted-foreground">
            Track deployment readiness and configuration status
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Deployment Status */}
      <Card className={isDeploymentReady ? 'border-green-500' : 'border-yellow-500'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Status
              </CardTitle>
              <CardDescription>
                {isDeploymentReady
                  ? 'All required items complete. Ready to deploy!'
                  : 'Complete required items before deploying'
                }
              </CardDescription>
            </div>
            <Badge variant={isDeploymentReady ? 'default' : 'secondary'} className={isDeploymentReady ? 'bg-green-500' : ''}>
              {isDeploymentReady ? 'Ready' : 'In Progress'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Required Items</span>
              <span>{completedRequired.length} / {requiredItems.length}</span>
            </div>
            <Progress value={requiredProgress} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>All Items</span>
              <span>{completedAll.length} / {allItems.length}</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {!isDeploymentReady && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            Complete all required items to ensure a successful deployment.
            <Button
              variant="link"
              className="px-1 h-auto"
              onClick={() => navigate('/admin/onboarding')}
            >
              Run Setup Wizard
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Checklist Categories */}
      {checklist?.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      item.status === 'complete' ? 'bg-green-500/5 border-green-500/20' :
                      item.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                      'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{item.title}</p>
                          {getCategoryBadge(item.category)}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    {item.action && item.status !== 'complete' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (item.action?.onClick) {
                            item.action.onClick();
                          } else if (item.action?.href) {
                            navigate(item.action.href);
                          }
                        }}
                        disabled={seedMutation.isPending && item.id === 'template-data'}
                      >
                        {seedMutation.isPending && item.id === 'template-data' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {item.action.label}
                            {item.action.href && <ExternalLink className="ml-2 h-3 w-3" />}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Resources for setting up your deployment:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/environment-validator')}>
              Environment Validator
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/system-settings')}>
              System Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/integrations')}>
              Integrations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
