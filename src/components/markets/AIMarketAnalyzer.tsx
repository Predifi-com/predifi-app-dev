import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AUTO_REFRESH_MS = 2 * 60 * 1000;
const CACHE_TTL_MS = 2 * 60 * 1000; // cache valid for 2 minutes

// Simple client-side cache
const analysisCache = new Map<string, { analysis: string; timestamp: number }>();

function getCacheKey(asset: string, timeframe: string) {
  return `${asset}-${timeframe}`;
}

interface AIMarketAnalyzerProps {
  asset: string;
  timeframe: "hourly" | "daily";
  currentPrice: number;
  baseline: number;
  yesProb: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AIMarketAnalyzer({ asset, timeframe, currentPrice, baseline, yesProb, isOpen, onToggle }: AIMarketAnalyzerProps) {
  // Use controlled state if provided, otherwise internal
  const isControlled = isOpen !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = isControlled ? !isOpen : internalCollapsed;

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAnalysis = useCallback(async (skipCache = false) => {
    if (isLoading) return;

    // Check cache first
    const key = getCacheKey(asset, timeframe);
    if (!skipCache) {
      const cached = analysisCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setAnalysis(cached.analysis);
        setHasLoaded(true);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("market-ai-analysis", {
        body: { asset, timeframe, currentPrice, baseline, yesProb },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data?.analysis || "No analysis available.";
      setAnalysis(result);
      setHasLoaded(true);

      // Store in cache
      analysisCache.set(key, { analysis: result, timestamp: Date.now() });
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("Failed to fetch AI analysis");
    } finally {
      setIsLoading(false);
    }
  }, [asset, timeframe, currentPrice, baseline, yesProb, isLoading]);

  // Auto-refresh every 2 minutes while expanded
  useEffect(() => {
    if (!collapsed && hasLoaded) {
      intervalRef.current = setInterval(() => {
        fetchAnalysis(true); // skip cache on auto-refresh
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [collapsed, hasLoaded, fetchAnalysis]);

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      if (!next && !hasLoaded) fetchAnalysis();
    }
    // If opening and not loaded yet
    if (collapsed && !hasLoaded) {
      fetchAnalysis();
    }
  };

  return (
    <div className="border-t border-border">
      <div className="px-3 py-1.5 flex items-center justify-between">
        <button onClick={handleToggle} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            AI Analysis
          </span>
          {collapsed ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
        </button>

        {!collapsed && hasLoaded && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => fetchAnalysis(true)} disabled={isLoading}>
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          {isLoading && !analysis ? (
            <div className="flex items-center gap-2 py-3 justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground">Analyzing {asset} {timeframe} market…</span>
            </div>
          ) : analysis ? (
            <div className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line bg-muted/30 rounded-md p-2.5">
              {analysis}
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-2">
              Click to generate AI analysis
            </div>
          )}
        </div>
      )}
    </div>
  );
}
