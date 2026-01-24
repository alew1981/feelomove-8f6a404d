
-- =====================================================
-- LIMPIEZA MASIVA: Noise Words en Slugs
-- Formato canónico: [prefix]-[artista]-[ciudad]-[dia]-[mes]-[año]
-- =====================================================

-- Disable trigger temporarily
ALTER TABLE slug_redirects DISABLE TRIGGER trg_prevent_placeholder_new_slug_redirects;

-- PASO 1: Crear función helper para limpiar noise words
CREATE OR REPLACE FUNCTION temp_clean_noise_slug(
  p_artist TEXT,
  p_city TEXT,
  p_event_date TIMESTAMPTZ,
  p_is_vip BOOLEAN DEFAULT FALSE,
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
  
  -- Build slug with VIP prefix if applicable
  IF p_is_vip THEN
    v_slug := 'vip-' || v_artist || '-' || v_city || '-' || v_day || '-' || v_month || '-' || v_year;
  ELSE
    v_slug := v_artist || '-' || v_city || '-' || v_day || '-' || v_month || '-' || v_year;
  END IF;
  
  -- Add hour if provided (for conflicts)
  IF p_event_hour IS NOT NULL THEN
    v_slug := v_slug || '-' || p_event_hour || 'h';
  END IF;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 2: Crear tabla temporal con todos los eventos a limpiar
CREATE TEMP TABLE temp_noise_cleanup AS
WITH noise_events AS (
  SELECT 
    id,
    slug as old_slug,
    primary_attraction_name,
    venue_city,
    event_date,
    LPAD(EXTRACT(HOUR FROM event_date)::TEXT, 2, '0') as event_hour,
    -- Detect if it's a VIP package
    (slug ~* 'paquetes?-vip|upgrade|vip') as is_vip,
    -- Generate base clean slug
    temp_clean_noise_slug(
      primary_attraction_name, 
      venue_city, 
      event_date,
      (slug ~* 'paquetes?-vip|upgrade|vip')
    ) as base_slug
  FROM tm_tbl_events
  WHERE slug ~* '(world-tour|everyones?-s-star|paquetes?-vip|tickets?|entradas?|gira-|lux-tour|tour-mundial|european-tour|ntktour|wishbone|upgrade|bite-the-apple|mi-norte|los-mejores|iconica|santalucia)'
    AND event_date >= NOW()
    AND EXTRACT(YEAR FROM event_date) BETWEEN 2024 AND 2030
),
ranked AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY base_slug
      ORDER BY event_date, id
    ) as rn
  FROM noise_events
)
SELECT 
  id,
  old_slug,
  is_vip,
  CASE 
    -- If base slug conflicts with existing OR is duplicate within batch, add hour
    WHEN EXISTS(SELECT 1 FROM tm_tbl_events e WHERE e.slug = r.base_slug AND e.id != r.id)
      OR rn > 1
    THEN temp_clean_noise_slug(primary_attraction_name, venue_city, event_date, is_vip, event_hour)
    ELSE base_slug
  END as new_slug
FROM ranked r;

-- PASO 3: Preview (commented out in production)
-- SELECT old_slug, new_slug FROM temp_noise_cleanup ORDER BY old_slug LIMIT 20;

-- PASO 4: Update events (skip if new slug would still conflict)
UPDATE tm_tbl_events e
SET 
  slug = t.new_slug,
  updated_at = NOW()
FROM temp_noise_cleanup t
WHERE e.id = t.id
  AND t.old_slug != t.new_slug
  AND NOT EXISTS(SELECT 1 FROM tm_tbl_events e2 WHERE e2.slug = t.new_slug AND e2.id != t.id);

-- PASO 5: Insert 301 redirects for all changed slugs
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
SELECT 
  t.old_slug,
  e.slug,
  t.id
FROM temp_noise_cleanup t
JOIN tm_tbl_events e ON e.id = t.id
WHERE t.old_slug != e.slug
ON CONFLICT (old_slug) 
DO UPDATE SET 
  new_slug = EXCLUDED.new_slug,
  event_id = EXCLUDED.event_id;

-- Cleanup
DROP TABLE temp_noise_cleanup;
DROP FUNCTION temp_clean_noise_slug;

-- Re-enable trigger
ALTER TABLE slug_redirects ENABLE TRIGGER trg_prevent_placeholder_new_slug_redirects;
