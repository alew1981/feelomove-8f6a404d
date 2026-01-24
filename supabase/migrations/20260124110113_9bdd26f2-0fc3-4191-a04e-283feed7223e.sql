-- Step 1: Update slugs in tm_tbl_events to clean SEO format
-- First, update the main 5SOS Madrid concert (not VIP)
UPDATE tm_tbl_events 
SET slug = '5-seconds-of-summer-madrid-30-abril-2026',
    updated_at = NOW()
WHERE id = '2023202971';

-- Update all 5SOS events with clean slugs
UPDATE tm_tbl_events 
SET slug = '5-seconds-of-summer-valencia-2-mayo-2026',
    updated_at = NOW()
WHERE id = '1589730238';

-- Step 2: Clean up slug_redirects - delete entries where new_slug contains noise
DELETE FROM slug_redirects 
WHERE new_slug LIKE '%paquetes-vip%' 
   OR new_slug LIKE '%paquete-vip%'
   OR new_slug LIKE '%world-tour%'
   OR new_slug LIKE '%upgrade%'
   OR new_slug LIKE '%entrada-no-incluida%';

-- Step 3: Insert clean redirects for 5SOS
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
VALUES 
  -- Madrid variants
  ('5-seconds-of-summer-everyone-s-star-world-tour-paquetes-vip-madrid', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-everyones-star-world-tour-paquetes-vip-madrid', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-everyones-star-world-tour-paquetes-vip-madrid-2026', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-everyone-s-star-world-tour-madrid', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-everyones-star-world-tour-madrid', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-everyones-star-world-tour-madrid-2026', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  ('5-seconds-of-summer-madrid', '5-seconds-of-summer-madrid-30-abril-2026', '2023202971'),
  -- Valencia variants  
  ('5-seconds-of-summer-everyone-s-star-world-tour-valencia', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-everyones-star-world-tour-valencia', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-everyones-star-world-tour-valencia-2026', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-everyone-s-star-world-tour-paquetes-vip-valencia', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-everyones-star-world-tour-paquetes-vip-valencia', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-everyones-star-world-tour-paquetes-vip-valencia-2026', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238'),
  ('5-seconds-of-summer-valencia', '5-seconds-of-summer-valencia-2-mayo-2026', '1589730238')
ON CONFLICT (old_slug) DO UPDATE SET 
  new_slug = EXCLUDED.new_slug,
  event_id = EXCLUDED.event_id;

-- Step 4: Add a constraint to prevent dirty slugs from being inserted
CREATE OR REPLACE FUNCTION public.validate_clean_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if new_slug contains prohibited patterns
  IF NEW.new_slug ~ '(paquetes?-vip|world-tour|tickets?|entradas?|upgrade|entrada-no-incluida)' THEN
    RAISE EXCEPTION 'new_slug contains prohibited noise patterns: %', NEW.new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_clean_slug ON slug_redirects;
CREATE TRIGGER trg_validate_clean_slug
BEFORE INSERT OR UPDATE ON slug_redirects
FOR EACH ROW
EXECUTE FUNCTION public.validate_clean_slug();