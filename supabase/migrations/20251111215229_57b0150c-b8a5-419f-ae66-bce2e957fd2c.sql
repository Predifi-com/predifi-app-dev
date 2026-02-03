-- Create referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table to track who referred whom
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_address TEXT NOT NULL,
  referee_address TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
  UNIQUE(referee_address)
);

-- Create rewards table for tracking PREDIFI token rewards
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- referral, share, milestone
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed BOOLEAN NOT NULL DEFAULT false
);

-- Create activity feed table for real-time updates
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- commitment, referral, milestone
  token TEXT,
  amount TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create milestones table to track user progress
CREATE TABLE public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  milestone_tier TEXT NOT NULL, -- bronze_1k, silver_10k, gold_50k, diamond_100k
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_amount NUMERIC NOT NULL,
  UNIQUE(user_address, milestone_tier)
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view all referral codes"
  ON public.referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (user_address IS NOT NULL);

-- RLS Policies for referrals
CREATE POLICY "Users can view all referrals"
  ON public.referrals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards
CREATE POLICY "Users can view own rewards"
  ON public.rewards FOR SELECT
  USING (user_address IS NOT NULL);

CREATE POLICY "System can create rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own rewards"
  ON public.rewards FOR UPDATE
  USING (user_address IS NOT NULL);

-- RLS Policies for activity_feed
CREATE POLICY "Anyone can view activity feed"
  ON public.activity_feed FOR SELECT
  USING (true);

CREATE POLICY "System can create activity"
  ON public.activity_feed FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_milestones
CREATE POLICY "Users can view all milestones"
  ON public.user_milestones FOR SELECT
  USING (true);

CREATE POLICY "System can create milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (true);

-- Enable realtime for activity feed
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;

-- Add indexes for performance
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_address);
CREATE INDEX idx_referrals_referee ON public.referrals(referee_address);
CREATE INDEX idx_rewards_user ON public.rewards(user_address);
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX idx_user_milestones_user ON public.user_milestones(user_address);
