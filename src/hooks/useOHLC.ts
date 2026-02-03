import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { OHLCData, TimeFrame } from "@/types/market";

interface UseOHLCResult {
  data: OHLCData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useOHLC = (
  marketId: string,
  timeframe: TimeFrame,
  from?: number,
  to?: number
): UseOHLCResult => {
  const [data, setData] = useState<OHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOHLC = async () => {
    if (!marketId) return;

    setIsLoading(true);
    setError(null);

    try {
      const ohlcData = await apiService.getOHLC(marketId, timeframe, from, to);
      setData(ohlcData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch OHLC data"));
      console.error("Error fetching OHLC data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchOHLC();
  };

  useEffect(() => {
    fetchOHLC();
  }, [marketId, timeframe, from, to]);

  return {
    data,
    isLoading,
    error,
    refresh,
  };
};
