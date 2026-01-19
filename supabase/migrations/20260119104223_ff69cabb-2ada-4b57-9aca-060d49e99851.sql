-- Allow public read access to city mapping for frontend usage (place_id + imagen_ciudad)
-- Note: table contains no PII; this enables destination images/deeplinks.
ALTER TABLE public.lite_tbl_city_mapping ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lite_tbl_city_mapping'
      AND policyname = 'public_read_access'
  ) THEN
    CREATE POLICY "public_read_access"
    ON public.lite_tbl_city_mapping
    FOR SELECT
    USING (true);
  END IF;
END $$;