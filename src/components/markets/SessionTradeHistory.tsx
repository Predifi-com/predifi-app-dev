import { cn } from "@/lib/utils";
import { Clock, ArrowUp, ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TradeEntry {
  id: string;
  asset: string;
  side: "yes" | "no";
  orderType: "market" | "limit";
  amount: number;
  leverage: number;
  price: number;
  timestamp: number;
  stopLoss?: string;
  takeProfit?: string;
}

interface SessionTradeHistoryProps {
  trades: TradeEntry[];
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function SessionTradeHistory({ trades }: SessionTradeHistoryProps) {
  if (trades.length === 0) return null;

  return (
    <div className="border-t border-border pt-2 space-y-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <Clock className="w-3 h-3" /> Session History ({trades.length})
      </span>
      <ScrollArea className="max-h-32">
        <div className="space-y-1">
          {trades.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-[10px]"
            >
              <div className="flex items-center gap-1.5">
                {t.side === "yes" ? (
                  <ArrowUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-destructive" />
                )}
                <span className="font-medium">{t.asset}</span>
                <span className={cn(
                  "px-1 rounded text-[8px] font-bold uppercase",
                  t.side === "yes" ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                )}>
                  {t.side}
                </span>
                {t.leverage > 1 && (
                  <span className="text-[8px] font-bold text-primary">{t.leverage}x</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-medium">${t.amount.toFixed(2)}</span>
                <span className="text-muted-foreground tabular-nums">{formatTime(t.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
