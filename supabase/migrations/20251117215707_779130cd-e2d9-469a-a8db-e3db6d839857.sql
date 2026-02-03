-- Drop the existing check constraint on token column
ALTER TABLE public.vault_stats DROP CONSTRAINT IF EXISTS vault_stats_token_check;

-- Add new check constraint allowing USDC, USDT, and BNB
ALTER TABLE public.vault_stats 
ADD CONSTRAINT vault_stats_token_check CHECK (token IN ('USDC', 'USDT', 'BNB'));

-- Now add BNB vault stats
INSERT INTO vault_stats (vault_name, token, tvl, apy, strategy)
VALUES ('Delta Neutral BNB Vault', 'BNB', '0', 12.5, 'Market Making + Hedging')
ON CONFLICT DO NOTHING;

-- Create wallet balance tracking table
CREATE TABLE IF NOT EXISTS public.wallet_balance_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  token TEXT NOT NULL,
  balance TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  commitment_id UUID REFERENCES soft_staking(id),
  below_commitment BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_balance_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_balance_snapshots
CREATE POLICY "Users can view their own balance snapshots"
ON public.wallet_balance_snapshots
FOR SELECT
USING (user_address IS NOT NULL);

CREATE POLICY "System can create balance snapshots"
ON public.wallet_balance_snapshots
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_wallet_balance_user_token 
ON public.wallet_balance_snapshots(user_address, token, checked_at DESC);

-- Update soft_staking table to track yield status
ALTER TABLE public.soft_staking 
ADD COLUMN IF NOT EXISTS yield_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_balance_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS balance_warnings INTEGER DEFAULT 0;

-- Create function to calculate rewards
CREATE OR REPLACE FUNCTION public.calculate_soft_staking_rewards(
  p_user_address TEXT,
  p_commitment_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_committed_amount NUMERIC;
  v_token TEXT;
  v_created_at TIMESTAMP;
  v_yield_active BOOLEAN;
  v_current_apy NUMERIC;
  v_days_elapsed NUMERIC;
  v_rewards NUMERIC;
BEGIN
  -- Get commitment details
  SELECT 
    CAST(committed_amount AS NUMERIC) / 1e6, -- Convert from wei
    token,
    created_at,
    COALESCE(yield_active, true)
  INTO 
    v_committed_amount,
    v_token,
    v_created_at,
    v_yield_active
  FROM soft_staking
  WHERE id = p_commitment_id AND user_address = LOWER(p_user_address);

  -- If commitment not found or yield not active, return 0
  IF NOT FOUND OR NOT v_yield_active THEN
    RETURN 0;
  END IF;

  -- Calculate current APY (300% starting, 25% reduction every 2 weeks)
  v_days_elapsed := EXTRACT(EPOCH FROM (NOW() - TIMESTAMP '2025-01-01')) / 86400;
  v_current_apy := 300 * POWER(0.75, FLOOR(v_days_elapsed / 14));

  -- Calculate days since commitment
  v_days_elapsed := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 86400;

  -- Calculate rewards: (amount * APY * days) / 365
  v_rewards := (v_committed_amount * v_current_apy / 100 * v_days_elapsed) / 365;

  RETURN GREATEST(v_rewards, 0);
END;
$$;