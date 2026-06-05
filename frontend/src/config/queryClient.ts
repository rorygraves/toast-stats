import { QueryClient } from '@tanstack/react-query'

export interface QueryClientConfig {
  queryRetry: number
  refetchOnWindowFocus: boolean
  staleTimeMs: number
  gcTimeMs: number
  mutationRetry: number
}

export const QUERY_CLIENT_CONFIG: QueryClientConfig = {
  queryRetry: 1,
  refetchOnWindowFocus: false,
  staleTimeMs: 5 * 60 * 1000, // 5 minutes
  gcTimeMs: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  mutationRetry: 0,
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_CLIENT_CONFIG.queryRetry,
      refetchOnWindowFocus: QUERY_CLIENT_CONFIG.refetchOnWindowFocus,
      staleTime: QUERY_CLIENT_CONFIG.staleTimeMs,
      gcTime: QUERY_CLIENT_CONFIG.gcTimeMs,
    },
    mutations: {
      retry: QUERY_CLIENT_CONFIG.mutationRetry,
    },
  },
})
