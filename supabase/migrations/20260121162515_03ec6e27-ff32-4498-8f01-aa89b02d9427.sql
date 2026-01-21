-- Create a function that handles duplicates by adding numeric suffix
CREATE OR REPLACE FUNCTION public.generate_unique_concert_slug(
  p_event_id TEXT,
  p_artist_name TEXT,
  p_city TEXT,
  p_event_date TIMESTAMPTZ,
  p_event_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  suffix_num INTEGER := 0;
BEGIN
  -- Get base slug from the existing function
  base_slug := public.generate_concert_slug(p_artist_name, p_city, p_event_date, p_event_name);
  final_slug := base_slug;
  
  -- Check for existing slugs and add suffix if needed
  WHILE EXISTS (
    SELECT 1 FROM tm_tbl_events 
    WHERE slug = final_slug AND id != p_event_id
  ) LOOP
    suffix_num := suffix_num + 1;
    final_slug := base_slug || '-' || suffix_num::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SET search_path = public