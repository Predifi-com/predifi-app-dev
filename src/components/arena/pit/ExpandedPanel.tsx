/**
 * Expanded Panel Component
 * Modal overlay showing full trader details
 */

import { TraderState, GlobalPrices, PairSymbol } from '@/types/arena-pit'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'

interface ExpandedPanelProps {
  trader: TraderState | null
  prices: GlobalPrices
  onClose: () => void
  onTradeClick?: (pair: PairSymbol) => void
}

export function ExpandedPanel({ trader, prices, onClose, onTradeClick }: ExpandedPanelProps) {
  if (!trader) return null

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${value.toLocaleString()}`
  }

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const pairs: PairSymbol[] = ['BTC', 'ETH', 'SOL']

  return (
    <Dialog open={!!trader} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl bg-[#0e1118] border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
                trader.currentRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white'
              )}>
                #{trader.currentRank}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {trader.name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {trader.isLive && (
                    <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
                      <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-green-400" />
                      Live
                    </Badge>
                  )}
                  {trader.rankDelta > 0 && (
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Up {trader.rankDelta}
                    </Badge>
                  )}
                  {trader.rankDelta < 0 && (
                    <Badge variant="outline" className="border-red-500/50 text-red-400">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      Down {Math.abs(trader.rankDelta)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/50">Total P&L</div>
              <div className={cn(
                'mt-1 font-mono text-2xl font-bold tabular-nums',
                trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatPnl(trader.totalPnl)}
              </div>
              <div className="mt-0.5 text-xs text-white/50">
                {trader.totalPnlPercentage >= 0 ? '+' : ''}{trader.totalPnlPercentage.toFixed(2)}% ROI
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/50">Total Equity</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                ${trader.totalEquity.toLocaleString()}
              </div>
              <div className="mt-0.5 text-xs text-white/50">
                Balance: ${trader.unusedBalance.toLocaleString()}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/50">Epoch Volume</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                ${(trader.epochVolume / 1000).toFixed(0)}K
              </div>
              <div className="mt-0.5 text-xs text-white/50">
                {trader.epochTradeCount} trades
              </div>
            </div>
          </div>

          {/* Position Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
              Positions
            </h3>
            {pairs.map((pair) => {
              const exposure = trader.exposure[pair]
              const price = prices[pair].price
              const hasPosition = exposure.longSize > 0 || exposure.shortSize > 0

              if (!hasPosition) return null

              return (
                <div
                  key={pair}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white">{pair}/USD</h4>
                    <div className="text-right">
                      <div className="font-mono text-sm text-white/70">
                        ${price.toLocaleString()}
                      </div>
                      <div className={cn(
                        'font-mono text-lg font-bold',
                        exposure.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {formatPnl(exposure.pnl)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {exposure.longSize > 0 && (
                      <div className="rounded border border-green-500/30 bg-green-500/10 p-3">
                        <div className="text-xs text-green-400 font-semibold">LONG POSITION</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Size:</span>
                            <span className="font-mono text-white">{exposure.longSize.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Avg Entry:</span>
                            <span className="font-mono text-white">{formatPrice(exposure.avgLongEntry)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Current:</span>
                            <span className="font-mono text-white">{formatPrice(price)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {exposure.shortSize > 0 && (
                      <div className="rounded border border-red-500/30 bg-red-500/10 p-3">
                        <div className="text-xs text-red-400 font-semibold">SHORT POSITION</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/50">Size:</span>
                            <span className="font-mono text-white">{exposure.shortSize.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Avg Entry:</span>
                            <span className="font-mono text-white">{formatPrice(exposure.avgShortEntry)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/50">Current:</span>
                            <span className="font-mono text-white">{formatPrice(price)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Trade Button */}
                  <Button
                    onClick={() => onTradeClick?.(pair)}
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600"
                  >
                    Trade {pair}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/50">Leverage</div>
              <div className={cn(
                'mt-1 font-mono text-xl font-bold',
                trader.leverage > 10 ? 'text-orange-400' : 'text-white'
              )}>
                {trader.leverage.toFixed(2)}x
              </div>
              {trader.liquidationRisk && (
                <div className="mt-1 text-xs text-red-400">⚠️ High risk</div>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/50">Net Funding</div>
              <div className={cn(
                'mt-1 font-mono text-xl font-bold',
                trader.netFunding >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {formatPnl(trader.netFunding)}
              </div>
              <div className="mt-0.5 text-xs text-white/50">
                Paid: ${trader.fundingPaid.toFixed(2)} | Received: ${trader.fundingReceived.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
