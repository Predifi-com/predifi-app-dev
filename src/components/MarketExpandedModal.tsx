import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketChart } from "./MarketChart";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Activity,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface MarketExpandedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    id: string;
    title: string;
    description?: string;
    yesPercentage: number;
    noPercentage: number;
    volume?: string;
    venue?: string;
    endDate?: string;
    imageUrl?: string;
  };
}

export function MarketExpandedModal({
  open,
  onOpenChange,
  market,
}: MarketExpandedModalProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");

  const yesPrice = market.yesPercentage / 100;
  const noPrice = market.noPercentage / 100;

  const handleTrade = (side: "yes" | "no") => {
    toast.success(`${side.toUpperCase()} order placed (demo)`);
  };

  const openFullPage = () => {
    onOpenChange(false);
    navigate(`/markets/${market.id}`);
  };

  // Mock recent trades
  const recentTrades = [
    { side: "buy", shares: 120, price: 0.63, time: "1m ago" },
    { side: "sell", shares: 45, price: 0.62, time: "3m ago" },
    { side: "buy", shares: 200, price: 0.64, time: "7m ago" },
    { side: "buy", shares: 80, price: 0.63, time: "12m ago" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="p-5 pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {market.venue}
                  </Badge>
                  {market.endDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(market.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-foreground leading-snug">
                  {market.title}
                </h2>
              </div>
            </div>

            {/* Probability summary */}
            <div className="flex gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold">
                  Yes {market.yesPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold">
                  No {market.noPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground ml-auto">
                Vol: {market.volume}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="chart" className="h-full">
              <TabsList className="mx-5 mt-3 mb-0">
                <TabsTrigger value="chart" className="text-xs gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="trades" className="text-xs gap-1">
                  <Activity className="w-3 h-3" />
                  Trades
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="px-5 py-3">
                <Card className="p-3">
                  <MarketChart marketId={market.id} height={240} />
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="px-5 py-3">
                <div className="space-y-1.5">
                  {recentTrades.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-sm"
                    >
                      <Badge
                        className={`text-xs ${
                          t.side === "buy"
                            ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                            : "bg-red-500/20 text-red-500 border-red-500/30"
                        }`}
                        variant="outline"
                      >
                        {t.side.toUpperCase()}
                      </Badge>
                      <span>{t.shares} shares</span>
                      <span className="font-medium">
                        {(t.price * 100).toFixed(0)}¢
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t.time}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="px-5 py-3 space-y-3">
                {market.description && (
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {market.description}
                    </p>
                  </Card>
                )}
                <Card className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue</span>
                    <span className="font-medium">{market.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium">{market.volume}</span>
                  </div>
                  {market.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">
                        {new Date(market.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer — Trading CTAs */}
          <div className="p-5 pt-3 border-t border-border flex-shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Amount ($)
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              {[10, 50, 100].map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-2"
                  onClick={() => setAmount(v.toString())}
                >
                  ${v}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleTrade("yes")}
                className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                disabled={!amount}
              >
                <TrendingUp className="w-4 h-4 mr-1.5" />
                Buy Yes — {market.yesPercentage.toFixed(0)}¢
              </Button>
              <Button
                onClick={() => handleTrade("no")}
                variant="outline"
                className="flex-1 h-11 border-red-500/40 text-red-500 hover:bg-red-500/10 font-bold"
                disabled={!amount}
              >
                <TrendingDown className="w-4 h-4 mr-1.5" />
                Buy No — {market.noPercentage.toFixed(0)}¢
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={openFullPage}
            >
              Open in full page →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
