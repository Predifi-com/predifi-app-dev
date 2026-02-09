import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { MarketCardSimple } from "@/components/markets/MarketCardSimple";
import { TradingLayout } from "@/components/markets/TradingLayout";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { predifiApi, type PredifiMarket } from "@/services/predifi-api";
import { getEffectiveEndDate } from "@/lib/market-date-utils";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Fixed asset roster ──
const CURATED_ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
type CuratedAsset = typeof CURATED_ASSETS[number];

const ASSET_PATTERNS: Record<CuratedAsset, RegExp> = {
  BTC: /\bbtc\b|bitcoin/i,
  ETH: /\beth\b|ethereum/i,
  SOL: /\bsol\b|solana/i,
  DOGE: /\bdoge\b|dogecoin/i,
  XRP: /\bxrp\b|ripple/i,
};

// ── Fixed timeframe definitions ──
type MarketTimeframe = "hourly" | "daily";

/**
 * Strictly classify a market into hourly or daily.
 * Hourly: expires within 4 hours from now.
 * Daily:  expires between 4 hours and 48 hours from now.
 * Anything else is rejected (returns null).
 */
function classifyTimeframe(market: PredifiMarket): MarketTimeframe | null {
  const end = getEffectiveEndDate(market);
  if (!end) return null;
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return null; // expired
  if (diff <= 4 * 60 * 60 * 1000) return "hourly";
  if (diff <= 48 * 60 * 60 * 1000) return "daily";
  return null; // too far out — not hourly or daily
}

/** A guaranteed slot in the curated grid */
export interface CuratedSlot {
  asset: CuratedAsset;
  timeframe: MarketTimeframe;
  isDaily: boolean;
  market: PredifiMarket | null; // null = no matching market found
}

/**
 * Build a deterministic 10-slot grid: 5 assets × 2 timeframes.
 *
 * Rules:
 * - Each slot is either filled or left as a placeholder.
 * - A slot is NEVER filled with a market from the wrong timeframe.
 * - When multiple candidates exist, pick highest volume.
 * - Order: assets in roster order, hourly first then daily per asset.
 */
function buildCuratedSlots(allMarkets: PredifiMarket[]): CuratedSlot[] {
  const slots: CuratedSlot[] = [];

  for (const asset of CURATED_ASSETS) {
    const pattern = ASSET_PATTERNS[asset];

    // Find all active markets matching this asset
    const matching = allMarkets.filter(
      (m) => m.status === "active" && pattern.test(m.title)
    );

    for (const timeframe of ["hourly", "daily"] as MarketTimeframe[]) {
      // Strictly filter by exact timeframe — no cross-contamination
      const candidates = matching
        .filter((m) => classifyTimeframe(m) === timeframe)
        .sort((a, b) => (b.volume_total || 0) - (a.volume_total || 0));

      slots.push({
        asset,
        timeframe,
        isDaily: timeframe === "daily",
        market: candidates[0] || null, // best match or empty slot
      });
    }
  }

  return slots; // Always exactly 10 slots
}

const Markets = () => {
  const [allMarkets, setAllMarkets] = useState<PredifiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Fetch crypto markets
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const res = await predifiApi.listAggregatedMarkets({
          category: "crypto",
          status: "active",
          limit: 100,
        });
        setAllMarkets(res.markets || []);
      } catch (err) {
        console.error("Markets: failed to fetch", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const slots = useMemo(() => buildCuratedSlots(allMarkets), [allMarkets]);

  // Only filled slots for trading layout
  const filledSlots = useMemo(() => slots.filter((s) => s.market !== null) as (CuratedSlot & { market: PredifiMarket })[], [slots]);

  const tradingMarkets = useMemo(
    () =>
      filledSlots.map((s) => ({
        id: s.market.id,
        title: s.market.title,
        yesPercentage: s.market.yes_price ?? 50,
        noPercentage: s.market.no_price ?? 50,
        totalVolume: s.market.volume_total || s.market.volume_24h || 0,
        imageUrl: s.market.image_url || undefined,
        endDate: getEffectiveEndDate(s.market) || undefined,
        isDaily: s.isDaily,
      })),
    [filledSlots]
  );

  // If a market is selected, show trading layout
  if (selectedMarketId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title="Markets | Predifi" description="Trade prediction markets on crypto, sports, politics and more." />
        <Header />
        <TradingLayout
          markets={tradingMarkets}
          selectedId={selectedMarketId}
          onSelect={setSelectedMarketId}
          onBack={() => setSelectedMarketId(null)}
        />
      </div>
    );
  }

  // Default: curated 10-slot grid
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO title="Markets | Predifi" description="Trade prediction markets on crypto, sports, politics and more." />
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header area */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
            <p className="text-sm text-muted-foreground mt-1">Curated crypto prediction markets</p>
          </div>
          <Link to="/markets-plus">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Markets+
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Fixed 10-slot grid: 5 assets × 2 timeframes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isLoading ? (
            Array.from({ length: 10 }, (_, i) => <MarketCardSkeleton key={i} />)
          ) : (
            slots.map((slot) => {
              if (slot.market) {
                return (
                  <MarketCardSimple
                    key={`${slot.asset}-${slot.timeframe}`}
                    id={slot.market.id}
                    title={slot.market.title}
                    yesPercentage={slot.market.yes_price ?? 50}
                    noPercentage={slot.market.no_price ?? 50}
                    totalVolume={slot.market.volume_total || slot.market.volume_24h || 0}
                    imageUrl={slot.market.image_url || undefined}
                    endDate={getEffectiveEndDate(slot.market) || undefined}
                    isDaily={slot.isDaily}
                    timeframeLabel={slot.timeframe === "hourly" ? "Hourly" : "Daily"}
                    onClick={() => setSelectedMarketId(slot.market!.id)}
                  />
                );
              }

              // Empty placeholder slot
              return (
                <div
                  key={`${slot.asset}-${slot.timeframe}`}
                  className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 flex flex-col items-center justify-center min-h-[160px]"
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase">{slot.asset}</span>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 uppercase">{slot.timeframe}</span>
                  <span className="text-[10px] text-muted-foreground/40 mt-2">No market available</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
