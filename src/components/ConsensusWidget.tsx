import { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { predifiApi, type PredifiMarket } from "@/services/predifi-api";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AssetConsensus {
  asset: string;
  probability: number;
  direction: "up" | "down" | "neutral";
  signal: "strong" | "moderate" | "low";
}

/**
 * Compute liquidity-weighted average probability across markets for an asset.
 * Consensus = Σ(yes_price × volume) / Σ(volume)
 */
function computeConsensus(markets: PredifiMarket[]): number | null {
  if (markets.length === 0) return null;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const m of markets) {
    const weight = m.volume_total || m.volume_24h || 0;
    if (weight <= 0) continue;
    weightedSum += (m.yes_price ?? 50) * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return weightedSum / totalWeight;
}

export function ConsensusWidget() {
  const { service, isConnected } = useWebSocket();
  const [btcMarkets, setBtcMarkets] = useState<PredifiMarket[]>([]);
  const [ethMarkets, setEthMarkets] = useState<PredifiMarket[]>([]);
  const [prevBtc, setPrevBtc] = useState<number | null>(null);
  const [prevEth, setPrevEth] = useState<number | null>(null);

  // Fetch BTC and ETH crypto markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await predifiApi.listAggregatedMarkets({
          category: "crypto",
          status: "active",
          limit: 50,
        });
        const all = res.markets || [];
        const btc = all.filter((m) => /\bbtc\b|bitcoin/i.test(m.title));
        const eth = all.filter((m) => /\beth\b|ethereum/i.test(m.title));
        setBtcMarkets(btc);
        setEthMarkets(eth);
      } catch (err) {
        console.error("ConsensusWidget: fetch failed", err);
      }
    };
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // WebSocket live updates
  useEffect(() => {
    if (!isConnected) return;
    const allIds = [...btcMarkets, ...ethMarkets].map((m) => m.id);
    if (allIds.length === 0) return;

    service.subscribeToMarkets(["markets"], allIds);

    const unsub = service.subscribe("market_update", (event) => {
      const update = event as any;
      const updateMarkets = (prev: PredifiMarket[]) =>
        prev.map((m) =>
          m.id === update.market_id
            ? { ...m, yes_price: update.yes_price ?? m.yes_price, no_price: update.no_price ?? m.no_price }
            : m
        );
      setBtcMarkets(updateMarkets);
      setEthMarkets(updateMarkets);
    });

    return () => {
      unsub();
      service.unsubscribeFromMarkets(["markets"], allIds);
    };
  }, [isConnected, btcMarkets.length, ethMarkets.length]);

  const btcConsensus = useMemo(() => computeConsensus(btcMarkets), [btcMarkets]);
  const ethConsensus = useMemo(() => computeConsensus(ethMarkets), [ethMarkets]);

  // Track direction changes
  useEffect(() => {
    if (btcConsensus !== null && prevBtc !== null && btcConsensus !== prevBtc) {
      // direction changed
    }
    setPrevBtc(btcConsensus);
  }, [btcConsensus]);

  useEffect(() => {
    if (ethConsensus !== null && prevEth !== null && ethConsensus !== prevEth) {
      // direction changed
    }
    setPrevEth(ethConsensus);
  }, [ethConsensus]);

  const assets: AssetConsensus[] = useMemo(() => {
    const items: AssetConsensus[] = [];

    if (btcConsensus !== null) {
      items.push({
        asset: "BTC",
        probability: Math.round(btcConsensus),
        direction: prevBtc !== null ? (btcConsensus > prevBtc ? "up" : btcConsensus < prevBtc ? "down" : "neutral") : "neutral",
        signal: btcMarkets.length >= 3 ? "strong" : btcMarkets.length >= 1 ? "moderate" : "low",
      });
    }

    if (ethConsensus !== null) {
      items.push({
        asset: "ETH",
        probability: Math.round(ethConsensus),
        direction: prevEth !== null ? (ethConsensus > prevEth ? "up" : ethConsensus < prevEth ? "down" : "neutral") : "neutral",
        signal: ethMarkets.length >= 3 ? "strong" : ethMarkets.length >= 1 ? "moderate" : "low",
      });
    }

    return items;
  }, [btcConsensus, ethConsensus, prevBtc, prevEth, btcMarkets.length, ethMarkets.length]);

  if (assets.length === 0) return null;

  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-lg bg-muted/30 border border-border/50">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Consensus</span>
      {assets.map((a) => (
        <div key={a.asset} className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground/70">{a.asset}</span>
          <span className={cn(
            "text-xs font-bold tabular-nums",
            a.direction === "up" && "text-emerald-500",
            a.direction === "down" && "text-red-500",
            a.direction === "neutral" && "text-foreground",
          )}>
            {a.probability}%
          </span>
          {a.direction === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
          {a.direction === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
          {a.direction === "neutral" && <Minus className="w-3 h-3 text-muted-foreground" />}
          {a.signal === "low" && (
            <span className="text-[9px] text-muted-foreground">—</span>
          )}
        </div>
      ))}
    </div>
  );
}
