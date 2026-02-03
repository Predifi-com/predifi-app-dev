import { useState, useEffect, useCallback, useRef } from "react";
import { predifiApi, type PredifiMarket, type ListMarketsResponse } from "@/services/predifi-api";

interface UsePredifiMarketsParams {
  status?: 'open' | 'closed' | 'settled' | 'cancelled';
  venue?: 'POLYMARKET' | 'KALSHI' | 'LIMITLESS' | 'PREDIFI_NATIVE';
  category?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  min_volume?: number;
  min_liquidity?: number;
  autoLoad?: boolean;
}

interface UsePredifiMarketsResult {
  markets: PredifiMarket[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
  };
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const usePredifiMarkets = (params?: UsePredifiMarketsParams): UsePredifiMarketsResult => {
  const [markets, setMarkets] = useState<PredifiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false,
  });

  const limit = params?.limit || 50;
  const autoLoad = params?.autoLoad !== false;

  // Use ref to store latest params without causing re-renders
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchMarkets = useCallback(async (currentOffset: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentParams = paramsRef.current;
      const response: ListMarketsResponse = await predifiApi.listMarkets({
        status: currentParams?.status,
        venue: currentParams?.venue,
        category: currentParams?.category,
        limit,
        offset: currentOffset,
        sort_by: currentParams?.sort_by,
        sort_dir: currentParams?.sort_dir,
        min_volume: currentParams?.min_volume,
        min_liquidity: currentParams?.min_liquidity,
      });

      if (append) {
        setMarkets(prev => [...prev, ...response.data]);
      } else {
        setMarkets(response.data);
      }

      setPagination({
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
      });
      
      setOffset(currentOffset);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch markets"));
      console.error("Error fetching Predifi markets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(async () => {
    if (pagination.hasMore && !isLoading) {
      await fetchMarkets(offset + limit, true);
    }
  }, [pagination.hasMore, isLoading, offset, limit, fetchMarkets]);

  const refresh = useCallback(async () => {
    await fetchMarkets(0, false);
  }, [fetchMarkets]);

  // Auto-fetch when params change (but keep stable function reference)
  useEffect(() => {
    if (autoLoad) {
      fetchMarkets(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, params?.status, params?.venue, params?.category, params?.sort_by, params?.sort_dir, params?.min_volume, params?.min_liquidity]);

  return {
    markets,
    isLoading,
    error,
    pagination: {
      total: pagination.total,
      hasMore: pagination.hasMore,
      offset,
    },
    loadMore,
    refresh,
  };
};
