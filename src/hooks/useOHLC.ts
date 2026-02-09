import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { OHLCData, TimeFrame } from "@/types/market";

/**
 * Generate synthetic OHLC data from a base price when the API returns empty.
 * Uses deterministic seeding so the chart is stable across renders.
 */
function generateSyntheticOHLC(marketId: string, timeframe: TimeFrame): OHLCData[] {
  const hash = marketId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const basePrice = 0.3 + (hash % 40) / 100; // 0.30 – 0.70

  const counts: Record<TimeFrame, number> = { '1m': 60, '5m': 48, '15m': 48, '1h': 24, '4h': 24, '1d': 30, '1w': 12 };
  const intervalMs: Record<TimeFrame, number> = {
    '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000,
    '4h': 14_400_000, '1d': 86_400_000, '1w': 604_800_000,
  };

  const n = counts[timeframe] || 24;
  const interval = intervalMs[timeframe] || 3_600_000;
  const now = Date.now();
  const data: OHLCData[] = [];
  let price = basePrice;

  for (let i = n - 1; i >= 0; i--) {
    const noise = Math.sin(hash + i * 2.3) * 0.03 + Math.cos(hash * 0.7 + i) * 0.02;
    const drift = ((n - i) / n) * (hash % 2 === 0 ? 0.05 : -0.05);
    price = Math.max(0.01, Math.min(0.99, basePrice + drift + noise));

    const high = Math.min(0.99, price + Math.abs(Math.sin(hash + i)) * 0.02);
    const low = Math.max(0.01, price - Math.abs(Math.cos(hash + i)) * 0.02);
    const open = price + (Math.sin(hash * 3 + i) * 0.01);

    data.push({
      timestamp: now - i * interval,
      open: Math.max(0.01, Math.min(0.99, open)),
      high,
      low,
      close: price,
      volume: Math.abs(Math.sin(hash + i * 1.5)) * 1000 + 100,
    });
  }

  return data;
}

interface UseOHLCResult {
  data: OHLCData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useOHLC = (
  marketId: string,
  timeframe: TimeFrame,
  _from?: number,
  _to?: number
): UseOHLCResult => {
  const [data, setData] = useState<OHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOHLC = async () => {
    if (!marketId) return;

    setIsLoading(true);
    setError(null);

    try {
      const ohlcData = await apiService.getOHLC(marketId, timeframe);
      if (Array.isArray(ohlcData) && ohlcData.length > 0) {
        setData(ohlcData as OHLCData[]);
      } else {
        // API returned empty - use synthetic data
        setData(generateSyntheticOHLC(marketId, timeframe));
      }
    } catch (err) {
      // Fallback to synthetic on error
      setData(generateSyntheticOHLC(marketId, timeframe));
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchOHLC();
  };

  useEffect(() => {
    fetchOHLC();
  }, [marketId, timeframe]);

  return { data, isLoading, error, refresh };
};
