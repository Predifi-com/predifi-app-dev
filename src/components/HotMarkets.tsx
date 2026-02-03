import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePredifiMarkets } from "@/hooks/usePredifiMarkets";
import MarketCard from "@/components/MarketCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Flame } from "lucide-react";
import { useMemo } from "react";

export const HotMarkets = () => {
  // Fetch more markets and sort client-side to ensure we get the actual highest volume
  const { markets, isLoading } = usePredifiMarkets({
    status: 'open',
    limit: 50,
    sort_by: 'volumeTotal',
    sort_dir: 'desc',
    autoLoad: true,
  });

  const displayMarkets = useMemo(() => {
    // Normalize all markets first
    const normalized = markets.map((market, idx) => {
      const lastPriceYes = market.venues[0]?.metrics.lastPriceYes;
      const lastPriceNo = market.venues[0]?.metrics.lastPriceNo;
      
      const normalizePrice = (price: number | null | undefined) => {
        if (price == null) return 50;
        if (price > 1) return Math.round(price);
        return Math.round(price * 100);
      };
      
      const yesPercentage = normalizePrice(lastPriceYes);
      const noPercentage = normalizePrice(lastPriceNo);
      
      // Volume comes in raw units, divide by 1000000 for USD
      const volumeUSD = (market.aggregateMetrics.volumeTotal || 0) / 1000000;
      
      return {
        id: market.id,
        uniqueKey: `hot-${market.id}-${idx}`,
        title: market.title,
        yesPercentage,
        noPercentage,
        totalVolume: volumeUSD,
        venue: market.primaryVenue,
        imageUrl: market.imageUrl,
        category: market.category,
      };
    });
    
    // Sort by volume descending and take top 6
    return normalized
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 6);
  }, [markets]);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Hot Markets 🔥
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Hot Markets 🔥
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Highest volume markets right now
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMarkets.map((market) => (
            <MarketCard key={market.uniqueKey} {...market} animationsEnabled={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
