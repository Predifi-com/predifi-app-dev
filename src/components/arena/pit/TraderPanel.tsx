/**
 * Trader Panel Component
 * Core visual unit showing trader exposure and PnL
 * Supports 3 density modes: COMPACT, BALANCED, DETAILED
 */

import React, { memo } from 'react'
import { TraderState, DensityMode, GlobalPrices, PairSymbol } from '@/types/arena-pit'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TraderPanelProps {
  trader: TraderState
  densityMode: DensityMode
  prices: GlobalPrices
  isHighlighted?: boolean
  isTop3?: boolean
  onClick?: () => void
  onPairClick?: (pair: PairSymbol) => void
}

export const TraderPanel = memo(function TraderPanel({
  trader,
  densityMode,
  prices,
  isHighlighted = false,
  isTop3 = false,
  onClick,
  onPairClick
}: TraderPanelProps) {
  // Format numbers
  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    if (Math.abs(value) >= 1_000_000) {
      return `${sign}$${(value / 1_000_000).toFixed(2)}M`
    } else if (Math.abs(value) >= 1_000) {
      return `${sign}$${(value / 1_000).toFixed(1)}K`
    }
    return `${sign}$${value.toFixed(0)}`
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const formatSize = (value: number) => {
    return value.toFixed(4)
  }

  // Build exposure rows
  const exposureData = [
    {
      pair: 'BTC' as PairSymbol,
      price: prices.BTC.price,
      long: trader.exposure.BTC.longSize,
      short: trader.exposure.BTC.shortSize,
      pnl: trader.exposure.BTC.pnl
    },
    {
      pair: 'ETH' as PairSymbol,
      price: prices.ETH.price,
      long: trader.exposure.ETH.longSize,
      short: trader.exposure.ETH.shortSize,
      pnl: trader.exposure.ETH.pnl
    },
    {
      pair: 'SOL' as PairSymbol,
      price: prices.SOL.price,
      long: trader.exposure.SOL.longSize,
      short: trader.exposure.SOL.shortSize,
      pnl: trader.exposure.SOL.pnl
    }
  ]

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-xl border p-4 transition-all duration-200',
        onClick && 'cursor-pointer',
        'hover:border-primary/40 hover:shadow-md',
        isTop3 && 'scale-105 z-10',
        isHighlighted && 'animate-pulse border-warning/60 bg-warning/10',
        !isHighlighted && trader.currentRank <= 3 && 'border-success/30 shadow-success/20',
        !isHighlighted && trader.currentRank > 3 && 'border-border',
        'bg-card'
      )}
      onClick={onClick}
      style={{
        aspectRatio: '16/9'
      }}
    >
      {/* Odds Badge (if market data available) */}
      {trader.marketData && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-primary/20 border border-primary/30">
          <span className="text-xs font-semibold text-primary">
            {(trader.marketData.probability * 100).toFixed(0)}% odds
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Rank badge */}
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
              trader.currentRank <= 3 ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
            )}
          >
            {trader.currentRank}
          </div>

          {/* Trader name */}
          <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/90">
            {trader.name}
          </h3>

          {/* Live indicator */}
          {trader.isLive && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
          )}
        </div>

        {/* Rank delta */}
        {trader.rankDelta !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            trader.rankDelta > 0 ? 'text-success' : 'text-destructive'
          )}>
            {trader.rankDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trader.rankDelta)}</span>
          </div>
        )}
      </div>

      {/* PnL Display */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              'font-mono text-2xl font-semibold tabular-nums',
              trader.totalPnl >= 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {formatPnl(trader.totalPnl)}
          </span>
          <span className="text-xs text-muted-foreground">
            {trader.totalPnlPercentage >= 0 ? '+' : ''}
            {trader.totalPnlPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Equity:{' '}
          <span className="font-mono text-foreground/70">
            ${trader.totalEquity.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Exposure Table */}
      {densityMode === DensityMode.COMPACT ? (
        <CompactExposure exposureData={exposureData} />
      ) : densityMode === DensityMode.BALANCED ? (
        <BalancedExposure exposureData={exposureData} formatPrice={formatPrice} formatSize={formatSize} formatPnl={formatPnl} onPairClick={onPairClick} />
      ) : (
        <DetailedExposure
          exposureData={exposureData}
          formatPrice={formatPrice}
          formatSize={formatSize}
          formatPnl={formatPnl}
          onPairClick={onPairClick}
          trader={trader}
        />
      )}
    </div>
  )
})

