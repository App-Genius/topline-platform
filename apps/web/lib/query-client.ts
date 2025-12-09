/**
 * React Query Client Configuration
 *
 * Enterprise-grade defaults for data fetching:
 * - Retry logic with exponential backoff
 * - Stale time management
 * - Cache garbage collection
 * - Network-aware fetching
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

/**
 * Enterprise query defaults optimized for:
 * - Reduced unnecessary refetches
 * - Graceful error handling
 * - Offline support
 * - Reasonable cache lifetimes
 */
const queryDefaults = {
  staleTime: 5 * 60 * 1000,       // 5 minutes - data considered fresh
  gcTime: 30 * 60 * 1000,         // 30 minutes - garbage collection time
  retry: 3,                        // Retry failed requests 3 times
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
  refetchOnWindowFocus: false,     // Don't refetch on tab focus
  refetchOnReconnect: 'always' as const,  // Always refetch on reconnect
  networkMode: 'offlineFirst' as const,   // Use cache when offline
};

/**
 * Enterprise mutation defaults
 */
const mutationDefaults = {
  retry: 1,                        // Retry mutations once
  networkMode: 'online' as const,  // Mutations require network
};

/**
 * Error logging for production
 */
function logError(error: unknown, context: string) {
  // In production, this would send to error tracking service
  console.error(`[Query ${context}]`, error);
}

/**
 * Create QueryClient with enterprise configuration
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: queryDefaults,
      mutations: mutationDefaults,
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only log errors that aren't expected (404s, etc)
        if (query.state.data !== undefined) {
          logError(error, `query:${String(query.queryKey)}`);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logError(error, `mutation:${mutation.options.mutationKey || 'unknown'}`);
      },
    }),
  });
}

/**
 * Singleton QueryClient for SSR/hydration consistency
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  // Server: always make a new query client
  if (typeof window === 'undefined') {
    return createQueryClient();
  }

  // Browser: reuse existing client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

/**
 * Default options for specific query patterns
 */
export const queryOptions = {
  /** For data that rarely changes (roles, permissions) */
  static: {
    staleTime: 60 * 60 * 1000,     // 1 hour
    gcTime: 2 * 60 * 60 * 1000,    // 2 hours
    refetchOnMount: false,
  },

  /** For frequently changing data (dashboard metrics) */
  realtime: {
    staleTime: 30 * 1000,          // 30 seconds
    refetchInterval: 30 * 1000,    // Poll every 30s
  },

  /** For user-initiated searches */
  search: {
    staleTime: 0,                  // Always fresh
    gcTime: 5 * 60 * 1000,         // Keep for 5 minutes
  },

  /** For infinite scroll / pagination */
  paginated: {
    staleTime: 60 * 1000,          // 1 minute
    keepPreviousData: true,
  },
};
