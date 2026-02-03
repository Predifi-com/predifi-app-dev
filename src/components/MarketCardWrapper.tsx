import { MarketGroupCard } from '@/components/MarketGroupCard';
import { SwipeableMarketCard } from '@/components/SwipeableMarketCard';
import type { MarketItem } from '@/types/market-group';

interface MarketCardWrapperProps {
  item: MarketItem;
  animationsEnabled?: boolean;
}

export function MarketCardWrapper({ item, animationsEnabled = true }: MarketCardWrapperProps) {
  if (item.type === 'group') {
    return <MarketGroupCard group={item.group} animationsEnabled={animationsEnabled} />;
  }

  return (
    <SwipeableMarketCard
      {...item.market}
      animationsEnabled={animationsEnabled}
    />
  );
}
