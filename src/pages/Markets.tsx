import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketFilters from "@/components/MarketFilters";
import Sidebar from "@/components/Sidebar";
import { MarketSearch } from "@/components/MarketSearch";
import { SEO } from "@/components/SEO";

import { useState, useEffect, useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { usePredifiMarkets } from "@/hooks/usePredifiMarkets";
import { useMarketGroups } from "@/hooks/useMarketGroups";
import { MarketCardWrapper } from "@/components/MarketCardWrapper";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { MarketFiltersSettings } from "@/components/MarketFiltersSettings";
import { TrendingKeywords } from "@/components/TrendingKeywords";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const Markets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [category, setCategory] = useState<string>(searchParams.get('category') || "all");
  const [venue, setVenue] = useState<string>(searchParams.get('venue') || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || "createdAt_desc");
  const [minVolume, setMinVolume] = useState<number | undefined>(
    searchParams.get('minVolume') ? Number(searchParams.get('minVolume')) : undefined
  );
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (venue && venue !== 'all') params.set('venue', venue);
    if (sortBy !== 'createdAt_desc') params.set('sort', sortBy);
    if (minVolume) params.set('minVolume', minVolume.toString());
    setSearchParams(params, { replace: true });
  }, [category, venue, sortBy, minVolume, setSearchParams]);

  // Parse sort string into field and direction
  const [sortField, sortDir] = sortBy.split('_');

  // Transform markets into groups
  const { markets, isLoading, pagination, loadMore, refresh } = usePredifiMarkets({
    status: showClosed ? undefined : 'open',
    venue: (venue && venue !== 'all' ? venue : undefined) as any,
    category: (category && category !== 'all' ? category : undefined),
    limit: 24,
    sort_by: sortField,
    sort_dir: sortDir as 'asc' | 'desc',
    min_volume: minVolume,
    autoLoad: true,
  });

  // Refresh when filters change
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, venue, sortBy, minVolume, showClosed]);

  // Refresh handler
  const handleRefresh = async () => {
    await refresh();
    toast.success("Markets refreshed");
  };

  // Transform markets into groups and normalize
  const marketItems = useMarketGroups(markets);

  const displayMarkets = useMemo(() => {
    if (!marketItems.length) return [];

    const sorted = [...marketItems].sort((a, b) => {
      if (sortField === 'volumeTotal' || sortField === 'volume24h') {
        const aVol = a.type === 'group' ? a.group.totalVolume : a.market.totalVolume;
        const bVol = b.type === 'group' ? b.group.totalVolume : b.market.totalVolume;
        return sortDir === 'asc' ? aVol - bVol : bVol - aVol;
      }
      return 0;
    });

    return sorted;
  }, [marketItems, sortField, sortDir]);

  // Grid columns based on density
  const gridColsClass = density === 'compact' 
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    : density === 'spacious'
    ? 'grid-cols-1 lg:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO 
        title="Prediction Markets | Trade on Real-World Events | Predifi"
        description="Explore thousands of prediction markets on politics, crypto, sports & more. Trade with deep liquidity across Polymarket, Kalshi, Limitless and Predifi native markets."
      />
      <Header />
      <CategoryNav />
      
      {/* Filters Bar */}
      <div className="px-4 py-4 border-b border-border">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <MarketSearch open={showSearch} onClose={() => setShowSearch(false)} />
      </div>
      
      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Markets Grid */}
          <div className="lg:col-span-8 xl:col-span-9">
            <InfiniteScroll
              dataLength={displayMarkets.length}
              next={loadMore}
              hasMore={pagination.hasMore}
              loader={
                <div className={`grid ${gridColsClass} gap-4`}>
                  {[1, 2, 3, 4].map((n) => (
                    <MarketCardSkeleton key={n} />
                  ))}
                </div>
              }
              endMessage={
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <p className="text-xs uppercase tracking-wide">No more markets</p>
                </div>
              }
            >
              <div className={`grid ${gridColsClass} gap-4`}>
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <MarketCardSkeleton key={n} />
                    ))}
                  </>
                ) : (
                  displayMarkets.map((item) => (
                    <MarketCardWrapper
                      key={item.type === 'group' ? item.group.groupId : item.market.id}
                      item={item}
                      animationsEnabled={animationsEnabled}
                    />
                  ))
                )}
              </div>
            </InfiniteScroll>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 space-y-4">
              <TrendingKeywords />
              <Sidebar />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
