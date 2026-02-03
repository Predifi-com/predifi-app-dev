import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Coins } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AIModelLeaderboard } from "@/components/AIModelLeaderboard";

const Leaderboard = () => {
  const topTraders = [
    { rank: 1, name: "CryptoKing", profit: "$127,543", trades: 892, winRate: 76, avatar: "👑" },
    { rank: 2, name: "MarketMaster", profit: "$98,234", trades: 743, winRate: 72, avatar: "🎯" },
    { rank: 3, name: "PredictorPro", profit: "$87,123", trades: 654, winRate: 69, avatar: "⚡" },
    { rank: 4, name: "TradeWizard", profit: "$76,890", trades: 612, winRate: 67, avatar: "🔮" },
    { rank: 5, name: "BetGenius", profit: "$65,432", trades: 567, winRate: 64, avatar: "🧠" },
    { rank: 6, name: "OddsOracle", profit: "$54,321", trades: 523, winRate: 62, avatar: "🎲" },
    { rank: 7, name: "FutureSeer", profit: "$48,765", trades: 489, winRate: 60, avatar: "👁️" },
    { rank: 8, name: "ChartChaser", profit: "$42,109", trades: 445, winRate: 58, avatar: "📈" },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: <Trophy className="w-5 h-5 text-warning" />, class: "text-warning" };
    if (rank === 2) return { icon: <Trophy className="w-5 h-5 text-muted-foreground" />, class: "text-muted-foreground" };
    if (rank === 3) return { icon: <Trophy className="w-5 h-5 text-warning/60" />, class: "text-warning/60" };
    return { icon: <span className="text-sm font-medium text-muted-foreground">#{rank}</span>, class: "text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Trading Leaderboard - Top Prediction Market Traders | Predifi"
        description="View the top prediction market traders on Predifi. Track rankings, win rates, total profits and trading volume."
      />
      <Header />
      
      <div className="px-4 py-8 max-w-5xl mx-auto">
        {/* Development Banner */}
        <div className="mb-6 py-3 px-4 bg-muted border border-border rounded-md">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
            <span className="text-warning">Development Mode</span> — Leaderboard data shown is for demonstration
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top traders on Predifi</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <Trophy className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Volume</p>
                <p className="text-xl font-semibold text-foreground">$2.4M</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Traders</p>
                <p className="text-xl font-semibold text-foreground">8,432</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <Coins className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Markets</p>
                <p className="text-xl font-semibold text-foreground">1,247</p>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Model Leaderboard */}
        <div className="mb-8">
          <AIModelLeaderboard />
        </div>

        {/* Leaderboard Table */}
        <Card className="overflow-hidden border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Top Traders</h2>
          </div>
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Trader</div>
            <div className="col-span-2 text-right">Trades</div>
            <div className="col-span-3 text-right">Profit</div>
            <div className="col-span-2 text-right">Win Rate</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {topTraders.map((trader) => {
              const rankDisplay = getRankDisplay(trader.rank);
              return (
                <div
                  key={trader.rank}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors duration-150"
                >
                  {/* Rank */}
                  <div className="col-span-1 flex justify-center">
                    {rankDisplay.icon}
                  </div>

                  {/* Trader Info */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-lg">
                      {trader.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{trader.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{trader.trades} trades</p>
                    </div>
                  </div>

                  {/* Trades */}
                  <div className="hidden md:block col-span-2 text-right">
                    <span className="text-sm text-muted-foreground">{trader.trades}</span>
                  </div>

                  {/* Profit */}
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-medium text-success">{trader.profit}</span>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 text-right">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {trader.winRate}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Leaderboard;
