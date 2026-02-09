import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import { FlowWalletConnectors } from "@dynamic-labs/flow";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { SparkWalletConnectors } from "@dynamic-labs/spark";
import { StarknetWalletConnectors } from "@dynamic-labs/starknet";
import { SuiWalletConnectors } from "@dynamic-labs/sui";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SEO } from "@/components/SEO";
import { CookieConsent } from "@/components/CookieConsent";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AlphaBanner } from "@/components/AlphaBanner";
import { PlatformProvider } from "@/components/PlatformProvider";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { AdminFloatingButton } from "@/components/AdminFloatingButton";
import { PredifiWalletProvider } from "@/contexts/PredifiWalletContext";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppContent() {
  usePageTracking();

  // Catch unhandled promise rejections (e.g. MetaMask connection failures)
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled rejection caught:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);
  
  return (
    <>
      <SEO />
      <AlphaBanner />
      <CookieConsent />
      <AnimatedRoutes />
      <AdminFloatingButton />
      <MobileBottomNav />
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlatformProvider>
          <DynamicContextProvider
            settings={{
              environmentId: "204b5e55-b3c6-46aa-8c5a-5497e156a3a6",
              walletConnectors: [
                EthereumWalletConnectors,
                BitcoinWalletConnectors,
                FlowWalletConnectors,
                SolanaWalletConnectors,
                SparkWalletConnectors,
                StarknetWalletConnectors,
                SuiWalletConnectors,
              ],
            }}
          >
            <TooltipProvider>
              <PredifiWalletProvider>
                <WebSocketProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </WebSocketProvider>
              </PredifiWalletProvider>
            </TooltipProvider>
          </DynamicContextProvider>
        </PlatformProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;