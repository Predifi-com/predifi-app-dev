import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { SUPPORTED_NETWORKS } from '@/config/gmx';
import type {
  ConnectedWallet,
  ArenaWallet,
  PredifiWalletContextState,
  SupportedNetwork,
} from '@/types/predifi-wallet';

const PredifiWalletContext = createContext<PredifiWalletContextState | null>(null);

export function PredifiWalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, wallet } = useWallet();
  
  // Connected wallet state
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  
  // Protocol state
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [ledgerBalance, setLedgerBalance] = useState(0);
  const [ledgerBalanceLoading, setLedgerBalanceLoading] = useState(false);
  
  // Arena wallets state
  const [arenaWallets, setArenaWallets] = useState<ArenaWallet[]>([]);
  const [arenaWalletsLoading, setArenaWalletsLoading] = useState(false);
  const [currentArenaWallet, setCurrentArenaWallet] = useState<ArenaWallet | null>(null);

  // Determine wallet type from Dynamic
  useEffect(() => {
    if (isConnected && address && wallet) {
      const walletType = wallet.connector?.name?.toLowerCase().includes('embedded') ? 'aa' : 'eoa';
      const providerName = wallet.connector?.name?.toLowerCase() || 'unknown';
      
      let provider: ConnectedWallet['provider'] = 'unknown';
      if (providerName.includes('metamask')) provider = 'metamask';
      else if (providerName.includes('coinbase')) provider = 'coinbase';
      else if (providerName.includes('walletconnect')) provider = 'walletconnect';
      else if (providerName.includes('dynamic') || providerName.includes('embedded')) provider = 'dynamic';
      
      setConnectedWallet({
        address,
        type: walletType,
        provider,
      });
      
      // Derive proxy address (in production, this would come from backend)
      // For now, use a deterministic derivation
      setProxyAddress(`0x${address.slice(2, 42)}`); // Placeholder
    } else {
      setConnectedWallet(null);
      setProxyAddress(null);
      setLedgerBalance(0);
      setArenaWallets([]);
      setCurrentArenaWallet(null);
    }
  }, [isConnected, address, wallet]);

  // Fetch ledger balance (prediction market internal balance)
  const refreshLedgerBalance = useCallback(async () => {
    if (!address) return;
    
    setLedgerBalanceLoading(true);
    try {
      // In production, this would call backend API
      // GET /api/user/ledger-balance
      // For now, return mock data
      setLedgerBalance(0);
    } catch (error) {
      console.error('Failed to fetch ledger balance:', error);
    } finally {
      setLedgerBalanceLoading(false);
    }
  }, [address]);

  // Fetch arena wallets from registrations
  const refreshArenaWallets = useCallback(async () => {
    if (!address) return;
    
    setArenaWalletsLoading(true);
    try {
      // Fetch registrations with arena wallet addresses
      const { data: registrations, error } = await supabase
        .from('arena_registrations')
        .select(`
          id,
          competition_id,
          wallet_address,
          arena_wallet_address,
          status,
          deposit_amount,
          arena_competitions!inner(
            competition_number,
            status,
            competition_start,
            competition_end
          )
        `)
        .eq('wallet_address', address.toLowerCase())
        .not('arena_wallet_address', 'is', null);

      if (error) throw error;

      // Fetch performance data for each registration
      const wallets: ArenaWallet[] = await Promise.all(
        (registrations || []).map(async (reg: any) => {
          const { data: perfData } = await supabase
            .from('arena_performance')
            .select('*')
            .eq('registration_id', reg.id)
            .single();

          const competition = reg.arena_competitions;
          const isLocked = competition?.status === 'LIVE' || competition?.status === 'FINALIZED';
          
          return {
            address: reg.arena_wallet_address,
            competitionId: reg.competition_id,
            competitionNumber: competition?.competition_number || 0,
            balance: perfData?.current_balance || reg.deposit_amount || 100,
            equity: perfData?.current_balance || reg.deposit_amount || 100,
            roi: perfData?.roi_percent || 0,
            rank: 0, // Calculated from leaderboard
            initialDeposit: reg.deposit_amount || 100,
            depositsLocked: isLocked,
            isForfeited: reg.status === 'WITHDRAWN' || reg.status === 'ELIMINATED',
            status: reg.status as ArenaWallet['status'],
          };
        })
      );

      setArenaWallets(wallets);
      
      // Auto-select first active wallet
      if (wallets.length > 0 && !currentArenaWallet) {
        const activeWallet = wallets.find(w => w.status === 'ACTIVE') || wallets[0];
        setCurrentArenaWallet(activeWallet);
      }
    } catch (error) {
      console.error('Failed to fetch arena wallets:', error);
    } finally {
      setArenaWalletsLoading(false);
    }
  }, [address, currentArenaWallet]);

  // Initial fetch
  useEffect(() => {
    if (isConnected && address) {
      refreshLedgerBalance();
      refreshArenaWallets();
    }
  }, [isConnected, address, refreshLedgerBalance, refreshArenaWallets]);

  const value = useMemo<PredifiWalletContextState>(() => ({
    connectedWallet,
    isConnected: !!connectedWallet,
    proxyAddress,
    ledgerBalance,
    ledgerBalanceLoading,
    arenaWallets,
    arenaWalletsLoading,
    currentArenaWallet,
    setCurrentArenaWallet,
    refreshLedgerBalance,
    refreshArenaWallets,
    supportedNetworks: SUPPORTED_NETWORKS,
  }), [
    connectedWallet,
    proxyAddress,
    ledgerBalance,
    ledgerBalanceLoading,
    arenaWallets,
    arenaWalletsLoading,
    currentArenaWallet,
    refreshLedgerBalance,
    refreshArenaWallets,
  ]);

  return (
    <PredifiWalletContext.Provider value={value}>
      {children}
    </PredifiWalletContext.Provider>
  );
}

export function usePredifiWallet() {
  const context = useContext(PredifiWalletContext);
  if (!context) {
    throw new Error('usePredifiWallet must be used within a PredifiWalletProvider');
  }
  return context;
}

// Helper hook to get the current signer
export function useArenaSigner() {
  const { connectedWallet, currentArenaWallet } = usePredifiWallet();
  const { getSigner } = useWallet();
  
  const getArenaSigner = useCallback(async () => {
    if (!connectedWallet || !currentArenaWallet) {
      throw new Error('No wallet connected or arena wallet selected');
    }
    
    const signer = await getSigner();
    if (!signer) {
      throw new Error('Failed to get signer');
    }
    
    return {
      signer,
      account: currentArenaWallet.address,
      signerAddress: connectedWallet.address,
    };
  }, [connectedWallet, currentArenaWallet, getSigner]);
  
  return { getArenaSigner };
}
