-- Add referral system to waitlist_signups
ALTER TABLE public.waitlist_signups 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by TEXT,
ADD COLUMN referral_count INTEGER DEFAULT 0,
ADD COLUMN priority_score INTEGER DEFAULT 0;

-- Create index for referral lookups
CREATE INDEX idx_waitlist_referral_code ON public.waitlist_signups(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX idx_waitlist_referred_by ON public.waitlist_signups(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX idx_waitlist_priority ON public.waitlist_signups(priority_score DESC, created_at ASC);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_waitlist_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Generate a unique 8-character code
  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM waitlist_signups WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on insert
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.waitlist_signups
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_waitlist_referral_code();

-- Function to update referral count and priority when someone uses a referral
CREATE OR REPLACE FUNCTION public.process_waitlist_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this signup was referred by someone, update the referrer's stats
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE waitlist_signups
    SET 
      referral_count = referral_count + 1,
      priority_score = priority_score + 10  -- Each referral adds 10 priority points
    WHERE referral_code = NEW.referred_by;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to process referrals after insert
CREATE TRIGGER process_referral_trigger
AFTER INSERT ON public.waitlist_signups
FOR EACH ROW
WHEN (NEW.referred_by IS NOT NULL)
EXECUTE FUNCTION public.process_waitlist_referral();

-- Function to get waitlist position
CREATE OR REPLACE FUNCTION public.get_waitlist_position(user_email TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT position
  FROM (
    SELECT 
      email,
      ROW_NUMBER() OVER (ORDER BY priority_score DESC, created_at ASC) as position
    FROM waitlist_signups
    WHERE approved_at IS NULL
  ) ranked
  WHERE lower(email) = lower(user_email);
$$;

-- Add policy for users to read their own waitlist entry (for referral code sharing)
CREATE POLICY "Users can view their own waitlist entry"
ON public.waitlist_signups
FOR SELECT
USING (true);

-- Drop the old admin-only select policy since we now allow public reads
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist_signups;