import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useCoinbaseCandles, formatPrice, CoinbaseCandle } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ResolutionChartProps {
  asset: string;
  timeframe: "hourly" | "daily";
  /** Override: if set, renders a static chart for a past/future period instead of the live one */
  periodStart?: number;
  periodEnd?: number;
  periodState?: "past" | "current" | "future";
}

interface PricePoint {
  time: number;
  price: number;
}

const PADDING = { top: 30, right: 80, bottom: 30, left: 12 };
const BASELINE_COLOR = "#6366f1";
const GREEN = "#22c55e";
const RED = "#ef4444";
const GRID_COLOR = "rgba(148,163,184,0.15)";
const TEXT_COLOR = "rgba(148,163,184,0.8)";

function formatChartPrice(price: number): string {
  if (price >= 1000) return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return "$" + price.toFixed(4);
  return "$" + price.toFixed(6);
}

function formatTimeLabel(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

const COINBASE_API = "https://api.exchange.coinbase.com";
const ASSET_PAIRS: Record<string, string> = {
  BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", DOGE: "DOGE-USD", XRP: "XRP-USD",
};

async function fetchCandlesRange(pair: string, granularity: number, start: Date, end: Date): Promise<CoinbaseCandle[]> {
  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`);
  const raw: number[][] = await res.json();
  return raw
    .map(([ts, low, high, open, close, volume]) => ({ timestamp: ts, open, high, low, close, volume }))
    .reverse();
}

export function ResolutionChart({ asset, timeframe, periodStart, periodEnd, periodState = "current" }: ResolutionChartProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";
  const pair = ASSET_PAIRS[asset] || `${asset}-USD`;

  const isLive = periodState === "current";
  const isFuture = periodState === "future";

  // ── Determine window ──
  const liveWindowStart = useMemo(() => {
    const now = new Date();
    if (isDaily) { now.setUTCHours(0, 0, 0, 0); }
    else { now.setUTCMinutes(0, 0, 0); }
    return now.getTime();
  }, [isDaily]);

  const windowStart = periodStart ?? liveWindowStart;
  const windowEnd = periodEnd ?? (isDaily ? data.dailyCloseTime.getTime() : data.hourlyCloseTime.getTime());

  // ── Baseline: always the close of the PREVIOUS period ──
  // For live: use hook data. For past periods: fetch.
  const [overrideBaseline, setOverrideBaseline] = useState<number | null>(null);
  const [pastPoints, setPastPoints] = useState<PricePoint[]>([]);
  const [pastLoading, setPastLoading] = useState(false);

  // Fetch data for past periods
  useEffect(() => {
    if (isLive || isFuture) {
      setOverrideBaseline(null);
      setPastPoints([]);
      return;
    }

    let cancelled = false;
    setPastLoading(true);

    (async () => {
      try {
        const periodMs = windowEnd - windowStart;
        const granularity = periodMs > 4 * 3600 * 1000 ? 300 : 60;

        // Fetch baseline: last candle before this period
        const baselineStart = new Date(windowStart - (granularity === 300 ? 30 * 60 * 1000 : 5 * 60 * 1000));
        const baselineEnd = new Date(windowStart);
        const baselineCandles = await fetchCandlesRange(pair, granularity, baselineStart, baselineEnd);
        if (cancelled) return;

        const bl = baselineCandles.length > 0 ? baselineCandles[baselineCandles.length - 1].close : 0;
        setOverrideBaseline(bl);

        // Fetch chart data for the period
        const chartCandles = await fetchCandlesRange(pair, granularity, new Date(windowStart), new Date(windowEnd));
        if (cancelled) return;

        setPastPoints(chartCandles.map(c => ({ time: c.timestamp * 1000, price: c.close })));
      } catch (err) {
        console.error("Failed to load past period:", err);
      } finally {
        if (!cancelled) setPastLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isLive, isFuture, windowStart, windowEnd, pair]);

  const baseline = overrideBaseline ?? (isDaily ? data.dailyBaseline : data.hourlyBaseline);

  // ── Live points buffer ──
  const pointsRef = useRef<PricePoint[]>([]);
  const lastKnownPriceRef = useRef(0);

  useEffect(() => {
    if (!isLive) return;
    const source = isDaily ? data.dailyCandles : data.candles;
    if (source.length === 0) return;
    const newPoints: PricePoint[] = source
      .filter((c) => c.timestamp * 1000 >= windowStart)
      .map((c) => ({ time: c.timestamp * 1000, price: c.close }));
    const lastCandleTime = newPoints.length > 0 ? newPoints[newPoints.length - 1].time : 0;
    const existingFine = pointsRef.current.filter((p) => p.time > lastCandleTime);
    pointsRef.current = [...newPoints, ...existingFine];
    lastKnownPriceRef.current = data.currentPrice;
  }, [data.candles, data.dailyCandles, data.currentPrice, isDaily, windowStart, isLive]);

  useEffect(() => {
    if (data.currentPrice > 0 && isLive) lastKnownPriceRef.current = data.currentPrice;
  }, [data.currentPrice, isLive]);

  // ── Canvas ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [countdown, setCountdown] = useState({ mins: 0, secs: 0 });

  // ── Render ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const now = Date.now();

    // Get the right points
    let points: PricePoint[];
    let tMax: number;

    if (isLive) {
      // Inject NOW point
      const price = lastKnownPriceRef.current;
      if (price > 0) {
        const pts = pointsRef.current;
        if (pts.length === 0 || pts[pts.length - 1].time < now - 500) {
          pts.push({ time: now, price });
        } else {
          pts[pts.length - 1] = { time: now, price };
        }
      }
      points = pointsRef.current.filter((p) => p.time >= windowStart && p.time <= now);
      tMax = now;
    } else {
      points = pastPoints;
      tMax = windowEnd;
    }

    if (points.length < 1 || baseline <= 0) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      if (isFuture) {
        ctx.fillText("Market opens soon", w / 2, h / 2);
      } else {
        ctx.fillText("Waiting for price data…", w / 2, h / 2);
      }
      if (isLive) animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const chartW = w - PADDING.left - PADDING.right;
    const chartH = h - PADDING.top - PADDING.bottom;
    const tMin = windowStart;
    const tRange = Math.max(tMax - tMin, 1000);

    const allPrices = points.map((p) => p.price);
    allPrices.push(baseline);
    let yMin = Math.min(...allPrices);
    let yMax = Math.max(...allPrices);
    const yPad = (yMax - yMin) * 0.15 || yMax * 0.002;
    yMin -= yPad;
    yMax += yPad;
    const yRange = yMax - yMin || 1;

    const toX = (t: number) => PADDING.left + ((t - tMin) / tRange) * chartW;
    const toY = (p: number) => PADDING.top + (1 - (p - yMin) / yRange) * chartH;

    // Grid
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yVal = yMin + (i / 5) * yRange;
      const y = toY(yVal);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatChartPrice(yVal), w - PADDING.right + 4, y + 3);
    }

    // X labels
    const xTicks = Math.min(8, Math.floor(chartW / 80));
    for (let i = 0; i <= xTicks; i++) {
      const t = tMin + (i / xTicks) * tRange;
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatTimeLabel(t), toX(t), h - 8);
    }

    // Baseline
    const baselineY = toY(baseline);
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = BASELINE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, baselineY);
    ctx.lineTo(w - PADDING.right, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = BASELINE_COLOR;
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Price to beat  ${formatChartPrice(baseline)}`, w - PADDING.right + 4, baselineY - 6);

    // Price line
    const lastPrice = points[points.length - 1].price;
    const isAbove = lastPrice >= baseline;
    const color = isAbove ? GREEN : RED;

    const gradient = ctx.createLinearGradient(0, PADDING.top, 0, h - PADDING.bottom);
    gradient.addColorStop(0, isAbove ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(toX(points[0].time), toY(points[0].price));
    for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].time), toY(points[i].price));
    ctx.lineTo(toX(points[points.length - 1].time), h - PADDING.bottom);
    ctx.lineTo(toX(points[0].time), h - PADDING.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(toX(points[0].time), toY(points[0].price));
    for (let i = 1; i < points.length; i++) ctx.lineTo(toX(points[i].time), toY(points[i].price));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Live dot
    if (isLive) {
      const lastPt = points[points.length - 1];
      const lx = toX(lastPt.time);
      const ly = toY(lastPt.price);
      const pulse = (Math.sin(now / 400) + 1) / 2;
      ctx.beginPath();
      ctx.arc(lx, ly, 6 + pulse * 6, 0, Math.PI * 2);
      ctx.fillStyle = isAbove ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatChartPrice(lastPt.price), lx + 10, ly + 4);
    }

    // Resolved badge for past periods
    if (!isLive && !isFuture && points.length > 0) {
      const finalPrice = points[points.length - 1].price;
      const resolved = finalPrice >= baseline ? "YES" : "NO";
      const badgeColor = resolved === "YES" ? GREEN : RED;
      ctx.fillStyle = badgeColor;
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Resolved: ${resolved}`, w / 2, PADDING.top - 8);
    }

    if (isLive) animFrameRef.current = requestAnimationFrame(draw);
  }, [baseline, windowStart, windowEnd, isLive, isFuture, pastPoints]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [draw]);

  // For past periods, draw once when data arrives
  useEffect(() => {
    if (!isLive && pastPoints.length > 0) {
      requestAnimationFrame(draw);
    }
  }, [pastPoints, draw, isLive]);

  // Countdown
  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      const diff = Math.max(0, windowEnd - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      setCountdown({ mins: Math.floor(totalSecs / 60), secs: totalSecs % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowEnd, isLive]);

  const currentPrice = isLive ? data.currentPrice : (pastPoints.length > 0 ? pastPoints[pastPoints.length - 1].price : 0);
  const isAbove = currentPrice >= baseline && baseline > 0;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;

  if ((isLive && data.isLoading) || (!isLive && !isFuture && pastLoading)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isFuture) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1 text-muted-foreground">
          <div className="text-center">
            <div className="text-lg font-semibold mb-1">Upcoming Market</div>
            <div className="text-xs">This market period hasn't started yet.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
            {isLive ? "Current Price" : "Final Price"}{" "}
            {baseline > 0 && (
              <span className={cn("ml-1", isAbove ? "text-emerald-500" : "text-red-500")}>
                {isAbove ? "▲" : "▼"} ${formatPrice(Math.abs(priceDiff))}
              </span>
            )}
          </span>
          <div className={cn("text-xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
            ${formatPrice(currentPrice)}
          </div>
        </div>
        {isLive && (
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
        )}
        {!isLive && (
          <div className="text-right">
            <div className={cn(
              "text-sm font-bold px-3 py-1 rounded-full",
              isAbove ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"
            )}>
              Resolved {isAbove ? "YES" : "NO"}
            </div>
          </div>
        )}
      </div>

      {/* Resolution indicators */}
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

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
