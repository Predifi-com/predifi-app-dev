import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIMarketAnalyzerProps {
  asset: string;
  timeframe: "hourly" | "daily";
  currentPrice: number;
  baseline: number;
  yesProb: number;
}

export function AIMarketAnalyzer({ asset, timeframe, currentPrice, baseline, yesProb }: AIMarketAnalyzerProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    if (isLoading) return;
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

      setAnalysis(data?.analysis || "No analysis available.");
      setHasLoaded(true);
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("Failed to fetch AI analysis");
    } finally {
      setIsLoading(false);
    }
  }, [asset, timeframe, currentPrice, baseline, yesProb, isLoading]);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (!next && !hasLoaded) {
      fetchAnalysis();
    }
  };

  return (
    <div className="border-t border-border">
      {/* Header */}
      <div className="px-3 py-1.5 flex items-center justify-between">
        <button onClick={handleToggle} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            AI Analysis
          </span>
          {collapsed ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
        </button>

        {!collapsed && hasLoaded && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={fetchAnalysis} disabled={isLoading}>
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
