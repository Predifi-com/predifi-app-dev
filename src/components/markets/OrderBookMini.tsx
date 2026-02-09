import { TrendingUp, TrendingDown } from "lucide-react";

interface OrderBookMiniProps {
  yesProb: number;
}

export function OrderBookMini({ yesProb }: OrderBookMiniProps) {
  // Generate demo orderbook levels
  const generateLevels = (basePrice: number, count: number, isAsk: boolean) => {
    return Array.from({ length: count }, (_, i) => ({
      price: basePrice + (isAsk ? (i + 1) * 0.5 : -(i + 1) * 0.5),
      size: Math.round(20 + Math.random() * 180),
      total: 0,
    })).map((level, i, arr) => ({
      ...level,
      total: arr.slice(0, i + 1).reduce((s, l) => s + l.size, 0),
    }));
  };

  const asks = generateLevels(yesProb, 5, true).reverse();
  const bids = generateLevels(yesProb, 5, false);
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total));

  return (
    <div className="border-t border-border">
      <div className="px-3 py-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Order Book</span>
      </div>
      <div className="px-3 pb-2 space-y-0.5">
        {/* Asks */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <TrendingDown className="w-2.5 h-2.5 text-red-500" />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">Asks</span>
        </div>
        {asks.map((ask, i) => (
          <div key={i} className="flex justify-between items-center text-[10px] py-0.5 px-1 rounded relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 bg-red-500/8" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
            <span className="text-red-500 font-medium tabular-nums relative z-10">{ask.price.toFixed(1)}¢</span>
            <span className="text-muted-foreground tabular-nums relative z-10">{ask.size}</span>
          </div>
        ))}

        {/* Spread */}
        <div className="text-center py-1 border-y border-border/50 my-0.5">
          <span className="text-[11px] font-bold tabular-nums">{yesProb.toFixed(1)}¢</span>
          <span className="text-[9px] text-muted-foreground ml-1">spread 1.0¢</span>
        </div>

        {/* Bids */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
          <span className="text-[9px] font-semibold text-muted-foreground uppercase">Bids</span>
        </div>
        {bids.map((bid, i) => (
          <div key={i} className="flex justify-between items-center text-[10px] py-0.5 px-1 rounded relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/8" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
            <span className="text-emerald-500 font-medium tabular-nums relative z-10">{bid.price.toFixed(1)}¢</span>
            <span className="text-muted-foreground tabular-nums relative z-10">{bid.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
