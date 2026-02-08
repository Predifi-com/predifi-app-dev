import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { MarketExpandedModal } from "./MarketExpandedModal";
import { MarketAnalysisChat } from "./MarketAnalysisChat";
import { getVenueDisplayName } from "@/lib/venue-utils";

// Consistent color palette for multi-outcome segments
const OUTCOME_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
];

const OUTCOME_TEXT_COLORS = [
  "text-emerald-500",
  "text-blue-500",
  "text-amber-500",
  "text-violet-500",
  "text-rose-500",
  "text-cyan-500",
];

export interface MarketOutcome {
  label: string;
  probability: number;
}

interface MinimalMarketCardProps {
  id: string;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  totalVolume?: number;
  volume?: string;
  venue?: string;
  imageUrl?: string;
  endDate?: string;
  description?: string;
  animationsEnabled?: boolean;
  marketType?: "binary" | "multi_outcome";
  outcomes?: MarketOutcome[];
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(2)}mn`;
  if (volume >= 10_000) return `$${(volume / 1_000).toFixed(2)}k`;
  if (volume > 0) return `$${volume.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return "$0";
}

export function MinimalMarketCard({
  id,
  title,
  yesPercentage,
  noPercentage,
  totalVolume,
  volume,
  venue = "predifi",
  imageUrl,
  endDate,
  description,
  animationsEnabled = true,
  marketType = "binary",
  outcomes,
}: MinimalMarketCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const displayVolume =
    totalVolume !== undefined && totalVolume !== null
      ? formatVolume(totalVolume)
      : volume || "$0";

  const venueLabel = getVenueDisplayName(venue);

  const isMultiOutcome = marketType === "multi_outcome" && outcomes && outcomes.length > 2;

  // For multi-outcome: top 2 + others
  const displaySegments = useMemo(() => {
    if (!isMultiOutcome || !outcomes) return [];
    const sorted = [...outcomes].sort((a, b) => b.probability - a.probability);
    const top2 = sorted.slice(0, 2);
    const othersProb = sorted.slice(2).reduce((sum, o) => sum + o.probability, 0);
    const segments = top2.map((o, i) => ({
      label: o.label,
      probability: o.probability,
      colorClass: OUTCOME_COLORS[i],
      textColorClass: OUTCOME_TEXT_COLORS[i],
    }));
    if (othersProb > 0) {
      segments.push({
        label: "Others",
        probability: Math.round(othersProb),
        colorClass: "bg-muted-foreground/40",
        textColorClass: "text-muted-foreground",
      });
    }
    return segments;
  }, [isMultiOutcome, outcomes]);

  return (
    <>
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: 12 } : {}}
        animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
        whileHover={animationsEnabled ? { y: -2 } : {}}
        transition={{ duration: 0.18 }}
        onClick={() => setModalOpen(true)}
        className="relative group cursor-pointer rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
      >
        {/* AI Analysis icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAiChatOpen(true);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
          aria-label="AI Analysis"
        >
          <Bot className="w-4 h-4" />
        </button>

        {/* Question */}
        <h3 className="font-semibold text-foreground text-[15px] leading-snug pr-10 mb-4 line-clamp-3">
          {title}
        </h3>

        {/* Probability bar */}
        <div className="mb-4">
          {isMultiOutcome ? (
            /* Multi-outcome stacked bar */
            <>
              <div className="flex h-7 rounded-lg overflow-hidden">
                {displaySegments.map((seg, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-xs font-bold text-white ${seg.colorClass} transition-all`}
                    style={{ width: `${Math.max(seg.probability, 6)}%` }}
                  >
                    {seg.probability >= 15 && `${seg.probability}%`}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                {displaySegments.map((seg, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${seg.colorClass}`} />
                    <span className="truncate max-w-[80px]">{seg.label}</span>
                    <span className={`font-semibold ${seg.textColorClass}`}>{seg.probability}%</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            /* Binary YES/NO bar */
            <>
              <div className="flex h-7 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-center text-xs font-bold text-white bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(yesPercentage, 8)}%` }}
                >
                  {yesPercentage >= 15 && `${yesPercentage.toFixed(0)}%`}
                </div>
                <div
                  className="flex items-center justify-center text-xs font-bold text-white bg-red-500 transition-all"
                  style={{ width: `${Math.max(noPercentage, 8)}%` }}
                >
                  {noPercentage >= 15 && `${noPercentage.toFixed(0)}%`}
                </div>
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>
                  Yes <span className="font-semibold text-emerald-500">{yesPercentage.toFixed(0)}%</span>
                </span>
                <span>
                  No <span className="font-semibold text-red-500">{noPercentage.toFixed(0)}%</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{venueLabel}</span>
          <span className="font-semibold text-foreground/70">{displayVolume}</span>
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <MarketExpandedModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        market={{
          id,
          title,
          description,
          yesPercentage,
          noPercentage,
          volume: displayVolume,
          venue: venueLabel,
          endDate,
          imageUrl,
          marketType: isMultiOutcome ? "multi_outcome" : "binary",
          outcomes,
        }}
      />

      {/* AI Chat */}
      <MarketAnalysisChat
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        marketId={id}
        marketTitle={title}
        yesPercentage={yesPercentage}
        noPercentage={noPercentage}
        volume={displayVolume}
      />
    </>
  );
}
