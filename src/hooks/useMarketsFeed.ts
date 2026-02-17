import { useState, useEffect, useCallback, useRef } from "react";
import { predifiApi, type PredifiMarket, type ListMarketsResponse } from "@/services/predifi-api";

interface UseMarketsFeedParams {
  category?: string;
  venue?: string;
  status?: 'active' | 'resolved' | 'expired';
  limit?: number;
}

interface UseMarketsFeedResult {
  markets: PredifiMarket[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Hook for fetching markets with server-side filtering and offset-based pagination.
 * Passes category and venue to the API so filtering happens server-side.
 */
export function useMarketsFeed(params: UseMarketsFeedParams): UseMarketsFeedResult {
  const [markets, setMarkets] = useState<PredifiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [lastBatchSize, setLastBatchSize] = useState(0);

  const limit = params.limit || 50;

  // Stable ref for current params to avoid stale closures
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Track current fetch to prevent race conditions
  const fetchIdRef = useRef(0);

  const fetchMarkets = useCallback(async (currentOffset: number, append: boolean) => {
    const fetchId = ++fetchIdRef.current;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const p = paramsRef.current;

      // Map category/venue for API compatibility
      const apiVenue = p.venue && p.venue !== 'all' && p.venue !== 'PREDIFI_NATIVE'
        ? p.venue.toLowerCase() as 'limitless' | 'polymarket' | 'predifi'
        : p.venue === 'PREDIFI_NATIVE' ? 'predifi' as const : undefined;

      const apiCategory = p.category && p.category !== 'all' && p.category !== 'for_you'
        ? p.category
        : undefined;

      const response: ListMarketsResponse = await predifiApi.listAggregatedMarkets({
        venue: apiVenue,
        category: apiCategory,
        status: p.status || 'active',
        limit,
        offset: currentOffset,
      });

      // Guard against stale responses
      if (fetchId !== fetchIdRef.current) return;

      const fetchedMarkets = response.markets || [];
      const batchSize = fetchedMarkets.length;

      if (append) {
        setMarkets(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnly = fetchedMarkets.filter(m => !existingIds.has(m.id));
          return [...prev, ...newOnly];
        });
      } else {
        setMarkets(fetchedMarkets);
      }

      setLastBatchSize(batchSize);
      setTotal(response.total || 0);
      setOffset(currentOffset);

      
    } catch (err: any) {
      if (fetchId !== fetchIdRef.current) return;
      setError(err.message || "Failed to fetch markets");
      console.error("Failed to fetch markets:", err);
    } finally {
      if (fetchId !== fetchIdRef.current) return;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  // Use both total-based and batch-size-based check for hasMore
  // If API returns reliable total, use it; otherwise check if batch was full
  const hasMore = total > 0
    ? (offset + limit < total)
    : (lastBatchSize >= limit);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchMarkets(offset + limit, true);
    }
  }, [hasMore, isLoadingMore, isLoading, offset, limit, fetchMarkets]);

  const refresh = useCallback(() => {
    fetchMarkets(0, false);
  }, [fetchMarkets]);

  // Re-fetch when filter params change — reset pagination state
  // Use a stable key to avoid re-triggering from object identity changes
  const filterKey = `${params.category}|${params.venue}|${params.status}`;
  useEffect(() => {
    setOffset(0);
    setLastBatchSize(0);
    setTotal(0);
    setMarkets([]);
    fetchMarkets(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return {
    markets,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}
