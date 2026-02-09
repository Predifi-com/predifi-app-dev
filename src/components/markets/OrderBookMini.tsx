import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderBookMiniProps {
  yesProb: number;
  side?: "yes" | "no";
}

export function OrderBookMini({ yesProb, side = "yes" }: OrderBookMiniProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [bookSide, setBookSide] = useState<"yes" | "no">(side);

  // Sync external side prop
  useMemo(() => setBookSide(side), [side]);

  const basePrice = bookSide === "yes" ? yesProb : 100 - yesProb;

  const generateLevels = (base: number, count: number, isAsk: boolean) => {
    return Array.from({ length: count }, (_, i) => ({
      price: base + (isAsk ? (i + 1) * 0.5 : -(i + 1) * 0.5),
      size: Math.round(20 + Math.random() * 180),
      total: 0,
    })).map((level, i, arr) => ({
      ...level,
      total: arr.slice(0, i + 1).reduce((s, l) => s + l.size, 0),
    }));
  };

  const asks = generateLevels(basePrice, 5, true).reverse();
  const bids = generateLevels(basePrice, 5, false);
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total));

  return (
    <div className="border-t border-border">
      {/* Header with collapse toggle + side tabs */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Order Book
          </span>
          <Tabs value={bookSide} onValueChange={(v) => setBookSide(v as "yes" | "no")}>
            <TabsList className="h-5 p-0.5">
              <TabsTrigger value="yes" className="text-[9px] h-4 px-2 data-[state=active]:text-emerald-500">Yes</TabsTrigger>
              <TabsTrigger value="no" className="text-[9px] h-4 px-2 data-[state=active]:text-red-500">No</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          {/* Column headers */}
          <div className="grid grid-cols-2 gap-3 mb-1">
            <div className="text-[9px] font-semibold text-muted-foreground uppercase flex justify-between px-1">
              <span>Price (Bid)</span><span>Size</span>
            </div>
            <div className="text-[9px] font-semibold text-muted-foreground uppercase flex justify-between px-1">
              <span>Price (Ask)</span><span>Size</span>
            </div>
          </div>

          {/* Side-by-side bids (left) and asks (right) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bids — left */}
            <div className="space-y-0.5">
              {bids.map((bid, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] py-0.5 px-1 rounded relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/8" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
                  <span className="text-emerald-500 font-medium tabular-nums relative z-10">{bid.price.toFixed(1)}¢</span>
                  <span className="text-muted-foreground tabular-nums relative z-10">{bid.size}</span>
                </div>
              ))}
            </div>

            {/* Asks — right */}
            <div className="space-y-0.5">
              {asks.map((ask, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] py-0.5 px-1 rounded relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 bg-red-500/8" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
                  <span className="text-red-500 font-medium tabular-nums relative z-10">{ask.price.toFixed(1)}¢</span>
                  <span className="text-muted-foreground tabular-nums relative z-10">{ask.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spread */}
          <div className="text-center py-1 border-t border-border/50 mt-1">
            <span className="text-[11px] font-bold tabular-nums">
              {bookSide === "yes" ? "Yes" : "No"} {basePrice.toFixed(1)}¢
            </span>
            <span className="text-[9px] text-muted-foreground ml-1">spread 1.0¢</span>
          </div>
        </div>
      )}
    </div>
  );
}
