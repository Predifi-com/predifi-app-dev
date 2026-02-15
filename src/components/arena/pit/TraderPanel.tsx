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
        'group relative cursor-pointer rounded-lg border p-4 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg',
        isTop3 && 'scale-105 z-10',
        isHighlighted && 'animate-pulse border-yellow-500/60 bg-yellow-500/10',
        !isHighlighted && trader.currentRank <= 3 && 'border-green-500/30 shadow-green-500/20',
        !isHighlighted && trader.currentRank > 3 && 'border-white/8',
        'bg-[#0e1118]'
      )}
      onClick={onClick}
      style={{
        aspectRatio: '16/9'
      }}
    >
      {/* Odds Badge (if market data available) */}
      {trader.marketData && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-400/30">
          <span className="text-xs font-semibold text-blue-300">
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
              trader.currentRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/70'
            )}
          >
            {trader.currentRank}
          </div>

          {/* Trader name */}
          <h3 className="text-sm font-medium text-white group-hover:text-white/90">
            {trader.name}
          </h3>

          {/* Live indicator */}
          {trader.isLive && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          )}
        </div>

        {/* Rank delta */}
        {trader.rankDelta !== 0 && (
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            trader.rankDelta > 0 ? 'text-green-400' : 'text-red-400'
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
              trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
            )}
          >
            {formatPnl(trader.totalPnl)}
          </span>
          <span className="text-xs text-white/50">
            {trader.totalPnlPercentage >= 0 ? '+' : ''}
            {trader.totalPnlPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="mt-0.5 text-xs text-white/50">
          Equity:{' '}
          <span className="font-mono text-white/70">
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
          <span className="font-medium text-white/70">{data.pair}</span>
          <div className="flex items-center gap-2">
            {data.long > 0 && (
              <span className="text-green-400">{data.long.toFixed(2)}L</span>
            )}
            {data.short > 0 && (
              <span className="text-red-400">{data.short.toFixed(2)}S</span>
            )}
            {data.long === 0 && data.short === 0 && (
              <span className="text-white/30">-</span>
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
          className="w-full rounded p-1.5 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/70">{data.pair}</span>
            <span className="font-mono text-white/50">{formatPrice(data.price)}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {data.long > 0 && (
                <span className="text-green-400">LONG {formatSize(data.long)}</span>
              )}
              {data.short > 0 && (
                <span className="text-red-400">SHORT {formatSize(data.short)}</span>
              )}
              {data.long === 0 && data.short === 0 && (
                <span className="text-white/30">No position</span>
              )}
            </div>
            <span className={cn(
              'font-mono font-semibold tabular-nums',
              data.pnl >= 0 ? 'text-green-400' : 'text-red-400'
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
          className="w-full rounded border border-white/10 p-2 text-left transition-colors hover:border-white/20 hover:bg-white/5"
        >
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-white">{data.pair}/USD</span>
            <span className="font-mono text-white/70">${formatPrice(data.price)}</span>
          </div>
          <div className="mt-1 space-y-0.5 text-xs">
            {data.long > 0 && (
              <div className="flex justify-between">
                <span className="text-green-400">Long {formatSize(data.long)}</span>
                <span className="font-mono text-white/50">
                  Avg: ${formatPrice(trader.exposure[data.pair].avgLongEntry)}
                </span>
              </div>
            )}
            {data.short > 0 && (
              <div className="flex justify-between">
                <span className="text-red-400">Short {formatSize(data.short)}</span>
                <span className="font-mono text-white/50">
                  Avg: ${formatPrice(trader.exposure[data.pair].avgShortEntry)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-0.5">
              <span className="text-white/50">PnL:</span>
              <span className={cn(
                'font-mono font-semibold',
                data.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatPnl(data.pnl)}
              </span>
            </div>
          </div>
        </button>
      ))}

      {/* Additional stats for detailed mode */}
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-xs">
        <div>
          <div className="text-white/50">Leverage</div>
          <div className="font-mono font-semibold text-white">{trader.leverage.toFixed(2)}x</div>
        </div>
        <div>
          <div className="text-white/50">Trades</div>
          <div className="font-mono font-semibold text-white">{trader.epochTradeCount}</div>
        </div>
      </div>
    </div>
  )
}
