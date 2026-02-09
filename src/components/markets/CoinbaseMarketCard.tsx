import { useMemo } from "react";
import { useCoinbaseCandles, formatPrice, formatCloseTime, buildMarketQuestion } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";

interface CoinbaseMarketCardProps {
  asset: string;
  timeframe: "hourly" | "daily";
  isSelected?: boolean;
  onClick?: () => void;
}

export function CoinbaseMarketCard({ asset, timeframe, isSelected = false, onClick }: CoinbaseMarketCardProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";

  const baseline = isDaily ? data.dailyBaseline : data.hourlyBaseline;
  const closeTime = isDaily ? data.dailyCloseTime : data.hourlyCloseTime;
  const question = useMemo(
    () => (baseline > 0 ? buildMarketQuestion(asset, baseline, closeTime, timeframe) : `${asset} market loading...`),
    [asset, baseline, closeTime, timeframe]
  );

  // Implied probability: how far current price is above/below baseline
  const yesProb = useMemo(() => {
    if (baseline <= 0 || data.currentPrice <= 0) return 50;
    const diff = ((data.currentPrice - baseline) / baseline) * 100;
    // Map to 0-100 range: at baseline = 50%, +2% above = ~75%, -2% below = ~25%
    return Math.min(95, Math.max(5, 50 + diff * 25));
  }, [data.currentPrice, baseline]);

  const noProb = 100 - yesProb;

  // Chart data from 1-min candles
  const chartData = useMemo(() => {
    return data.candles.map((c) => ({
      time: new Date(c.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: c.close,
      high: c.high,
      low: c.low,
    }));
  }, [data.candles]);

  // Time left
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

  if (data.isLoading) {
    return (
      <div className={cn(
        "rounded-xl border border-border bg-card p-4 flex items-center justify-center min-h-[220px]",
      )}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 min-h-[220px] flex flex-col items-center justify-center">
        <span className="text-xs text-destructive">{asset} — Failed to load</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md flex flex-col",
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
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
              <TrendingUp className="w-2.5 h-2.5" />
              Leverage
            </span>
          )}
        </div>
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
          "bg-muted text-muted-foreground"
        )}>
          <Clock className="w-2.5 h-2.5" />
          {timeLeftText}
        </span>
      </div>

      {/* Question */}
      <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-2">{question}</h3>

      {/* Mini chart with baseline */}
      {chartData.length > 1 && (
        <div className="mb-3 -mx-1">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${asset}-${timeframe}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <XAxis dataKey="time" hide />
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
              {/* Baseline reference line */}
              <ReferenceLine
                y={baseline}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: `$${formatPrice(baseline)}`,
                  position: "right",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
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
