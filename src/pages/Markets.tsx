import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketFilters from "@/components/MarketFilters";
import { SEO } from "@/components/SEO";

import { useState, useEffect, useMemo } from "react";
import { useLocalMarkets } from "@/hooks/useLocalMarkets";
import { MinimalMarketCard } from "@/components/MinimalMarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { MarketFiltersSettings } from "@/components/MarketFiltersSettings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { extractGroupTitle, extractUniqueSegments } from "@/lib/market-label-utils";

const Markets = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [category, setCategory] = useState<string>(searchParams.get('category') || "all");
  const [venue, setVenue] = useState<string>(searchParams.get('venue') || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || "trending");
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

  // Sync category from URL (CategoryNav drives this)
  useEffect(() => {
    const urlCat = searchParams.get('category') || 'all';
    const urlVenue = searchParams.get('venue') || 'all';
    if (urlCat !== category) setCategory(urlCat);
    if (urlVenue !== venue) setVenue(urlVenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (category && category !== 'all') params.set('category', category);
    if (venue && venue !== 'all') params.set('venue', venue);
    if (sortBy !== 'trending') params.set('sort', sortBy);
    if (minVolume) params.set('minVolume', minVolume.toString());
    setSearchParams(params, { replace: true });
  }, [searchQuery, category, venue, sortBy, minVolume, setSearchParams]);

  // Filter markets
  const filteredMarkets = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return markets.filter(market => {
      // Search query
      if (query && !market.title.toLowerCase().includes(query)) return false;
      // Status
      if (!showClosed && market.status !== 'active') return false;
      // Venue
      if (venue && venue !== 'all') {
        if (market.venue?.toLowerCase() !== venue.toLowerCase()) return false;
      }
      // Category
      if (category && category !== 'all') {
        const marketCat = (market.category || '').toLowerCase();
        if (marketCat !== category.toLowerCase()) return false;
      }
      return true;
    });
  }, [markets, searchQuery, showClosed, venue, category]);

  // Group markets by group_id and transform into displayable items
  const displayMarkets = useMemo(() => {
    const groupMap = new Map<string, typeof filteredMarkets>();
    const standalone: typeof filteredMarkets = [];

    filteredMarkets.forEach(market => {
      if (market.outcomes && Array.isArray(market.outcomes) && market.outcomes.length > 2) {
        standalone.push(market);
        return;
      }
      if (market.group_id) {
        const existing = groupMap.get(market.group_id) || [];
        existing.push(market);
        groupMap.set(market.group_id, existing);
      } else {
        standalone.push(market);
      }
    });

    const items: Array<{ type: 'binary' | 'multi_outcome'; market: any }> = [];

    // Build grouped multi-outcome cards
    groupMap.forEach((groupMarkets, groupId) => {
      if (groupMarkets.length <= 2) {
        groupMarkets.forEach(m => standalone.push(m));
        return;
      }
      const first = groupMarkets[0];
      const totalVol = groupMarkets.reduce((s, m) => s + (m.volume_total || m.volume_24h || 0), 0);
      
      // Extract clean group title
      const groupTitle = extractGroupTitle(groupMarkets.map(m => m.title));

      // Extract short outcome labels
      const rawLabels = groupMarkets.map(m => (m as any).group_item_title || m.title);
      const shortLabels = extractUniqueSegments(rawLabels);
      const outcomes = groupMarkets.map((m, i) => ({
        label: shortLabels[i],
        probability: m.yes_price ?? 50,
      }));

      items.push({
        type: 'multi_outcome',
        market: {
          id: groupId,
          title: groupTitle,
          description: first.description || '',
          yesPercentage: 50,
          noPercentage: 50,
          totalVolume: totalVol,
          liquidity: groupMarkets.reduce((s, m) => s + (m.liquidity || 0), 0),
          volume24h: groupMarkets.reduce((s, m) => s + (m.volume_24h || 0), 0),
          openInterest: 0,
          endDate: first.resolution_date || first.expires_at || '',
          imageUrl: first.image_url || '',
          status: first.status,
          venue: first.venue || 'predifi',
          category: first.category || '',
          createdAt: first.created_at || '',
          trendingScore: first.trending_score || 0,
          marketType: 'multi_outcome' as const,
          outcomes,
        },
      });
    });

    // Build standalone cards
    standalone.forEach(market => {
      const apiOutcomes = market.outcomes;
      const isMulti = apiOutcomes && Array.isArray(apiOutcomes) && apiOutcomes.length > 2;
      const effectiveVolume = (market.volume_total || market.volume_24h || 0);

      items.push({
        type: isMulti ? 'multi_outcome' : 'binary',
        market: {
          id: market.id,
          title: market.title,
          description: market.description || '',
          yesPrice: (market.yes_price ?? 50) / 100,
          noPrice: (market.no_price ?? 50) / 100,
          yesPercentage: market.yes_price ?? 50,
          noPercentage: market.no_price ?? 50,
          totalVolume: effectiveVolume,
          liquidity: market.liquidity ?? 0,
          volume24h: market.volume_24h ?? 0,
          openInterest: market.open_interest ?? 0,
          endDate: market.resolution_date || market.expires_at || '',
          imageUrl: market.image_url || '',
          status: market.status,
          venue: market.venue || 'predifi',
          category: market.category || '',
          createdAt: market.created_at || '',
          trendingScore: market.trending_score || 0,
          marketType: isMulti ? 'multi_outcome' as const : 'binary' as const,
          outcomes: isMulti
            ? apiOutcomes.map((o: any) => ({ label: o.label || o.name, probability: Math.round((o.price ?? 0) * 100) }))
            : undefined,
        },
      });
    });

    // Sort items
    items.sort((a, b) => {
      const ma = a.market;
      const mb = b.market;
      switch (sortBy) {
        case 'trending':
          return (mb.trendingScore || 0) - (ma.trendingScore || 0);
        case 'liquidity_desc':
          return (mb.liquidity || 0) - (ma.liquidity || 0);
        case 'volume24h_desc':
          return (mb.volume24h || mb.totalVolume || 0) - (ma.volume24h || ma.totalVolume || 0);
        case 'createdAt_desc':
          return new Date(mb.createdAt || 0).getTime() - new Date(ma.createdAt || 0).getTime();
        case 'endingSoon': {
          const now = Date.now();
          const endA = new Date(ma.endDate || '2099-01-01').getTime();
          const endB = new Date(mb.endDate || '2099-01-01').getTime();
          // Only future dates; push past dates to end
          const aFuture = endA > now ? endA : Infinity;
          const bFuture = endB > now ? endB : Infinity;
          return aFuture - bFuture;
        }
        default:
          return 0;
      }
    });

    return items;
  }, [filteredMarkets, sortBy]);

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
              <MinimalMarketCard
                key={item.market.id}
                id={item.market.id}
                title={item.market.title}
                description={item.market.description}
                yesPercentage={item.market.yesPercentage}
                noPercentage={item.market.noPercentage}
                totalVolume={item.market.totalVolume}
                venue={item.market.venue}
                imageUrl={item.market.imageUrl}
                endDate={item.market.endDate}
                animationsEnabled={animationsEnabled}
                marketType={item.market.marketType}
                outcomes={item.market.outcomes}
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
