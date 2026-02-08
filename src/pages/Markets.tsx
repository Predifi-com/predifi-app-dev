import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketFilters from "@/components/MarketFilters";
import Sidebar from "@/components/Sidebar";
import { MarketSearch } from "@/components/MarketSearch";
import { SEO } from "@/components/SEO";

import { useState, useEffect, useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useLocalMarkets } from "@/hooks/useLocalMarkets";
import { MarketCardWrapper } from "@/components/MarketCardWrapper";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { MarketFiltersSettings } from "@/components/MarketFiltersSettings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

const Markets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [category, setCategory] = useState<string>(searchParams.get('category') || "all");
  const [venue, setVenue] = useState<string>(searchParams.get('venue') || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || "createdAt_desc");
  const [minVolume, setMinVolume] = useState<number | undefined>(
    searchParams.get('minVolume') ? Number(searchParams.get('minVolume')) : undefined
  );
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  // Fetch markets from local backend
  const { markets, loading: isLoading, error } = useLocalMarkets();

  // Display error if markets fail to load
  useEffect(() => {
    if (error) {
      toast.error("Failed to load markets from PrediFi API.");
    }
  }, [error]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category && category !== 'all') params.set('category', category);
    if (venue && venue !== 'all') params.set('venue', venue);
    if (sortBy !== 'createdAt_desc') params.set('sort', sortBy);
    if (minVolume) params.set('minVolume', minVolume.toString());
    setSearchParams(params, { replace: true });
  }, [searchQuery, category, venue, sortBy, minVolume, setSearchParams]);

  // Parse sort string into field and direction
  const [sortField, sortDir] = sortBy.split('_');

  // Filter and transform markets
  const filteredMarkets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return markets
      .filter(market => {
        // Filter by search query
        if (query && !market.title.toLowerCase().includes(query)) return false;
        
        // Filter by status
        if (!showClosed && market.status !== 'active') return false;
        
        // Filter by venue
        if (venue && venue !== 'all') {
          if (market.venue?.toLowerCase() !== venue.toLowerCase()) return false;
        }
        
        return true;
      });
  }, [markets, searchQuery, showClosed, venue]);

  // Transform markets into displayable items
  const displayMarkets = useMemo(() => {
    return filteredMarkets.map(market => {
      // Detect multi-outcome from API data
      const apiOutcomes = (market as any).outcomes;
      const isMulti = apiOutcomes && Array.isArray(apiOutcomes) && apiOutcomes.length > 2;

      return {
        type: 'binary' as const,
        market: {
          id: market.id,
          title: market.title,
          description: market.description || '',
          yesPrice: (market.yes_price ?? 50) / 100,
          noPrice: (market.no_price ?? 50) / 100,
          yesPercentage: market.yes_price ?? 50,
          noPercentage: market.no_price ?? 50,
          totalVolume: market.volume_total ?? 0,
          liquidity: market.liquidity ?? 0,
          volume24h: market.volume_24h ?? 0,
          openInterest: market.open_interest ?? 0,
          endDate: market.resolution_date || market.expires_at || '',
          imageUrl: market.image_url || '',
          status: market.status,
          venue: market.venue || 'predifi',
          category: market.category || '',
          createdAt: market.created_at || '',
          marketType: isMulti ? 'multi_outcome' as const : 'binary' as const,
          outcomes: isMulti
            ? apiOutcomes.map((o: any) => ({ label: o.label || o.name, probability: o.probability ?? o.price ?? 0 }))
            : undefined,
        }
      };
    });
  }, [filteredMarkets]);

  // Refresh handler
  const handleRefresh = async () => {
    window.location.reload();
    toast.success("Markets refreshed");
  };

  // Grid columns based on density
  const gridColsClass = density === 'compact' 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
    : density === 'spacious'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO 
        title="Prediction Markets | Trade on Real-World Events | Predifi"
        description="Explore thousands of prediction markets on politics, crypto, sports & more. Trade with deep liquidity across Polymarket, Kalshi, Limitless and Predifi native markets."
      />
      <Header />
      <CategoryNav />
      
      {/* Search & Filters Bar */}
      <div className="px-4 py-4 border-b border-border">
        {/* Search Bar */}
        <div className="relative mb-3 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <MarketFilters 
              venue={venue}
              sortBy={sortBy}
              onVenueChange={setVenue}
              onSortChange={setSortBy}
            />
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md">
              <Switch
                id="show-closed-markets"
                checked={showClosed}
                onCheckedChange={setShowClosed}
              />
              <Label htmlFor="show-closed-markets" className="text-xs cursor-pointer whitespace-nowrap">
                Show closed
              </Label>
            </div>
            <MarketFiltersSettings
              animationsEnabled={animationsEnabled}
              onAnimationsChange={setAnimationsEnabled}
              minVolume={minVolume}
              onMinVolumeChange={setMinVolume}
              density={density}
              onDensityChange={setDensity}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Markets Grid */}
          <div className="lg:col-span-12">
            <div className={`grid ${gridColsClass} gap-4`}>
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <MarketCardSkeleton key={n} />
                  ))}
                </>
              ) : displayMarkets.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p className="text-sm">No markets found.</p>
                </div>
              ) : (
                displayMarkets.map((item) => (
                  <MarketCardWrapper
                    key={item.market.id}
                    item={item}
                    animationsEnabled={animationsEnabled}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
