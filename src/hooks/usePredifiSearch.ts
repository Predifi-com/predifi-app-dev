import { useState, useCallback, useRef } from "react";
import { predifiApi, type PredifiMarket } from "@/services/predifi-api";

interface UsePredifiSearchParams {
  status?: 'open' | 'closed' | 'settled' | 'cancelled';
  venue?: 'POLYMARKET' | 'KALSHI' | 'LIMITLESS' | 'PREDIFI_NATIVE';
  category?: string;
  limit?: number;
}

interface UsePredifiSearchResult {
  results: PredifiMarket[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export const usePredifiSearch = (params?: UsePredifiSearchParams): UsePredifiSearchResult => {
  const [results, setResults] = useState<PredifiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store latest params without causing re-renders
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentParams = paramsRef.current;
      console.log('🔍 Search params:', { query, ...currentParams });
      
      const response = await predifiApi.searchMarkets({
        q: query,
        ...currentParams,
      });
      
      console.log('📊 Search results:', { 
        total: response.data.length,
        firstFew: response.data.slice(0, 3).map(m => ({ 
          id: m.id, 
          slug: m.slug, 
          status: m.status,
          title: m.title.substring(0, 50)
        }))
      });
      
      setResults(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Search failed"));
      console.error("Error searching markets:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - stable function reference

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clear,
  };
};
