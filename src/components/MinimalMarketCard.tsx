import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { MarketExpandedModal } from "./MarketExpandedModal";
import { MarketAnalysisChat } from "./MarketAnalysisChat";
import { getVenueDisplayName } from "@/lib/venue-utils";

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
}: MinimalMarketCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const displayVolume =
    totalVolume !== undefined && totalVolume !== null
      ? formatVolume(totalVolume)
      : volume || "$0";

  const venueLabel = getVenueDisplayName(venue);

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
