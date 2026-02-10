import { useEffect, useRef, useState, useMemo } from "react";
import { useCoinbaseCandles, formatPrice, CoinbaseCandle } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* ── Types ── */
interface ResolutionChartProps {
  asset: string;
  timeframe: "hourly" | "daily";
  periodStart?: number;
  periodEnd?: number;
  periodState?: "past" | "current" | "future";
}

interface PricePoint {
  time: number; // ms
  price: number;
}

/* ── Constants ── */
const PAD = { top: 30, right: 80, bottom: 30, left: 12 };
const GREEN = "#22c55e";
const RED = "#ef4444";
const BASELINE_CLR = "#6366f1";
const GRID_CLR = "rgba(148,163,184,0.15)";
const TEXT_CLR = "rgba(148,163,184,0.8)";

const COINBASE_API = "https://api.exchange.coinbase.com";
const PAIR_MAP: Record<string, string> = {
  BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", DOGE: "DOGE-USD", XRP: "XRP-USD",
};

/* ── Helpers ── */
function fmtPrice(p: number) {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function fmtTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function fetchRange(pair: string, gran: number, start: Date, end: Date): Promise<CoinbaseCandle[]> {
  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${gran}&start=${start.toISOString()}&end=${end.toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase ${res.status}`);
  const raw: number[][] = await res.json();
  return raw.map(([ts, low, high, open, close, volume]) => ({ timestamp: ts, open, high, low, close, volume })).reverse();
}

/* ═══════════════════════════════════════════════════════
   ResolutionChart — time-progressive countdown chart
   ═══════════════════════════════════════════════════════ */
export function ResolutionChart({ asset, timeframe, periodStart, periodEnd, periodState = "current" }: ResolutionChartProps) {
  const data = useCoinbaseCandles(asset);
  const isDaily = timeframe === "daily";
  const pair = PAIR_MAP[asset] || `${asset}-USD`;

  const isLive = periodState === "current";
  const isFuture = periodState === "future";

  /* ── Period boundaries ── */
  const liveStart = useMemo(() => {
    const d = new Date();
    if (isDaily) d.setUTCHours(0, 0, 0, 0);
    else d.setUTCMinutes(0, 0, 0);
    return d.getTime();
  }, [isDaily]);

  const windowStart = periodStart ?? liveStart;
  const windowEnd = periodEnd ?? (isDaily ? data.dailyCloseTime.getTime() : data.hourlyCloseTime.getTime());

  /* ── Refs for animation-loop data (never cause re-renders) ── */
  const pointsRef = useRef<PricePoint[]>([]);
  const baselineRef = useRef(0);
  const lastPriceRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval>>();

  /* ── Past-period state ── */
  const [pastPoints, setPastPoints] = useState<PricePoint[]>([]);
  const [pastBaseline, setPastBaseline] = useState(0);
  const [pastLoading, setPastLoading] = useState(false);

  /* ── Countdown (for header display only) ── */
  const [countdown, setCountdown] = useState({ m: 0, s: 0 });

  /* ═══ LIVE: sync baseline + candle data from hook into refs ═══ */
  useEffect(() => {
    if (!isLive) return;
    const bl = isDaily ? data.dailyBaseline : data.hourlyBaseline;
    if (bl > 0) baselineRef.current = bl;
  }, [isLive, isDaily, data.hourlyBaseline, data.dailyBaseline]);

  useEffect(() => {
    if (!isLive) return;
    const source = isDaily ? data.dailyCandles : data.candles;
    if (source.length === 0) return;
    // Rebuild points from candles (within current period)
    const pts: PricePoint[] = source
      .filter(c => c.timestamp * 1000 >= windowStart)
      .map(c => ({ time: c.timestamp * 1000, price: c.close }));
    pointsRef.current = pts;
    if (data.currentPrice > 0) lastPriceRef.current = data.currentPrice;
  }, [isLive, isDaily, data.candles, data.dailyCandles, data.currentPrice, windowStart]);

  /* ═══ LIVE: 1-second ticker — injects a synthetic point every second ═══ */
  useEffect(() => {
    if (!isLive) return;
    const tick = () => {
      const now = Date.now();
      const price = lastPriceRef.current;
      if (price <= 0) return;
      // Append a new point at the current timestamp
      const pts = pointsRef.current;
      // Remove any previous synthetic point (within last 1.5s) to avoid duplicates
      while (pts.length > 0 && pts[pts.length - 1].time > now - 1500) {
        // If it's a candle-origin point (older than 2s from now), keep it
        if (now - pts[pts.length - 1].time > 2000) break;
        pts.pop();
      }
      pts.push({ time: now, price });

      // Update countdown
      const diff = Math.max(0, windowEnd - now);
      const totalSecs = Math.floor(diff / 1000);
      setCountdown({ m: Math.floor(totalSecs / 60), s: totalSecs % 60 });
    };
    tick();
    tickerRef.current = setInterval(tick, 1000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [isLive, windowEnd]);

  /* ═══ PAST: fetch historical data ═══ */
  useEffect(() => {
    if (isLive || isFuture) { setPastPoints([]); setPastBaseline(0); return; }
    let dead = false;
    setPastLoading(true);
    (async () => {
      try {
        const span = windowEnd - windowStart;
        const gran = span > 4 * 3600_000 ? 300 : 60;
        // Baseline: last candle before this period
        const blStart = new Date(windowStart - (gran === 300 ? 30 * 60_000 : 5 * 60_000));
        const blCandles = await fetchRange(pair, gran, blStart, new Date(windowStart));
        if (dead) return;
        const bl = blCandles.length > 0 ? blCandles[blCandles.length - 1].close : 0;
        setPastBaseline(bl);
        const chart = await fetchRange(pair, gran, new Date(windowStart), new Date(windowEnd));
        if (dead) return;
        setPastPoints(chart.map(c => ({ time: c.timestamp * 1000, price: c.close })));
      } catch (e) { console.error("Past period load error:", e); }
      finally { if (!dead) setPastLoading(false); }
    })();
    return () => { dead = true; };
  }, [isLive, isFuture, windowStart, windowEnd, pair]);

  /* ═══ RENDER LOOP ═══ */
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) { rafRef.current = requestAnimationFrame(render); return; }

      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + "px"; canvas.style.height = h + "px";
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(render); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const NOW = Date.now();
      const baseline = isLive ? baselineRef.current : pastBaseline;

      /* Determine points + tMax */
      let pts: PricePoint[];
      let tMax: number;

      if (isLive) {
        // CRITICAL: tMax = NOW, not end of period
        tMax = NOW;
        pts = pointsRef.current.filter(p => p.time >= windowStart && p.time <= NOW);

        // Inject "now" point at exact current time so line always reaches right edge
        const price = lastPriceRef.current;
        if (price > 0 && pts.length > 0) {
          const last = pts[pts.length - 1];
          if (NOW - last.time > 100) {
            pts.push({ time: NOW, price });
          } else {
            pts[pts.length - 1] = { time: NOW, price };
          }
        } else if (price > 0) {
          pts = [{ time: NOW, price }];
        }
      } else {
        pts = pastPoints;
        tMax = windowEnd;
      }

      const tMin = windowStart;
      const tRange = Math.max(tMax - tMin, 1000);
      const chartW = w - PAD.left - PAD.right;
      const chartH = h - PAD.top - PAD.bottom;

      /* Empty state */
      if (pts.length < 1 || baseline <= 0) {
        ctx.fillStyle = TEXT_CLR;
        ctx.font = "12px system-ui,sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(isFuture ? "Market opens soon" : "Waiting for price data…", w / 2, h / 2);
        if (isLive) rafRef.current = requestAnimationFrame(render);
        return;
      }

      const toX = (t: number) => PAD.left + ((t - tMin) / tRange) * chartW;
      const toY = (p: number) => PAD.top + (1 - (p - yMin) / yRange) * chartH;

      /* Y range */
      const prices = pts.map(p => p.price);
      prices.push(baseline);
      let yMin = Math.min(...prices);
      let yMax = Math.max(...prices);
      const yPad = (yMax - yMin) * 0.15 || yMax * 0.002;
      yMin -= yPad; yMax += yPad;
      const yRange = yMax - yMin || 1;

      /* Grid */
      ctx.strokeStyle = GRID_CLR; ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const yVal = yMin + (i / 5) * yRange;
        const y = toY(yVal);
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(w - PAD.right, y); ctx.stroke();
        ctx.fillStyle = TEXT_CLR; ctx.font = "10px system-ui,sans-serif"; ctx.textAlign = "left";
        ctx.fillText(fmtPrice(yVal), w - PAD.right + 4, y + 3);
      }

      /* X labels */
      const xTicks = Math.min(6, Math.floor(chartW / 90));
      for (let i = 0; i <= xTicks; i++) {
        const t = tMin + (i / xTicks) * tRange;
        ctx.fillStyle = TEXT_CLR; ctx.font = "10px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.fillText(fmtTime(t), toX(t), h - 8);
      }

      /* Baseline */
      const blY = toY(baseline);
      ctx.setLineDash([8, 4]); ctx.strokeStyle = BASELINE_CLR; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PAD.left, blY); ctx.lineTo(w - PAD.right, blY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = BASELINE_CLR; ctx.font = "bold 10px system-ui,sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`Price to beat  ${fmtPrice(baseline)}`, w - PAD.right + 4, blY - 6);

      /* Price line */
      const lastPrice = pts[pts.length - 1].price;
      const above = lastPrice >= baseline;
      const clr = above ? GREEN : RED;

      // Fill
      const grad = ctx.createLinearGradient(0, PAD.top, 0, h - PAD.bottom);
      grad.addColorStop(0, above ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].time), toY(pts[0].price));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(pts[i].time), toY(pts[i].price));
      ctx.lineTo(toX(pts[pts.length - 1].time), h - PAD.bottom);
      ctx.lineTo(toX(pts[0].time), h - PAD.bottom);
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

      // Stroke
      ctx.beginPath();
      ctx.moveTo(toX(pts[0].time), toY(pts[0].price));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(toX(pts[i].time), toY(pts[i].price));
      ctx.strokeStyle = clr; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();

      /* Live dot */
      if (isLive) {
        const lp = pts[pts.length - 1];
        const lx = toX(lp.time), ly = toY(lp.price);
        const pulse = (Math.sin(NOW / 400) + 1) / 2;
        ctx.beginPath(); ctx.arc(lx, ly, 6 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = above ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"; ctx.fill();
        ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = clr; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = clr; ctx.font = "bold 11px system-ui,sans-serif"; ctx.textAlign = "left";
        ctx.fillText(fmtPrice(lp.price), lx + 10, ly + 4);
      }

      /* Resolved badge for past */
      if (!isLive && !isFuture) {
        const res = lastPrice >= baseline ? "YES" : "NO";
        ctx.fillStyle = res === "YES" ? GREEN : RED;
        ctx.font = "bold 14px system-ui,sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`Resolved: ${res}`, w / 2, PAD.top - 8);
      }

      /* Continue loop only for live */
      if (isLive) rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLive, isFuture, windowStart, windowEnd, pastPoints, pastBaseline]);

  /* Draw once for past data */
  useEffect(() => {
    if (!isLive && pastPoints.length > 0) {
      // Trigger a single render by toggling a ref — the main effect handles it
    }
  }, [pastPoints, isLive]);

  /* ── Derived values for header ── */
  const baseline = isLive ? (isDaily ? data.dailyBaseline : data.hourlyBaseline) : pastBaseline;
  const currentPrice = isLive ? data.currentPrice : (pastPoints.length > 0 ? pastPoints[pastPoints.length - 1].price : 0);
  const isAbove = currentPrice >= baseline && baseline > 0;
  const priceDiff = baseline > 0 ? currentPrice - baseline : 0;

  /* ── Loading / Future guards ── */
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
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price to beat</span>
          <div className="text-xl font-bold tabular-nums text-foreground">${formatPrice(baseline)}</div>
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
                {String(countdown.m).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-semibold uppercase text-muted-foreground">Mins</span>
              <span className={cn("text-2xl font-bold tabular-nums", isAbove ? "text-emerald-500" : "text-red-500")}>
                {String(countdown.s).padStart(2, "0")}
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
