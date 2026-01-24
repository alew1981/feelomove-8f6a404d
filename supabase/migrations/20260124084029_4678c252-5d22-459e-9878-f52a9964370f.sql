
-- =====================================================
-- MIGRATION: Clean SEO-Friendly URL Slugs (Revised)
-- Handles duplicates by adding time-based suffix first
-- =====================================================

-- Spanish month names array for slug generation
CREATE OR REPLACE FUNCTION generate_seo_slug_with_spanish_date_v2(
  p_name TEXT,
  p_venue_city TEXT,
  p_event_date TIMESTAMPTZ,
  p_primary_attraction_name TEXT DEFAULT NULL,
  p_is_vip BOOLEAN DEFAULT FALSE,
  p_event_hour INT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  spanish_months TEXT[] := ARRAY['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  base_name TEXT;
  city_slug TEXT;
  date_day INT;
  date_month INT;
  date_year INT;
  date_part TEXT;
  final_slug TEXT;
  suffix TEXT := '';
BEGIN
  -- Use primary_attraction_name if available and shorter
  IF p_primary_attraction_name IS NOT NULL 
     AND length(p_primary_attraction_name) < length(p_name) 
     AND p_primary_attraction_name !~ '^\d' THEN
    base_name := p_primary_attraction_name;
  ELSE
    base_name := regexp_replace(p_name, '\s*[-–]\s*(The\s+)?(World\s+)?Tour.*$', '', 'i');
    base_name := regexp_replace(base_name, '\s*\|\s*Paquetes?\s+VIP.*$', '', 'i');
    base_name := regexp_replace(base_name, '\s*[-–]\s*(Gira|Live|En Concierto).*$', '', 'i');
    IF length(base_name) > 50 AND p_primary_attraction_name IS NOT NULL THEN
      base_name := p_primary_attraction_name;
    END IF;
  END IF;
  
  -- Normalize to slug format
  base_name := lower(unaccent(base_name));
  base_name := regexp_replace(base_name, '[^a-z0-9\s-]', '', 'g');
  base_name := regexp_replace(base_name, '\s+', '-', 'g');
  base_name := regexp_replace(base_name, '-+', '-', 'g');
  base_name := trim(both '-' from base_name);
  
  city_slug := lower(unaccent(p_venue_city));
  city_slug := regexp_replace(city_slug, '[^a-z0-9\s-]', '', 'g');
  city_slug := regexp_replace(city_slug, '\s+', '-', 'g');
  city_slug := regexp_replace(city_slug, '-+', '-', 'g');
  city_slug := trim(both '-' from city_slug);
  
  -- Extract date parts
  date_day := EXTRACT(DAY FROM p_event_date);
  date_month := EXTRACT(MONTH FROM p_event_date);
  date_year := EXTRACT(YEAR FROM p_event_date);
  
  IF date_year = 9999 THEN
    date_year := EXTRACT(YEAR FROM NOW()) + 1;
    date_part := date_year::TEXT;
  ELSE
    date_part := date_day || '-' || spanish_months[date_month] || '-' || date_year;
  END IF;
  
  -- Add VIP suffix if applicable
  IF p_is_vip THEN
    suffix := '-paquetes-vip';
  -- Add hour suffix for same-day duplicates (matinee vs evening)
  ELSIF p_event_hour IS NOT NULL AND p_event_hour < 17 THEN
    suffix := '-matine';
  END IF;
  
  final_slug := base_name || '-' || city_slug || '-' || date_part || suffix;
  final_slug := regexp_replace(final_slug, '-+', '-', 'g');
  final_slug := trim(both '-' from final_slug);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- =====================================================
-- STEP 1: Clean up slug_redirects table
-- =====================================================

DELETE FROM slug_redirects WHERE old_slug = new_slug;
DELETE FROM slug_redirects WHERE new_slug ~ '-\d{1,2}$' AND new_slug !~ '-20\d{2}$';
DELETE FROM slug_redirects WHERE new_slug ~ '-9999';

-- =====================================================
-- STEP 2: Update slugs in batches to avoid conflicts
-- First, identify which events need updates
-- =====================================================

-- Create a tracking table for the update
CREATE TABLE IF NOT EXISTS slug_migration_log (
  event_id TEXT PRIMARY KEY,
  old_slug TEXT,
  new_slug TEXT,
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert events that need migration into tracking table
INSERT INTO slug_migration_log (event_id, old_slug, new_slug)
SELECT 
  id::text,
  slug,
  generate_seo_slug_with_spanish_date_v2(
    name,
    venue_city,
    event_date::timestamptz,
    primary_attraction_name,
    name ILIKE '%VIP%' OR name ILIKE '%Paquete%',
    EXTRACT(HOUR FROM event_date)::int
  )
FROM tm_tbl_events
WHERE event_date >= '2026-01-01'
  AND slug IS NOT NULL
  AND (
    slug ~ '-\d{1,2}$'
    OR slug ~ '-9999'
    OR slug ~ '-\d{4}-\d{2}-\d{2}$'
  )
ON CONFLICT (event_id) DO UPDATE SET
  new_slug = EXCLUDED.new_slug;

-- Add slugs to slug_redirects for SEO continuity
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
SELECT old_slug, new_slug, event_id
FROM slug_migration_log
WHERE old_slug <> new_slug
  AND old_slug IS NOT NULL
ON CONFLICT (old_slug) DO UPDATE SET
  new_slug = EXCLUDED.new_slug,
  event_id = EXCLUDED.event_id;
