# GMX Native Frontend Implementation Analysis

**Date:** February 3, 2026  
**Source:** GMX Official Documentation + gmx-io/gmx-interface repository

---

## 🎯 Overview: Running GMX Natively

GMX protocol allows anyone to **run their own frontend** to interact with the smart contracts. This means you can:
- Deploy your own instance of the GMX UI
- Configure custom RPC endpoints
- Set your own UI fee receiver (earn fees on orders)
- Customize the trading experience

---

## 📋 Key Configuration Options

### 1. **Environment Variables (.env file)**

From GMX docs, you need to configure:

```bash
# .env file for GMX frontend

# UI Fee Receiver (YOUR address receives fees on orders)
REACT_APP_UI_FEE_RECEIVER=0xYourAddressHere

# Custom RPC URLs (optional, improves performance)
REACT_APP_ARBITRUM_RPC_URLS=["https://arb1.arbitrum.io/rpc","https://your-rpc.com"]
REACT_APP_AVALANCHE_RPC_URLS=["https://api.avax.network/ext/bc/C/rpc"]
REACT_APP_BOTANIX_RPC_URLS=["https://rpc.ankr.com/botanix_mainnet"]
```

### 2. **UI Fee Structure**

**How UI Fees Work:**
- GMX charges a **base fee** on all trades (goes to GMX protocol)
- Frontends can charge an **additional UI fee** (goes to you)
- **Your fee receiver address** gets paid when orders execute

**From GMX contracts:**
```typescript
// UI Fee is charged on top of base fees
interface Order {
  uiFeeReceiver: address;  // Your address
  // Order executes → You get paid
}
```

**Important:** 
- UI fees only work for **orders** (trades)
- Deposits/withdrawals don't support UI fees (need custom code)

### 3. **RPC Configuration**

GMX frontend has **sophisticated RPC fallback logic**:

```typescript
// From gmx-interface/src/config/rpc.ts
const RPC_CONFIGS = {
  [ARBITRUM]: [
    // Public endpoints (free, rate-limited)
    { url: "https://arb1.arbitrum.io/rpc", isPublic: true, purpose: "default" },
    
    // Private Alchemy endpoints (paid, faster)
    { url: "https://arb-mainnet.g.alchemy.com/v2/KEY", isPublic: false, purpose: "fallback" },
    { url: "https://arb-mainnet.g.alchemy.com/v2/KEY2", isPublic: false, purpose: "largeAccount" },
    { url: "https://arb-mainnet.g.alchemy.com/v2/KEY3", isPublic: false, purpose: "express" },
  ]
};
```

**RPC Purpose Types:**
- `default` - Used for normal users
- `fallback` - Backup when primary fails
- `largeAccount` - For users with large positions (faster)
- `express` - Ultra-low latency for time-sensitive operations

**RPC Fallback Tracker:**
```typescript
// Automatically switches RPCs if one fails
export class RpcTracker {
  // Tests RPC health every 10 seconds
  // Switches to fastest working endpoint
  // Bans endpoints after 3 consecutive failures
}
```

---

## 🏗️ Architecture: How GMX Frontend Works

### Core Components:

#### 1. **Oracle Keeper Fetcher** (Price Data)
```typescript
// src/lib/oracleKeeperFetcher/oracleKeeperFetcher.ts
export class OracleKeeperFetcher {
  mainUrl = "https://arbitrum-api.gmxinfra.io";
  fallbacks = [
    "https://arbitrum-api-fallback.gmxinfra.io",
    "https://arbitrum-api-fallback.gmxinfra2.io"
  ];
  
  // Fetches prices, candles, APYs, etc.
  fetchTickers(): Promise<TickersResponse>;
  fetchOracleCandles(symbol, period, limit): Promise<Bar[]>;
  fetch24hPrices(): Promise<DayPriceCandle[]>;
}
```

