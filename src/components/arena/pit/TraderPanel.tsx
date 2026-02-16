/**
 * Trader Panel Component
 * Compact view with sparkline, fits 4x4 grid (16 panels per page)
 */

import React, { memo, useMemo } from 'react'
import { TraderState, GlobalPrices, PairSymbol } from '@/types/arena-pit'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { TraderAvatar } from './TraderAvatar'

interface TraderPanelProps {
  trader: TraderState
  prices: GlobalPrices
  isHighlighted?: boolean
  onClick?: () => void
}

/** Generate a deterministic 7-day equity sparkline from trader name */
function generateSparkline(name: string, finalPnl: number): number[] {
  let seed = 0
  for (let i = 0; i < name.length; i++) seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0
  const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff }

  const points: number[] = [100] // start at $100
  for (let d = 1; d <= 6; d++) {
    const progress = d / 7
    const target = 100 + finalPnl * progress
    const noise = (rng() - 0.5) * 15
    points.push(Math.max(5, target + noise))
  }
  points.push(Math.max(5, 100 + finalPnl))
  return points
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 60
  const h = 18
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const TraderPanel = memo(function TraderPanel({
  trader,
  prices,
  isHighlighted = false,
  onClick,
}: TraderPanelProps) {
  const sparklineData = useMemo(() => generateSparkline(trader.name, trader.totalPnl), [trader.name, trader.totalPnl])

  const formatPnl = (value: number) => `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`

  const exposureData = [
    { pair: 'BTC' as PairSymbol, long: trader.exposure.BTC.longSize, short: trader.exposure.BTC.shortSize, pnl: trader.exposure.BTC.pnl },
    { pair: 'ETH' as PairSymbol, long: trader.exposure.ETH.longSize, short: trader.exposure.ETH.shortSize, pnl: trader.exposure.ETH.pnl },
    { pair: 'SOL' as PairSymbol, long: trader.exposure.SOL.longSize, short: trader.exposure.SOL.shortSize, pnl: trader.exposure.SOL.pnl }
  ]

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-lg border transition-all duration-200 overflow-hidden',
        'hover:shadow-md hover:border-primary/30',
        'bg-card text-card-foreground flex flex-col p-2',
        isHighlighted && 'ring-1 ring-yellow-500/60 bg-yellow-500/5',
        !isHighlighted && trader.currentRank <= 3 && 'border-green-500/20',
        !isHighlighted && trader.currentRank > 3 && 'border-border'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <TraderAvatar name={trader.name} size="sm" />
          <div className={cn(
            'flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold flex-shrink-0',
            trader.currentRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'
          )}>
            {trader.currentRank}
          </div>
          <span className="text-[10px] font-medium text-foreground truncate">{trader.name}</span>
          {trader.isLive && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 flex-shrink-0" />}
        </div>
        {trader.rankDelta !== 0 && (
          <div className={cn('flex items-center gap-0.5 text-[8px] font-semibold flex-shrink-0', trader.rankDelta > 0 ? 'text-green-400' : 'text-red-400')}>
            {trader.rankDelta > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
            {Math.abs(trader.rankDelta)}
          </div>
        )}
      </div>

      {/* PnL + Sparkline */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="flex items-baseline gap-1">
            <span className={cn('font-mono text-sm font-bold tabular-nums leading-none', trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
              {formatPnl(trader.totalPnl)}
            </span>
            <span className="text-[8px] text-muted-foreground">
              {trader.totalPnlPercentage >= 0 ? '+' : ''}{trader.totalPnlPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-[8px] text-muted-foreground mt-0.5">
            Equity: <span className="font-mono text-foreground/70">${trader.totalEquity.toFixed(2)}</span>
          </div>
        </div>
        <MiniSparkline data={sparklineData} positive={trader.totalPnl >= 0} />
      </div>

      {/* Exposure rows */}
      <div className="space-y-0 flex-1">
        {exposureData.map((data) => (
          <div key={data.pair} className="flex items-center justify-between text-[8px] px-0.5 py-px">
            <div className="flex items-center gap-1">
              <span className="font-medium text-muted-foreground w-5">{data.pair}</span>
              {data.long > 0 && <span className="text-green-400/80">L {data.long.toFixed(4)}</span>}
              {data.short > 0 && <span className="text-red-400/80">S {data.short.toFixed(4)}</span>}
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
