import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface MarketFiltersProps {
  venue?: string;
  sortBy?: string;
  onVenueChange?: (venue: string) => void;
  onSortChange?: (sort: string) => void;
}

export function MarketFilters({
  venue = 'all',
  sortBy = 'createdAt_desc',
  onVenueChange,
  onSortChange,
}: MarketFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Venue Filter */}
      <Select value={venue} onValueChange={onVenueChange}>
        <SelectTrigger className="w-[160px] rounded-full border-2">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="All Venues" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Venues</SelectItem>
          <SelectItem value="POLYMARKET">Polymarket</SelectItem>
          <SelectItem value="KALSHI">Kalshi</SelectItem>
          <SelectItem value="LIMITLESS">Limitless</SelectItem>
          <SelectItem value="PREDIFI_NATIVE">Predifi</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[160px] rounded-full border-2">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt_desc">Newest First</SelectItem>
          <SelectItem value="createdAt_asc">Oldest First</SelectItem>
          <SelectItem value="volumeTotal_desc">Highest Volume</SelectItem>
          <SelectItem value="volumeTotal_asc">Lowest Volume</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default MarketFilters;
