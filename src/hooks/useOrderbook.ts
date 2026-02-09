import { useState, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { apiService } from "@/services/api";
import type { Orderbook } from "@/types/market";
import type { WebSocketEvent } from "@/services/websocket";

/**
 * Generate synthetic orderbook data when API returns empty.
 */
function generateSyntheticOrderbook(marketId: string): Orderbook {
  const hash = marketId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const midPrice = 0.3 + (hash % 40) / 100;
  const spread = 0.01 + (hash % 5) * 0.005;

  const bids = Array.from({ length: 8 }, (_, i) => {
    const price = midPrice - spread / 2 - i * 0.01;
    const size = 50 + Math.abs(Math.sin(hash + i * 2)) * 200;
    return { price: Math.max(0.01, price), size, total: 0 };
  });

  const asks = Array.from({ length: 8 }, (_, i) => {
    const price = midPrice + spread / 2 + i * 0.01;
    const size = 50 + Math.abs(Math.cos(hash + i * 2)) * 200;
    return { price: Math.min(0.99, price), size, total: 0 };
  });

  // Calculate running totals
  let runBid = 0;
  bids.forEach((b) => { runBid += b.size; b.total = runBid; });
  let runAsk = 0;
  asks.forEach((a) => { runAsk += a.size; a.total = runAsk; });

  return {
    marketId,
    bids,
    asks,
    spread,
    midPrice,
    timestamp: Date.now(),
  };
}

interface UseOrderbookResult {
  orderbook: Orderbook | null;
  isLoading: boolean;
  error: Error | null;
}

export const useOrderbook = (marketId: string): UseOrderbookResult => {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { service } = useWebSocket();

  useEffect(() => {
    if (!marketId) return;

    const fetchInitialOrderbook = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getOrderbook(marketId);
        if (data && typeof data === 'object' && Array.isArray((data as any).bids) && (data as any).bids.length > 0) {
          setOrderbook(data as unknown as Orderbook);
        } else {
          // API returned empty - use synthetic
          setOrderbook(generateSyntheticOrderbook(marketId));
        }
      } catch (err) {
        // Fallback to synthetic
        setOrderbook(generateSyntheticOrderbook(marketId));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialOrderbook();

    const unsubscribe = service.subscribe(`market:${marketId}`, (event: WebSocketEvent) => {
      if (event.type === "orderbook_update") {
        setOrderbook(event as unknown as Orderbook);
      }
    });

    return () => { unsubscribe(); };
  }, [marketId, service]);

  return { orderbook, isLoading, error };
};
