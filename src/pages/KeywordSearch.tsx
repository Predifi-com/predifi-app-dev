import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketCard from "@/components/MarketCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { usePredifiSearch } from "@/hooks/usePredifiSearch";
import { useSearchParams } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const KeywordSearch = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const [showClosed, setShowClosed] = useState(false);
  
  const { results, isLoading, error, search } = usePredifiSearch({
    status: showClosed ? undefined : 'open',
  });

  useEffect(() => {
    if (keyword) {
      search(keyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, showClosed]);

  // Convert Predifi markets to display format with deduplication
  const displayMarkets = useMemo(() => {
    // First, deduplicate by slug (keep first occurrence)
    const seenSlugs = new Set<string>();
    const deduplicated = results.filter(market => {
      if (seenSlugs.has(market.slug)) {
        console.warn('⚠️ Duplicate market found:', market.slug, market.title);
        return false;
      }
      seenSlugs.add(market.slug);
      return true;
    });

    console.log(`🔍 Search returned ${results.length} results, deduplicated to ${deduplicated.length}`);

    return deduplicated.map((market, idx) => {
      const lastPriceYes = market.venues[0]?.metrics.lastPriceYes;
      const lastPriceNo = market.venues[0]?.metrics.lastPriceNo;
      
      const normalizePrice = (price: number | null | undefined) => {
        if (price == null) return 50;
        if (price > 1) return Math.round(price);
        return Math.round(price * 100);
      };
      
      const yesPercentage = normalizePrice(lastPriceYes);
      const noPercentage = normalizePrice(lastPriceNo);
      const volumeUSD = (market.aggregateMetrics.volumeTotal || 0) / 1000000;
      
      return {
        id: market.id,
        uniqueKey: `${market.slug}-${idx}`, // Use slug for stability
        title: market.title,
        yesPercentage,
        noPercentage,
        totalVolume: volumeUSD,
        venue: market.primaryVenue,
        imageUrl: market.imageUrl,
        category: market.category,
      };
    });
  }, [results]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="px-3 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/markets">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Markets
              </Link>
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Search Results</h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Searching for:</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {keyword}
                </Badge>
                {!isLoading && (
                  <span className="text-muted-foreground">
                    ({displayMarkets.length} market{displayMarkets.length !== 1 ? 's' : ''} found)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="show-closed-keyword"
                  checked={showClosed}
                  onCheckedChange={setShowClosed}
                />
                <Label htmlFor="show-closed-keyword" className="text-sm cursor-pointer">
                  Include closed & settled markets
                </Label>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load search results</p>
            </div>
          )}

          {!isLoading && !error && displayMarkets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No markets found for "{keyword}"</p>
            </div>
          )}

          {!isLoading && !error && displayMarkets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayMarkets.map((market) => (
                <MarketCard 
                  key={market.uniqueKey} 
                  {...market} 
                  animationsEnabled={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default KeywordSearch;
