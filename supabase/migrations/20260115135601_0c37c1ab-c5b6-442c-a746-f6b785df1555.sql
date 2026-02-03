-- =====================================================
-- Security Fix: Orders Table - Proper Ownership Verification
-- =====================================================

-- Drop the vulnerable cancellation policy
DROP POLICY IF EXISTS "Users can cancel own orders" ON public.orders;

-- Create a secure cancellation policy that verifies ownership via profiles table
-- This ensures users can only cancel orders where they own the maker_address
CREATE POLICY "Users can cancel own orders"
ON public.orders FOR UPDATE
USING (
  LOWER(maker_address) = LOWER((SELECT wallet_address FROM profiles WHERE id = auth.uid()))
  AND status = 'pending'
)
WITH CHECK (status = 'cancelled');

-- =====================================================
-- Security Fix: User Activity Table - Restrict Access
-- =====================================================

-- Drop the overly permissive SELECT policy that exposes all activity
DROP POLICY IF EXISTS "Users can view all activity" ON public.user_activity;

-- Create restrictive policy: users can only view their own activity, admins can see all
CREATE POLICY "Users view own activity"
ON public.user_activity FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- Data Cleanup: Remove tokens from existing activity records
-- =====================================================

-- Remove __lovable_token and other sensitive tokens from stored search parameters
UPDATE user_activity
SET details = 
  CASE 
    WHEN details->>'search' IS NOT NULL THEN
      jsonb_set(
        details,
        '{search}',
        to_jsonb(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                details->>'search',
                '[?&]?__lovable_token=[^&]*',
                '',
                'gi'
              ),
              '[?&]?access_token=[^&]*',
              '',
              'gi'
            ),
            '[?&]?token=[^&]*',
            '',
            'gi'
          )
        )
      )
    ELSE details
  END
WHERE details IS NOT NULL 
  AND details::text LIKE '%token%';