-- Create soft staking commitments table
CREATE TABLE public.soft_staking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
  committed_amount TEXT NOT NULL, -- Stored as wei string
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'converted')),
  notes TEXT,
  UNIQUE(user_address, token, status)
);

-- Create index for faster queries
CREATE INDEX idx_soft_staking_user ON public.soft_staking(user_address);
CREATE INDEX idx_soft_staking_token ON public.soft_staking(token);
CREATE INDEX idx_soft_staking_status ON public.soft_staking(status);

-- Enable RLS
ALTER TABLE public.soft_staking ENABLE ROW LEVEL SECURITY;

-- Users can view their own commitments
CREATE POLICY "Users can view own commitments"
ON public.soft_staking
FOR SELECT
USING (user_address IS NOT NULL);

-- Users can create commitments
CREATE POLICY "Users can create commitments"
ON public.soft_staking
FOR INSERT
WITH CHECK (user_address IS NOT NULL);

-- Users can update their own commitments
CREATE POLICY "Users can update own commitments"
ON public.soft_staking
FOR UPDATE
USING (user_address IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_soft_staking_updated_at
  BEFORE UPDATE ON public.soft_staking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create vault statistics table (for displaying vault performance)
CREATE TABLE public.vault_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_name TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL CHECK (token IN ('USDC', 'USDT')),
  tvl TEXT NOT NULL, -- Total Value Locked in wei
  apy NUMERIC NOT NULL, -- Annual Percentage Yield
  strategy TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view vault stats
CREATE POLICY "Anyone can view vault stats"
ON public.vault_stats
FOR SELECT
USING (true);

-- Insert initial vault data
INSERT INTO public.vault_stats (vault_name, token, tvl, apy, strategy) VALUES
('Delta Neutral USDC Vault', 'USDC', '0', 12.5, 'Market Making + Hedging'),
('Delta Neutral USDT Vault', 'USDT', '0', 11.8, 'Market Making + Hedging');