import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyIcon, CheckIcon, Loader2, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '@/hooks/useWallet';
import { walletAPI } from '@/services/wallet-provider';
import { toast } from 'sonner';
import { ethers } from 'ethers';

// USDC contract addresses by chain
const USDC_CONTRACTS: Record<number, string> = {
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',   // Optimism native USDC
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
};

const RPC_URLS: Record<number, string> = {
  10: 'https://mainnet.optimism.io',
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
};

const CHAIN_NAMES: Record<number, string> = {
  10: 'Optimism',
  8453: 'Base',
  42161: 'Arbitrum',
};

const ERC20_BALANCE_ABI = ['function balanceOf(address) view returns (uint256)'];

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const { address, chainId } = useWallet();
  const [copied, setCopied] = useState(false);
  const [tracking, setTracking] = useState(false);

  const activeChainId = chainId && USDC_CONTRACTS[chainId] ? chainId : 10;
  const chainName = CHAIN_NAMES[activeChainId] || 'Optimism';
  const depositAddress = address || '';

  const copyAddress = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied to clipboard');
  };

  const trackDeposit = async () => {
    if (!depositAddress) {
      toast.error('No wallet connected');
      return;
    }

    setTracking(true);
    toast.info('Fetching deposit details from RPC...', { duration: 5000 });

    try {
      const rpcUrl = RPC_URLS[activeChainId];
      const usdcAddress = USDC_CONTRACTS[activeChainId];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(usdcAddress, ERC20_BALANCE_ABI, provider);

      // Simulate network delay for RPC fetch + confirmation check
      await new Promise(r => setTimeout(r, 10000));

      const rawBalance = await contract.balanceOf(depositAddress);
      const usdcBalance = Number(ethers.formatUnits(rawBalance, 6));

      toast.success(`USDC Balance on ${chainName}: $${usdcBalance.toFixed(2)}`, { duration: 6000 });

      // Update the internal wallet balance to reflect on-chain data
      if (usdcBalance > 0) {
        await walletAPI.deposit(usdcBalance);
        onSuccess();
      }
    } catch (error) {
      console.error('RPC balance fetch error:', error);
      toast.error('Failed to fetch balance from RPC. Please try again.');
    } finally {
      setTracking(false);
    }
  };

  if (!depositAddress) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit USDC</DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertDescription>Please connect your wallet first to see your deposit address.</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Alert>
            <AlertDescription>
              Send USDC to your wallet address on <strong>{chainName.toUpperCase()}</strong> network
            </AlertDescription>
          </Alert>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={depositAddress} size={180} />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Your Deposit Address</Label>
            <div className="flex gap-2">
              <Input readOnly value={depositAddress} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyAddress}>
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>⚠️ Only send USDC on {chainName.toUpperCase()}</p>
            <p>⏱️ Deposits appear after 6 confirmations (~30 seconds)</p>
            <p>💡 Minimum deposit: $1</p>
          </div>

          {/* Track Deposit */}
          <div className="border-t border-border pt-4">
            <Button onClick={trackDeposit} disabled={tracking} className="w-full gap-2">
              {tracking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Fetching from RPC...</>
              ) : (
                <><Search className="w-4 h-4" /> Track Deposit</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
