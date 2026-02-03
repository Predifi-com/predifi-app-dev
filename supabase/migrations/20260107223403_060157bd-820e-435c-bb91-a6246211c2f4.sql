-- Arena Competition Status Enum
CREATE TYPE public.arena_competition_status AS ENUM ('UPCOMING', 'REGISTERING', 'LIVE', 'FINALIZED');

-- Arena Competitor Status Enum
CREATE TYPE public.arena_competitor_status AS ENUM ('REGISTERED', 'ACTIVE', 'QUALIFIED', 'ELIMINATED', 'WITHDRAWN');

-- Arena Competitions Table
CREATE TABLE public.arena_competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id TEXT NOT NULL,
  competition_number INTEGER NOT NULL,
  is_finale BOOLEAN NOT NULL DEFAULT false,
  status arena_competition_status NOT NULL DEFAULT 'UPCOMING',
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  competition_start TIMESTAMP WITH TIME ZONE NOT NULL,
  competition_end TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  fcfs_slots INTEGER DEFAULT 0,
  fcfs_slots_remaining INTEGER DEFAULT 0,
  is_whitelist_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(season_id, competition_number)
);

-- Arena Whitelist Table
CREATE TABLE public.arena_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES public.arena_competitions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  added_by TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competition_id, wallet_address)
);

-- Arena Registrations Table
CREATE TABLE public.arena_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.arena_competitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  arena_wallet_address TEXT,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deposit_confirmed BOOLEAN NOT NULL DEFAULT false,
  status arena_competitor_status NOT NULL DEFAULT 'REGISTERED',
  admission_type TEXT NOT NULL DEFAULT 'WHITELIST',
  rules_accepted BOOLEAN NOT NULL DEFAULT false,
  rules_accepted_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competition_id, wallet_address)
);

-- Arena Qualifications Table
CREATE TABLE public.arena_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  competition_id UUID NOT NULL REFERENCES public.arena_competitions(id) ON DELETE CASCADE,
  final_roi NUMERIC(10, 4) NOT NULL,
  final_rank INTEGER NOT NULL,
  qualified_for_finale BOOLEAN NOT NULL DEFAULT false,
  qualified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, competition_id)
);

-- Enable Row Level Security
ALTER TABLE public.arena_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_qualifications ENABLE ROW LEVEL SECURITY;

-- Competitions are publicly readable
CREATE POLICY "Anyone can view competitions"
ON public.arena_competitions
FOR SELECT
USING (true);

-- Only admins can modify competitions
CREATE POLICY "Admins can manage competitions"
ON public.arena_competitions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Whitelist: only authenticated users can check their own status
CREATE POLICY "Users can view own whitelist status"
ON public.arena_whitelist
FOR SELECT
TO authenticated
USING (LOWER(wallet_address) = LOWER(auth.jwt() ->> 'wallet_address') OR public.has_role(auth.uid(), 'admin'));

-- Admins can manage whitelist
CREATE POLICY "Admins can manage whitelist"
ON public.arena_whitelist
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Registrations: users can view their own, admins can view all
CREATE POLICY "Users can view own registrations"
ON public.arena_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Users can insert their own registration
CREATE POLICY "Users can register themselves"
ON public.arena_registrations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own registration
CREATE POLICY "Users can update own registration"
ON public.arena_registrations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Qualifications are publicly readable
CREATE POLICY "Anyone can view qualifications"
ON public.arena_qualifications
FOR SELECT
USING (true);

-- Admins can manage qualifications
CREATE POLICY "Admins can manage qualifications"
ON public.arena_qualifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_arena_competitions_updated_at
BEFORE UPDATE ON public.arena_competitions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arena_registrations_updated_at
BEFORE UPDATE ON public.arena_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial Season 01 competitions
INSERT INTO public.arena_competitions (season_id, competition_number, is_finale, status, is_whitelist_only, registration_start, registration_end, competition_start, competition_end, fcfs_slots, fcfs_slots_remaining) VALUES
('season-01', 1, false, 'REGISTERING', true, '2025-01-07', '2025-02-02', '2025-02-03', '2025-02-09', 0, 0),
('season-01', 2, false, 'UPCOMING', true, NULL, NULL, '2025-02-17', '2025-02-23', 0, 0),
('season-01', 3, false, 'UPCOMING', true, NULL, NULL, '2025-03-03', '2025-03-09', 0, 0),
('season-01', 4, false, 'UPCOMING', true, NULL, NULL, '2025-03-17', '2025-03-23', 0, 0),
('season-01', 5, false, 'UPCOMING', true, NULL, NULL, '2025-03-31', '2025-04-06', 0, 0),
('season-01', 6, true, 'UPCOMING', false, NULL, NULL, '2025-04-14', '2025-04-28', 25, 25);