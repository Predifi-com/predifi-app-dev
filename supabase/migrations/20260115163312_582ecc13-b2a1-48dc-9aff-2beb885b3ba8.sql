-- Create table for Arena Season 0 notification signups
CREATE TABLE public.arena_notification_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.arena_notification_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (insert)
CREATE POLICY "Anyone can sign up for notifications"
ON public.arena_notification_signups
FOR INSERT
WITH CHECK (true);

-- Users can view their own signup by email
CREATE POLICY "Users can view their own signup"
ON public.arena_notification_signups
FOR SELECT
USING (true);

-- Add index for faster lookups
CREATE INDEX idx_arena_notification_signups_email ON public.arena_notification_signups(email);