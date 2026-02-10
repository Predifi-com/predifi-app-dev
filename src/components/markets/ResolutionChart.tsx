import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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

/** Custom dot that renders a pulsing circle on the last data point */
function LiveDot(props: any) {
  const { cx, cy, index, payload, dataLength, color } = props;
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.25}>
        <animate attributeName="r" from="6" to="14" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />
    </g>
  );
}

export function ResolutionChart({ asset, timeframe }: ResolutionChartProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";

  const baseline = isDaily ? data.dailyBaseline : data.hourlyBaseline;
  const closeTime = isDaily ? data.dailyCloseTime : data.hourlyCloseTime;

  // Countdown
  const [countdown, setCountdown] = useState({ mins: 0, secs: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, closeTime.getTime() - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      setCountdown({
        mins: Math.floor(totalSecs / 60),
        secs: totalSecs % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closeTime]);

  // Chart data
  const chartData = useMemo(() => {
    const source = isDaily ? data.dailyCandles : data.candles;
    return source.map((c) => ({
      time: c.timestamp * 1000,
      price: c.close,
    }));
  }, [data.candles, data.dailyCandles, isDaily]);

  const currentPrice = data.currentPrice;
  const isAbove = currentPrice >= baseline;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;
  const lineColor = isAbove ? "hsl(152, 69%, 53%)" : "hsl(0, 84%, 60%)";
  const gradientId = `res-grad-${asset}-${timeframe}`;

  // Y-axis domain: encompass baseline and all data with some padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0 && baseline <= 0) return [0, 100];
    const prices = chartData.map((d) => d.price);
    if (baseline > 0) prices.push(baseline);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.15 || max * 0.002;
    return [min - pad, max + pad];
  }, [chartData, baseline]);

  // Time formatter
  const formatTime = useCallback(
    (ts: number) => {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    },
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
        {/* Price to beat */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Price to beat
          </span>
          <div className="text-xl font-bold tabular-nums text-foreground">
            ${formatPrice(baseline)}
          </div>
        </div>

        {/* Current price + diff */}
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

        {/* Countdown */}
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

      {/* ── Resolution semantics bar ── */}
      <div className="flex items-center gap-3 px-4 pb-2">
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          isAbove
            ? "bg-emerald-500/15 text-emerald-500"
            : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Yes — Above baseline
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
          !isAbove
            ? "bg-red-500/15 text-red-500"
            : "bg-muted text-muted-foreground"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          No — Below baseline
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="flex-1 min-h-0 px-1 pb-2">
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            Waiting for price data…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 50, left: 10, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />

              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatTime}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                minTickGap={60}
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
                labelFormatter={(ts: number) => {
                  const d = new Date(ts);
                  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                }}
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
