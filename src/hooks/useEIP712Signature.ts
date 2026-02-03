import { useState } from "react";
import { useWallet } from "./useWallet";
import { Order, EIP712_DOMAIN, ORDER_TYPES, SignedOrder } from "@/types/eip712";
import { toast } from "sonner";

/**
 * Hook for signing orders using EIP-712
 */
export function useEIP712Signature() {
  const { address, chain, isConnected } = useWallet();
  const [isSigningOrder, setIsSigningOrder] = useState(false);

  /**
   * Sign an order using EIP-712
   */
  const signOrder = async (order: Order): Promise<SignedOrder | null> => {
    if (!isConnected || !address || !chain) {
      toast.error("Please connect your wallet first");
      return null;
    }

    setIsSigningOrder(true);

    try {
      const chainId = parseInt(chain);
      
      // Build the EIP-712 domain
      const domain = {
        ...EIP712_DOMAIN,
        chainId,
        verifyingContract: "0x0000000000000000000000000000000000000000", // TODO: Replace with actual contract address
      };

      // Convert outcome to uint8 for signing
      const orderForSigning = {
        ...order,
        outcome: order.outcome === "YES" ? 0 : 1,
      };

      // Request signature from wallet using eth_signTypedData_v4
      const signature = await (window as any).ethereum.request({
        method: "eth_signTypedData_v4",
        params: [
          address,
          JSON.stringify({
            types: {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
              ],
              ...ORDER_TYPES,
            },
            primaryType: "Order",
            domain,
            message: orderForSigning,
          }),
        ],
      });

      toast.success("Order signed successfully!");

      return {
        ...order,
        signature,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error("Error signing order:", error);
      
      if (error.code === 4001) {
        toast.error("Signature request rejected");
      } else {
        toast.error("Failed to sign order");
      }
      
      return null;
    } finally {
      setIsSigningOrder(false);
    }
  };

  /**
   * Create an order object from form inputs
   */
  const createOrder = (params: {
    marketId: string;
    outcome: "YES" | "NO";
    price: number; // In USDC (e.g., 0.65)
    size: number; // In tokens
    nonce: number;
    expiryMinutes?: number;
  }): Order => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Convert to wei (assuming 18 decimals for USDC)
    const priceInWei = BigInt(Math.floor(params.price * 1e18)).toString();
    const sizeInWei = BigInt(params.size * 1e18).toString();
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (params.expiryMinutes || 60) * 60;

    return {
      maker: address,
      marketId: params.marketId,
      outcome: params.outcome,
      price: priceInWei,
      size: sizeInWei,
      nonce: params.nonce.toString(),
      expiry: expiryTimestamp.toString(),
    };
  };

  return {
    signOrder,
    createOrder,
    isSigningOrder,
    isConnected,
    address,
  };
}
