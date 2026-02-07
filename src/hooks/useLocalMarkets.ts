import { useState, useEffect } from "react";

interface LocalMarket {
  id: string;
  question: string;
  description: string;
  status: string;
  resolution_time: string;
  venues?: { venue: string }[];
}

export function useLocalMarkets() {
  const [markets, setMarkets] = useState<LocalMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/markets");
        if (!res.ok) throw new Error("Failed to fetch markets");
        const data = await res.json();
        setMarkets(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  return { markets, loading, error };
}
