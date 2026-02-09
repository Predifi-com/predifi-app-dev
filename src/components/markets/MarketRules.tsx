import { ExternalLink, Info } from "lucide-react";

interface MarketRulesProps {
  asset: string;
  timeframe: "hourly" | "daily";
}

const TRADINGVIEW_SYMBOLS: Record<string, string> = {
  BTC: "COINBASE:BTCUSD",
  ETH: "COINBASE:ETHUSD",
  SOL: "COINBASE:SOLUSD",
  DOGE: "COINBASE:DOGEUSD",
  XRP: "COINBASE:XRPUSD",
};

export function MarketRules({ asset, timeframe }: MarketRulesProps) {
  const tvSymbol = TRADINGVIEW_SYMBOLS[asset] || `COINBASE:${asset}USD`;
  const tvUrl = `https://www.tradingview.com/chart/?symbol=${tvSymbol}`;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Info className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rules</span>
      </div>

      <ul className="text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
        <li>• Market resolves based on <span className="text-foreground font-medium">Coinbase {asset}-USD</span> spot price.</li>
        <li>• Resolution at the end of the current {timeframe === "hourly" ? "hour" : "day"} (UTC).</li>
        <li>• If the closing price is <span className="text-emerald-500 font-medium">above</span> the baseline, <span className="text-emerald-500 font-medium">YES</span> wins.</li>
        <li>• If the closing price is <span className="text-red-500 font-medium">at or below</span> the baseline, <span className="text-red-500 font-medium">NO</span> wins.</li>
        {timeframe === "daily" && (
          <li>• Daily markets support up to <span className="text-foreground font-medium">5× leverage</span>.</li>
        )}
        <li>• All prices sourced from the Coinbase Exchange public API.</li>
      </ul>

      <a
        href={tvUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        View {asset}/USD on TradingView
      </a>
    </div>
  );
}
