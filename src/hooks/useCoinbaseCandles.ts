import { useState, useEffect, useRef } from "react";

export interface CoinbaseCandle {
  timestamp: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CoinbaseAssetData {
  asset: string;
  pair: string;
  candles: CoinbaseCandle[];
  currentPrice: number;
  hourlyBaseline: number;  // last completed hourly candle close
  dailyBaseline: number;   // last completed daily candle close
  hourlyCloseTime: Date;   // current hourly candle close time
  dailyCloseTime: Date;    // current daily candle close time
  isLoading: boolean;
  error: string | null;
}

const COINBASE_API = "https://api.exchange.coinbase.com";

const ASSET_PAIRS: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  DOGE: "DOGE-USD",
  XRP: "XRP-USD",
};

/**
 * Fetch 1-minute candles from Coinbase public API.
 * Returns most recent candles (Coinbase returns newest first).
 */
async function fetchCandles(pair: string, granularity: number = 60, count: number = 60): Promise<CoinbaseCandle[]> {
  const end = new Date();
  const start = new Date(end.getTime() - count * granularity * 1000);

  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`);

  const raw: number[][] = await res.json();

  // Coinbase format: [timestamp, low, high, open, close, volume]
  // Returns newest first, so reverse for chronological order
  return raw
    .map(([ts, low, high, open, close, volume]) => ({
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume,
    }))
    .reverse();
}

/**
 * Compute the baseline price for a given timeframe.
 * Hourly: close of the last completed hour candle.
 * Daily: close of the last completed daily candle.
 */
function computeBaseline(candles: CoinbaseCandle[], timeframe: "hourly" | "daily"): number {
  if (candles.length === 0) return 0;

  const now = new Date();

  if (timeframe === "hourly") {
    // Last completed hour = floor current hour, then go back 1 hour
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);
    const lastHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);

    // Find candle closest to last hour end (i.e., current hour start)
    const lastHourCandle = candles
      .filter((c) => c.timestamp * 1000 >= lastHourStart.getTime() && c.timestamp * 1000 < currentHourStart.getTime())
      .pop(); // last one in that range

    return lastHourCandle?.close ?? candles[candles.length - 1].close;
  }

  // Daily: use the last completed day's close
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // We'd need daily candles for this — use the oldest 1-min candle as approximation,
  // or fetch a single daily candle
  return candles[0]?.open ?? candles[candles.length - 1].close;
}

/** Next full-hour boundary in UTC (e.g. 02:00, 03:00 UTC) */
function getNextHourlyClose(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

/** Next midnight UTC boundary (00:00 UTC) */
function getNextDailyClose(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Hook to fetch Coinbase candle data for a single asset.
 */
export function useCoinbaseCandles(asset: string) {
  const pair = ASSET_PAIRS[asset] || `${asset}-USD`;
  const [data, setData] = useState<CoinbaseAssetData>({
    asset,
    pair,
    candles: [],
    currentPrice: 0,
    hourlyBaseline: 0,
    dailyBaseline: 0,
    hourlyCloseTime: getNextHourlyClose(),
    dailyCloseTime: getNextDailyClose(),
    isLoading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // Fetch 1-min candles for the last 60 minutes
        const candles = await fetchCandles(pair, 60, 60);
        if (cancelled) return;

        const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
        const hourlyBaseline = computeBaseline(candles, "hourly");

        // For daily baseline, fetch one daily candle
        let dailyBaseline = currentPrice;
        try {
          const dailyCandles = await fetchCandles(pair, 86400, 2);
          if (!cancelled && dailyCandles.length >= 2) {
            dailyBaseline = dailyCandles[dailyCandles.length - 2].close; // previous day close
          } else if (!cancelled && dailyCandles.length === 1) {
            dailyBaseline = dailyCandles[0].open;
          }
        } catch {
          // Fallback: use first candle open as daily baseline
          dailyBaseline = candles[0]?.open ?? currentPrice;
        }

        setData({
          asset,
          pair,
          candles,
          currentPrice,
          hourlyBaseline,
          dailyBaseline,
          hourlyCloseTime: getNextHourlyClose(),
          dailyCloseTime: getNextDailyClose(),
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message || "Failed to fetch",
        }));
      }
    };

    load();

    // Refresh every 30 seconds
    intervalRef.current = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [asset, pair]);

  return data;
}

/**
 * Format a date as "MMM-DD-YYYY HH:MM UTC"
 */
export function formatCloseTime(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const mins = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day}-${year} ${hours}:${mins} UTC`;
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

/**
 * Build the market question string.
 */
export function buildMarketQuestion(
  asset: string,
  baseline: number,
  closeTime: Date,
  timeframe: "hourly" | "daily"
): string {
  return `${asset} will close above $${formatPrice(baseline)} at ${formatCloseTime(closeTime)}?`;
}
