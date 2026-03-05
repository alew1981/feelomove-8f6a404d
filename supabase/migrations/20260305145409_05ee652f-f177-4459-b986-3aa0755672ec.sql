-- Allow authenticated users to read their own subscriber record
CREATE POLICY "Users can read own subscriber"
ON public.subscribers FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Tighten UPDATE policy: authenticated users can only update their own record
-- First drop the overly permissive existing update policy
DROP POLICY IF EXISTS "Anyone can update own subscriber record" ON public.subscribers;

-- Recreate with proper auth check
CREATE POLICY "Authenticated users can update own subscriber"
ON public.subscribers FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Keep allowing anon upserts for newsletter (insert-only, handled by existing INSERT policy)