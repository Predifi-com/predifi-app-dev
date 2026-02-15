/**
 * Arena Pit Page
 * High-performance live trading competition interface
 */

import { useEffect } from 'react'
import { GlobalPriceBar } from '@/components/arena/pit/GlobalPriceBar'
import { LeaderboardSidebar } from '@/components/arena/pit/LeaderboardSidebar'
import { TraderPanel } from '@/components/arena/pit/TraderPanel'
import { ExpandedPanel } from '@/components/arena/pit/ExpandedPanel'
import { useArenaPit, useArenaPitUI, useArenaPitKeyboard } from '@/hooks/useArenaPit'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ArenaPit() {
  // Get user wallet
  const { address: userAddress } = useWallet()

  // Core data
  const {
    traders,
    prices,
    loading,
    error,
    lastUpdate,
    epoch,
    timeRemaining,
    epochState,
    aggregateStats,
    totalBetVolume,
    refresh
  } = useArenaPit(userAddress)

  // UI state
  const ui = useArenaPitUI(traders.length)

  // Keyboard shortcuts
  useArenaPitKeyboard(ui)

  // Get visible traders for current page
  const visibleTraders = ui.getVisibleTraders(traders)

  // Handle trader panel click
  const handleTraderClick = (address: string) => {
    ui.expandTrader(address)
  }

  // Handle leaderboard click
  const handleLeaderboardClick = (address: string, rank: number) => {
    ui.jumpToTrader(address, rank)
  }

  // Handle pair click (open trading modal - would integrate with existing trading modal)
  const handlePairClick = (pair: string) => {
    toast.info(`Open trading modal for ${pair}`)
    // TODO: Integrate with existing TradingModal
  }

  // Find expanded trader
  const expandedTrader = traders.find((t) => t.address === ui.expandedTrader) || null

  // Show loading state
  if (loading && traders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1118]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white/50" />
          <p className="text-white/70">Loading Arena Pit...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && traders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0e1118]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">{error}</p>
          <Button onClick={refresh} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e1118]">
      {/* Global Price Bar */}
      {prices && epoch && (
        <GlobalPriceBar
          prices={prices}
          epochState={epochState}
          timeRemaining={timeRemaining}
          totalPnl={aggregateStats.totalPnl}
          totalVolume={aggregateStats.totalVolume}
          totalTraders={traders.length}
          totalBetVolume={totalBetVolume}
        />
      )}

      {/* Main Container */}
      <div className="flex">
        {/* Leaderboard Sidebar */}
        <LeaderboardSidebar
          traders={traders}
          selectedTrader={ui.selectedTrader}
          highlightedTrader={ui.highlightedTrader}
          onTraderClick={handleLeaderboardClick}
        />

        {/* Main Content Area */}
        <div className="ml-[280px] flex-1 p-6">
          {/* Top Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Arena Pit</h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ui.setDensityMode('compact')}
                  className={cn(
                    ui.densityMode === 'compact' && 'bg-white/10'
                  )}
                >
                  Compact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ui.setDensityMode('balanced')}
                  className={cn(
                    ui.densityMode === 'balanced' && 'bg-white/10'
                  )}
                >
                  Balanced
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ui.setDensityMode('detailed')}
                  className={cn(
                    ui.densityMode === 'detailed' && 'bg-white/10'
                  )}
                >
                  Detailed
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => ui.setAutoScrollEnabled(!ui.autoScrollEnabled)}
              >
                {ui.autoScrollEnabled ? 'Pause Auto-Scroll' : 'Enable Auto-Scroll'}
              </Button>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ui.setShowShortcutsOverlay(true)}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Trader Grid */}
          <div
            className={cn(
              'grid gap-4',
              ui.densityMode === 'detailed'
                ? 'grid-cols-3'
                : 'grid-cols-4'
            )}
          >
            {visibleTraders.map((trader, index) => (
              <TraderPanel
                key={trader.address}
                trader={trader}
                densityMode={ui.densityMode}
                prices={prices!}
                isHighlighted={trader.address === ui.highlightedTrader}
                isTop3={trader.currentRank <= 3}
                onClick={() => handleTraderClick(trader.address)}
                onPairClick={handlePairClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {ui.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={ui.previousPage}
                disabled={ui.currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: ui.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => ui.goToPage(i)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors',
                      i === ui.currentPage
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={ui.nextPage}
                disabled={ui.currentPage === ui.totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Panel Modal */}
      {prices && (
        <ExpandedPanel
          trader={expandedTrader}
          prices={prices}
          epoch={epoch}
          onClose={() => ui.expandTrader(null)}
          onTradeClick={handlePairClick}
          onTraderSwitch={(address) => ui.expandTrader(address)}
          topContenders={traders.slice(0, 10)}
          userBalance={1000} // TODO: Get from wallet context
        />
      )}

      {/* Keyboard Shortcuts Overlay */}
      {ui.showShortcutsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => ui.setShowShortcutsOverlay(false)}
        >
          <div className="w-full max-w-md rounded-lg border border-white/20 bg-[#0e1118] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <ShortcutRow keys="Space" description="Pause/Resume auto-scroll" />
              <ShortcutRow keys="← →" description="Navigate pages" />
              <ShortcutRow keys="1-9" description="Jump to rank" />
              <ShortcutRow keys="D" description="Toggle density mode" />
              <ShortcutRow keys="F" description="Toggle fullscreen" />
              <ShortcutRow keys="R" description="Refresh data" />
              <ShortcutRow keys="Esc" description="Close panels/overlays" />
              <ShortcutRow keys="?" description="Show/hide this help" />
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => ui.setShowShortcutsOverlay(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-white">
        {keys}
      </kbd>
      <span className="text-white/70">{description}</span>
    </div>
  )
}
