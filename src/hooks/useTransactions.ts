import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { toast } from "sonner";
import { parseTransactionError } from "@/lib/wallet-utils";
import type { TransactionRequest } from "@/types/wallet";
import { isEthereumWallet } from "@dynamic-labs/ethereum";

/**
 * Hook for handling transactions with user feedback
 */
export function useTransactions() {
  const [isPending, setIsPending] = useState(false);
  const { primaryWallet } = useDynamicContext();

  const sendTransaction = async (request: TransactionRequest) => {
    if (!primaryWallet) {
      toast.error("Wallet not connected");
      return null;
    }

    if (!isEthereumWallet(primaryWallet)) {
      toast.error("Ethereum wallet required");
      return null;
    }

    setIsPending(true);
    
    try {
      const provider = await primaryWallet.getWalletClient();
      
      // @ts-ignore - Dynamic SDK type compatibility
      const hash = await provider.sendTransaction({
        to: request.to,
        data: request.data || "0x",
        value: request.value || 0n,
      });
      
      toast.success("Transaction submitted successfully");

      return { hash };
    } catch (error) {
      const message = parseTransactionError(error as Error);
      toast.error("Transaction failed", { description: message });
      console.error("Transaction error:", error);
      return null;
    } finally {
      setIsPending(false);
    }
  };

  return {
    sendTransaction,
    isPending,
  };
}
