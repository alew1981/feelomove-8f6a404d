
-- Step 1: Update the generate_event_slug function with new SEO-optimized logic
CREATE OR REPLACE FUNCTION public.generate_event_slug(
  p_name TEXT,
  p_venue_city TEXT,
  p_venue_name TEXT,
  p_event_date TIMESTAMP WITH TIME ZONE,
  p_event_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_base_slug TEXT;
  v_slug_with_year TEXT;
  v_slug_with_venue TEXT;
  v_slug_with_month TEXT;
  v_slug_with_day TEXT;
  v_final_slug TEXT;
  v_year TEXT;
  v_month_es TEXT;
  v_day TEXT;
  v_venue_slug TEXT;
  v_counter INT;
  v_month_names TEXT[] := ARRAY['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
BEGIN
  -- Generate base slug from name and city
  v_base_slug := generate_seo_slug(p_name || ' ' || p_venue_city);
  
  -- Extract date components
  v_year := EXTRACT(YEAR FROM p_event_date)::TEXT;
  v_month_es := v_month_names[EXTRACT(MONTH FROM p_event_date)::INT];
  v_day := EXTRACT(DAY FROM p_event_date)::TEXT;
  
  -- Generate venue slug
  v_venue_slug := generate_seo_slug(COALESCE(p_venue_name, ''));
  
  -- Level 1: artista-ciudad-año
  v_slug_with_year := v_base_slug || '-' || v_year;
  
  IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_year AND id != p_event_id) THEN
    RETURN v_slug_with_year;
  END IF;
  
  -- Level 2: artista-venue-ciudad-año (if venue exists)
  IF v_venue_slug != '' AND v_venue_slug IS NOT NULL THEN
    v_slug_with_venue := generate_seo_slug(p_name) || '-' || v_venue_slug || '-' || 
                         generate_seo_slug(p_venue_city) || '-' || v_year;
    
    IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_venue AND id != p_event_id) THEN
      RETURN v_slug_with_venue;
    END IF;
    
    -- Level 3: artista-venue-ciudad-mes-año
    v_slug_with_month := generate_seo_slug(p_name) || '-' || v_venue_slug || '-' || 
                         generate_seo_slug(p_venue_city) || '-' || v_month_es || '-' || v_year;
    
    IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_month AND id != p_event_id) THEN
      RETURN v_slug_with_month;
    END IF;
    
    -- Level 4: artista-venue-ciudad-dia-mes-año
    v_slug_with_day := generate_seo_slug(p_name) || '-' || v_venue_slug || '-' || 
                       generate_seo_slug(p_venue_city) || '-' || v_day || '-' || v_month_es || '-' || v_year;
    
    IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_day AND id != p_event_id) THEN
      RETURN v_slug_with_day;
    END IF;
    
    -- Level 5: Fallback with counter (extremely rare)
    v_counter := 2;
    v_final_slug := v_slug_with_day;
    WHILE EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_final_slug AND id != p_event_id) LOOP
      v_final_slug := v_slug_with_day || '-' || v_counter;
      v_counter := v_counter + 1;
    END LOOP;
    
    RETURN v_final_slug;
  ELSE
    -- No venue: artista-ciudad-mes-año
    v_slug_with_month := v_base_slug || '-' || v_month_es || '-' || v_year;
    
    IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_month AND id != p_event_id) THEN
      RETURN v_slug_with_month;
    END IF;
    
    -- artista-ciudad-dia-mes-año
    v_slug_with_day := v_base_slug || '-' || v_day || '-' || v_month_es || '-' || v_year;
    
    IF NOT EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_slug_with_day AND id != p_event_id) THEN
      RETURN v_slug_with_day;
    END IF;
    
    -- Fallback with counter
    v_counter := 2;
    v_final_slug := v_slug_with_day;
    WHILE EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = v_final_slug AND id != p_event_id) LOOP
      v_final_slug := v_slug_with_day || '-' || v_counter;
      v_counter := v_counter + 1;
    END LOOP;
    
    RETURN v_final_slug;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create a table to store old-to-new slug mappings for redirects
CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug TEXT NOT NULL,
  new_slug TEXT NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(old_slug)
);

-- Enable RLS
ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "public_read_slug_redirects" ON public.slug_redirects
  FOR SELECT USING (true);

CREATE POLICY "service_role_full_access_slug_redirects" ON public.slug_redirects
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_slug_redirects_old_slug ON public.slug_redirects(old_slug);
