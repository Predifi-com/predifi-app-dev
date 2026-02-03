# Limitless API Integration

## Overview
The MarketCard components are **fully reusable templates** that can be used throughout the application. They now display real data from the Limitless Exchange API.

## What's Been Integrated

### 1. New Limitless API Service (`src/services/limitless-api.ts`)
- Base URL: `https://api.limitless.exchange`
- Fetches active markets with pagination
- Supports sorting by newest, volume, or liquidity
- Includes category filtering

### 2. Updated Hook (`src/hooks/useInfiniteMarkets.ts`)
- Now supports both mock data and real Limitless API
- Automatically converts Limitless API format to app's format
- Maintains backward compatibility with existing components

### 3. Markets Page (`src/pages/Markets.tsx`)
- Enabled `useApi: true` to use real Limitless data
- Loads 24 markets per batch
- Supports infinite scrolling

## Real Data Being Displayed

The cards now show:
- **Title**: Actual market questions from Limitless
- **Yes/No Prices**: Real-time market probabilities
- **Volume**: Formatted trading volume (e.g., "164.1M")
- **Venue**: Shows "Limitless" badge
- **Images**: Creator logos from Limitless API
- **Comments**: Number of recent feed events

## How to Use the Reusable MarketCard

```tsx
import MarketCard from "@/components/MarketCard";

<MarketCard
  title="Will Bitcoin reach $100k?"
  yesPercentage={65}
  noPercentage={35}
  volume="2.5M"
  venue="Limitless"
  animationsEnabled={true}
/>
```

## API Endpoints Used

- `GET /markets/active` - Fetches active markets
- Supports pagination with `page` and `limit` parameters
- Supports sorting with `sortBy` parameter

## Future Enhancements

You can easily extend this to add:
- Category filtering
- Search functionality  
- Market details page
- Trading integration
- WebSocket real-time updates
