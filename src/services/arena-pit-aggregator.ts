/**
 * Arena Pit Data Aggregator
 * Aggregates GMX position data for all competing traders
 */

import { getGmxPrice, getGmxTickers } from './gmx-api'
import {
  TraderState,
  TraderMarketExposure,
  TraderExposure,
  PairSymbol,
  GlobalPrices,
  MarketPrice,
  ArenaPitApiResponse
} from '@/types/arena-pit'
import { GmxPosition } from '@/types/predifi-wallet'

/**
 * Calculate PnL for a single exposure
 */
function calculateExposurePnl(
  exposure: TraderExposure,
  currentPrice: number
): number {
  const longPnl =
    exposure.longSize > 0
      ? exposure.longSize * (currentPrice - exposure.avgLongEntry)
      : 0

  const shortPnl =
    exposure.shortSize > 0
      ? exposure.shortSize * (exposure.avgShortEntry - currentPrice)
      : 0

  return longPnl + shortPnl
}

/**
 * Calculate total PnL across all markets
 */
export function calculateTotalPnl(
  exposure: TraderMarketExposure,
  prices: GlobalPrices
): number {
  const btcPnl = calculateExposurePnl(exposure.BTC, prices.BTC.price)
  const ethPnl = calculateExposurePnl(exposure.ETH, prices.ETH.price)
  const solPnl = calculateExposurePnl(exposure.SOL, prices.SOL.price)

  return btcPnl + ethPnl + solPnl
}

/**
 * Calculate total equity (balance + unrealized PnL)
 */
export function calculateEquity(
  unusedBalance: number,
  totalPnl: number
): number {
  return unusedBalance + totalPnl
}

/**
 * Aggregate GMX positions into TraderExposure format
 */
function aggregatePositions(
  positions: GmxPosition[],
  market: PairSymbol
): TraderExposure {
  const marketPositions = positions.filter((p) =>
    (p.marketSymbol || p.market).toUpperCase().includes(market)
  )

  let longSize = 0
  let shortSize = 0
  let longValue = 0
  let shortValue = 0

  marketPositions.forEach((pos) => {
    if (pos.side === 'long') {
      longSize += pos.size
      longValue += pos.size * pos.entryPrice
    } else {
      shortSize += pos.size
      shortValue += pos.size * pos.entryPrice
    }
  })

  const avgLongEntry = longSize > 0 ? longValue / longSize : 0
  const avgShortEntry = shortSize > 0 ? shortValue / shortSize : 0

  return {
    longSize,
    shortSize,
    avgLongEntry,
    avgShortEntry,
    pnl: 0, // Will be calculated with current prices
    unrealizedPnl: 0
  }
}

/**
 * Fetch current global prices from GMX
 */
export async function fetchGlobalPrices(): Promise<GlobalPrices> {
  try {
    const [btcData, ethData, solData] = await Promise.all([
      getGmxPrice('BTC'),
      getGmxPrice('ETH'),
      getGmxPrice('SOL')
    ])

    // Fetch 24h data for change calculation (using tickers)
    const tickers = await getGmxTickers()

    const btcTicker = tickers.find((t) => t.tokenSymbol === 'BTC')
    const ethTicker = tickers.find((t) => t.tokenSymbol === 'ETH')
    const solTicker = tickers.find((t) => t.tokenSymbol === 'SOL')

    return {
      BTC: {
        symbol: 'BTC',
        price: btcData.price,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      },
      ETH: {
        symbol: 'ETH',
        price: ethData.price,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      },
      SOL: {
        symbol: 'SOL',
        price: solData.price,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      }
    }
  } catch (error) {
    console.error('Failed to fetch global prices:', error)
    // Return fallback prices
    return {
      BTC: {
        symbol: 'BTC',
        price: 0,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      },
      ETH: {
        symbol: 'ETH',
        price: 0,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      },
      SOL: {
        symbol: 'SOL',
        price: 0,
        change24h: 0,
        change24hPercentage: 0,
        lastUpdate: Date.now()
      }
    }
  }
}

/**
 * Transform API response to TraderState
 */
export function transformApiResponseToTraderState(
  apiData: ArenaPitApiResponse['traders'][0],
  prices: GlobalPrices,
  rank: number,
  previousRank?: number
): TraderState {
  // Build exposure from API data
  const exposure: TraderMarketExposure = {
    BTC: {
      ...apiData.exposure.BTC,
      pnl: calculateExposurePnl(apiData.exposure.BTC as TraderExposure, prices.BTC.price),
      unrealizedPnl: calculateExposurePnl(
        apiData.exposure.BTC as TraderExposure,
        prices.BTC.price
      )
    },
    ETH: {
      ...apiData.exposure.ETH,
      pnl: calculateExposurePnl(apiData.exposure.ETH as TraderExposure, prices.ETH.price),
      unrealizedPnl: calculateExposurePnl(
        apiData.exposure.ETH as TraderExposure,
        prices.ETH.price
      )
    },
    SOL: {
      ...apiData.exposure.SOL,
      pnl: calculateExposurePnl(apiData.exposure.SOL as TraderExposure, prices.SOL.price),
      unrealizedPnl: calculateExposurePnl(
        apiData.exposure.SOL as TraderExposure,
        prices.SOL.price
      )
    }
  }

  const totalPnl = calculateTotalPnl(exposure, prices)
  const totalEquity = calculateEquity(apiData.unusedBalance, totalPnl)
  const totalPnlPercentage =
    apiData.unusedBalance > 0 ? (totalPnl / apiData.unusedBalance) * 100 : 0

  // Calculate rank delta
  const epochStartRank = previousRank || rank
  const rankDelta = epochStartRank - rank // Positive = moved up

  // Calculate leverage (simplified)
  const totalCollateral = apiData.unusedBalance
  const totalPositionSize =
    (exposure.BTC.longSize + exposure.BTC.shortSize) * prices.BTC.price +
    (exposure.ETH.longSize + exposure.ETH.shortSize) * prices.ETH.price +
    (exposure.SOL.longSize + exposure.SOL.shortSize) * prices.SOL.price

  const leverage = totalCollateral > 0 ? totalPositionSize / totalCollateral : 0

  // Check liquidation risk (simplified - would need actual liquidation prices from GMX)
  const liquidationRisk = leverage > 10 // Simplified: >10x leverage = risky

  const netFunding = apiData.fundingReceived - apiData.fundingPaid

  return {
    address: apiData.address,
    name: apiData.name,

    unusedBalance: apiData.unusedBalance,
    totalEquity,

    exposure,

    totalPnl,
    totalPnlPercentage,
    epochVolume: apiData.totalVolumeEpoch,
    epochTradeCount: apiData.tradeCountEpoch,

    currentRank: rank,
    epochStartRank,
    rankDelta,

    isLive: true, // Would be determined by recent activity
    lastUpdateTimestamp: Date.now(),

    leverage,
    liquidationRisk,

    fundingPaid: apiData.fundingPaid,
    fundingReceived: apiData.fundingReceived,
    netFunding
  }
}

