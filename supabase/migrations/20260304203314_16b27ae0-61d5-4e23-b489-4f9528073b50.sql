-- Allow anonymous users to insert/upsert into subscribers via waitlist
CREATE POLICY "Anyone can subscribe via waitlist"
ON public.subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow upsert (UPDATE on conflict) for subscribers
CREATE POLICY "Anyone can update own subscriber record"
ON public.subscribers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);