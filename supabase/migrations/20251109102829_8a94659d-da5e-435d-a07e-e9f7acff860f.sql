-- Allow anonymous users to insert activity tracking
ALTER TABLE public.user_activity ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy for inserting activity (both authenticated and anonymous)
CREATE POLICY "Anyone can insert activity"
ON public.user_activity
FOR INSERT
WITH CHECK (true);

-- Add index for better query performance on activity tracking (skip if exists)
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id) WHERE user_id IS NOT NULL;