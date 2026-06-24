/**
 * Set a connected provider as the org default for its Integration Hub category.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invalidateKeys } from '@/lib/cache';
import {
  fetchSelectableChatModels,
  integrationSlugFromAIProviderSlug,
  setDefaultAIProvider,
} from '@/lib/ai-model-policy';
import {
  getPrimaryByCategorySettings,
  resolvePrimaryCategorySlug,
  savePrimaryByCategory,
  type PrimaryByCategory,
} from '@/lib/integration-preferences';
import { isAIProvidersCategory } from '@/lib/integration-utils';

export function useSetProviderAsDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categorySlug,
      categoryName,
      providerSlug,
    }: {
      categorySlug: string;
      categoryName?: string;
      providerSlug: string;
    }) => {
      if (isAIProvidersCategory(categorySlug, categoryName)) {
        const models = await fetchSelectableChatModels();
        const providerModels = models.filter(
          (m) => integrationSlugFromAIProviderSlug(m.provider_slug) === providerSlug
        );
        const model =
          providerModels.find((m) => m.is_default) ?? providerModels[0] ?? null;
        return setDefaultAIProvider(providerSlug, model?.id ?? null);
      }

      const canonicalCategory = resolvePrimaryCategorySlug(categorySlug, categoryName);
      if (canonicalCategory) {
        const existing = await getPrimaryByCategorySettings();
        const payload: Partial<PrimaryByCategory> = {
          ...existing,
          [canonicalCategory]: {
            single_active_only: true,
            primary_slug: providerSlug,
            active_slugs: [providerSlug],
          },
        };
        return savePrimaryByCategory(payload);
      }

      throw new Error('This category does not support a default provider.');
    },
    onSuccess: () => {
      invalidateKeys.integrationSettings(queryClient);
      toast.success('Default provider updated.');
    },
    onError: (err: Error) => {
      toast.error('Failed to set default provider', { description: err.message });
    },
  });
}
