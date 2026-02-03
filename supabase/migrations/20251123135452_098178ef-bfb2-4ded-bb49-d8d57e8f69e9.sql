-- Fix RLS policies to prevent unauthorized data access

-- 1. Fix profiles table - restrict email visibility
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can only view their own full profile (including email)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create a view for public profiles (no email exposure)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  avatar_url,
  full_name,
  bio,
  wallet_address,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2. Fix rewards table - ensure users can only see their own rewards
DROP POLICY IF EXISTS "Users can view own rewards" ON public.rewards;
DROP POLICY IF EXISTS "Users can update own rewards" ON public.rewards;

CREATE POLICY "Users can view own rewards"
ON public.rewards
FOR SELECT
USING (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Users can update own rewards"
ON public.rewards
FOR UPDATE
USING (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

-- 3. Fix soft_staking table - ensure users can only access their own commitments
DROP POLICY IF EXISTS "Users can view own commitments" ON public.soft_staking;
DROP POLICY IF EXISTS "Users can create commitments" ON public.soft_staking;
DROP POLICY IF EXISTS "Users can update own commitments" ON public.soft_staking;

CREATE POLICY "Users can view own commitments"
ON public.soft_staking
FOR SELECT
USING (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Users can create own commitments"
ON public.soft_staking
FOR INSERT
WITH CHECK (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Users can update own commitments"
ON public.soft_staking
FOR UPDATE
USING (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
)
WITH CHECK (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

-- 4. Fix price_alerts table - ensure users can only access their own alerts
DROP POLICY IF EXISTS "Users can view all alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can update alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can delete alerts" ON public.price_alerts;

CREATE POLICY "Users can view own alerts"
ON public.price_alerts
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own alerts"
ON public.price_alerts
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own alerts"
ON public.price_alerts
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own alerts"
ON public.price_alerts
FOR DELETE
USING (user_id = auth.uid());

-- 5. Fix referral_codes table - restrict to viewing only own code
DROP POLICY IF EXISTS "Users can view all referral codes" ON public.referral_codes;

CREATE POLICY "Users can view own referral code"
ON public.referral_codes
FOR SELECT
USING (
  user_address = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

-- Create a secure function to lookup referral codes (for referral flow)
CREATE OR REPLACE FUNCTION public.get_referral_code(code text)
RETURNS TABLE (
  id uuid,
  referral_code text,
  user_address text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, referral_code, user_address, created_at
  FROM public.referral_codes
  WHERE referral_code = code
  LIMIT 1;
$$;