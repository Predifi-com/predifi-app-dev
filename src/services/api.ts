import type {
  Market,
  MarketFilters,
  MarketSort,
  PaginationCursor,
  MarketListResponse,
  Orderbook,
  Trade,
  OHLCData,
  TimeFrame,
  PriceDistribution,
  VolumeAnalytics,
  MarketStats,
  SearchSuggestion,
} from "@/types/market";
import type {
  QuoteRequest,
  QuoteResponse,
  DepositTransaction,
  Order,
  LockedBalance,
} from "@/types/trading";
import type {
  Position,
  Transaction,
  PortfolioSummary,
  UserAnalytics,
  RedemptionQuote,
} from "@/types/portfolio";
import type { Vault, UserVaultPosition, VaultTransaction } from "@/types/vault";

// TODO: Replace with your actual API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.predifi.io";

class ApiService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============= Market Discovery =============
  
  async getMarkets(
    filters?: MarketFilters,
    sort?: MarketSort,
    pagination?: PaginationCursor
  ): Promise<MarketListResponse> {
    const params = new URLSearchParams();
    
    if (filters?.venue) params.append("venue", filters.venue.join(","));
    if (filters?.status) params.append("status", filters.status.join(","));
    if (filters?.category) params.append("category", filters.category.join(","));
    if (filters?.chain) params.append("chain", filters.chain.join(","));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.minLiquidity) params.append("minLiquidity", filters.minLiquidity.toString());
    if (filters?.maxLiquidity) params.append("maxLiquidity", filters.maxLiquidity.toString());
    
    if (sort) {
      params.append("sortBy", sort.field);
      params.append("sortDir", sort.direction);
    }
    
    if (pagination?.cursor) params.append("cursor", pagination.cursor);
    if (pagination?.limit) params.append("limit", pagination.limit.toString());

    return this.request<MarketListResponse>(`/markets?${params.toString()}`);
  }

  async getTrendingMarkets(limit: number = 10): Promise<Market[]> {
    return this.request<Market[]>(`/markets/trending?limit=${limit}`);
  }

  async searchMarkets(query: string): Promise<Market[]> {
    return this.request<Market[]>(`/markets/search?q=${encodeURIComponent(query)}`);
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    return this.request<SearchSuggestion[]>(`/markets/suggestions?q=${encodeURIComponent(query)}`);
  }

  // ============= Market Details =============
  
  async getMarketById(marketId: string): Promise<Market> {
    return this.request<Market>(`/markets/${marketId}`);
  }

  async getMarketStats(marketId: string): Promise<MarketStats> {
    return this.request<MarketStats>(`/markets/${marketId}/stats`);
  }

  // ============= Trading Data =============
  
  async getOrderbook(marketId: string): Promise<Orderbook> {
    return this.request<Orderbook>(`/markets/${marketId}/orderbook`);
  }

  async getTradeHistory(marketId: string, limit: number = 50): Promise<Trade[]> {
    return this.request<Trade[]>(`/markets/${marketId}/trades?limit=${limit}`);
  }

  async getOHLC(
    marketId: string,
    timeframe: TimeFrame,
    from?: number,
    to?: number
  ): Promise<OHLCData[]> {
    const params = new URLSearchParams({ timeframe });
    if (from) params.append("from", from.toString());
    if (to) params.append("to", to.toString());
    
    return this.request<OHLCData[]>(`/markets/${marketId}/ohlc?${params.toString()}`);
  }

  async getPriceDistribution(marketId: string): Promise<PriceDistribution[]> {
    return this.request<PriceDistribution[]>(`/markets/${marketId}/price-distribution`);
  }

  async getVolumeAnalytics(marketId: string): Promise<VolumeAnalytics> {
    return this.request<VolumeAnalytics>(`/markets/${marketId}/volume-analytics`);
  }

  // ============= Quote & Trading =============
  
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    return this.request<QuoteResponse>("/trading/quote", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async buildDepositTransaction(
    marketId: string,
    side: "buy" | "sell",
    amount: number,
    slippage: number
  ): Promise<DepositTransaction> {
    return this.request<DepositTransaction>("/trading/deposit", {
      method: "POST",
      body: JSON.stringify({ marketId, side, amount, slippage }),
    });
  }

  async getOrders(userAddress: string): Promise<Order[]> {
    return this.request<Order[]>(`/trading/orders/${userAddress}`);
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/trading/orders/${orderId}/cancel`, {
      method: "POST",
    });
  }

  async getLockedBalance(userAddress: string): Promise<LockedBalance[]> {
    return this.request<LockedBalance[]>(`/trading/locked-balance/${userAddress}`);
  }

  // ============= Portfolio =============
  
  async getPositions(userAddress: string): Promise<Position[]> {
    return this.request<Position[]>(`/portfolio/${userAddress}/positions`);
  }

  async getTransactions(userAddress: string, limit: number = 50): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/portfolio/${userAddress}/transactions?limit=${limit}`);
  }

  async getPortfolioSummary(userAddress: string): Promise<PortfolioSummary> {
    return this.request<PortfolioSummary>(`/portfolio/${userAddress}/summary`);
  }

  async getUserAnalytics(userAddress: string): Promise<UserAnalytics> {
    return this.request<UserAnalytics>(`/portfolio/${userAddress}/analytics`);
  }

  // ============= Redemption =============
  
  async getRedemptionQuote(marketId: string, positionSize: number): Promise<RedemptionQuote> {
    return this.request<RedemptionQuote>("/redemption/quote", {
      method: "POST",
      body: JSON.stringify({ marketId, positionSize }),
    });
  }

  async redeemPosition(marketId: string): Promise<{ txHash: string }> {
    return this.request<{ txHash: string }>(`/redemption/${marketId}`, {
      method: "POST",
    });
  }

  // ============= Vault Operations =============
  
  async getVaults(): Promise<Vault[]> {
    return this.request<Vault[]>("/vaults");
  }

  async getVaultById(vaultId: string): Promise<Vault> {
    return this.request<Vault>(`/vaults/${vaultId}`);
  }

  async getUserVaultPositions(userAddress: string): Promise<UserVaultPosition[]> {
    return this.request<UserVaultPosition[]>(`/vaults/positions/${userAddress}`);
  }

  async depositToVault(vaultId: string, amount: number): Promise<{ txHash: string }> {
    return this.request<{ txHash: string }>(`/vaults/${vaultId}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async withdrawFromVault(vaultId: string, shares: number): Promise<{ txHash: string }> {
    return this.request<{ txHash: string }>(`/vaults/${vaultId}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ shares }),
    });
  }

  async getVaultTransactions(vaultId: string, userAddress: string): Promise<VaultTransaction[]> {
    return this.request<VaultTransaction[]>(`/vaults/${vaultId}/transactions/${userAddress}`);
  }

  // ============= System Health =============
  
  async getSystemHealth(): Promise<{
    backend: boolean;
    relayer: boolean;
    chains: Record<string, boolean>;
  }> {
    return this.request("/health");
  }
}

export const apiService = new ApiService();
