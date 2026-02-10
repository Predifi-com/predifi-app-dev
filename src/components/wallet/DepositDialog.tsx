import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyIcon, CheckIcon, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { walletAPI, isMockMode } from '@/services/wallet-provider';
import type { DepositAddress } from '@/types/wallet';
import { toast } from 'sonner';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const [depositAddress, setDepositAddress] = useState<DepositAddress | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState('100');

  useEffect(() => {
    if (open) {
      walletAPI.getDepositAddress().then(setDepositAddress).catch(() =>
        toast.error('Failed to load deposit address')
      );
    }
  }, [open]);

  const copyAddress = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied to clipboard');
  };

  const simulateDeposit = async () => {
    if (!isMockMode) return;
    try {
      setSimulating(true);
      const amount = parseFloat(simulateAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');
      await walletAPI.deposit(amount);
      toast.success(`Successfully deposited $${amount}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Deposit failed');
    } finally {
      setSimulating(false);
    }
  };

  if (!depositAddress) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Alert>
            <AlertDescription>
              Send USDC to this address on <strong>{depositAddress.network.toUpperCase()}</strong> network
            </AlertDescription>
          </Alert>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={depositAddress.address} size={180} />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Your Deposit Address</Label>
            <div className="flex gap-2">
              <Input readOnly value={depositAddress.address} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyAddress}>
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>⚠️ Only send USDC on {depositAddress.network.toUpperCase()}</p>
            <p>⏱️ Deposits appear after 6 confirmations (~30 seconds)</p>
            <p>💡 Minimum deposit: $1</p>
          </div>

          {/* Mock simulator */}
          {isMockMode && (
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Demo Mode: Simulate Deposit</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                />
                <Button onClick={simulateDeposit} disabled={simulating} className="whitespace-nowrap">
                  {simulating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : 'Simulate Deposit'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
