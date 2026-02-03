-- Add signature column to soft_staking table
ALTER TABLE public.soft_staking 
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS nonce TEXT;