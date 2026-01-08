-- Enable RLS on canonical_event_urls table
ALTER TABLE public.canonical_event_urls ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for URL redirects to work)
-- But this is still more secure as RLS is now enabled
CREATE POLICY "public_read_access" 
ON public.canonical_event_urls 
FOR SELECT 
USING (true);

-- Only service role can modify
CREATE POLICY "service_role_full_access" 
ON public.canonical_event_urls 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);