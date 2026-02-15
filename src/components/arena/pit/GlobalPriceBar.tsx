/**
 * Global Price Bar Component
 * Top sticky bar showing live prices, epoch timer, and aggregate stats
 */

import { useEffect, useState } from 'react'
import { GlobalPrices, EpochState } from '@/types/arena-pit'
import { clockSync } from '@/services/clock-sync'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface GlobalPriceBarProps {
  prices: GlobalPrices | null
  epochState: EpochState
  timeRemaining: number
  totalPnl: number
  totalVolume: number
  totalTraders?: number
  totalBetVolume?: number
}

export function GlobalPriceBar({
  prices,
  epochState,
  timeRemaining,
  totalPnl,
  totalVolume,
  totalTraders = 0,
  totalBetVolume = 0
}: GlobalPriceBarProps) {
  const [priceFlash, setPriceFlash] = useState<{
    BTC?: 'up' | 'down'
    ETH?: 'up' | 'down'
    SOL?: 'up' | 'down'
  }>({})

  // Track previous prices for flash effect
  const [prevPrices, setPrevPrices] = useState<GlobalPrices | null>(null)

  // Detect price changes and trigger flash
  useEffect(() => {
    if (!prices || !prevPrices) {
      setPrevPrices(prices)
      return
    }

    const flash: typeof priceFlash = {}

    if (prices.BTC.price > prevPrices.BTC.price) flash.BTC = 'up'
    else if (prices.BTC.price < prevPrices.BTC.price) flash.BTC = 'down'

    if (prices.ETH.price > prevPrices.ETH.price) flash.ETH = 'up'
    else if (prices.ETH.price < prevPrices.ETH.price) flash.ETH = 'down'

    if (prices.SOL.price > prevPrices.SOL.price) flash.SOL = 'up'
    else if (prices.SOL.price < prevPrices.SOL.price) flash.SOL = 'down'

    setPriceFlash(flash)
    setPrevPrices(prices)

    // Clear flash after 150ms
    const timeout = setTimeout(() => setPriceFlash({}), 150)
    return () => clearTimeout(timeout)
  }, [prices])

  // Format time remaining
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  // Epoch state labels
  const getEpochLabel = () => {
    switch (epochState) {
      case EpochState.PRE_EPOCH:
        return 'STARTING IN'
      case EpochState.ACTIVE:
        return 'TIME REMAINING'
      case EpochState.COOLDOWN:
        return 'SETTLING...'
      case EpochState.SETTLING:
        return 'EPOCH COMPLETE'
      default:
        return 'EPOCH'
    }
  }

  // Format large numbers
  const formatVolume = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    if (Math.abs(value) >= 1_000_000) {
      return `${sign}$${(value / 1_000_000).toFixed(2)}M`
    } else if (Math.abs(value) >= 1_000) {
      return `${sign}$${(value / 1_000).toFixed(1)}K`
    }
    return `${sign}$${value.toFixed(0)}`
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0e1118] backdrop-blur-sm">
      <div className="flex h-[72px] items-center justify-between px-6">
        {/* Left: Live Prices */}
        <div className="flex items-center gap-8">
          {prices && (
            <>
              <PriceDisplay
                symbol="BTC"
                price={prices.BTC.price}
                change24h={prices.BTC.change24hPercentage}
                flash={priceFlash.BTC}
              />
              <PriceDisplay
                symbol="ETH"
                price={prices.ETH.price}
                change24h={prices.ETH.change24hPercentage}
                flash={priceFlash.ETH}
              />
              <PriceDisplay
                symbol="SOL"
                price={prices.SOL.price}
                change24h={prices.SOL.change24hPercentage}
                flash={priceFlash.SOL}
              />
            </>
          )}
        </div>

        {/* Center: Epoch Timer */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium uppercase tracking-wider text-white/50">
            {getEpochLabel()}
          </div>
          <div
            className={cn(
              'font-mono text-4xl font-bold tabular-nums',
              epochState === EpochState.ACTIVE && timeRemaining < 60000
                ? 'text-red-400'
                : 'text-white'
            )}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Right: Aggregate Stats */}
        <div className="flex items-center gap-8">
          <StatDisplay label="ARENA PNL" value={formatPnl(totalPnl)} positive={totalPnl >= 0} />
          <div className="flex flex-col items-end">
            <div className="text-xs font-medium uppercase tracking-wider text-white/50">VOLUME</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-semibold tabular-nums text-white">
                {formatVolume(totalVolume)}
              </span>
              {totalBetVolume > 0 && (
                <>
                  <span className="text-white/30">|</span>
                  <span className="font-mono text-sm font-semibold text-blue-400">
                    {formatVolume(totalBetVolume)} Bet
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Price Display Component
interface PriceDisplayProps {
  symbol: string
  price: number
  change24h: number
  flash?: 'up' | 'down'
}

function PriceDisplay({ symbol, price, change24h, flash }: PriceDisplayProps) {
  const isPositive = change24h >= 0

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white/70">{symbol}</span>
        <span
          className={cn(
            'font-mono text-xl font-semibold tabular-nums transition-colors duration-150',
            flash === 'up' && 'text-green-400',
            flash === 'down' && 'text-red-400',
            !flash && 'text-white'
          )}
        >
          ${price.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-400" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-400" />
        )}
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}
        >
          {isPositive ? '+' : ''}
          {change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

// Stat Display Component
interface StatDisplayProps {
  label: string
  value: string
  positive?: boolean
}

function StatDisplay({ label, value, positive }: StatDisplayProps) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-xs font-medium uppercase tracking-wider text-white/50">{label}</div>
      <div
        className={cn(
          'font-mono text-xl font-semibold tabular-nums',
          positive === true && 'text-green-400',
          positive === false && 'text-red-400',
          positive === undefined && 'text-white'
        )}
      >
        {value}
      </div>
    </div>
  )
}
