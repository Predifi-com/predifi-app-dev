import { MarketGroupCard } from '@/components/MarketGroupCard';
import { MinimalMarketCard } from '@/components/MinimalMarketCard';
import type { MarketItem } from '@/types/market-group';

interface MarketCardWrapperProps {
  item: MarketItem;
  animationsEnabled?: boolean;
}

export function MarketCardWrapper({ item, animationsEnabled = true }: MarketCardWrapperProps) {
  if (item.type === 'group') {
    return <MarketGroupCard group={item.group} animationsEnabled={animationsEnabled} />;
  }

  const m = item.market;
  return (
    <MinimalMarketCard
      id={m.id}
      title={m.title}
      description={m.description}
      yesPercentage={m.yesPercentage}
      noPercentage={m.noPercentage}
      totalVolume={m.totalVolume}
      venue={m.venue}
      imageUrl={m.imageUrl}
      endDate={m.endDate}
      animationsEnabled={animationsEnabled}
    />
  );
}
