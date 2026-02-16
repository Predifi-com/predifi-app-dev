import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export default function MobileAuthBridge() {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const [params] = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = params.get("callbackUrl") ?? "";
    if (!raw) return "";

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "predifi:") return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }, [params]);

  useEffect(() => {
    if (!callbackUrl) return;

    if (!primaryWallet?.address) {
      setShowAuthFlow(true);
      return;
    }

    const url = new URL(callbackUrl);
    url.searchParams.set("address", primaryWallet.address);
    url.searchParams.set("provider", "dynamic");
    window.location.replace(url.toString());
  }, [callbackUrl, primaryWallet?.address, setShowAuthFlow]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">Mobile Dynamic Sign-in</h1>
        {!callbackUrl ? (
          <p className="text-muted-foreground">Missing or invalid callback URL.</p>
        ) : primaryWallet?.address ? (
          <p className="text-muted-foreground">Completing sign-in and returning to app...</p>
        ) : (
          <p className="text-muted-foreground">Please connect your wallet to continue.</p>
        )}
      </div>
    </main>
  );
}
