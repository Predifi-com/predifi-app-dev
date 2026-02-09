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

const CURATED_ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"];
const ASSET_PATTERNS: Record<string, RegExp> = {
  BTC: /\bbtc\b|bitcoin/i,
  ETH: /\beth\b|ethereum/i,
  SOL: /\bsol\b|solana/i,
  DOGE: /\bdoge\b|dogecoin/i,
  XRP: /\bxrp\b|ripple/i,
};

/**
 * Classify market as hourly or daily based on expiry timeframe.
 */
function getTimeframe(market: PredifiMarket): "hourly" | "daily" | "other" {
  const end = getEffectiveEndDate(market);
  if (!end) return "other";
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return "other";
  if (diff <= 4 * 60 * 60 * 1000) return "hourly"; // ≤4h = hourly
  if (diff <= 48 * 60 * 60 * 1000) return "daily";  // ≤48h = daily
  return "other";
}

/**
 * Match markets to assets, picking one hourly + one daily per asset.
 * Total target: 10 cards (5 assets × 2 timeframes).
 */
function curateMarkets(allMarkets: PredifiMarket[]) {
  const result: Array<{
    market: PredifiMarket;
    asset: string;
    isDaily: boolean;
  }> = [];

  for (const asset of CURATED_ASSETS) {
    const pattern = ASSET_PATTERNS[asset];
    const matching = allMarkets.filter((m) => pattern.test(m.title) && m.status === "active");

    const hourly = matching
      .filter((m) => getTimeframe(m) === "hourly")
      .sort((a, b) => (b.volume_total || 0) - (a.volume_total || 0));

    const daily = matching
      .filter((m) => getTimeframe(m) === "daily")
      .sort((a, b) => (b.volume_total || 0) - (a.volume_total || 0));

    if (hourly[0]) {
      result.push({ market: hourly[0], asset, isDaily: false });
    }
    if (daily[0]) {
      result.push({ market: daily[0], asset, isDaily: true });
    }
  }

  // Cap at 10
  return result.slice(0, 10);
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

  const curated = useMemo(() => curateMarkets(allMarkets), [allMarkets]);

  const tradingMarkets = useMemo(
    () =>
      curated.map((c) => ({
        id: c.market.id,
        title: c.market.title,
        yesPercentage: c.market.yes_price ?? 50,
        noPercentage: c.market.no_price ?? 50,
        totalVolume: c.market.volume_total || c.market.volume_24h || 0,
        imageUrl: c.market.image_url || undefined,
        endDate: getEffectiveEndDate(c.market) || undefined,
        isDaily: c.isDaily,
      })),
    [curated]
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

  // Default: curated grid
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

        {/* Market Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }, (_, i) => <MarketCardSkeleton key={i} />)
          ) : curated.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-sm">No active crypto markets found.</p>
            </div>
          ) : (
            curated.map((c) => (
              <MarketCardSimple
                key={c.market.id}
                id={c.market.id}
                title={c.market.title}
                yesPercentage={c.market.yes_price ?? 50}
                noPercentage={c.market.no_price ?? 50}
                totalVolume={c.market.volume_total || c.market.volume_24h || 0}
                imageUrl={c.market.image_url || undefined}
                endDate={getEffectiveEndDate(c.market) || undefined}
                isDaily={c.isDaily}
                onClick={() => setSelectedMarketId(c.market.id)}
              />
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