/**
 * Sort traders by PnL (descending)
 */
export function sortTradersByPnl(traders: TraderState[]): TraderState[] {
  return [...traders].sort((a, b) => b.totalPnl - a.totalPnl)
}

/**
 * Calculate aggregate stats
 */
export function calculateAggregateStats(traders: TraderState[]): {
  totalPnl: number
  totalVolume: number
  avgPnl: number
  topPnl: number
} {
  const totalPnl = traders.reduce((sum, t) => sum + t.totalPnl, 0)
  const totalVolume = traders.reduce((sum, t) => sum + t.epochVolume, 0)
  const avgPnl = traders.length > 0 ? totalPnl / traders.length : 0
  const topPnl = traders.length > 0 ? Math.max(...traders.map((t) => t.totalPnl)) : 0

  return { totalPnl, totalVolume, avgPnl, topPnl }
}

/**
 * Update trader rankings
 */
export function updateTraderRankings(
  traders: TraderState[],
  previousRankings?: Map<string, number>
): TraderState[] {
  // Sort by PnL
  const sorted = sortTradersByPnl(traders)

  // Update ranks
  return sorted.map((trader, index) => {
    const newRank = index + 1
    const previousRank = previousRankings?.get(trader.address) || newRank

    return {
      ...trader,
      currentRank: newRank,
      rankDelta: previousRank - newRank
    }
  })
}

/**
 * Check if trader state has changed (for optimization)
 */
export function hasTraderStateChanged(
  oldState: TraderState,
  newState: TraderState
): boolean {
  // Check key fields that would trigger re-render
  return (
    oldState.totalPnl !== newState.totalPnl ||
    oldState.currentRank !== newState.currentRank ||
    oldState.unusedBalance !== newState.unusedBalance ||
    oldState.epochVolume !== newState.epochVolume ||
    oldState.isLive !== newState.isLive
  )
}

/**
 * Calculate state checksum for reconciliation
 */
export function calculateStateChecksum(traders: TraderState[]): string {
  // Simple checksum based on critical data
  const data = traders
    .map((t) => `${t.address}:${t.totalPnl.toFixed(2)}:${t.currentRank}`)
    .join('|')

  // Simple hash (in production, use crypto.subtle.digest)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  return hash.toString(36)
}

/**
 * Fetch arena pit state with optional market data
 */
export async function fetchArenaPitState(
  page: number = 0,
  userAddress?: string
): Promise<ArenaPitApiResponse & { marketData?: any }> {
  try {
    // Fetch arena state
    const arenaResponse = await fetch(`/api/arena/pit/state?page=${page}`)
    if (!arenaResponse.ok) {
      throw new Error('Failed to fetch arena pit state')
    }
    const arenaData = await arenaResponse.json()

    // Fetch market data if we have an epochId
    let marketData = null
    if (arenaData.epochId) {
      try {
        const marketResponse = await fetch(
          `/api/arena/markets/${arenaData.epochId}?user=${userAddress || ''}`
        )
        if (marketResponse.ok) {
          marketData = await marketResponse.json()
        }
      } catch (error) {
        console.warn('Failed to fetch market data:', error)
        // Continue without market data
      }
    }

    // Merge market data into trader data
    if (marketData?.outcomes) {
      arenaData.traders = arenaData.traders.map((trader: any) => {
        const traderMarket = marketData.outcomes.find(
          (o: any) => o.traderAddress === trader.address
        )

        return {
          ...trader,
          marketData: traderMarket
            ? {
                marketId: marketData.marketId,
                outcomeIndex: traderMarket.index,
                probability: traderMarket.probability,
                yesPrice: traderMarket.yesPrice,
                noPrice: traderMarket.noPrice,
                volume: traderMarket.volume,
                oddsChange: traderMarket.oddsChange,
                userPosition: traderMarket.userPosition
              }
            : null,
          historicalStats: traderMarket?.historicalStats || null
        }
      })
    }

    return { ...arenaData, marketData }
  } catch (error) {
    console.error('Failed to fetch arena pit state:', error)

    // Return mock data for development
    return {
      traders: [],
      totalCount: 0,
      epochEndTimestamp: Date.now() + 4 * 60 * 60 * 1000,
      epochStartTimestamp: Date.now() - 30 * 60 * 1000,
      epochId: 'epoch-1',
      serverTimestamp: Date.now(),
      checksum: '',
      version: '1.0.0',
      dataSourceLatency: 0,
      cacheHit: false
    }
  }
}