**Key Configuration:**
```typescript
// sdk/src/configs/oracleKeeper.ts
export const ORACLE_FALLBACK_TRACKER_CONFIG = {
  trackInterval: 10 * 1000,     // Test health every 10s
  checkTimeout: 10 * 1000,      // 10s timeout per request
  cacheTimeout: 5 * 60 * 1000,  // Cache results for 5 mins
  failuresBeforeBan: {
    count: 3,                    // Ban after 3 failures
    window: 60 * 1000,           // Within 1 minute
  },
};
```

#### 2. **GMX SDK** (Smart Contract Interactions)
```typescript
// sdk/src/clients/v1/index.ts
export class GmxSdk {
  constructor(config: {
    chainId: number;
    rpcUrl: string;
    oracleUrl: string;
    subsquidUrl?: string;
    walletClient: WalletClient;
  }) {
    this.markets = new Markets(this);
    this.orders = new Orders(this);
    this.positions = new Positions(this);
    this.tokens = new Tokens(this);
  }
}
```

**SDK Configuration:**
```typescript
const sdk = new GmxSdk({
  chainId: 42161,                                           // Arbitrum
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  oracleUrl: "https://arbitrum-api.gmxinfra.io",            // Price data
  subsquidUrl: "https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql",
  walletClient: useWallet().walletClient,
});
```

#### 3. **Contract Addresses**
```typescript
// sdk/src/configs/contracts.ts
const CONTRACTS = {
  [ARBITRUM]: {
    DataStore: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8",
    Reader: "0xf60becbba223EEA9495Da3f606753867eC10d139",
    ExchangeRouter: "0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8",
    SubaccountRouter: "0xB6C5C0E7c97B5c10FDf7b3c8cB869F7b1c2D1aC6",
    OrderVault: "0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5",
    DepositVault: "0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55",
    WithdrawalVault: "0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55",
    EventEmitter: "0xC8ee91A54287DB53897056e12D9819156D3822Fb",
  }
};
```

#### 4. **WebSocket Support** (On-Chain Events)
```typescript
// src/context/WebsocketContext/subscribeToEvents.ts
export function subscribeToV2Events({ chainId, account }) {
  const client = createPublicClient({
    transport: webSocket('wss://arb1.arbitrum.io/rpc')
  });
  
  // Listen to real-time contract events
  client.watchContractEvent({
    address: GMX_EVENT_EMITTER,
    abi: EventEmitterAbi,
    eventName: 'EventLog1',
    onLogs: (logs) => {
      // Real-time order executions, position updates, etc.
    }
  });
}
```

**What WebSocket Provides:**
- ✅ Real-time order execution notifications
- ✅ Position updates (leverage changes, liquidations)
- ✅ Token transfers (deposits, withdrawals)
- ✅ Approvals (ERC20 token approvals)
- ❌ **NOT for price updates** (prices come from REST API)

---

## 📊 Lovable's Implementation vs GMX Native

### Architecture Comparison:

| Component | GMX Native | Lovable's Implementation | Status |
|-----------|-----------|-------------------------|--------|
| **Price Data** | OracleKeeperFetcher | gmx-api.ts | ✅ Correct |
| **API Endpoints** | arbitrum-api.gmxinfra.io | Same | ✅ Correct |
| **Fallback URLs** | 2 fallbacks with auto-switch | 2 fallbacks with manual switch | ⚠️ Could improve |
| **RPC Management** | RpcTracker with health checks | Not implemented | ❌ Missing |
| **WebSocket Events** | Full implementation | Not implemented | ❌ Missing |
| **SDK Usage** | @gmx-io/sdk | @gmx-io/sdk | ✅ Correct |
| **Error Handling** | Comprehensive with metrics | Basic (improved after fixes) | ✅ Fixed |
| **Polling Interval** | 1s (PRICES_UPDATE_INTERVAL) | 5s (safer) | ✅ Better |
| **UI Fee Receiver** | Configurable via .env | Not configured | ❌ Missing |

---

## 🚀 What Lovable Should Add

### Priority 1: UI Fee Receiver (Revenue Generation)

**Current State:** Not configured  
**Impact:** You're missing out on trading fees

