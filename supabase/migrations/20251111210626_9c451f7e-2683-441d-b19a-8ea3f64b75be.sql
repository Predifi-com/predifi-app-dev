-- Create orders table for storing signed EIP-712 orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maker_address TEXT NOT NULL,
  market_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  price TEXT NOT NULL, -- Stored as wei string
  size TEXT NOT NULL, -- Stored as wei string
  nonce TEXT NOT NULL,
  expiry TEXT NOT NULL, -- Unix timestamp as string
  signature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'settled', 'cancelled', 'expired')),
  filled_size TEXT DEFAULT '0', -- Amount filled in wei
  UNIQUE(maker_address, nonce)
);

-- Create index for faster queries
CREATE INDEX idx_orders_maker ON public.orders(maker_address);
CREATE INDEX idx_orders_market ON public.orders(market_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_expiry ON public.orders(expiry);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view all orders (needed for orderbook)
CREATE POLICY "Anyone can view orders"
ON public.orders
FOR SELECT
USING (true);

-- Users can create their own orders
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (maker_address IS NOT NULL);

-- Users can cancel their own orders
CREATE POLICY "Users can cancel own orders"
ON public.orders
FOR UPDATE
USING (maker_address IS NOT NULL AND status = 'pending')
WITH CHECK (status = 'cancelled');

-- Create function to update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create matches table for tracking matched orders
CREATE TABLE public.order_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buy_order_id UUID NOT NULL REFERENCES public.orders(id),
  sell_order_id UUID NOT NULL REFERENCES public.orders(id),
  matched_price TEXT NOT NULL,
  matched_size TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settlement_tx_hash TEXT,
  settled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_matches_buy_order ON public.order_matches(buy_order_id);
CREATE INDEX idx_matches_sell_order ON public.order_matches(sell_order_id);

-- Enable RLS
ALTER TABLE public.order_matches ENABLE ROW LEVEL SECURITY;

-- Anyone can view matches
CREATE POLICY "Anyone can view matches"
ON public.order_matches
FOR SELECT
USING (true);