/**
 * useRouterAccount
 * =================
 * Manages the per-user UserRouter contract on Arbitrum Sepolia.
 *
 * Each user gets exactly one router at a deterministic CREATE2 address.
 * Deployment is fully automatic — triggered silently on wallet connect with no
 * user-facing prompt.  The router address is the user's deposit address;
 * funds sent to it are swept to PredifiPool automatically.
 *
 * Nothing deployment-related is exposed in the public API surface; the user
 * never sees or interacts with the router setup flow.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  CONTRACTS,
  ROUTER_FACTORY_ABI,
  USER_ROUTER_ABI,
  ERC20_ABI,
  userSalt,
  ARB_SEPOLIA_CHAIN_ID,
} from "@/config/contracts";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouterAccountState {
  /** Deterministic router address (available immediately, even before deployment) */
  routerAddress: string | null;
  /** True once the on-chain router is fully set up and ready to receive funds */
  isReady: boolean;
  /** True while the initial check / silent deployment is in progress */
  isSettingUp: boolean;
  /** Whether a sweep tx is in-flight */
  isSweeping: boolean;
  /** USDC balance currently sitting in the router (pre-sweep) */
  routerUsdcBalance: string;
  /** Last error message, if any */
  error: string | null;
  /** Sweep USDC from router → vault — normally called by the backend */
  sweep: () => Promise<void>;
  /** Re-check router state and balance */
  refresh: () => Promise<void>;
}

// ─── RPC provider (read-only, no wallet needed) ───────────────────────────────

const ARB_SEPOLIA_RPC =
  (import.meta.env.VITE_ARB_SEPOLIA_RPC as string | undefined) ??
  "https://sepolia-rollup.arbitrum.io/rpc";

function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ARB_SEPOLIA_RPC, ARB_SEPOLIA_CHAIN_ID);
}

// ─── Signer helper ────────────────────────────────────────────────────────────

/**
 * Get an ethers v6 Signer from the Dynamic `primaryWallet`.
 * Tries the Dynamic-recommended `getWalletClient()` path first, then falls back
 * to `window.ethereum` for injected (MetaMask-style) wallets.
 */
async function getDynamicSigner(
  primaryWallet: any,
): Promise<ethers.Signer | null> {
  if (!primaryWallet) return null;

  try {
    // Path A: Dynamic EVM connector — preferred for embedded + injected wallets
    if (typeof primaryWallet.getWalletClient === "function") {
      const walletClient = await primaryWallet.getWalletClient();
      if (walletClient) {
        const provider = new ethers.BrowserProvider(walletClient as any, ARB_SEPOLIA_CHAIN_ID);
        return await provider.getSigner();
      }
    }

    // Path B: connector.getProvider() (some Dynamic connector versions)
    if (typeof primaryWallet.connector?.getProvider === "function") {
      const rawProvider = await primaryWallet.connector.getProvider();
      if (rawProvider) {
        const provider = new ethers.BrowserProvider(rawProvider, ARB_SEPOLIA_CHAIN_ID);
        return await provider.getSigner();
      }
    }

    // Path C: injected window.ethereum fallback (MetaMask / Rabby)
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum, ARB_SEPOLIA_CHAIN_ID);
      return await provider.getSigner();
    }
  } catch (err) {
    console.error("[useRouterAccount] Failed to get signer:", err);
  }

  return null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRouterAccount(): RouterAccountState {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address as string | undefined;

  const [routerAddress, setRouterAddress] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [routerUsdcBalance, setRouterUsdcBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  // Prevent concurrent setup attempts
  const setupInProgressRef = useRef(false);

  // ── Check + silently deploy if needed ────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!address) {
      setRouterAddress(null);
      setIsReady(false);
      setRouterUsdcBalance("0");
      return;
    }

    // Prevent concurrent runs
    if (setupInProgressRef.current) return;
    setupInProgressRef.current = true;
    setIsSettingUp(true);
    setError(null);
    try {
      const provider = getReadProvider();
      const factory = new ethers.Contract(
        CONTRACTS.ROUTER_FACTORY,
        ROUTER_FACTORY_ABI,
        provider,
      );

      const salt = userSalt(address);
      const computed: string = await factory.computeRouterAddress(address, salt);
      const checksummed = ethers.getAddress(computed);
      setRouterAddress(checksummed);

      const code = await provider.getCode(checksummed);
      const deployed = code !== "0x";

      if (!deployed) {
        // ── Silently deploy in the background ──────────────────────────────
        const signer = await getDynamicSigner(primaryWallet);
        if (signer) {
          try {
            const signerNetwork = await (signer.provider as ethers.JsonRpcProvider).getNetwork();
            if (Number(signerNetwork.chainId) === ARB_SEPOLIA_CHAIN_ID) {
              const factoryWithSigner = new ethers.Contract(
                CONTRACTS.ROUTER_FACTORY,
                ROUTER_FACTORY_ABI,
                signer,
              );
              const tx = await factoryWithSigner.createRouter(address, salt);
              await tx.wait(1);
              setIsReady(true);
            }
            // Wrong chain — skip silently; user will deposit when on the right chain
          } catch (deployErr: any) {
            // Non-fatal: log quietly, user can still see their address
            console.warn("[useRouterAccount] Silent deploy failed:", deployErr?.message);
          }
        }
      } else {
        setIsReady(true);
      }

      // Read USDC balance on the router
      if (deployed) {
        const usdc = new ethers.Contract(CONTRACTS.USDC, ERC20_ABI, provider);
        const rawBal: bigint = await usdc.balanceOf(checksummed);
        setRouterUsdcBalance(ethers.formatUnits(rawBal, 6));
      }
    } catch (err: any) {
      console.error("[useRouterAccount] refresh error:", err);
      setError(err?.message ?? "Failed to set up account");
    } finally {
      setIsSettingUp(false);
      setupInProgressRef.current = false;
    }
  }, [address, primaryWallet]);

  // Run on wallet connect / address change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Sweep router → vault ──────────────────────────────────────────────────
  const sweep = useCallback(async () => {
    if (!routerAddress || !isReady) {
      toast.error("Account not ready yet");
      return;
    }

    setIsSweeping(true);
    setError(null);
    try {
      const signer = await getDynamicSigner(primaryWallet);
      if (!signer) throw new Error("Could not get wallet signer");

      const router = new ethers.Contract(routerAddress, USER_ROUTER_ABI, signer);

      toast.loading("Sweeping USDC to vault…", { id: "sweep-router" });
      const tx = await router.sweep();
      await tx.wait(1);

      toast.success("USDC forwarded to vault!", { id: "sweep-router" });
      await refresh();
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.message ?? "Sweep failed";
      console.error("[useRouterAccount] sweep error:", err);
      toast.error(msg, { id: "sweep-router" });
      setError(msg);
    } finally {
      setIsSweeping(false);
    }
  }, [routerAddress, isReady, primaryWallet, refresh]);

  return {
    routerAddress,
    isReady,
    isSettingUp,
    isSweeping,
    routerUsdcBalance,
    error,
    sweep,
    refresh,
  };
}
