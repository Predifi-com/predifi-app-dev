import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";

interface Position {
  id: string;
  market: string;
  side: "YES" | "NO";
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface OrderEntry {
  id: string;
  market: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  price: number;
  size: number;
  filled: number;
  status: "open" | "partial" | "filled" | "cancelled";
  createdAt: string;
}

// Demo data for trading demo
const DEMO_POSITIONS: Position[] = [
  { id: "p1", market: "BTC Hourly", side: "YES", size: 50, entryPrice: 0.52, currentPrice: 0.61, pnl: 4.5, pnlPercent: 17.3 },
  { id: "p2", market: "ETH Daily", side: "NO", size: 25, entryPrice: 0.45, currentPrice: 0.38, pnl: 1.75, pnlPercent: 15.6 },
  { id: "p3", market: "SOL Hourly", side: "YES", size: 40, entryPrice: 0.60, currentPrice: 0.54, pnl: -2.4, pnlPercent: -10.0 },
  { id: "p4", market: "DOGE Daily", side: "NO", size: 15, entryPrice: 0.35, currentPrice: 0.42, pnl: -1.05, pnlPercent: -20.0 },
];

const DEMO_ORDERS: OrderEntry[] = [
  { id: "o1", market: "SOL Hourly", side: "BUY", type: "LIMIT", price: 0.40, size: 30, filled: 0, status: "open", createdAt: "2 min ago" },
  { id: "o2", market: "BTC Daily", side: "BUY", type: "MARKET", price: 0.55, size: 20, filled: 20, status: "filled", createdAt: "15 min ago" },
];

export function PositionManagement() {
  const [tab, setTab] = useState("positions");

  const totalPnl = DEMO_POSITIONS.reduce((s, p) => s + p.pnl, 0);

  return (
    <div className="border-t border-border bg-card">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between px-4 pt-2">
          <TabsList className="h-8 bg-transparent p-0 gap-4">
            <TabsTrigger value="positions" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Positions ({DEMO_POSITIONS.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Orders ({DEMO_ORDERS.filter(o => o.status === "open" || o.status === "partial").length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              History
            </TabsTrigger>
          </TabsList>
          {totalPnl !== 0 && (
            <span className={cn("text-xs font-bold tabular-nums", totalPnl >= 0 ? "text-emerald-500" : "text-red-500")}>
              PnL: {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} USDC
            </span>
          )}
        </div>

        <TabsContent value="positions" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-right p-2 font-medium">Entry</th>
                  <th className="text-right p-2 font-medium">Current</th>
                  <th className="text-right p-2 font-medium">PnL</th>
                  <th className="text-right p-2 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_POSITIONS.map((pos) => (
                  <tr key={pos.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-2 pl-4 font-medium">{pos.market}</td>
                    <td className="p-2">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", pos.side === "YES" ? "text-emerald-500 border-emerald-500/30" : "text-red-500 border-red-500/30")}>
                        {pos.side}
                      </Badge>
                    </td>
                    <td className="p-2 text-right tabular-nums">{pos.size}</td>
                    <td className="p-2 text-right tabular-nums">{(pos.entryPrice * 100).toFixed(0)}¢</td>
                    <td className="p-2 text-right tabular-nums">{(pos.currentPrice * 100).toFixed(0)}¢</td>
                    <td className={cn("p-2 text-right tabular-nums font-bold", pos.pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {pos.pnl >= 0 ? "+" : ""}{pos.pnl.toFixed(2)}
                      <span className="text-muted-foreground font-normal ml-1">({pos.pnlPercent.toFixed(1)}%)</span>
                    </td>
                    <td className="p-2 pr-4 text-right">
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">
                        <X className="w-3 h-3 mr-1" /> Close
                      </Button>
                    </td>
                  </tr>
                ))}
                {DEMO_POSITIONS.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">No open positions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-right p-2 font-medium">Filled</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-right p-2 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORDERS.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-2 pl-4 font-medium">{order.market}</td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{order.type}</Badge>
                    </td>
                    <td className="p-2">
                      <span className={cn("font-medium", order.side === "BUY" ? "text-emerald-500" : "text-red-500")}>{order.side}</span>
                    </td>
                    <td className="p-2 text-right tabular-nums">{(order.price * 100).toFixed(0)}¢</td>
                    <td className="p-2 text-right tabular-nums">{order.size}</td>
                    <td className="p-2 text-right tabular-nums">{order.filled}/{order.size}</td>
                    <td className="p-2">
                      <Badge variant={order.status === "open" ? "default" : order.status === "filled" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-2 pr-4 text-right">
                      {(order.status === "open" || order.status === "partial") && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-right p-2 pr-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORDERS.filter(o => o.status === "filled" || o.status === "cancelled").map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-2 pl-4 font-medium">{order.market}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{order.type}</Badge></td>
                    <td className="p-2"><span className={cn("font-medium", order.side === "BUY" ? "text-emerald-500" : "text-red-500")}>{order.side}</span></td>
                    <td className="p-2 text-right tabular-nums">{(order.price * 100).toFixed(0)}¢</td>
                    <td className="p-2 text-right tabular-nums">{order.size}</td>
                    <td className="p-2"><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{order.status}</Badge></td>
                    <td className="p-2 pr-4 text-right text-muted-foreground">{order.createdAt}</td>
                  </tr>
                ))}
                {DEMO_ORDERS.filter(o => o.status === "filled" || o.status === "cancelled").length === 0 && (
                  <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">No order history</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
