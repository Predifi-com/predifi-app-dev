-- Fix wallet_balance_snapshots RLS policy - restrict to own records
DROP POLICY IF EXISTS "Users can view their own balance snapshots" ON public.wallet_balance_snapshots;

CREATE POLICY "Users can view own balance snapshots"
ON public.wallet_balance_snapshots
FOR SELECT
TO authenticated
USING (
  LOWER(user_address) = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
);

-- Fix avatars storage bucket policies - add ownership verification
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix arena_whitelist policy to use profiles table instead of JWT claims
DROP POLICY IF EXISTS "Users can view own whitelist status" ON public.arena_whitelist;

CREATE POLICY "Users can view own whitelist status"
ON public.arena_whitelist
FOR SELECT
TO authenticated
USING (
  LOWER(wallet_address) = LOWER((SELECT wallet_address FROM public.profiles WHERE id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);