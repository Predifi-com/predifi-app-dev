import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";

interface WaitlistEntry {
  id: string;
  email: string;
  wallet_address: string | null;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  priority_score: number;
  created_at: string;
  approved_at: string | null;
}

interface WaitlistStatus {
  isWhitelisted: boolean;
  isLoading: boolean;
  isOnWaitlist: boolean;
  error: string | null;
  waitlistEntry: WaitlistEntry | null;
  queuePosition: number | null;
}

const initialStatus: WaitlistStatus = {
  isWhitelisted: false,
  isLoading: true,
  isOnWaitlist: false,
  error: null,
  waitlistEntry: null,
  queuePosition: null,
};

export function useWaitlistGate() {
  const { address, isConnected, email } = useWallet();
  const [status, setStatus] = useState<WaitlistStatus>(initialStatus);
  const inFlightRef = useRef(0);

  const checkWhitelistStatus = useCallback(async (walletAddress?: string, email?: string) => {
    try {
      const requestId = ++inFlightRef.current;
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // IMPORTANT: Avoid direct SELECTs on role/whitelist tables here.
      // Those queries can be blocked by RLS and appear “flaky” depending on auth state.
      // Use backend security-definer functions instead.
      const normalizedWallet = walletAddress?.toLowerCase();
      const normalizedEmail = email?.toLowerCase();

      const [adminRes, whitelistRes] = await Promise.all([
        normalizedWallet
          ? supabase.rpc("is_admin_wallet", { _wallet_address: normalizedWallet })
          : Promise.resolve({ data: false as any, error: null as any }),
        supabase.rpc("is_whitelisted", {
          check_email: normalizedEmail ?? null,
          check_wallet: normalizedWallet ?? null,
        }),
      ]);

      if (adminRes.error) throw adminRes.error;
      if (whitelistRes.error) throw whitelistRes.error;

      const isWhitelisted = !!adminRes.data || !!whitelistRes.data;

      // If a newer request started while we were awaiting, ignore this result.
      if (requestId !== inFlightRef.current) return isWhitelisted;

      // Check waitlist status and get entry details
      let waitlistEntry: WaitlistEntry | null = null;
      let queuePosition: number | null = null;

      // If user is already whitelisted (or admin), don't do extra waitlist queries.
      // This reduces chances of RLS-related noise and speeds up route gating.
      if (isWhitelisted) {
        setStatus({
          isWhitelisted,
          isLoading: false,
          isOnWaitlist: false,
          error: null,
          waitlistEntry: null,
          queuePosition: null,
        });

        return true;
      }
      
      if (walletAddress) {
        const { data: walletWaitlist } = await supabase
          .from("waitlist_signups")
          .select("*")
          .ilike("wallet_address", walletAddress)
          .limit(1);
        
        if (walletWaitlist && walletWaitlist.length > 0) {
          waitlistEntry = walletWaitlist[0] as WaitlistEntry;
        }
      }
      
      if (!waitlistEntry && email) {
        const { data: emailWaitlist } = await supabase
          .from("waitlist_signups")
          .select("*")
          .ilike("email", email)
          .limit(1);
        
        if (emailWaitlist && emailWaitlist.length > 0) {
          waitlistEntry = emailWaitlist[0] as WaitlistEntry;
        }
      }

      // Get queue position if on waitlist
      if (waitlistEntry && !waitlistEntry.approved_at) {
        const { data: positionData } = await supabase
          .rpc("get_waitlist_position", { user_email: waitlistEntry.email });
        
        queuePosition = positionData as number | null;
      }

      setStatus({
        isWhitelisted,
        isLoading: false,
        isOnWaitlist: !!waitlistEntry,
        error: null,
        waitlistEntry,
        queuePosition,
      });

      return isWhitelisted;
    } catch (error) {
      console.error("Error checking whitelist:", error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to check access status",
      }));
      return false;
    }
  }, []);

  const joinWaitlist = useCallback(async (
    email: string, 
    walletAddress?: string, 
    referralCode?: string
  ) => {
    try {
      const insertData = {
        email: email.toLowerCase(),
        wallet_address: walletAddress?.toLowerCase() || null,
        referred_by: null as string | null,
      };

      // Add referral if provided
      if (referralCode) {
        // Verify the referral code exists
        const { data: referrer } = await supabase
          .from("waitlist_signups")
          .select("id")
          .eq("referral_code", referralCode.toUpperCase())
          .limit(1);

        if (referrer && referrer.length > 0) {
          insertData.referred_by = referralCode.toUpperCase();
        }
      }

      const { data, error } = await supabase
        .from("waitlist_signups")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Duplicate email - try to fetch existing entry
          const { data: existingEntry } = await supabase
            .from("waitlist_signups")
            .select("*")
            .ilike("email", email)
            .limit(1);

          if (existingEntry && existingEntry.length > 0) {
            setStatus(prev => ({ 
              ...prev, 
              isOnWaitlist: true,
              waitlistEntry: existingEntry[0] as WaitlistEntry
            }));
            return { success: true, error: null, alreadyExists: true };
          }
          return { success: false, error: "This email is already on the waitlist" };
        }
        throw error;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke("send-waitlist-welcome", {
          body: {
            email: email.toLowerCase(),
            referralCode: data.referral_code,
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the signup if email fails
      }

      // Get queue position
      const { data: positionData } = await supabase
        .rpc("get_waitlist_position", { user_email: email });

      setStatus(prev => ({ 
        ...prev, 
        isOnWaitlist: true,
        waitlistEntry: data as WaitlistEntry,
        queuePosition: positionData as number | null,
      }));
      
      return { success: true, error: null, entry: data };
    } catch (error: any) {
      console.error("Error joining waitlist:", error);
      return { success: false, error: error.message || "Failed to join waitlist" };
    }
  }, []);

  const getShareUrl = useCallback(() => {
    if (!status.waitlistEntry?.referral_code) return null;
    return `${window.location.origin}?ref=${status.waitlistEntry.referral_code}`;
  }, [status.waitlistEntry]);

  // Reset state helper
  const resetToInitial = useCallback(() => {
    setStatus({ ...initialStatus, isLoading: false });
  }, []);

  // Initial check on mount and wallet changes
  useEffect(() => {
    const checkAccess = async () => {
      if (isConnected && address) {
        checkWhitelistStatus(address, email);
      } else if (email) {
        // Email-only Dynamic session (no wallet connected)
        checkWhitelistStatus(undefined, email);
      } else {
        // No wallet and no user - stop loading
        setStatus(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    checkAccess();
  }, [isConnected, address, email, checkWhitelistStatus]);

  return {
    ...status,
    checkWhitelistStatus,
    joinWaitlist,
    getShareUrl,
    resetToInitial,
  };
}
