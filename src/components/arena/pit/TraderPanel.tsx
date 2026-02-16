/**
 * Trader Panel Component
 * Balanced view showing trader exposure and PnL - fits 4x3 grid in viewport
 */

import React, { memo } from 'react'
import { TraderState, GlobalPrices, PairSymbol } from '@/types/arena-pit'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TraderPanelProps {
  trader: TraderState
  prices: GlobalPrices
  isHighlighted?: boolean
  onClick?: () => void
  onPairClick?: (pair: PairSymbol) => void
}

export const TraderPanel = memo(function TraderPanel({
  trader,
  prices,
  isHighlighted = false,
  onClick,
  onPairClick
}: TraderPanelProps) {
  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${value.toFixed(2)}`
  }

  const formatPrice = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const formatSize = (value: number) => value.toFixed(4)

  const exposureData = [
    { pair: 'BTC' as PairSymbol, price: prices.BTC.price, long: trader.exposure.BTC.longSize, short: trader.exposure.BTC.shortSize, pnl: trader.exposure.BTC.pnl },
    { pair: 'ETH' as PairSymbol, price: prices.ETH.price, long: trader.exposure.ETH.longSize, short: trader.exposure.ETH.shortSize, pnl: trader.exposure.ETH.pnl },
    { pair: 'SOL' as PairSymbol, price: prices.SOL.price, long: trader.exposure.SOL.longSize, short: trader.exposure.SOL.shortSize, pnl: trader.exposure.SOL.pnl }
  ]

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden',
        'hover:shadow-md hover:border-border/80',
        'bg-card text-card-foreground flex flex-col p-2.5',
        isHighlighted && 'animate-pulse border-yellow-500/60 bg-yellow-500/10',
        !isHighlighted && trader.currentRank <= 3 && 'border-green-500/30',
        !isHighlighted && trader.currentRank > 3 && 'border-border'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={cn(
            'flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold flex-shrink-0',
            trader.currentRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'
          )} style={{ width: 18, height: 18 }}>
            {trader.currentRank}
          </div>
          <h3 className="text-[11px] font-medium text-foreground truncate">{trader.name}</h3>
          {trader.isLive && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 flex-shrink-0" />}
        </div>

        {trader.rankDelta !== 0 && (
          <div className={cn('flex items-center gap-0.5 text-[9px] font-semibold flex-shrink-0', trader.rankDelta > 0 ? 'text-green-400' : 'text-red-400')}>
            {trader.rankDelta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            <span>{Math.abs(trader.rankDelta)}</span>
          </div>
        )}
      </div>

      {/* PnL */}
      <div className="mb-1.5">
        <div className="flex items-baseline gap-1">
          <span className={cn('font-mono text-base font-semibold tabular-nums leading-none', trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
            {formatPnl(trader.totalPnl)}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {trader.totalPnlPercentage >= 0 ? '+' : ''}{trader.totalPnlPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-[9px] text-muted-foreground leading-tight">
          Equity: <span className="font-mono text-foreground/70">${trader.totalEquity.toFixed(2)}</span>
        </div>
      </div>

      {/* Exposure - compact */}
      <div className="space-y-0.5 flex-1">
        {exposureData.map((data) => (
          <div
            key={data.pair}
            onClick={(e) => { e.stopPropagation(); onPairClick?.(data.pair) }}
            className="flex items-center justify-between text-[9px] rounded px-1 py-0.5 hover:bg-accent/30 cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-muted-foreground w-6">{data.pair}</span>
              {data.long > 0 && <span className="text-green-400">L {formatSize(data.long)}</span>}
              {data.short > 0 && <span className="text-red-400">S {formatSize(data.short)}</span>}
              {data.long === 0 && data.short === 0 && <span className="text-muted-foreground/30">—</span>}
            </div>
            <span className={cn('font-mono font-semibold tabular-nums', data.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
              {formatPnl(data.pnl)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})