**Implementation:**
```typescript
// 1. Add to .env
VITE_UI_FEE_RECEIVER=0xYourAddressHere

// 2. Update gmx-sdk.ts
const uiFeeReceiver = import.meta.env.VITE_UI_FEE_RECEIVER;

// 3. Pass to order creation
sdk.orders.createIncreaseOrder({
  ...orderParams,
  uiFeeReceiver: uiFeeReceiver || '0x0000000000000000000000000000000000000000'
});
```

**Revenue Estimate:**
- UI fee: ~0.05-0.1% of trade volume
- $1M daily volume = $500-$1000/day revenue

### Priority 2: RPC Fallback System

**Current State:** Manual fallback in gmx-api.ts  
**Impact:** If primary API fails, app might be slow to recover

**GMX's Implementation:**
```typescript
// src/lib/rpc/RpcTracker.ts
export class RpcTracker {
  constructor() {
    this.fallbackTracker = new FallbackTracker({
      trackInterval: 10 * 1000,      // Health check every 10s
      checkTimeout: 10 * 1000,       // 10s timeout
      failuresBeforeBan: { count: 3 }  // Ban after 3 failures
    });
  }
  
  async checkRpc(endpoint: string): Promise<RpcCheckResult> {
    // 1. Fetch block number
    const blockNumber = await fetchBlockNumber(endpoint);
    
    // 2. Check if block is stale (lagging behind)
    if (blockNumber < highestBlock - threshold) {
      throw new Error('RPC is lagging');
    }
    
    // 3. Return health metrics
    return { blockNumber, responseTime };
  }
}
```

**What This Provides:**
- Automatic RPC switching on failure
- Block staleness detection
- Performance ranking (uses fastest RPC)
- Ban lists (excludes broken RPCs)

**Recommendation:**
```typescript
// Create src/services/gmx-rpc-tracker.ts
import { RpcTracker } from '@gmx-io/sdk/rpc';

export const gmxRpcTracker = new RpcTracker({
  chainId: 42161,
  endpoints: [
    { url: 'https://arb1.arbitrum.io/rpc', isPublic: true },
    { url: import.meta.env.VITE_ARBITRUM_RPC_URL, isPublic: false }
  ]
});

// Use in SDK initialization
const bestRpc = gmxRpcTracker.pickCurrentRpcUrls().primary;
```

### Priority 3: WebSocket Event Subscriptions

**Current State:** Not implemented  
**Impact:** Users don't get real-time order/position updates

**GMX's Implementation:**
```typescript
// src/context/WebsocketContext/subscribeToEvents.ts
export function subscribeToV2Events({
  chainId,
  account,
  eventLogHandlers
}) {
  const wsClient = createPublicClient({
    transport: webSocket('wss://arb1.arbitrum.io/rpc')
  });
  
  // Subscribe to GMX EventEmitter
  wsClient.watchContractEvent({
    address: '0xC8ee91A54287DB53897056e12D9819156D3822Fb',
    abi: EventEmitterAbi,
    eventName: 'EventLog1',
    args: { account },  // Filter by user
    onLogs: (logs) => {
      for (const log of logs) {
        const eventName = log.args.eventName;
        const eventData = parseEventLogData(log.args.eventData);
        
        // Handle different event types
        switch(eventName) {
          case 'OrderExecuted':
            showToast('Your order was executed!');
            refreshPositions();
            break;
          case 'PositionIncrease':
            updatePositionUI(eventData);
            break;
          case 'OrderCancelled':
            showToast('Order cancelled');
            break;
        }
      }
    }
  });
}
```

**What This Enables:**
- ✅ Instant order execution notifications
- ✅ Real-time position updates (no polling)
- ✅ Liquidation warnings
- ✅ Deposit/withdrawal confirmations

