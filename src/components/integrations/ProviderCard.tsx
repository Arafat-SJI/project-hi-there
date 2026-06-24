/**
 * Provider Card Component
 * Displays an integration provider with status and action button
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  IntegrationProvider,
  OrganizationIntegration,
  getProviderIcon,
  getConnectionStatusIcon,
  getConnectionStatusLabel,
  getConnectionStatusVariant,
  getProviderActionLabel,
} from '@/lib/integration-utils';
import { cn } from '@/lib/utils';
import { Loader2, Star } from 'lucide-react';

interface ProviderCardProps {
  provider: IntegrationProvider;
  orgIntegration?: OrganizationIntegration;
  onClick?: () => void;
  isDefaultAIProvider?: boolean;
  isPrimaryProvider?: boolean;
  isInactiveForCategory?: boolean;
  /** Show star control to set org default (admin, connected providers) */
  canSetDefault?: boolean;
  isOrganizationDefault?: boolean;
  onSetAsDefault?: () => void;
  isSettingDefault?: boolean;
  /** AI Providers tab — show agent default controls on card (admin-locked mode only) */
  showAgentDefaultOnCard?: boolean;
  /** When false, hide star / "Use for agents" even on AI tab (user_choice mode) */
  requireAgentDefault?: boolean;
}

export function ProviderCard({
  provider,
  orgIntegration,
  onClick,
  isDefaultAIProvider = false,
  isPrimaryProvider = false,
  isInactiveForCategory = false,
  canSetDefault = false,
  isOrganizationDefault = false,
  onSetAsDefault,
  isSettingDefault = false,
  showAgentDefaultOnCard = false,
  requireAgentDefault = true,
}: ProviderCardProps) {
  const navigate = useNavigate();
  const Icon = getProviderIcon(provider.slug);
  const StatusIcon = orgIntegration
    ? getConnectionStatusIcon(orgIntegration.connection_status)
    : null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (provider.slug === 'zoom') {
      navigate('/admin/integrations/zoom');
    } else if (provider.slug === 'microsoft-teams') {
      navigate('/admin/integrations/microsoft-teams');
    } else {
      navigate(`/admin/integrations/${provider.slug}`);
    }
  };

  const statusVariant = orgIntegration
    ? getConnectionStatusVariant(orgIntegration.connection_status)
    : 'secondary';

  const statusLabel = orgIntegration
    ? getConnectionStatusLabel(orgIntegration.connection_status)
    : provider.is_coming_soon
      ? 'Coming Soon'
      : 'Not Configured';

  const actionLabel = getProviderActionLabel(provider, orgIntegration);
  const showAgentDefaultControls = showAgentDefaultOnCard && requireAgentDefault;
  const isDefault =
    isOrganizationDefault || (isDefaultAIProvider && requireAgentDefault) || isPrimaryProvider;
  const isConnected = orgIntegration?.connection_status === 'connected';
  const showDefaultStar = (canSetDefault || showAgentDefaultControls) && isConnected;

  return (
    <Card
      className={cn(
        'relative border-2 transition-all duration-200 cursor-pointer',
        provider.is_coming_soon ? 'opacity-60' : 'hover:border-primary/50 hover:shadow-md',
        isInactiveForCategory && 'opacity-50',
        isDefault && 'border-primary/60 ring-1 ring-primary/20'
      )}
      onClick={handleClick}
    >
      {showDefaultStar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={isDefault ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'absolute right-2 top-2 z-10 h-9 w-9 shrink-0 shadow-sm',
                  !isDefault && 'bg-background hover:bg-primary/10'
                )}
                disabled={isSettingDefault}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetAsDefault?.();
                }}
                aria-label={
                  isDefault
                    ? showAgentDefaultOnCard
                      ? `${provider.name} is the agent default`
                      : `${provider.name} is the default`
                    : showAgentDefaultOnCard
                      ? `Set ${provider.name} as agent default`
                      : `Set ${provider.name} as default`
                }
              >
                {isSettingDefault ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className={cn('h-4 w-4', isDefault && 'fill-current')} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isDefault
                ? showAgentDefaultOnCard
                  ? 'Agent default for your organization'
                  : 'Default provider for this category'
                : showAgentDefaultOnCard
                  ? 'Set as agent default — used when running agents'
                  : 'Set as default — used across the app for this category'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Icon */}
          <div className="rounded-lg border p-3 bg-muted/50">
            <Icon className="h-8 w-8" />
          </div>

          {/* Provider Name */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2">
              <p className="font-semibold">{provider.name}</p>
              {provider.is_beta && (
                <Badge variant="outline" className="text-xs">
                  Beta
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {provider.description}
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant={statusVariant} className="gap-1">
              {StatusIcon && <StatusIcon className="h-3 w-3" />}
              {statusLabel}
            </Badge>
            {isDefaultAIProvider && requireAgentDefault && (
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Agent default
              </Badge>
            )}
            {isPrimaryProvider && !isDefaultAIProvider && (
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
            )}
            {isInactiveForCategory && orgIntegration?.connection_status === 'connected' && (
              <Badge variant="secondary" className="text-xs">
                Connected, not active
              </Badge>
            )}
          </div>

          {isConnected && showAgentDefaultControls && !isDefault && (
            <p className="text-xs text-muted-foreground">
              Tap <Star className="inline h-3 w-3" /> to use for agents
            </p>
          )}

          {/* Service Count or Auth Type */}
          {isConnected ? (
            <p className="text-xs text-muted-foreground">
              {/* Service count will be added later */}
              Connected
            </p>
          ) : (
            <p className="text-xs text-muted-foreground capitalize">
              {provider.auth_type.replace('_', ' ')}
            </p>
          )}

          {isConnected && showAgentDefaultControls && onSetAsDefault && (
            <Button
              type="button"
              variant={isDefault ? 'default' : 'secondary'}
              size="sm"
              className="w-full"
              disabled={isSettingDefault}
              onClick={(e) => {
                e.stopPropagation();
                onSetAsDefault();
              }}
            >
              {isSettingDefault ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className={cn('mr-2 h-4 w-4', isDefault && 'fill-current')} />
              )}
              {isDefault ? 'Agent default' : 'Use for agents'}
            </Button>
          )}

          {/* Action Button */}
          <Button
            variant={orgIntegration?.connection_status === 'connected' ? 'outline' : 'default'}
            size="sm"
            className="w-full"
            disabled={provider.is_coming_soon}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
