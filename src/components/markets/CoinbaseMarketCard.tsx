import { useMemo } from "react";
import { useCoinbaseCandles, formatPrice, formatCloseTime, buildMarketQuestion } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";

interface CoinbaseMarketCardProps {
  asset: string;
  timeframe: "hourly" | "daily";
  isSelected?: boolean;
  /** If true, render a compact version for sidebar lists */
  compact?: boolean;
  /** If true, render an expanded version with larger chart */
  expanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function CoinbaseMarketCard({ asset, timeframe, isSelected = false, compact = false, expanded = false, onClick }: CoinbaseMarketCardProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";

  const baseline = isDaily ? data.dailyBaseline : data.hourlyBaseline;
  const closeTime = isDaily ? data.dailyCloseTime : data.hourlyCloseTime;
  const question = useMemo(
    () => (baseline > 0 ? buildMarketQuestion(asset, baseline, closeTime, timeframe) : `${asset} market loading...`),
    [asset, baseline, closeTime, timeframe]
  );

  const yesProb = useMemo(() => {
    if (baseline <= 0 || data.currentPrice <= 0) return 50;
    const diff = ((data.currentPrice - baseline) / baseline) * 100;
    return Math.min(95, Math.max(5, 50 + diff * 25));
  }, [data.currentPrice, baseline]);

  const noProb = 100 - yesProb;

  const chartData = useMemo(() => {
    const source = isDaily ? data.dailyCandles : data.candles;
    return source.map((c) => ({
      time: new Date(c.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: c.close,
    }));
  }, [data.candles, data.dailyCandles, isDaily]);

  const timeLeftText = useMemo(() => {
    const diff = closeTime.getTime() - Date.now();
    if (diff <= 0) return "Closing...";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m left`;
    return `${Math.floor(hrs / 24)}d ${hrs % 24}h left`;
  }, [closeTime]);

  const priceColor = data.currentPrice >= baseline ? "text-emerald-500" : "text-red-500";
  const chartColor = data.currentPrice >= baseline ? "hsl(152, 69%, 53%)" : "hsl(0, 84%, 60%)";
  const chartHeight = expanded ? 320 : compact ? 50 : 80;

  if (data.isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center min-h-[120px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 min-h-[120px] flex flex-col items-center justify-center">
        <span className="text-xs text-destructive">{asset} — Failed to load</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 transition-all flex flex-col",
        onClick && "cursor-pointer hover:shadow-md",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Top row: badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
            isDaily ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
          )}>
            {timeframe}
          </span>
          {isDaily && (
            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
              5x
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-2.5 h-2.5" />
          {timeLeftText}
        </span>
      </div>

      {/* Question */}
      <h3 className={cn("font-semibold leading-snug mb-3", compact ? "text-xs line-clamp-1" : "text-sm line-clamp-2")}>
        {question}
      </h3>

      {/* Chart with baseline */}
      {chartData.length > 1 && !compact && (
        <div className="mb-3 -mx-1">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${asset}-${timeframe}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <XAxis dataKey="time" hide={!expanded} tick={expanded ? { fill: "hsl(var(--muted-foreground))", fontSize: 10 } : undefined} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px",
                }}
                formatter={(value: number) => [`$${formatPrice(value)}`, ""]}
                labelFormatter={() => ""}
              />
              <ReferenceLine
                y={baseline}
                stroke="hsl(var(--primary))"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: `Rate to beat: $${formatPrice(baseline)}`,
                  position: "right",
                  fill: "hsl(var(--primary))",
                  fontSize: expanded ? 11 : 9,
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                fill={`url(#grad-${asset}-${timeframe})`}
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Current price */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">Current</span>
        <span className={cn("font-bold tabular-nums", priceColor)}>
          ${formatPrice(data.currentPrice)}
        </span>
      </div>

      {/* YES/NO bar */}
      <div className="flex h-5 rounded-md overflow-hidden mb-1">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500 transition-all"
          style={{ width: `${Math.max(yesProb, 10)}%` }}
        >
          {yesProb >= 20 && `${yesProb.toFixed(0)}%`}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white bg-red-500 transition-all"
          style={{ width: `${Math.max(noProb, 10)}%` }}
        >
          {noProb >= 20 && `${noProb.toFixed(0)}%`}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Yes <span className="font-semibold text-emerald-500">{yesProb.toFixed(0)}%</span></span>
        <span>No <span className="font-semibold text-red-500">{noProb.toFixed(0)}%</span></span>
      </div>
    </div>
  );
}