**Recommendation:**
```typescript
// Create src/hooks/useGmxEvents.ts
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { subscribeToV2Events } from './gmx-events';

export function useGmxEvents() {
  const { address } = useAccount();
  
  useEffect(() => {
    if (!address) return;
    
    const unsubscribe = subscribeToV2Events({
      chainId: 42161,
      account: address,
      eventLogHandlers: {
        'OrderExecuted': (data) => {
          console.log('Order executed:', data);
          // Show notification, refresh UI
        },
        'PositionIncrease': (data) => {
          console.log('Position increased:', data);
          // Update position display
        }
      }
    });
    
    return unsubscribe;
  }, [address]);
}
```

### Priority 4: Advanced Fallback Logic

**GMX's Oracle Keeper Fallback:**
```typescript
// src/lib/oracleKeeperFetcher/OracleFallbackTracker.ts
export class OracleKeeperFallbackTracker {
  async checkEndpoint(endpoint: string): Promise<OracleCheckResult> {
    const startTime = Date.now();
    
    // Test /prices/tickers endpoint
    const response = await fetch(`${endpoint}/prices/tickers`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tickers');
    }
    
    const tickers = await response.json();
    
    if (!tickers.length) {
      throw new Error('No tickers found');
    }
    
    return {
      responseTime: Date.now() - startTime
    };
  }
  
  // Ranks endpoints by speed and reliability
  pickBestEndpoint(): string {
    const stats = this.getEndpointsStats();
    
    // Sort by: not banned > speed > consistency
    const ranked = orderBy(stats, [
      scoreNotBanned,
      scoreBySpeed,
      scoreByConsistency
    ]);
    
    return ranked[0]?.endpoint;
  }
}
```

**Your Current Implementation:**
```typescript
// gmx-api.ts
const urls = [
  currentApiUrl,
  ...GMX_API_FALLBACKS.filter(u => u !== currentApiUrl)
];

for (const baseUrl of urls) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    if (response.ok) {
      currentApiUrl = baseUrl;  // Remember working URL
      return response.json();
    }
  } catch (error) {
    continue;  // Try next
  }
}
```

