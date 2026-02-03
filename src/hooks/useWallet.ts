import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ethers } from "ethers";

/**
 * Unified wallet hook using Dynamic
 */
export function useWallet() {
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext();

  const connect = () => {
    setShowAuthFlow(true);
  };

  const disconnect = async () => {
    if (primaryWallet) {
      await primaryWallet.connector.endSession();
    }
  };

  const getSigner = async (): Promise<ethers.Signer | null> => {
    if (!primaryWallet) return null;
    
    try {
      // Dynamic wallet exposes the ethereum provider
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        return signer;
      }
      return null;
    } catch (error) {
      console.error("Error getting signer:", error);
      return null;
    }
  };

  return {
    // User data
    address: primaryWallet?.address,
    email: user?.email,
    isConnected: !!primaryWallet,
    user,
    wallet: primaryWallet,

    // Chain data
    chain: primaryWallet?.chain,
    chainId: primaryWallet?.chain ? parseInt(primaryWallet.chain) : undefined,

    // Actions
    connect,
    disconnect,
    getSigner,
  };
}
