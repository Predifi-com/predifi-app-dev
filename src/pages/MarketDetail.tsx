import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Users, ExternalLink } from "lucide-react";
import { MarketChart } from "@/components/MarketChart";
import { OrderbookWidget } from "@/components/OrderbookWidget";
import { MarketDetailModal } from "@/components/MarketDetailModal";
import { MobileMarketDetail } from "@/components/MobileMarketDetail";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketDetails } from "@/hooks/useMarketDetails";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import LeverageTradeWidget from "@/components/LeverageTradeWidget";
import LeveragePositionsList from "@/components/LeveragePositionsList";

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const { trackActivity } = useActivityTracking();
  const isMobile = useIsMobile();

  // Mock market data - replace with real API call using id
  const market = {
    id: id || "1",
    title: "Bitcoin above $100K by March 2026?",
    description: "Will Bitcoin (BTC) reach or exceed $100,000 USD by March 31, 2026, 23:59:59 UTC according to CoinGecko?",
    yesPercentage: 67,
    noPercentage: 33,
    volume: "5.2M",
    liquidity: "2.8M",
    participants: 1847,
    endDate: "March 31, 2026",
    category: "Crypto",
    venue: "Polymarket",
    creator: "0x1234...5678",
    resolutionSource: "CoinGecko API",
  };

  const { trades } = useTradeHistory(market.id);

  useEffect(() => {
    if (market) {
      trackActivity({
        activityType: "market_viewed",
        details: {
          marketId: market.id,
          marketTitle: market.title,
          category: market.category,
        },
      });
    }
  }, [id]);

  const handleTrade = (side: "yes" | "no") => {
    setTradingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Button>

        {/* Market Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge>{market.category}</Badge>
                <Badge variant="outline">{market.venue}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{market.title}</h1>
              <p className="text-muted-foreground">{market.description}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Volume</div>
              <div className="text-2xl font-bold">${market.volume}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
              <div className="text-2xl font-bold">${market.liquidity}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Participants</div>
              <div className="text-2xl font-bold">{market.participants.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Ends</div>
              <div className="text-lg font-bold">{market.endDate}</div>
            </Card>
          </div>

          {/* Trading Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => handleTrade("yes")}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Buy YES @ {market.yesPercentage}¢
            </Button>
            <Button
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => handleTrade("no")}
            >
              <TrendingDown className="w-5 h-5 mr-2" />
              Buy NO @ {market.noPercentage}¢
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Price Chart</h2>
              <MarketChart marketId={market.id} height={400} />
            </Card>

            {/* Tabs for Activity */}
            <Card className="p-6">
              <Tabs defaultValue="trades">
                <TabsList className="w-full">
                  <TabsTrigger value="trades" className="flex-1">Recent Trades</TabsTrigger>
                  <TabsTrigger value="leverage" className="flex-1">Leverage Trading</TabsTrigger>
                  <TabsTrigger value="info" className="flex-1">Market Info</TabsTrigger>
                </TabsList>

                <TabsContent value="trades" className="mt-4">
                  <div className="space-y-2">
                    {trades.slice(0, 10).map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={trade.side === "buy" ? "default" : "outline"}
                            className={trade.side === "buy" ? "bg-success" : "bg-destructive"}
                          >
                            {trade.side.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{trade.size.toFixed(2)} shares</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{(trade.price * 100).toFixed(1)}¢</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="leverage" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Open Leveraged Position</h3>
                      <LeverageTradeWidget 
                        marketId={market.id}
                        currentPrice={market.yesPercentage / 100}
                        marketName={market.title}
                      />
                    </div>
                    
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Your Positions</h3>
                      <LeveragePositionsList />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator</span>
                      <span className="font-medium">{market.creator}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resolution Source</span>
                      <span className="font-medium">{market.resolutionSource}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">{market.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium">{market.venue}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Orderbook */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Book</h2>
              <OrderbookWidget marketId={market.id} />
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {isMobile ? (
        <MobileMarketDetail
          open={tradingModalOpen}
          onOpenChange={setTradingModalOpen}
          market={market}
        />
      ) : (
        <MarketDetailModal
          open={tradingModalOpen}
          onOpenChange={setTradingModalOpen}
          market={market}
        />
      )}
    </div>
  );
};

export default MarketDetail;
