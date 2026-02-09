import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { OrderForm } from "@/components/markets/OrderForm";
import { OrderBookMini } from "@/components/markets/OrderBookMini";
import { MarketRules } from "@/components/markets/MarketRules";
import { PositionManagement } from "@/components/markets/PositionManagement";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoinbaseCandles } from "@/hooks/useCoinbaseCandles";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
const TIMEFRAMES = ["hourly", "daily"] as const;

function buildOrderedList() {
  const list: { asset: string; timeframe: "hourly" | "daily" }[] = [];
  for (const tf of TIMEFRAMES) {
    for (const asset of ASSETS) {
      list.push({ asset, timeframe: tf });
    }
  }
  return list;
}

const ORDERED_MARKETS = buildOrderedList();

function useYesProb(asset: string, timeframe: "hourly" | "daily") {
  const data = useCoinbaseCandles(asset);
  const baseline = timeframe === "daily" ? data.dailyBaseline : data.hourlyBaseline;
  if (baseline <= 0 || data.currentPrice <= 0) return 50;
  const diff = ((data.currentPrice - baseline) / baseline) * 100;
  return Math.min(95, Math.max(5, 50 + diff * 25));
}

function parseSlug(slug: string): { asset: string; timeframe: "hourly" | "daily" } | null {
  const parts = slug.split("-");
  if (parts.length !== 2) return null;
  const [asset, tf] = parts;
  const upperAsset = asset.toUpperCase();
  if (!(ASSETS as readonly string[]).includes(upperAsset)) return null;
  if (tf !== "hourly" && tf !== "daily") return null;
  return { asset: upperAsset, timeframe: tf };
}

const MarketTrade = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const parsed = slug ? parseSlug(slug) : null;
  const selected = parsed ?? { asset: "BTC", timeframe: "hourly" as const };
  const yesProb = useYesProb(selected.asset, selected.timeframe);

  const handleSelect = (m: { asset: string; timeframe: "hourly" | "daily" }) => {
    navigate(`/markets/${m.asset}-${m.timeframe}`, { replace: true });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <SEO
        title={`${selected.asset} ${selected.timeframe} | Predifi`}
        description="Trade prediction markets."
      />
      <Header />

      {/* 12-column grid: 3 / 6 / 3 — fills remaining viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">

        {/* ── Left (3 cols): scrollable market list ── */}
        <div className="col-span-3 border-r border-border hidden md:flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/markets")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Markets</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {ORDERED_MARKETS.map(({ asset, timeframe }) => (
                <div key={`${asset}-${timeframe}`} onClick={() => handleSelect({ asset, timeframe })} className="cursor-pointer">
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe={timeframe}
                    isSelected={selected.asset === asset && selected.timeframe === timeframe}
                    compact
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── Center (6 cols): chart → orderbook → positions ── */}
        <div className="col-span-12 md:col-span-6 flex flex-col overflow-hidden">
          {/* Chart — takes available space */}
          <div className="flex-1 min-h-0 p-3">
            <CoinbaseMarketCard asset={selected.asset} timeframe={selected.timeframe} expanded />
          </div>

          {/* Inline order book */}
          <OrderBookMini yesProb={yesProb} />

          {/* Positions table */}
          <PositionManagement />

          {/* Mobile back */}
          <div className="md:hidden p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => navigate("/markets")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
            </Button>
          </div>
        </div>

        {/* ── Right (3 cols): order form + rules (fixed, no scroll) ── */}
        <div className="col-span-3 border-l border-border hidden lg:flex flex-col overflow-hidden">
          {/* Order form — fixed height */}
          <OrderForm asset={selected.asset} yesProb={yesProb} />

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Market rules + TradingView link */}
          <MarketRules asset={selected.asset} timeframe={selected.timeframe} />
        </div>
      </div>
    </div>
  );
};

export default MarketTrade;
