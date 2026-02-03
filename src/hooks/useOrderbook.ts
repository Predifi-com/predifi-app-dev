import { useState, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { apiService } from "@/services/api";
import type { Orderbook } from "@/types/market";
import type { WebSocketEvent } from "@/services/websocket";

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

    // Fetch initial orderbook data
    const fetchInitialOrderbook = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getOrderbook(marketId);
        setOrderbook(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch orderbook"));
        console.error("Error fetching orderbook:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialOrderbook();

    // Subscribe to real-time updates
    const unsubscribe = service.subscribe(`market:${marketId}`, (event: WebSocketEvent) => {
      if (event.type === "orderbook_update") {
        const orderbookData = event.data as Orderbook;
        if (orderbookData.marketId === marketId) {
          setOrderbook(orderbookData);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [marketId, service]);

  return {
    orderbook,
    isLoading,
    error,
  };
};
