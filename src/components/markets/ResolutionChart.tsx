import { useEffect, useRef, useState, useCallback } from "react";
import { useCoinbaseCandles, formatPrice } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ResolutionChartProps {
  asset: string;
  timeframe: "hourly" | "daily";
}

/** A single price point in the timeline */
interface PricePoint {
  time: number; // ms timestamp
  price: number;
}

// ─── Canvas Chart Constants ───
const PADDING = { top: 30, right: 80, bottom: 30, left: 12 };
const BASELINE_COLOR = "#6366f1"; // primary-ish
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

/**
 * Pure canvas resolution chart.
 * Time is controlled manually — no charting library involved.
 */
export function ResolutionChart({ asset, timeframe }: ResolutionChartProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";

  const baseline = isDaily ? data.dailyBaseline : data.hourlyBaseline;
  const closeTime = isDaily ? data.dailyCloseTime : data.hourlyCloseTime;

  // ── Compute fixed window start (once per period) ──
  const windowStartRef = useRef(0);
  if (windowStartRef.current === 0) {
    const now = new Date();
    if (isDaily) {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      windowStartRef.current = d.getTime();
    } else {
      const d = new Date(now);
      d.setUTCMinutes(0, 0, 0);
      windowStartRef.current = d.getTime();
    }
  }
  const windowStart = windowStartRef.current;
  const windowEnd = closeTime.getTime();

  // ── Build point buffer from candle data ──
  const pointsRef = useRef<PricePoint[]>([]);
  const lastKnownPriceRef = useRef(0);

  // Seed points from candle data whenever it updates
  useEffect(() => {
    const source = isDaily ? data.dailyCandles : data.candles;
    if (source.length === 0) return;

    const newPoints: PricePoint[] = source
      .filter((c) => c.timestamp * 1000 >= windowStart)
      .map((c) => ({ time: c.timestamp * 1000, price: c.close }));

    // Merge: keep existing fine-grained points that are newer than last candle
    const lastCandleTime = newPoints.length > 0 ? newPoints[newPoints.length - 1].time : 0;
    const existingFine = pointsRef.current.filter((p) => p.time > lastCandleTime);

    pointsRef.current = [...newPoints, ...existingFine];
    lastKnownPriceRef.current = data.currentPrice;
  }, [data.candles, data.dailyCandles, data.currentPrice, isDaily, windowStart]);

  // ── Track current price ──
  useEffect(() => {
    if (data.currentPrice > 0) {
      lastKnownPriceRef.current = data.currentPrice;
    }
  }, [data.currentPrice]);

  // ── Canvas ref + resize ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // ── Countdown state ──
  const [countdown, setCountdown] = useState({ mins: 0, secs: 0 });
  const [nowTs, setNowTs] = useState(Date.now());

  // ── Main render loop (runs every frame via rAF) ──
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

    // Inject a point at NOW with last known price (ensures line progresses even if flat)
    const price = lastKnownPriceRef.current;
    if (price > 0) {
      const pts = pointsRef.current;
      if (pts.length === 0 || pts[pts.length - 1].time < now - 500) {
        pts.push({ time: now, price });
      } else {
        // Update last point to current time + price
        pts[pts.length - 1] = { time: now, price };
      }
    }

    const points = pointsRef.current.filter((p) => p.time >= windowStart && p.time <= now);
    if (points.length < 1 || baseline <= 0) {
      // Nothing to draw yet
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Waiting for price data…", w / 2, h / 2);
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    // ── Coordinate mapping ──
    const chartW = w - PADDING.left - PADDING.right;
    const chartH = h - PADDING.top - PADDING.bottom;

    const tMin = windowStart;
    const tMax = now; // x-axis ends at NOW — no future
    const tRange = Math.max(tMax - tMin, 1000);

    // Y range: encompass all prices + baseline with padding
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

    // ── Grid lines (horizontal) ──
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = yMin + (i / yTicks) * yRange;
      const y = toY(yVal);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();

      // Y labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatChartPrice(yVal), w - PADDING.right + 4, y + 3);
    }

    // ── Time labels (x-axis) ──
    const xTicks = Math.min(8, Math.floor(chartW / 80));
    for (let i = 0; i <= xTicks; i++) {
      const t = tMin + (i / xTicks) * tRange;
      const x = toX(t);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatTimeLabel(t), x, h - 8);
    }

    // ── Baseline ──
    const baselineY = toY(baseline);
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = BASELINE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, baselineY);
    ctx.lineTo(w - PADDING.right, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Baseline label
    ctx.fillStyle = BASELINE_COLOR;
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Price to beat  ${formatChartPrice(baseline)}`, w - PADDING.right + 4, baselineY - 6);

    // ── Price line ──
    const isAbove = price >= baseline;
    const color = isAbove ? GREEN : RED;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, PADDING.top, 0, h - PADDING.bottom);
    gradient.addColorStop(0, isAbove ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(toX(points[0].time), toY(points[0].price));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i].time), toY(points[i].price));
    }
    // Close to bottom
    ctx.lineTo(toX(points[points.length - 1].time), h - PADDING.bottom);
    ctx.lineTo(toX(points[0].time), h - PADDING.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(toX(points[0].time), toY(points[0].price));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i].time), toY(points[i].price));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // ── Live dot (latest point) ──
    const lastPt = points[points.length - 1];
    const lx = toX(lastPt.time);
    const ly = toY(lastPt.price);

    // Pulse ring
    const pulse = (Math.sin(now / 400) + 1) / 2; // 0-1 oscillation
    ctx.beginPath();
    ctx.arc(lx, ly, 6 + pulse * 6, 0, Math.PI * 2);
    ctx.fillStyle = isAbove ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
    ctx.fill();

    // Solid dot
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Current price label next to dot
    ctx.fillStyle = color;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(formatChartPrice(lastPt.price), lx + 10, ly + 4);

    // ── Schedule next frame ──
    animFrameRef.current = requestAnimationFrame(draw);
  }, [baseline, windowStart]);

  // Start/stop render loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // Countdown ticker (1s)
  useEffect(() => {
    const tick = () => {
      const n = Date.now();
      setNowTs(n);
      const diff = Math.max(0, windowEnd - n);
      const totalSecs = Math.floor(diff / 1000);
      setCountdown({ mins: Math.floor(totalSecs / 60), secs: totalSecs % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [windowEnd]);

  const currentPrice = data.currentPrice;
  const isAbove = currentPrice >= baseline && baseline > 0;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;

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

      {/* ── Resolution indicators ── */}
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

      {/* ── Canvas chart ── */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
