-- Add BNB to the allowed tokens in soft_staking table
ALTER TABLE public.soft_staking 
DROP CONSTRAINT IF EXISTS soft_staking_token_check;

ALTER TABLE public.soft_staking 
ADD CONSTRAINT soft_staking_token_check 
CHECK (token = ANY (ARRAY['USDC'::text, 'USDT'::text, 'BNB'::text]));