**Gaps:**
1. ❌ No health tracking (doesn't test endpoints in background)
2. ❌ No speed ranking (doesn't use fastest endpoint)
3. ❌ No ban logic (might keep trying broken endpoints)
4. ❌ No persistent state (forgets working endpoint on refresh)

**Recommendation:**
```typescript
// Upgrade to GMX's fallback tracker
import { OracleKeeperFallbackTracker } from '@gmx-io/sdk/oracle';

const fallbackTracker = new OracleKeeperFallbackTracker({
  chainId: 42161,
  mainUrl: 'https://arbitrum-api.gmxinfra.io',
  fallbacks: [
    'https://arbitrum-api-fallback.gmxinfra.io',
    'https://arbitrum-api-fallback.gmxinfra2.io'
  ],
  trackInterval: 10000,  // Check health every 10s
  failuresBeforeBan: { count: 3, window: 60000 }
});

// Always use best endpoint
const bestUrl = fallbackTracker.getCurrentEndpoints().primary;
```

---

## 🎯 Implementation Recommendations

### Immediate (1-2 days):

1. **Add UI Fee Receiver**
   ```typescript
   // .env
   VITE_UI_FEE_RECEIVER=0xYourArenaWalletAddress
   
   // gmx-sdk.ts
   const uiFeeReceiver = import.meta.env.VITE_UI_FEE_RECEIVER;
   ```
   **Why:** Start earning revenue immediately

2. **Improve Fallback Logic**
   ```typescript
   // Use GMX's OracleKeeperFallbackTracker
   import { OracleKeeperFallbackTracker } from '@gmx-io/sdk';
   ```
   **Why:** Better reliability and performance

### Medium Priority (3-5 days):

3. **Add WebSocket Events**
   ```typescript
   // Create useGmxEvents hook
   // Subscribe to order executions, position updates
   ```
   **Why:** Instant feedback for user actions

4. **Add RPC Health Tracking**
   ```typescript
   // Create gmx-rpc-tracker.ts
   // Monitor RPC performance, auto-switch on failures
   ```
   **Why:** Better resilience and speed

### Low Priority (Optional):

5. **Add GMX Debug Tools**
   ```typescript
   // Add debug panels for:
   // - RPC health monitoring
   // - Oracle keeper status
   // - API fallback tracking
   ```
   **Why:** Easier debugging in production

6. **Add Performance Metrics**
   ```typescript
   // Track and log:
   // - API response times
   // - RPC block lag
   // - Failed requests
   ```
   **Why:** Monitor app health

---

## 📝 Environment Setup

### Complete .env Configuration:

```bash
# ======================
# GMX Native Frontend Configuration
# ======================

# Your UI Fee Receiver (IMPORTANT: This is where you earn fees!)
VITE_UI_FEE_RECEIVER=0xYourArenaManagerAddress

# Custom RPC URLs (Optional but recommended)
VITE_ARBITRUM_RPC_URLS=["https://arb1.arbitrum.io/rpc","https://your-custom-rpc.com"]

# Alchemy API Keys (Optional, for faster RPCs)
VITE_ALCHEMY_ARBITRUM_KEY=your_alchemy_key_here

# GMX Oracle URLs (Already correct in your code)
# No need to override, GMX provides public endpoints

# WebSocket RPC (For real-time events)
VITE_ARBITRUM_WS_RPC=wss://arb1.arbitrum.io/rpc
```

---

## 🚦 Status Summary

### ✅ What's Correct:
- API endpoints (arbitrum-api.gmxinfra.io)
- SDK initialization (@gmx-io/sdk)
- Price data fetching (tickers, candles)
- Decimal conversion (30-decimal format)
- Polling interval (5s is safer than GMX's 1s)
- Error handling (after recent fixes)

### ⚠️ What Could Be Improved:
- Fallback logic (manual vs automatic)
- No health tracking for endpoints
- No performance ranking for RPCs

### ❌ What's Missing:
- **UI Fee Receiver** (missing revenue!)
- WebSocket event subscriptions (no real-time updates)
- RPC health monitoring
- Advanced fallback tracker
- Subaccount architecture (for ArenaWallet competitions)

---

## 🎯 Next Steps

### 1. Quick Win: Add UI Fee Receiver (30 minutes)
```bash
# Add to .env
VITE_UI_FEE_RECEIVER=0xYourAddress

# Update gmx-sdk.ts to pass uiFeeReceiver to orders
```

### 2. Improve Reliability: Upgrade Fallback System (2 hours)
```typescript
// Replace manual fallback with GMX's OracleKeeperFallbackTracker
// Provides automatic health checks and smart endpoint selection
```

### 3. Real-Time Updates: Add WebSocket Events (4 hours)
```typescript
// Create useGmxEvents hook
// Subscribe to order/position events
// Show real-time notifications
```

### 4. Production Ready: Add Monitoring (1 day)
```typescript
// Add RPC health tracking
// Log API failures
// Track performance metrics
```

---

## 📚 References

1. **GMX Frontends Docs:** https://docs.gmx.io/docs/frontends
2. **GMX Interface Repo:** https://github.com/gmx-io/gmx-interface
3. **GMX SDK Docs:** https://docs.gmx.io/docs/sdk
4. **Oracle Keeper Config:** `sdk/src/configs/oracleKeeper.ts`
5. **RPC Config:** `src/config/rpc.ts`
6. **WebSocket Events:** `src/context/WebsocketContext/subscribeToEvents.ts`

---

## ✅ Conclusion

**Lovable's implementation is ~80% correct** for basic trading functionality:
- ✅ Price data fetching works
- ✅ SDK integration is correct
- ✅ API endpoints are right
- ✅ Polling is actually safer than GMX's

**But missing ~20% for production-ready native frontend:**
- ❌ No UI fee receiver (missing revenue!)
- ❌ No WebSocket events (no real-time updates)
- ❌ Basic fallback system (could be more sophisticated)
- ❌ No RPC health monitoring

**Priority:** Add UI fee receiver first (easy win, generates revenue), then consider WebSocket events for better UX.
