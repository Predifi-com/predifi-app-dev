import { useState, useEffect } from "react";
import { predifiApi, type PredifiMarket } from "@/services/predifi-api";

export function useLocalMarkets() {
  const [markets, setMarkets] = useState<PredifiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await predifiApi.listAggregatedMarkets({ limit: 100 });
        setMarkets(res.markets || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch markets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  return { markets, loading, error };
}
