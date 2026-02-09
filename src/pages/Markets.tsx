import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { TradingLayout } from "@/components/markets/TradingLayout";
import { ConsensusWidget } from "@/components/ConsensusWidget";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;

const Markets = () => {
  const [selectedMarket, setSelectedMarket] = useState<{
    asset: string;
    timeframe: "hourly" | "daily";
  } | null>(null);

  // Trading layout view
  if (selectedMarket) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={`${selectedMarket.asset} ${selectedMarket.timeframe} | Predifi`} description="Trade prediction markets." />
        <Header />
        <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Left: all cards as selectable list */}
          <div className="w-64 xl:w-72 border-r border-border flex-shrink-0 hidden md:flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelectedMarket(null)}>
                ← Back
              </Button>
            </div>
            <div className="p-2 space-y-2">
              {ASSETS.map((asset) =>
                (["hourly", "daily"] as const).map((tf) => (
                  <div
                    key={`${asset}-${tf}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket({ asset, timeframe: tf });
                    }}
                    className="cursor-pointer"
                  >
                    <CoinbaseMarketCard
                      asset={asset}
                      timeframe={tf}
                      isSelected={selectedMarket.asset === asset && selectedMarket.timeframe === tf}
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center: full chart */}
          <div className="flex-1 min-w-0 flex flex-col p-4 overflow-auto">
            <CoinbaseMarketCard
              asset={selectedMarket.asset}
              timeframe={selectedMarket.timeframe}
              expanded
            />
            {/* Mobile back */}
            <div className="md:hidden mt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedMarket(null)} className="w-full">
                ← Back to Markets
              </Button>
            </div>
          </div>

          {/* Right: consensus */}
          <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 hidden lg:flex flex-col p-4 overflow-y-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Consensus Probability
            </h2>
            <ConsensusWidget />
          </div>
        </div>
      </div>
    );
  }

  // Default: curated grid
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
              {ASSETS.map((asset) => (
                <div key={asset} className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex items-center gap-2 pt-2 first:pt-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{asset}</span>
                    <div className="flex-1 border-t border-border/50" />
                  </div>
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe="hourly"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket({ asset, timeframe: "hourly" });
                    }}
                  />
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe="daily"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMarket({ asset, timeframe: "daily" });
                    }}
                  />
                </div>
              ))}
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
