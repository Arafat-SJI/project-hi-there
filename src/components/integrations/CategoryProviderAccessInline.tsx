/**
 * Inline per-category provider access bar — mirrors AI agent access for meeting, email, CRM, etc.
 */

import { useEffect, useState } from 'react';
import {
  usePrimaryByCategorySettings,
  useSavePrimaryByCategory,
} from '@/hooks/useIntegrationSettings';
import type {
  CategoryIntegrationPreference,
  PrimaryByCategory,
  PrimaryIntegrationCategorySlug,
} from '@/lib/integration-preferences';
import { isCategoryAdminDefaultOnly } from '@/lib/integration-preferences';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryProviderAccessInlineProps {
  categorySlug: PrimaryIntegrationCategorySlug;
  categoryName: string;
  connectedProviders: { slug: string; name: string }[];
  primarySlug?: string | null;
}

const emptyPref = (): CategoryIntegrationPreference => ({
  primary_slug: null,
  active_slugs: [],
  single_active_only: false,
});

export function CategoryProviderAccessInline({
  categorySlug,
  categoryName,
  connectedProviders,
  primarySlug,
}: CategoryProviderAccessInlineProps) {
  const { data: byCategory, isLoading } = usePrimaryByCategorySettings();
  const saveByCategory = useSavePrimaryByCategory();
  const [pref, setPref] = useState<CategoryIntegrationPreference>(emptyPref());

  useEffect(() => {
    if (byCategory?.[categorySlug]) {
      setPref(byCategory[categorySlug]);
    }
  }, [byCategory, categorySlug]);

  if (connectedProviders.length === 0) {
    const emptyHint = isCategoryAdminDefaultOnly(categorySlug)
      ? `Connect your ${categoryName.toLowerCase()} provider below, then set it as the organization default.`
      : `Connect a ${categoryName.toLowerCase()} provider below, then choose how it is used.`;
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    );
  }

  const adminOnly = isCategoryAdminDefaultOnly(categorySlug);
  const isUserChoice = !adminOnly && !pref.single_active_only;
  const resolvedPrimarySlug = primarySlug ?? pref.primary_slug;

  const persist = (next: CategoryIntegrationPreference) => {
    setPref(next);
    const payload: Partial<PrimaryByCategory> = {
      ...(byCategory ?? {}),
      [categorySlug]: next,
    };
    saveByCategory.mutate(payload);
  };

  const defaultName =
    connectedProviders.find((p) => p.slug === resolvedPrimarySlug)?.name ??
    resolvedPrimarySlug?.replace(/-/g, ' ');

  const connectedSlugs = connectedProviders.map((p) => p.slug);

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-primary/30 bg-primary/5 p-4',
        'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold">{categoryName} access</p>
        <p className="text-xs text-muted-foreground">
          {adminOnly
            ? `Your organization uses one ${categoryName.toLowerCase()} provider. Click `
            : isUserChoice
              ? `Users can pick from all connected ${categoryName.toLowerCase()} below when using the app.`
              : 'Everyone uses one default provider. Click '}
          {(adminOnly || !isUserChoice) && (
            <>
              <Star className="inline h-3 w-3 fill-primary text-primary" /> on a connected card
              below to choose it.
            </>
          )}
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {!adminOnly && (
            <RadioGroup
              value={pref.single_active_only ? 'admin_default' : 'user_choice'}
              onValueChange={(v) => {
                const single_active_only = v === 'admin_default';
                persist(
                  single_active_only
                    ? {
                        single_active_only: true,
                        primary_slug:
                          pref.primary_slug ?? connectedSlugs[0] ?? null,
                        active_slugs: pref.primary_slug
                          ? [pref.primary_slug]
                          : connectedSlugs[0]
                            ? [connectedSlugs[0]]
                            : [],
                      }
                    : {
                        single_active_only: false,
                        primary_slug: pref.primary_slug,
                        active_slugs:
                          pref.active_slugs.length > 0
                            ? pref.active_slugs
                            : [...connectedSlugs],
                      }
                );
              }}
              disabled={saveByCategory.isPending}
              className="flex flex-wrap gap-2"
            >
              <label
                htmlFor={`${categorySlug}-admin-default`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/30"
              >
                <RadioGroupItem
                  value="admin_default"
                  id={`${categorySlug}-admin-default`}
                />
                <span>Admin default only</span>
              </label>
              <label
                htmlFor={`${categorySlug}-user-choice`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/30"
              >
                <RadioGroupItem
                  value="user_choice"
                  id={`${categorySlug}-user-choice`}
                />
                <span>Users can choose</span>
              </label>
            </RadioGroup>
          )}

          {adminOnly && (
            <Badge variant="secondary" className="shrink-0">
              Admin default only
            </Badge>
          )}

          {!isUserChoice ? (
            resolvedPrimarySlug ? (
              <Badge variant="default" className="shrink-0 gap-1">
                <Star className="h-3 w-3 fill-current" />
                Default: {defaultName}
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">
                No default — click ★ on a card
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="shrink-0">
              {connectedProviders.length} provider
              {connectedProviders.length === 1 ? '' : 's'} available
            </Badge>
          )}

          {saveByCategory.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
