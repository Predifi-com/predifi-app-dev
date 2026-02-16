import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from 'lucide-react';
import { walletAPI } from '@/services/wallet-provider';
import type { WalletBalance } from '@/types/wallet';

export function MiniBalanceWidget() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    try {
      const data = await walletAPI.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    const interval = setInterval(loadBalance, 15000);
    return () => clearInterval(interval);
  }, [loadBalance]);

  return (
    <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg px-2.5 py-1.5">
      <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
      {loading && !balance ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span className="text-xs font-mono font-semibold text-foreground">
          ${balance?.available.toFixed(2) ?? '0.00'}
        </span>
      )}
    </div>
  );
}
