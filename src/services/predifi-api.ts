/**
 * Predifi API Service
 * Official API integration for Predifi Protocol
 * Base URL: https://api.predifi.com
 */

const BASE_URL = 'https://api.predifi.com';

// ============= API Response Types =============

export interface PredifiMarket {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  status: 'open' | 'closed' | 'settled' | 'cancelled';
  startTime: string;
  endTime: string;
  closeTime?: string | null;
  settlementTime?: string | null;
  settlementSource?: string | null;
  underlyingAsset?: string | null;
  imageUrl?: string;
  outcomes: Outcome[];
  primaryVenue: 'POLYMARKET' | 'KALSHI' | 'LIMITLESS' | 'PREDIFI_NATIVE';
  venues: VenueData[];
  aggregateMetrics: AggregateMetrics;
  groupId?: string | null;
  sport?: string | null;
  eventDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  index: number;
  name: string;
  venueLabel: string;
}

export interface VenueData {
  venue: string;
  metrics: VenueMetrics;
  raw?: object;
}

export interface VenueMetrics {
  lastPriceYes?: number | null;
  lastPriceNo?: number | null;
  lastPriceRaw?: number | null;
  volume24h?: number | null;
  volumeTotal: number;
  openInterest?: number | null;
  liquidity?: number | null;
}

export interface AggregateMetrics {
  volume24hTotal?: number | null;
  volumeTotal: number;
  venuesWithLiquidity: number;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface ListMarketsResponse {
  data: PredifiMarket[];
  pagination: Pagination;
}

export interface GetMarketByIdResponse {
  data: PredifiMarket;
}

// Native Market Types
export interface NativeMarketStatsResponse {
  marketId: string;
  volume24h: number;
  volumeTotal: number;
  openInterest: number;
  liquidity: number;
  lastPrice: number;
  priceChange24h: number;
  numTrades24h: number;
  timestamp: string;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  numOrders: number;
}

export interface OrderbookResponse {
  marketId: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: string;
}

export interface Trade {
  id: string;
  marketId: string;
  outcomeIndex: number;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  timestamp: string;
  buyOrderId?: string;
  sellOrderId?: string;
}

export interface TradesResponse {
  marketId: string;
  trades: Trade[];
  pagination?: {
    hasMore: boolean;
    cursor?: string;
  };
}

export interface OutcomePrices {
  outcomeIndex: number;
  outcomeName: string;
  bestBid: {
    price: number;
    size: number;
  } | null;
  bestAsk: {
    price: number;
    size: number;
  } | null;
  spread: number;
  midPrice: number;
}

export interface BestPricesResponse {
  marketId: string;
  outcomes: OutcomePrices[];
  timestamp: string;
}

// Trending Keywords Types
export interface TrendingMarket {
  id: string;
  title: string;
  volume: number;
  commentCount: number;
}

export interface TrendingKeyword {
  keyword: string;
  score: number;
  marketCount: number;
  totalVolume: number;
  totalComments: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  category: string;
  relatedKeywords: string[];
  markets: TrendingMarket[];
}

export interface TrendingKeywordsResponse {
  keywords: TrendingKeyword[];
  generatedAt: string;
  totalMarketsAnalyzed: number;
  timeWindow?: string;
  aiGenerated?: boolean;
  cached?: boolean;
}

// ============= API Service Class =============

class PredifiApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Predifi API request failed:', error);
      throw error;
    }
  }

  // ============= Market Service =============

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    services: { mongo: string; redis: string };
  }> {
    return this.request('/health');
  }

  /**
   * List markets with filters and pagination
   */
  async listMarkets(params?: {
    status?: 'open' | 'closed' | 'settled' | 'cancelled';
    venue?: 'POLYMARKET' | 'KALSHI' | 'LIMITLESS' | 'PREDIFI_NATIVE';
    category?: string;
    sport?: string;
    tag?: string;
    min_volume?: number;
    min_liquidity?: number;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }): Promise<ListMarketsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/markets${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<ListMarketsResponse>(endpoint);
  }

  /**
   * Search markets by text query
   */
  async searchMarkets(params: {
    q: string;
    status?: 'open' | 'closed' | 'settled' | 'cancelled';
    venue?: 'POLYMARKET' | 'KALSHI' | 'LIMITLESS' | 'PREDIFI_NATIVE';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListMarketsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<ListMarketsResponse>(`/api/markets/search?${queryParams}`);
  }

  /**
   * Get market by ID or slug
   */
  async getMarketById(id: string, includeRaw: boolean = false): Promise<GetMarketByIdResponse> {
    const params = includeRaw ? '?includeRaw=true' : '';
    return this.request<GetMarketByIdResponse>(`/api/markets/${id}${params}`);
  }

  // ============= Native Markets =============

  /**
   * List native markets only
   */
  async listNativeMarkets(params?: {
    status?: 'draft' | 'open' | 'closed' | 'settled' | 'cancelled';
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<ListMarketsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/api/native/markets${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<ListMarketsResponse>(endpoint);
  }

  /**
   * Get native market statistics
   */
  async getNativeMarketStats(marketId: string): Promise<NativeMarketStatsResponse> {
    return this.request<NativeMarketStatsResponse>(`/api/native/markets/${marketId}/stats`);
  }

  /**
   * Get native market orderbook
   */
  async getNativeMarketOrderbook(marketId: string): Promise<OrderbookResponse> {
    return this.request<OrderbookResponse>(`/api/native/markets/${marketId}/orderbook`);
  }

  /**
   * Get native market trades
   */
  async getNativeMarketTrades(marketId: string): Promise<TradesResponse> {
    return this.request<TradesResponse>(`/api/native/markets/${marketId}/trades`);
  }

  /**
   * Get best bid/ask prices for native market
   */
  async getNativeMarketBestPrices(marketId: string): Promise<BestPricesResponse> {
    return this.request<BestPricesResponse>(`/api/native/markets/${marketId}/best-prices`);
  }

  // ============= Vertex Service =============

  /**
   * Get trending keywords (via short alias)
   */
  async getTrendingKeywords(params?: {
    limit?: number;
    hours?: number;
    cache?: boolean;
  }): Promise<TrendingKeywordsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/trending${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.request<TrendingKeywordsResponse>(endpoint);
  }

  /**
   * Vertex service health check
   */
  async vertexHealthCheck(): Promise<{
    status: string;
    service: string;
    uptimeSeconds: number;
    env: { nodeEnv: string };
  }> {
    return this.request('/vertex/health');
  }
}

// Export singleton instance
export const predifiApi = new PredifiApiService();
