-- Arena Live Performance Table (for real-time leaderboard)
CREATE TABLE public.arena_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.arena_registrations(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.arena_competitions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  starting_capital NUMERIC(10, 2) NOT NULL DEFAULT 100,
  current_balance NUMERIC(12, 4) NOT NULL DEFAULT 100,
  realized_pnl NUMERIC(12, 4) NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC(12, 4) NOT NULL DEFAULT 0,
  total_pnl NUMERIC(12, 4) GENERATED ALWAYS AS (realized_pnl + unrealized_pnl) STORED,
  roi_percent NUMERIC(8, 4) GENERATED ALWAYS AS (((realized_pnl + unrealized_pnl) / starting_capital) * 100) STORED,
  open_positions_count INTEGER NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  last_trade_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(registration_id)
);

-- Arena Trade History Table
CREATE TABLE public.arena_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  performance_id UUID NOT NULL REFERENCES public.arena_performance(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.arena_competitions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  market TEXT NOT NULL,
  direction TEXT NOT NULL,
  size NUMERIC(12, 4) NOT NULL,
  entry_price NUMERIC(16, 8),
  exit_price NUMERIC(16, 8),
  pnl NUMERIC(12, 4),
  status TEXT NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_direction CHECK (direction IN ('LONG', 'SHORT')),
  CONSTRAINT valid_status CHECK (status IN ('OPEN', 'CLOSED', 'LIQUIDATED'))
);

-- Admin Audit Log Table
CREATE TABLE public.arena_admin_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arena_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_admin_logs ENABLE ROW LEVEL SECURITY;

-- Arena Performance: Public read for leaderboard
CREATE POLICY "Anyone can view performance"
ON public.arena_performance
FOR SELECT
USING (true);

-- Only system/admin can modify performance
CREATE POLICY "Admins can manage performance"
ON public.arena_performance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Arena Trades: Public read
CREATE POLICY "Anyone can view trades"
ON public.arena_trades
FOR SELECT
USING (true);

-- Only system/admin can create trades
CREATE POLICY "Admins can manage trades"
ON public.arena_trades
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin logs: Admin only
CREATE POLICY "Admins can view logs"
ON public.arena_admin_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create logs"
ON public.arena_admin_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for performance table
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_performance;

-- Trigger to update timestamp
CREATE TRIGGER update_arena_performance_updated_at
BEFORE UPDATE ON public.arena_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();