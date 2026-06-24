/**
 * Shared helpers for where synced integration data appears in the app.
 */

import type { IntegrationDataDestination } from '@/lib/integration-preferences';

const DESTINATION_PATHS: Record<IntegrationDataDestination, string> = {
  projects: '/projects',
  tasks: '/tasks',
  clients: '/clients',
  deals: '/deals',
  contacts: '/contacts',
  schedule: '/meetings/schedule',
  transcripts: '/meetings/transcripts',
};

const DESTINATION_QUERY_KEY: Partial<
  Record<IntegrationDataDestination, 'source' | 'view'>
> = {
  projects: 'source',
  tasks: 'view',
  clients: 'source',
  deals: 'source',
  contacts: 'source',
  schedule: 'source',
  transcripts: 'source',
};

export function getIntegrationViewPath(
  destination: IntegrationDataDestination,
  providerSlug: string
): string {
  const base = DESTINATION_PATHS[destination];
  const queryKey = DESTINATION_QUERY_KEY[destination] ?? 'source';
  return `${base}?${queryKey}=${encodeURIComponent(providerSlug)}`;
}
