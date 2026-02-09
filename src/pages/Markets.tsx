import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { ConsensusWidget } from "@/components/ConsensusWidget";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fixed asset roster — exactly 5 assets × 2 timeframes = 10 cards
const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;

const Markets = () => {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO title="Markets | Predifi" description="Trade prediction markets on crypto majors with real-time data." />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main content — cards */}
          <div className="flex-1 min-w-0">
            {/* Header */}
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

            {/* 5 rows × 2 columns: Hourly | Daily per asset */}
            <div className="space-y-3">
              {ASSETS.map((asset) => (
                <div key={asset} className="grid grid-cols-2 gap-3">
                  {/* Row label */}
                  <div className="col-span-2 flex items-center gap-2 pt-2 first:pt-0">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{asset}</span>
                    <div className="flex-1 border-t border-border/50" />
                  </div>
                  <CoinbaseMarketCard asset={asset} timeframe="hourly" />
                  <CoinbaseMarketCard asset={asset} timeframe="daily" />
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Consensus Probability */}
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
