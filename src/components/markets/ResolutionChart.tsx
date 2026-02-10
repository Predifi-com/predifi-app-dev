import { useMemo, useState, useEffect, useCallback } from "react";
import { useCoinbaseCandles, formatPrice } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";

interface ResolutionChartProps {
  asset: string;
  timeframe: "hourly" | "daily";
}

export function ResolutionChart({ asset, timeframe }: ResolutionChartProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";

  const baseline = isDaily ? data.dailyBaseline : data.hourlyBaseline;
  const closeTime = isDaily ? data.dailyCloseTime : data.hourlyCloseTime;

  // Compute window boundaries (fixed for the period)
  const windowStart = useMemo(() => {
    const now = new Date();
    if (isDaily) {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d.getTime();
    }
    const d = new Date(now);
    d.setUTCMinutes(0, 0, 0);
    return d.getTime();
  }, [isDaily]);

  const windowEnd = closeTime.getTime();

  // "now" cursor that ticks every second
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Countdown
  const countdown = useMemo(() => {
    const diff = Math.max(0, windowEnd - now);
    const totalSecs = Math.floor(diff / 1000);
    return { mins: Math.floor(totalSecs / 60), secs: totalSecs % 60 };
  }, [windowEnd, now]);

  // Build time-progressive chart data:
  // Use candle data up to now, then extend a final point at `now` with currentPrice
  const chartData = useMemo(() => {
    const source = isDaily ? data.dailyCandles : data.candles;
    const points = source
      .filter((c) => c.timestamp * 1000 >= windowStart && c.timestamp * 1000 <= now)
      .map((c) => ({ time: c.timestamp * 1000, price: c.close }));

    // Extend to current time with latest price (makes line march forward)
    if (data.currentPrice > 0) {
      const lastTime = points.length > 0 ? points[points.length - 1].time : 0;
      if (now > lastTime) {
        points.push({ time: now, price: data.currentPrice });
      }
    }

    return points;
  }, [data.candles, data.dailyCandles, data.currentPrice, isDaily, windowStart, now]);

  const currentPrice = data.currentPrice;
  const isAbove = currentPrice >= baseline;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;
  const lineColor = isAbove ? "hsl(152, 69%, 53%)" : "hsl(0, 84%, 60%)";
  const gradientId = `res-grad-${asset}-${timeframe}`;

  // Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0 && baseline <= 0) return [0, 100];
    const prices = chartData.map((d) => d.price);
    if (baseline > 0) prices.push(baseline);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.15 || max * 0.002;
    return [min - pad, max + pad];
  }, [chartData, baseline]);

  const formatTime = useCallback(
    (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    []
  );

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <span className="text-sm text-destructive">{asset} — Failed to load</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header: Price to beat | Current price | Countdown ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Price to beat
          </span>
          <div className="text-xl font-bold tabular-nums text-foreground">
            ${formatPrice(baseline)}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current Price{" "}
            <span className={cn("ml-1", isAbove ? "text-emerald-500" : "text-red-500")}>
              {isAbove ? "▲" : "▼"} ${formatPrice(Math.abs(priceDiff))}
            </span>
          </span>
          <div className={cn("text-xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
            ${formatPrice(currentPrice)}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
              {String(countdown.mins).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-semibold uppercase text-muted-foreground">Mins</span>
            <span className={cn("text-2xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
              {String(countdown.secs).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-semibold uppercase text-muted-foreground">Secs</span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {isDaily ? "Closes midnight UTC" : "Closes top of hour UTC"}
          </div>
        </div>
      </div>

      {/* ── Resolution semantics ── */}
      <div className="flex items-center gap-3 px-4 pb-2">
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          isAbove ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Yes — Above baseline
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          !isAbove ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          No — Below baseline
        </div>
      </div>

      {/* ── Time-progressive chart ── */}
      <div className="flex-1 min-h-0 px-1 pb-2">
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Waiting for price data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 55, left: 10, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />

              {/* X-axis anchored to full market window */}
              <XAxis
                dataKey="time"
                type="number"
                domain={[windowStart, windowEnd]}
                tickFormatter={formatTime}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                minTickGap={50}
              />
              <YAxis
                domain={yDomain}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${formatPrice(v)}`}
                width={70}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "6px 10px",
                }}
                labelFormatter={(ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                formatter={(value: number) => [`$${formatPrice(value)}`, "Price"]}
              />

              {/* Baseline — "Price to beat" */}
              {baseline > 0 && (
                <ReferenceLine
                  y={baseline}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{
                    value: `Price to beat  $${formatPrice(baseline)}`,
                    position: "right",
                    fill: "hsl(var(--primary))",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* "Now" cursor — vertical line at current time */}
              <ReferenceLine
                x={now}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 3"
                strokeWidth={1}
                label={{
                  value: "now",
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
                }}
              />

              {/* End boundary — resolution time */}
              <ReferenceLine
                x={windowEnd}
                stroke="hsl(var(--destructive))"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: isDaily ? "23:59 UTC" : formatTime(windowEnd),
                  position: "top",
                  fill: "hsl(var(--destructive))",
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={lineColor}
                fill={`url(#${gradientId})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
