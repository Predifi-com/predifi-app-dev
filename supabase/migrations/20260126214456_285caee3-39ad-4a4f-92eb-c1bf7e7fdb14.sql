-- Create waitlist signups table
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  wallet_address TEXT,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email)
);

-- Create platform whitelist table (approved users)
CREATE TABLE public.platform_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  wallet_address TEXT,
  added_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT whitelist_has_identifier CHECK (email IS NOT NULL OR wallet_address IS NOT NULL)
);

-- Create unique indexes for lookups
CREATE UNIQUE INDEX idx_whitelist_email ON public.platform_whitelist(lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_whitelist_wallet ON public.platform_whitelist(lower(wallet_address)) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_waitlist_email ON public.waitlist_signups(lower(email));
CREATE INDEX idx_waitlist_wallet ON public.waitlist_signups(lower(wallet_address)) WHERE wallet_address IS NOT NULL;

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_whitelist ENABLE ROW LEVEL SECURITY;

-- Waitlist policies: anyone can signup, admins can view all
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist_signups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
ON public.waitlist_signups
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage waitlist"
ON public.waitlist_signups
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Whitelist policies: admins manage, public can check their own status
CREATE POLICY "Admins can manage whitelist"
ON public.platform_whitelist
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can check whitelist status"
ON public.platform_whitelist
FOR SELECT
USING (true);

-- Function to check if user is whitelisted (by email or wallet)
CREATE OR REPLACE FUNCTION public.is_whitelisted(check_email TEXT DEFAULT NULL, check_wallet TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_whitelist
    WHERE 
      (check_email IS NOT NULL AND lower(email) = lower(check_email))
      OR (check_wallet IS NOT NULL AND lower(wallet_address) = lower(check_wallet))
  )
$$;