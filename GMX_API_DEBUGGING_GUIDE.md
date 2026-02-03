# GMX API Debugging Guide

## Quick Test (Run in Browser Console)

1. Open your app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy and paste this code:

```javascript
// Test 1: Check if GMX API is reachable
fetch('https://arbitrum-api.gmxinfra.io/ping')
  .then(r => r.text())
  .then(data => console.log('✅ GMX Ping:', data))
  .catch(err => console.error('❌ GMX Ping failed:', err));

// Test 2: Check current prices
fetch('https://arbitrum-api.gmxinfra.io/prices/tickers')
  .then(r => r.json())
  .then(data => {
    const btc = data.find(t => t.tokenSymbol === 'BTC');
    const eth = data.find(t => t.tokenSymbol === 'ETH');
    const sol = data.find(t => t.tokenSymbol === 'SOL');
    
    console.log('📊 Current Prices:');
    if (btc) {
      const price = (parseFloat(btc.minPrice) + parseFloat(btc.maxPrice)) / 2 / 1e30;
      console.log(`  BTC: $${price.toLocaleString()}`);
    }
    if (eth) {
      const price = (parseFloat(eth.minPrice) + parseFloat(eth.maxPrice)) / 2 / 1e30;
      console.log(`  ETH: $${price.toLocaleString()}`);
    }
    if (sol) {
      const price = (parseFloat(sol.minPrice) + parseFloat(sol.maxPrice)) / 2 / 1e30;
      console.log(`  SOL: $${price.toLocaleString()}`);
    }
  })
  .catch(err => console.error('❌ Price fetch failed:', err));

// Test 3: Check candle data
fetch('https://arbitrum-api.gmxinfra.io/prices/candles?tokenSymbol=BTC&period=1h&limit=5')
  .then(r => r.json())
  .then(data => {
    console.log('📈 BTC Candles:', data.candles.length, 'candles');
    console.log('  Latest:', data.candles[0]);
  })
  .catch(err => console.error('❌ Candle fetch failed:', err));
```

## Using Built-in Debug Utilities

We've added debug utilities you can import in your components:

```typescript
import { testGmxApi, testPriceData, testCandleData, runAllTests } from '@/utils/gmx-debug';

// Run comprehensive test suite
runAllTests();

// Or run individual tests
testGmxApi();      // Test all endpoints
testPriceData();   // Test price formatting
testCandleData();  // Test chart data
```

## Common Issues and Solutions

### Issue 1: "All GMX API endpoints failed"

**Symptoms:**
- No prices showing
- Charts are blank
- Console shows API errors

**Causes:**
1. Rate limiting (too many requests)
2. Network/firewall blocking requests
3. GMX API temporarily down
4. CORS issues (if running locally without proper setup)

**Solutions:**
```bash
# Check if GMX API is accessible
curl https://arbitrum-api.gmxinfra.io/ping

# Check if you're rate limited (429 status)
curl -I https://arbitrum-api.gmxinfra.io/prices/tickers

# Try fallback endpoints
curl https://arbitrum-api-fallback.gmxinfra.io/ping
curl https://arbitrum-api-fallback.gmxinfra2.io/ping
```

### Issue 2: Prices show as $0 or NaN

**Symptoms:**
- Prices display as $0.00
- Console shows "NaN" or "undefined"

**Causes:**
1. Decimal conversion error
2. API returning unexpected format
3. Symbol mismatch

**Solutions:**
1. Check API response format:
```javascript
fetch('https://arbitrum-api.gmxinfra.io/prices/tickers')
  .then(r => r.json())
  .then(data => console.log('Raw API response:', data[0]));
```

2. Verify decimal conversion:
```javascript
const ticker = { minPrice: "95123456789012345678901234567890", maxPrice: "95223456789012345678901234567890" };
console.log('Min:', parseFloat(ticker.minPrice) / 1e30);  // Should be ~95123
console.log('Max:', parseFloat(ticker.maxPrice) / 1e30);  // Should be ~95223
```

### Issue 3: Charts not updating in real-time

**Symptoms:**
- Charts load but don't update
- "Live" indicator not showing

**Causes:**
1. WebSocket subscription not working
2. Polling interval too long
3. Component unmounted before subscription established

**Solutions:**
1. Check if subscription is active:
```typescript
// Add to TradingChart.tsx
useEffect(() => {
  console.log('🔄 Starting price subscription for:', gmxSymbol);
  const cleanup = subscribeToGmxPrices(...);
  return () => {
    console.log('🛑 Stopping price subscription');
    cleanup();
  };
}, [gmxSymbol]);
```

2. Verify polling is working:
```javascript
// In browser console, watch for polling activity
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('gmxinfra'))
  .forEach(e => console.log(e.name, e.duration + 'ms'));
```

### Issue 4: Order book shows fake data

**Status:** ✅ FIXED - We added a warning banner

The order book component was generating simulated liquidity data. GMX doesn't have a traditional order book (it uses liquidity pools). The component now shows:
- Warning banner explaining this
- Pool-based liquidity levels (still simulated but accurate conceptually)
- Option to hide the warning

## Network Tab Debugging

1. Open DevTools → Network tab
2. Filter by "gmxinfra"
3. Look for:

**Good signs:**
- Status 200 (OK)
- Response time < 1000ms
- Regular polling every 5 seconds

**Bad signs:**
- Status 429 (Rate Limited) → Reduce polling frequency
- Status 500+ (Server Error) → GMX API issue, try fallbacks
- Status 0 (Failed) → CORS or network issue
- Response time > 5000ms → Network latency issues

## Production Checklist

Before deploying:

- [ ] Test all 3 GMX API endpoints (primary + 2 fallbacks)
- [ ] Verify prices display correctly for BTC, ETH, SOL
- [ ] Confirm charts load within 3 seconds
- [ ] Check that error messages are user-friendly
- [ ] Verify real-time updates work (check "Live" indicator)
- [ ] Test with network throttling (DevTools → Network → Slow 3G)
- [ ] Verify fallback behavior when API is down
- [ ] Check console for no API errors during normal operation

## Monitoring in Production

Add this to your monitoring/logging:

```typescript
// Track API health
let apiFailureCount = 0;
let lastApiSuccess = Date.now();

// In your error handling:
if (error.type === 'all_endpoints_failed') {
  apiFailureCount++;
  const downtime = Date.now() - lastApiSuccess;
  
  // Alert if down for > 5 minutes
  if (downtime > 5 * 60 * 1000) {
    console.error('🚨 GMX API down for', downtime / 1000, 'seconds');
    // Send to your monitoring service (Sentry, DataDog, etc.)
  }
}
```

## Getting Help

If issues persist:

1. Check GMX official status: https://status.gmx.io
2. Check GMX Discord: https://discord.gg/gmx
3. Review our implementation: See GMX_IMPLEMENTATION_ANALYSIS.md
4. Check this repository's issues for similar problems

## Changes Made (Feb 3, 2026)

✅ Added comprehensive error handling
✅ Changed polling from 1s → 5s (reduced rate limiting)
✅ Added timeout handling (10s max per request)
✅ Added error boundaries for charts
✅ Added user-visible error messages
✅ Added retry buttons for failed operations
✅ Added jitter to prevent thundering herd
✅ Added warning banner to order book
✅ Created debug utilities (gmx-debug.ts)
✅ Added API health check component