// Compact Exposure Display (minimal)
function CompactExposure({ exposureData }: any) {
  return (
    <div className="space-y-1">
      {exposureData.map((data: any) => (
        <div key={data.pair} className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">{data.pair}</span>
          <div className="flex items-center gap-2">
            {data.long > 0 && (
              <span className="text-success">{data.long.toFixed(2)}L</span>
            )}
            {data.short > 0 && (
              <span className="text-destructive">{data.short.toFixed(2)}S</span>
            )}
            {data.long === 0 && data.short === 0 && (
              <span className="text-muted-foreground/50">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Balanced Exposure Display (standard)
function BalancedExposure({ exposureData, formatPrice, formatSize, formatPnl, onPairClick }: any) {
  return (
    <div className="space-y-1.5">
      {exposureData.map((data: any) => (
        <button
          key={data.pair}
          onClick={(e) => {
            e.stopPropagation()
            onPairClick?.(data.pair)
          }}
          className="w-full rounded p-1.5 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{data.pair}</span>
            <span className="font-mono text-muted-foreground">{formatPrice(data.price)}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {data.long > 0 && (
                <span className="text-success">LONG {formatSize(data.long)}</span>
              )}
              {data.short > 0 && (
                <span className="text-destructive">SHORT {formatSize(data.short)}</span>
              )}
              {data.long === 0 && data.short === 0 && (
                <span className="text-muted-foreground/50">No position</span>
              )}
            </div>
            <span className={cn(
              'font-mono font-semibold tabular-nums',
              data.pnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatPnl(data.pnl)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

// Detailed Exposure Display (expanded inline)
function DetailedExposure({ exposureData, formatPrice, formatSize, formatPnl, onPairClick, trader }: any) {
  return (
    <div className="space-y-2">
      {exposureData.map((data: any) => (
        <button
          key={data.pair}
          onClick={(e) => {
            e.stopPropagation()
            onPairClick?.(data.pair)
          }}
          className="w-full rounded border border-border p-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-foreground">{data.pair}/USD</span>
            <span className="font-mono text-muted-foreground">${formatPrice(data.price)}</span>
          </div>
          <div className="mt-1 space-y-0.5 text-xs">
            {data.long > 0 && (
              <div className="flex justify-between">
                <span className="text-success">Long {formatSize(data.long)}</span>
                <span className="font-mono text-muted-foreground">
                  Avg: ${formatPrice(trader.exposure[data.pair].avgLongEntry)}
                </span>
              </div>
            )}
            {data.short > 0 && (
              <div className="flex justify-between">
                <span className="text-destructive">Short {formatSize(data.short)}</span>
                <span className="font-mono text-muted-foreground">
                  Avg: ${formatPrice(trader.exposure[data.pair].avgShortEntry)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-0.5">
              <span className="text-muted-foreground">PnL:</span>
              <span className={cn(
                'font-mono font-semibold',
                data.pnl >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {formatPnl(data.pnl)}
              </span>
            </div>
          </div>
        </button>
      ))}

      {/* Additional stats for detailed mode */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2 text-xs">
        <div>
          <div className="text-muted-foreground">Leverage</div>
          <div className="font-mono font-semibold text-foreground">{trader.leverage.toFixed(2)}x</div>
        </div>
        <div>
          <div className="text-muted-foreground">Trades</div>
          <div className="font-mono font-semibold text-foreground">{trader.epochTradeCount}</div>
        </div>
      </div>
    </div>
  )
}
