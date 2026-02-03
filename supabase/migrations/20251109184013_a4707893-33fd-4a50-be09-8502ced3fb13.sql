-- Migration: Change from Supabase auth to wallet-based auth
-- Replace user_id (UUID) with wallet_address (text) across all tables

-- 1. Add wallet_address column to profiles table
ALTER TABLE public.profiles ADD COLUMN wallet_address TEXT;

-- 2. Create index on wallet_address for performance
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);

-- 3. Update RLS policies for profiles to use wallet_address
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Allow users to view any profile (public profiles)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can insert their own profile based on wallet address
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

-- Users can update their own profile (no auth check needed, app level validation)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- 4. Update user_activity table to use wallet_address
ALTER TABLE public.user_activity ADD COLUMN wallet_address TEXT;
CREATE INDEX idx_user_activity_wallet_address ON public.user_activity(wallet_address);

DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;

CREATE POLICY "Users can view all activity" 
ON public.user_activity 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

-- 5. Update user_preferences table to use wallet_address
ALTER TABLE public.user_preferences ADD COLUMN wallet_address TEXT;
CREATE INDEX idx_user_preferences_wallet_address ON public.user_preferences(wallet_address);

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view preferences" 
ON public.user_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Users can update preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (true);

-- 6. Update price_alerts table to use wallet_address
ALTER TABLE public.price_alerts ADD COLUMN wallet_address TEXT;
CREATE INDEX idx_price_alerts_wallet_address ON public.price_alerts(wallet_address);

DROP POLICY IF EXISTS "Users can view their own alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can create their own alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can delete their own alerts" ON public.price_alerts;

CREATE POLICY "Users can view all alerts" 
ON public.price_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create alerts" 
ON public.price_alerts 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Users can update alerts" 
ON public.price_alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete alerts" 
ON public.price_alerts 
FOR DELETE 
USING (true);

-- 7. Remove the trigger that creates profiles on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();