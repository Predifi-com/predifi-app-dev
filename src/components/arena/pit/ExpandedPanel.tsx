/**
 * Expanded Panel Component
 * Modal overlay showing full trader details with prediction market betting
 */

import { TraderState, GlobalPrices, PairSymbol, Epoch } from '@/types/arena-pit'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react'
import { useState } from 'react'

interface ExpandedPanelProps {
  trader: TraderState | null
  prices: GlobalPrices
  epoch: Epoch | null
  onClose: () => void
  onTradeClick?: (pair: PairSymbol) => void
  onTraderSwitch?: (address: string) => void
  topContenders?: TraderState[]
  userBalance?: number
}

export function ExpandedPanel({
  trader,
  prices,
  epoch,
  onClose,
  onTradeClick,
  onTraderSwitch,
  topContenders = [],
  userBalance = 0
}: ExpandedPanelProps) {
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES')
  const [betAmount, setBetAmount] = useState('')

  if (!trader) return null

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${value.toLocaleString()}`
  }

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`
  }

  const pairs: PairSymbol[] = ['BTC', 'ETH', 'SOL']

  // Betting calculations
  const marketData = trader.marketData || {
    marketId: '',
    outcomeIndex: 0,
    probability: 0.15,
    yesPrice: 0.15,
    noPrice: 0.85,
    volume: 0,
    oddsChange: 0
  }

  const historicalStats = trader.historicalStats || {
    competitionsPlayed: 0,
    wins: 0,
    top3Finishes: 0,
    winRate: 0,
    avgRank: 0,
    lifetimePnL: 0
  }

  const betAmountNum = Number(betAmount) || 0
  const currentPrice = betSide === 'YES' ? marketData.yesPrice : marketData.noPrice
  const calculatedShares = betAmountNum > 0 ? betAmountNum / currentPrice : 0
  const potentialProfit = betAmountNum > 0 ? (betSide === 'YES' ? calculatedShares * (1 - marketData.yesPrice) : calculatedShares * (1 - marketData.noPrice)) : 0
  const profitPercentage = betAmountNum > 0 ? (potentialProfit / betAmountNum) * 100 : 0

  const handlePlaceBet = async () => {
    try {
      const response = await fetch(`/api/arena/markets/${marketData.marketId}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcomeIndex: marketData.outcomeIndex,
          side: betSide,
          amount: betAmountNum
        })
      })

      if (!response.ok) throw new Error('Failed to place bet')

      // Reset form
      setBetAmount('')
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to place bet:', error)
      // TODO: Show error toast
    }
  }

  const userPosition = marketData.userPosition

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

          {/* Historical Performance */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">
              📈 Historical Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Competitions" value={historicalStats.competitionsPlayed} />
              <Stat label="Win Rate" value={`${historicalStats.winRate}%`} />
              <Stat label="Wins" value={historicalStats.wins} icon="🏆" />
              <Stat label="Top 3" value={historicalStats.top3Finishes} icon="🥉" />
              <Stat label="Avg Rank" value={historicalStats.avgRank.toFixed(1)} />
              <Stat label="Lifetime PnL" value={formatCurrency(historicalStats.lifetimePnL)} />
            </div>
          </div>

          {/* Prediction Market */}
          <div className="space-y-4 border-t border-white/10 pt-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                🎯 Prediction Market
              </h3>
              <p className="text-sm text-white/50">
                Competition #{epoch?.id || 'N/A'} - Multi-Outcome Market
              </p>
            </div>

            {/* Market Stats */}
            <div className="rounded-lg bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Will {trader.name} win?</span>
                <span className="text-2xl font-bold text-white">
                  {(marketData.probability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-white/50">Odds Movement:</span>
                  <span className={cn(
                    "font-semibold flex items-center gap-0.5",
                    marketData.oddsChange > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {marketData.oddsChange > 0 ? "↑" : "↓"}
                    {Math.abs(marketData.oddsChange).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-white/50">Volume:</span>
                  <span className="text-white font-mono">
                    {formatCurrency(marketData.volume)}
                  </span>
                </div>
              </div>
            </div>

            {/* Betting Interface */}
            <div className="rounded-lg border border-white/10 bg-[#0e1118] p-6 space-y-4">
              <h4 className="font-semibold text-white">Place Your Bet</h4>

              {/* YES/NO Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setBetSide('YES')}
                  variant={betSide === 'YES' ? 'default' : 'outline'}
                  className={cn(
                    "h-16 text-lg font-semibold",
                    betSide === 'YES' && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>YES - Will Win</span>
                    <span className="text-sm opacity-80">
                      ${marketData.yesPrice.toFixed(2)}/share
                    </span>
                  </div>
                </Button>

                <Button
                  onClick={() => setBetSide('NO')}
                  variant={betSide === 'NO' ? 'default' : 'outline'}
                  className={cn(
                    "h-16 text-lg font-semibold",
                    betSide === 'NO' && "bg-red-500 hover:bg-red-600"
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>NO - Won't Win</span>
                    <span className="text-sm opacity-80">
                      ${marketData.noPrice.toFixed(2)}/share
                    </span>
                  </div>
                </Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="font-mono text-lg"
                />
                <div className="flex justify-between text-sm text-white/50">
                  <span>You receive: ~{calculatedShares.toFixed(1)} shares</span>
                  <span>Balance: ${userBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Potential Payout */}
              <div className="rounded-lg bg-white/5 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">If {betSide === 'YES' ? 'wins' : 'loses'}:</span>
                  <span className="text-green-400 font-semibold font-mono">
                    +${potentialProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Profit:</span>
                  <span className="text-white font-semibold">
                    {profitPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">If wrong:</span>
                  <span className="text-red-400 font-mono">$0.00</span>
                </div>
              </div>

              {/* Place Bet Button */}
              <Button
                onClick={handlePlaceBet}
                disabled={!betAmount || Number(betAmount) <= 0}
                className="w-full h-12 text-lg font-semibold"
              >
                Place Bet →
              </Button>
            </div>

            {/* User's Current Position (if any) */}
            {userPosition && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 font-semibold">Your Position</span>
                  <span className="text-sm text-white/50">
                    {userPosition.shares.toFixed(1)} {userPosition.side} shares
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Avg Price:</span>
                  <span className="text-white font-mono">
                    ${userPosition.avgPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Unrealized PnL:</span>
                  <span className={cn(
                    "font-semibold font-mono",
                    userPosition.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {userPosition.unrealizedPnL >= 0 ? "+" : ""}
                    ${userPosition.unrealizedPnL.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Other Top Contenders */}
            {topContenders.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white/70">
                  💡 Other Top Contenders
                </h4>
                <div className="space-y-2">
                  {topContenders.slice(0, 3).filter(c => c.address !== trader.address).map((contender) => (
                    <button
                      key={contender.address}
                      onClick={() => onTraderSwitch?.(contender.address)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white/50">#{contender.currentRank}</span>
                        <span className="text-white font-medium">{contender.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/70 font-mono">
                          {((contender.marketData?.probability || 0) * 100).toFixed(1)}% odds
                        </span>
                        <span className="text-blue-400 text-sm">View →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Stat Component for Historical Performance
function Stat({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </div>
    </div>
  )
}
