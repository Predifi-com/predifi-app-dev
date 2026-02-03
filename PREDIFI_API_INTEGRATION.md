# Predifi API Integration Guide

This guide covers the official Predifi API integration for the frontend.

## Base URL
```
https://api.predifi.com
```

## Services Available

### 1. Market Service
- **List Markets**: `/api/markets` - Get paginated markets from all venues
- **Search Markets**: `/api/markets/search` - Text search with filters
- **Get Market**: `/api/markets/:id` - Detailed market information
- **Native Markets**: `/api/native/markets` - Predifi-native markets only
- **Market Stats**: `/api/native/markets/:id/stats` - Real-time statistics
- **Orderbook**: `/api/native/markets/:id/orderbook` - Live order book
- **Trades**: `/api/native/markets/:id/trades` - Recent trades
- **Best Prices**: `/api/native/markets/:id/best-prices` - Best bid/ask

### 2. WebSocket Service
**URL**: `wss://predifi-ws-service-395321861753.us-east1.run.app/ws`

**Channels**:
- `orderbook` - Real-time order book updates
- `trades` - Live trade executions
- `ticker` - Market ticker data
- `stats` - Market statistics

### 3. Trending Keywords (Vertex Service)
- **Trending**: `/trending` - AI-generated trending keywords
- **Health**: `/vertex/health` - Service health check

## Frontend Implementation

### Using the API Service

```typescript
import { predifiApi } from '@/services/predifi-api';

// List all markets
const markets = await predifiApi.listMarkets({
  status: 'open',
  category: 'crypto',
  limit: 50
});

// Search markets
const results = await predifiApi.searchMarkets({
  q: 'bitcoin',
  venue: 'PREDIFI_NATIVE'
});

// Get market details
const market = await predifiApi.getMarketById('691b5e4083d4f79e27aae468');

// Get trending keywords
const trending = await predifiApi.getTrendingKeywords({ limit: 10 });
```

### Using React Hooks

```typescript
import { usePredifiMarkets } from '@/hooks/usePredifiMarkets';
import { useTrendingKeywords } from '@/hooks/useTrendingKeywords';

function MarketsPage() {
  const { markets, isLoading, loadMore, pagination } = usePredifiMarkets({
    status: 'open',
    category: 'crypto',
    limit: 50
  });

  const { keywords } = useTrendingKeywords(10);

  return (
    <div>
      {markets.map(market => (
        <MarketCard key={market.id} market={market} />
      ))}
      {pagination.hasMore && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### WebSocket Integration

```typescript
import { useWebSocket } from '@/providers/WebSocketProvider';

function MarketOrderbook({ marketId }) {
  const { service, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = service.subscribe(`market:${marketId}`, (event) => {
      if (event.type === 'orderbook_update') {
        setOrderbook(event.data);
      }
    });

    return unsubscribe;
  }, [marketId, isConnected, service]);
}
```

## API Response Types

All TypeScript types are available in `src/services/predifi-api.ts`:

- `PredifiMarket` - Complete market object
- `ListMarketsResponse` - Paginated market list
- `NativeMarketStatsResponse` - Market statistics
- `OrderbookResponse` - Order book data
- `TradesResponse` - Trade history
- `BestPricesResponse` - Best bid/ask prices
- `TrendingKeywordsResponse` - Trending keywords

## Rate Limiting

Rate limiting details are managed by the backend. Contact the backend team for specific limits.

## CORS

All API endpoints support cross-origin requests from authorized frontend domains.

## Health Checks

```typescript
// Market service health
const health = await predifiApi.healthCheck();

// Vertex service health
const vertexHealth = await predifiApi.vertexHealthCheck();
```

## Error Handling

```typescript
try {
  const markets = await predifiApi.listMarkets();
} catch (error) {
  console.error('API Error:', error);
  // Handle error appropriately
}
```

## Documentation

For complete API documentation, refer to the official Predifi API Reference (v1.1.0).
