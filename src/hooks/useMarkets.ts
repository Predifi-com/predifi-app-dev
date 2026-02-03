import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import type { Market, MarketFilters, MarketSort, PaginationCursor } from "@/types/market";

interface UseMarketsResult {
  markets: Market[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  nextCursor?: string;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  total?: number;
}

export const useMarkets = (
  filters?: MarketFilters,
  sort?: MarketSort,
  initialLimit: number = 20
): UseMarketsResult => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();

  const fetchMarkets = useCallback(
    async (cursor?: string, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const pagination: PaginationCursor = {
          cursor,
          limit: initialLimit,
        };

        const response = await apiService.getMarkets(filters, sort, pagination);

        if (append) {
          setMarkets((prev) => [...prev, ...response.markets]);
        } else {
          setMarkets(response.markets);
        }

        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setTotal(response.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch markets"));
        console.error("Error fetching markets:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, sort, initialLimit]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !nextCursor) return;
    await fetchMarkets(nextCursor, true);
  }, [hasMore, isLoading, nextCursor, fetchMarkets]);

  const refresh = useCallback(async () => {
    await fetchMarkets(undefined, false);
  }, [fetchMarkets]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    hasMore,
    nextCursor,
    loadMore,
    refresh,
    total,
  };
};
