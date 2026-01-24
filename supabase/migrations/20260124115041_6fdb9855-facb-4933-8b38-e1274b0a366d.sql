
-- =====================================================
-- LIMPIEZA MASIVA: Slugs con sufijos numéricos
-- Usando unaccent + hora para evitar conflictos
-- =====================================================

-- Disable trigger temporarily
ALTER TABLE slug_redirects DISABLE TRIGGER trg_prevent_placeholder_new_slug_redirects;

-- PASO 1: Crear función helper para generar slug limpio SEO
CREATE OR REPLACE FUNCTION temp_generate_clean_seo_slug(
  p_artist TEXT,
  p_city TEXT,
  p_event_date TIMESTAMPTZ,
  p_event_hour TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_artist TEXT;
  v_city TEXT;
  v_day TEXT;
  v_month TEXT;
  v_year TEXT;
  v_slug TEXT;
BEGIN
  -- Normalize artist: remove accents, special chars, lowercase
  v_artist := LOWER(unaccent(COALESCE(p_artist, 'evento')));
  v_artist := REGEXP_REPLACE(v_artist, '[^a-z0-9\s-]', '', 'g');
  v_artist := REGEXP_REPLACE(v_artist, '\s+', '-', 'g');
  v_artist := REGEXP_REPLACE(v_artist, '--+', '-', 'g');
  v_artist := TRIM(BOTH '-' FROM v_artist);
  
  -- Normalize city
  v_city := LOWER(unaccent(COALESCE(p_city, 'madrid')));
  v_city := REGEXP_REPLACE(v_city, '[^a-z0-9\s-]', '', 'g');
  v_city := REGEXP_REPLACE(v_city, '\s+', '-', 'g');
  v_city := TRIM(BOTH '-' FROM v_city);
  
  -- Date parts
  v_day := EXTRACT(DAY FROM p_event_date)::TEXT;
  v_year := EXTRACT(YEAR FROM p_event_date)::TEXT;
  v_month := CASE EXTRACT(MONTH FROM p_event_date)::INTEGER
    WHEN 1 THEN 'enero' WHEN 2 THEN 'febrero' WHEN 3 THEN 'marzo'
    WHEN 4 THEN 'abril' WHEN 5 THEN 'mayo' WHEN 6 THEN 'junio'
    WHEN 7 THEN 'julio' WHEN 8 THEN 'agosto' WHEN 9 THEN 'septiembre'
    WHEN 10 THEN 'octubre' WHEN 11 THEN 'noviembre' WHEN 12 THEN 'diciembre'
  END;
  
  -- Build slug
  v_slug := v_artist || '-' || v_city || '-' || v_day || '-' || v_month || '-' || v_year;
  
  -- Add hour if provided (for conflicts)
  IF p_event_hour IS NOT NULL THEN
    v_slug := v_slug || '-' || p_event_hour || 'h';
  END IF;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 2: Crear tabla con cambios propuestos
CREATE TEMP TABLE temp_slug_cleanup AS
WITH ranked_events AS (
  SELECT 
    id,
    slug as old_slug,
    primary_attraction_name,
    venue_city,
    event_date,
    LPAD(EXTRACT(HOUR FROM event_date)::TEXT, 2, '0') as event_hour,
    temp_generate_clean_seo_slug(primary_attraction_name, venue_city, event_date) as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY 
        temp_generate_clean_seo_slug(primary_attraction_name, venue_city, event_date)
      ORDER BY event_date, id
    ) as rn
  FROM tm_tbl_events
  WHERE slug ~ '-\d{1,2}$'
    AND slug !~ '-20[2-9]\d$'
    AND event_date IS NOT NULL
    AND EXTRACT(YEAR FROM event_date) BETWEEN 2024 AND 2030
)
SELECT 
  id,
  old_slug,
  CASE 
    -- If base slug conflicts with existing OR is duplicate within batch, add hour
    WHEN EXISTS(SELECT 1 FROM tm_tbl_events e WHERE e.slug = r.base_slug)
      OR rn > 1
    THEN temp_generate_clean_seo_slug(primary_attraction_name, venue_city, event_date, event_hour)
    ELSE base_slug
  END as new_slug
FROM ranked_events r;

-- PASO 3: Update events (skip if new slug would still conflict)
UPDATE tm_tbl_events e
SET 
  slug = t.new_slug,
  updated_at = NOW()
FROM temp_slug_cleanup t
WHERE e.id = t.id
  AND t.old_slug != t.new_slug
  AND NOT EXISTS(SELECT 1 FROM tm_tbl_events e2 WHERE e2.slug = t.new_slug AND e2.id != t.id);

-- PASO 4: Insert 301 redirects
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
SELECT 
  t.old_slug,
  e.slug,
  t.id
FROM temp_slug_cleanup t
JOIN tm_tbl_events e ON e.id = t.id
WHERE t.old_slug != e.slug
ON CONFLICT (old_slug) 
DO UPDATE SET 
  new_slug = EXCLUDED.new_slug,
  event_id = EXCLUDED.event_id;

-- Cleanup
DROP TABLE temp_slug_cleanup;
DROP FUNCTION temp_generate_clean_seo_slug;

-- Re-enable trigger
ALTER TABLE slug_redirects ENABLE TRIGGER trg_prevent_placeholder_new_slug_redirects;
