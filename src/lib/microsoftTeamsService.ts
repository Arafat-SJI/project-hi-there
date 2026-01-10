/**
 * Microsoft Teams Service Layer
 * Reusable service for Teams API operations with pagination and rate limiting
 */

import { callGraphAPI, ForbiddenError } from './microsoftGraphClient';

// ============================================================================
// Types
// ============================================================================

export interface MicrosoftChannel {
  id: string;
  displayName: string;
  description?: string | null;
  membershipType?: 'standard' | 'private' | 'shared';
  webUrl?: string;
  email?: string | null;
  isFavoriteByDefault?: boolean;
  createdDateTime?: string;
}

export interface ChannelsListResponse {
  '@odata.context': string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: MicrosoftChannel[];
}

export interface PaginatedResult<T> {
  items: T[];
  totalFetched: number;
  hasMore: boolean;
}

// ============================================================================
// Rate Limiting Utilities
// ============================================================================

const RATE_LIMIT_DELAY_MS = 100;
const MAX_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MULTIPLIER = 2;

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry on rate limit (429) errors
 */
async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const backoffMs = RATE_LIMIT_DELAY_MS * Math.pow(RATE_LIMIT_BACKOFF_MULTIPLIER, attempt);
        console.log(`[TeamsService] Rate limit backoff: ${backoffMs}ms (attempt ${attempt + 1})`);
        await sleep(backoffMs);
      }
      
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check for rate limit error (429)
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 429) {
        const retryAfter = (error as { headers?: { 'retry-after'?: number } }).headers?.['retry-after'] || 5;
        console.warn(`[TeamsService] Rate limited on ${context}. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error(`${context} failed after ${MAX_RETRIES} retries`);
}

// ============================================================================
// Paginated Fetch Utility
// ============================================================================

/**
 * Fetch all pages from a Graph API endpoint that supports OData pagination
 * @param initialUrl - The starting URL (e.g., /teams/{id}/channels)
 * @param maxItems - Maximum items to fetch (default: 1000)
 */
async function fetchAllPages<T>(
  initialUrl: string,
  maxItems: number = 1000
): Promise<T[]> {
  const allItems: T[] = [];
  let nextLink: string | undefined = initialUrl;
  
  while (nextLink && allItems.length < maxItems) {
    const response = await withRateLimitRetry(
      () => callGraphAPI<{ value: T[]; '@odata.nextLink'?: string }>(nextLink!),
      `Fetching ${initialUrl}`
    );
    
    if (response.value) {
      allItems.push(...response.value);
    }
    
    nextLink = response['@odata.nextLink'];
    
    if (nextLink) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }
  
  if (allItems.length >= maxItems) {
    console.warn(`[TeamsService] Reached max items limit (${maxItems}) for ${initialUrl}`);
  }
  
  return allItems;
}

// ============================================================================
// Channel Operations
// ============================================================================

/**
 * Get all channels for a specific team
 * Handles pagination automatically
 * 
 * @param teamId - The Microsoft Team ID
 * @returns Array of channels in the team
 * @throws ForbiddenError if missing Channel.ReadBasic.All permission
 */
export async function getTeamChannels(teamId: string): Promise<MicrosoftChannel[]> {
  if (!teamId) {
    throw new Error('Team ID is required');
  }
  
  try {
    console.log(`[TeamsService] Fetching channels for team ${teamId}`);
    
    const channels = await fetchAllPages<MicrosoftChannel>(
      `/teams/${teamId}/channels`
    );
    
    console.log(`[TeamsService] Found ${channels.length} channels in team ${teamId}`);
    return channels;
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw new ForbiddenError(
        'Missing Channel.ReadBasic.All permission. Please reconnect your Microsoft account.'
      );
    }
    throw error;
  }
}

/**
 * Get channels for multiple teams in batch
 * Useful for syncing all channels across all teams
 * 
 * @param teamIds - Array of Team IDs
 * @returns Map of teamId -> channels array
 */
export async function getChannelsForMultipleTeams(
  teamIds: string[]
): Promise<Map<string, MicrosoftChannel[]>> {
  const results = new Map<string, MicrosoftChannel[]>();
  
  for (const teamId of teamIds) {
    try {
      const channels = await getTeamChannels(teamId);
      results.set(teamId, channels);
      
      // Rate limit between teams
      await sleep(RATE_LIMIT_DELAY_MS * 2);
    } catch (error) {
      console.error(`[TeamsService] Failed to fetch channels for team ${teamId}:`, error);
      results.set(teamId, []);
    }
  }
  
  return results;
}
