/**
 * Leaderboard Sidebar Component
 * Fixed left sidebar showing live rankings with performance badges
 */

import { TraderState, PerformanceBadge, getPerformanceBadge, getPerformanceBand } from '@/types/arena-pit'
import { cn } from '@/lib/utils'
import { Trophy, TrendingUp, TrendingDown, Minus, AlertTriangle, Crown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LeaderboardSidebarProps {
  traders: TraderState[]
  selectedTrader: string | null
  highlightedTrader: string | null
  onTraderClick: (address: string, rank: number) => void
}

export function LeaderboardSidebar({
  traders,
  selectedTrader,
  highlightedTrader,
  onTraderClick
}: LeaderboardSidebarProps) {
  return (
    <div className="hidden lg:block fixed left-0 top-[72px] h-[calc(100vh-72px)] w-[280px] border-r border-border bg-card">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Rankings
        </h2>
        <Trophy className="h-4 w-4 text-warning" />
      </div>

      <ScrollArea className="h-[calc(100%-48px)]">
        <div className="space-y-0.5 p-2">
          {traders.map((trader) => (
            <LeaderboardEntry
              key={trader.address}
              trader={trader}
              isSelected={trader.address === selectedTrader}
              isHighlighted={trader.address === highlightedTrader}
              onClick={() => onTraderClick(trader.address, trader.currentRank)}
              totalTraders={traders.length}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

// Leaderboard Entry Component
interface LeaderboardEntryProps {
  trader: TraderState
  isSelected: boolean
  isHighlighted: boolean
  onClick: () => void
  totalTraders: number
}

function LeaderboardEntry({
  trader,
  isSelected,
  isHighlighted,
  onClick,
  totalTraders
}: LeaderboardEntryProps) {
  const badge = getPerformanceBadge(trader)
  const band = getPerformanceBand(trader.currentRank, totalTraders)

  // Format PnL
  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    if (Math.abs(value) >= 1_000_000) {
      return `${sign}$${(value / 1_000_000).toFixed(2)}M`
    } else if (Math.abs(value) >= 1_000) {
      return `${sign}$${(value / 1_000).toFixed(1)}K`
    }
    return `${sign}$${value.toFixed(0)}`
  }

  // Format volume
  const formatVolume = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg border p-3 text-left transition-all duration-200',
        'hover:border-primary/40 hover:bg-muted/50',
        isSelected && 'border-primary/60 bg-primary/10',
        isHighlighted && 'animate-pulse border-warning/60 bg-warning/10',
        !isSelected && !isHighlighted && 'border-border',
        // Performance band border color
        band === 'top' && !isSelected && !isHighlighted && 'border-success/30',
        band === 'bottom' && !isSelected && !isHighlighted && 'border-destructive/30'
      )}
    >
      {/* Top row: Rank + Name + Badge */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Rank */}
          <RankDisplay rank={trader.currentRank} />

          {/* Name */}
          <span className="text-sm font-medium text-foreground group-hover:text-foreground/90">
            {trader.name}
          </span>
        </div>

        {/* Performance Badge */}
        <PerformanceBadgeIcon badge={badge} />
      </div>

      {/* Middle row: PnL */}
      <div className="mb-1">
        <span
          className={cn(
            'font-mono text-base font-semibold tabular-nums',
            trader.totalPnl >= 0 ? 'text-success' : 'text-destructive'
          )}
        >
          {formatPnl(trader.totalPnl)}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">
          {trader.totalPnlPercentage >= 0 ? '+' : ''}
          {trader.totalPnlPercentage.toFixed(1)}%
        </span>
      </div>

      {/* Bottom row: Equity + Volume */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Equity:{' '}
          <span className="font-mono text-foreground/70">${trader.totalEquity.toLocaleString()}</span>
        </div>
        <div>
          Vol: <span className="font-mono text-foreground/70">{formatVolume(trader.epochVolume)}</span>
        </div>
      </div>

      {/* Rank Movement Indicator */}
      {trader.rankDelta !== 0 && (
        <div className="absolute right-1 top-1">
          <RankDeltaIndicator delta={trader.rankDelta} />
        </div>
      )}

      {/* Live Indicator */}
      {trader.isLive && (
        <div className="absolute bottom-1 right-1">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          </div>
        </div>
      )}
    </button>
  )
}

// Rank Display Component
function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20 text-xs font-bold text-warning">
        🥇
      </div>
    )
  } else if (rank === 2) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        🥈
      </div>
    )
  } else if (rank === 3) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/10 text-xs font-bold text-warning/70">
        🥉
      </div>
    )
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
      {rank}
    </div>
  )
}

// Performance Badge Icon Component
function PerformanceBadgeIcon({ badge }: { badge: PerformanceBadge }) {
  switch (badge) {
    case PerformanceBadge.LEADING:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
          <Crown className="h-3 w-3 text-success" />
        </div>
      )
    case PerformanceBadge.CLIMBING:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
          <TrendingUp className="h-3 w-3 text-primary" />
        </div>
      )
    case PerformanceBadge.FALLING:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/20">
          <TrendingDown className="h-3 w-3 text-warning" />
        </div>
      )
    case PerformanceBadge.RISK:
      return (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/20">
          <AlertTriangle className="h-3 w-3 text-destructive" />
        </div>
      )
    case PerformanceBadge.HOLDING:
    default:
      return null
  }
}

// Rank Delta Indicator Component
function RankDeltaIndicator({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <div className="flex items-center gap-0.5 text-xs font-semibold text-success">
        <TrendingUp className="h-3 w-3" />
        <span>{delta}</span>
      </div>
    )
  } else {
    return (
      <div className="flex items-center gap-0.5 text-xs font-semibold text-destructive">
        <TrendingDown className="h-3 w-3" />
        <span>{Math.abs(delta)}</span>
      </div>
    )
  }
}
