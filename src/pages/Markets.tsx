import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { TradingOrderbook } from "@/components/markets/TradingOrderbook";
import { PositionManagement } from "@/components/markets/PositionManagement";
import { ConsensusWidget } from "@/components/ConsensusWidget";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoinbaseCandles } from "@/hooks/useCoinbaseCandles";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
const TIMEFRAMES = ["hourly", "daily"] as const;

/** Build ordered list: all hourly first, then all daily */
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

/** Helper to get YES probability for the trading orderbook */
function useYesProb(asset: string, timeframe: "hourly" | "daily") {
  const data = useCoinbaseCandles(asset);
  const baseline = timeframe === "daily" ? data.dailyBaseline : data.hourlyBaseline;
  if (baseline <= 0 || data.currentPrice <= 0) return 50;
  const diff = ((data.currentPrice - baseline) / baseline) * 100;
  return Math.min(95, Math.max(5, 50 + diff * 25));
}

function TradingView({
  selected,
  onBack,
  onSelect,
}: {
  selected: { asset: string; timeframe: "hourly" | "daily" };
  onBack: () => void;
  onSelect: (m: { asset: string; timeframe: "hourly" | "daily" }) => void;
}) {
  const yesProb = useYesProb(selected.asset, selected.timeframe);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={`${selected.asset} ${selected.timeframe} | Predifi`} description="Trade prediction markets." />
      <Header />
      <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left: scrollable market list — hourly first, then daily */}
        <div className="w-64 xl:w-72 border-r border-border flex-shrink-0 hidden md:flex flex-col">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Markets</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* Hourly section */}
              <div className="px-2 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hourly</span>
              </div>
              {ASSETS.map((asset) => (
                <div
                  key={`${asset}-hourly`}
                  onClick={() => onSelect({ asset, timeframe: "hourly" })}
                  className="cursor-pointer"
                >
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe="hourly"
                    isSelected={selected.asset === asset && selected.timeframe === "hourly"}
                    compact
                  />
                </div>
              ))}
              {/* Daily section */}
              <div className="px-2 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily</span>
              </div>
              {ASSETS.map((asset) => (
                <div
                  key={`${asset}-daily`}
                  onClick={() => onSelect({ asset, timeframe: "daily" })}
                  className="cursor-pointer"
                >
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe="daily"
                    isSelected={selected.asset === asset && selected.timeframe === "daily"}
                    compact
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center: chart (fixed, no scroll) + position management */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 p-4">
            <CoinbaseMarketCard
              asset={selected.asset}
              timeframe={selected.timeframe}
              expanded
            />
          </div>
          {/* Position management below chart */}
          <PositionManagement />
          {/* Mobile back */}
          <div className="md:hidden p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
            </Button>
          </div>
        </div>

        {/* Right: orderbook (fixed, no scroll) */}
        <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 hidden lg:flex flex-col overflow-hidden">
          <TradingOrderbook asset={selected.asset} yesProb={yesProb} />
        </div>
      </div>
    </div>
  );
}

const Markets = () => {
  const [selectedMarket, setSelectedMarket] = useState<{
    asset: string;
    timeframe: "hourly" | "daily";
  } | null>(null);

  if (selectedMarket) {
    return (
      <TradingView
        selected={selectedMarket}
        onBack={() => setSelectedMarket(null)}
        onSelect={setSelectedMarket}
      />
    );
  }

  // Default: curated grid — hourly first, then daily
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO title="Markets | Predifi" description="Trade prediction markets on crypto majors with real-time data." />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
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

            <div className="space-y-3">
              {/* Hourly section */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hourly</span>
                <div className="flex-1 border-t border-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ASSETS.map((asset) => (
                  <CoinbaseMarketCard
                    key={`${asset}-hourly`}
                    asset={asset}
                    timeframe="hourly"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket({ asset, timeframe: "hourly" });
                    }}
                  />
                ))}
              </div>

              {/* Daily section */}
              <div className="flex items-center gap-2 pt-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Daily</span>
                <div className="flex-1 border-t border-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ASSETS.map((asset) => (
                  <CoinbaseMarketCard
                    key={`${asset}-daily`}
                    asset={asset}
                    timeframe="daily"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket({ asset, timeframe: "daily" });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Consensus Probability
              </h2>
              <ConsensusWidget />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
