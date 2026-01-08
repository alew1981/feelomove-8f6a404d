-- Drop the overly permissive public read access policy
DROP POLICY IF EXISTS "public_read_access" ON public.lite_tbl_city_mapping;

-- Create a more restrictive policy - only service role can access
CREATE POLICY "service_role_read_access" 
ON public.lite_tbl_city_mapping 
FOR SELECT 
TO service_role 
USING (true);