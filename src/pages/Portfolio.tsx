import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  ExternalLink,
  X,
} from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";

const Portfolio = () => {
  // Mock user address - replace with actual connected wallet
  const userAddress = "0x1234567890abcdef";
  const { positions, transactions, summary, analytics } = usePortfolio(userAddress);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const handleClosePosition = (positionId: string) => {
    toast.success("Position closed successfully", {
      description: "Your shares have been sold at market price",
    });
  };

  const handleRedeemWinnings = (positionId: string) => {
    toast.success("Winnings redeemed", {
      description: "Funds have been transferred to your wallet",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Track your positions, P&L, and trading history</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">${summary.totalValue.toLocaleString()}</div>
            <div className="text-sm text-success mt-1">
              +${summary.unrealizedPnL.toFixed(2)} unrealized
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Realized P&L</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div className={`text-3xl font-bold ${summary.realizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              {summary.realizedPnL >= 0 ? '+' : ''}${summary.realizedPnL.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">All time</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{analytics.totalTrades}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {analytics.winRate.toFixed(1)}% win rate
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Positions</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{positions.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {summary.totalInvested.toFixed(0)} invested
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="positions">Active Positions</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Active Positions */}
          <TabsContent value="positions" className="space-y-4">
            {positions.length === 0 ? (
              <Card className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Positions</h3>
                <p className="text-muted-foreground mb-4">
                  Start trading to see your positions here
                </p>
                <Button onClick={() => window.location.href = '/markets'}>
                  Browse Markets
                </Button>
              </Card>
            ) : (
              positions.map((position) => (
                <Card key={position.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{position.marketTitle}</h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={position.outcome === "yes" ? "default" : "outline"}
                          className={position.outcome === "yes" ? "bg-success" : "bg-destructive"}
                        >
                          {position.outcome.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{position.venue}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClosePosition(position.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Shares</div>
                      <div className="font-semibold">{position.shares.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Avg. Price</div>
                      <div className="font-semibold">{(position.avgPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                      <div className="font-semibold">{(position.currentPrice * 100).toFixed(1)}¢</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">P&L</div>
                      <div className={`font-bold ${position.unrealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                        <span className="text-xs ml-1">
                          ({position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/market/${position.marketId}`}
                    >
                      View Market
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                    {position.status === "won" && (
                      <Button
                        size="sm"
                        onClick={() => handleRedeemWinnings(position.id)}
                        className="bg-success hover:bg-success/90"
                      >
                        Redeem Winnings
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Trade History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${tx.type === 'buy' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        {tx.type === 'buy' ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{tx.marketTitle}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.shares.toFixed(2)} shares @ {(tx.price * 100).toFixed(1)}¢
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {tx.type === 'buy' ? '-' : '+'}${tx.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Trading Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades</span>
                    <span className="font-semibold">{analytics.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-semibold text-success">{analytics.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Position Size</span>
                    <span className="font-semibold">${analytics.avgPositionSize.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Trade</span>
                    <span className="font-semibold text-success">+${analytics.bestTrade.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Worst Trade</span>
                    <span className="font-semibold text-destructive">-${analytics.worstTrade.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Market Distribution</h3>
                <div className="space-y-4">
                  {analytics.marketBreakdown.map((market, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">{market.category}</span>
                        <span className="text-sm font-semibold">{market.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${market.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Portfolio;
