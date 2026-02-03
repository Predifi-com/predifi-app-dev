import { useState, useEffect, useCallback } from "react";
import { predifiApi, type TrendingKeyword } from "@/services/predifi-api";

interface UseTrendingKeywordsResult {
  keywords: TrendingKeyword[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

interface CachedData {
  keywords: TrendingKeyword[];
  timestamp: number;
}

const CACHE_KEY = "trending_keywords_cache";
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export const useTrendingKeywords = (limit: number = 10): UseTrendingKeywordsResult => {
  const [keywords, setKeywords] = useState<TrendingKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data: CachedData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid (less than 12 hours old)
      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }
      
      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (err) {
      console.error("Error reading cached trending keywords:", err);
      return null;
    }
  };

  const setCachedData = (keywords: TrendingKeyword[]) => {
    try {
      const data: CachedData = {
        keywords,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Error caching trending keywords:", err);
    }
  };

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        console.log("Using cached trending keywords (age: " + 
          Math.round((Date.now() - cachedData.timestamp) / 1000 / 60) + " minutes)");
        setKeywords(cachedData.keywords);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data if cache is invalid or missing
      console.log("Fetching fresh trending keywords from API");
      const response = await predifiApi.getTrendingKeywords({ limit });
      setKeywords(response.keywords);
      setCachedData(response.keywords);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch trending keywords"));
      console.error("Error fetching trending keywords:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    // Clear cache and fetch fresh data
    console.log("Manually refreshing trending keywords (clearing cache)");
    localStorage.removeItem(CACHE_KEY);
    await fetchKeywords();
  }, [fetchKeywords]);

  useEffect(() => {
    fetchKeywords();
    // Only run once on mount - limit is stable and doesn't need to trigger re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    keywords,
    isLoading,
    error,
    refresh,
  };
};
