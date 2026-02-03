import { WaitlistGate } from "@/components/WaitlistGate";

interface WaitlistRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that gates access to routes.
 * Only whitelisted users (by wallet or email) can access wrapped content.
 * Non-whitelisted users see the waitlist signup form.
 */
export function WaitlistRoute({ children }: WaitlistRouteProps) {
  return <WaitlistGate>{children}</WaitlistGate>;
}
