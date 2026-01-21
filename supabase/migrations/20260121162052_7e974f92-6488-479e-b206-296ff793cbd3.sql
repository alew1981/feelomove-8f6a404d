-- Migration: Update all concert slugs and create redirects
-- Using a function to handle the update properly

CREATE OR REPLACE FUNCTION public.migrate_concert_slugs()
RETURNS TABLE(updated_count INTEGER, redirect_count INTEGER) AS $$
DECLARE
  event_record RECORD;
  new_slug TEXT;
  base_new_slug TEXT;
  existing_count INTEGER;
  v_updated_count INTEGER := 0;
  v_redirect_count INTEGER := 0;
  slugs_used TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Process all concerts
  FOR event_record IN 
    SELECT id, slug, name, primary_attraction_name, venue_city, event_date
    FROM tm_tbl_events 
    WHERE event_type = 'concert' 
      AND is_transport IS NOT TRUE
      AND cancelled = false
      AND event_date >= '2026-01-01'
      AND primary_attraction_name IS NOT NULL
    ORDER BY event_date, id
  LOOP
    -- Generate new slug
    base_new_slug := public.generate_concert_slug(
      event_record.primary_attraction_name,
      event_record.venue_city,
      event_record.event_date,
      event_record.name
    );
    
    new_slug := base_new_slug;
    
    -- Check if this slug is already used in this batch or in DB
    SELECT COUNT(*) INTO existing_count
    FROM tm_tbl_events 
    WHERE slug = new_slug AND id != event_record.id;
    
    -- Also check our batch
    IF new_slug = ANY(slugs_used) THEN
      existing_count := existing_count + 1;
    END IF;
    
    -- Add suffix if duplicate
    IF existing_count > 0 THEN
      new_slug := base_new_slug || '-' || (existing_count + 1)::TEXT;
    END IF;
    
    -- Track used slugs
    slugs_used := array_append(slugs_used, new_slug);
    
    -- Only update if slug actually changed
    IF new_slug != event_record.slug THEN
      -- Insert redirect from old slug to new slug
      INSERT INTO slug_redirects (event_id, old_slug, new_slug)
      VALUES (event_record.id, event_record.slug, new_slug)
      ON CONFLICT DO NOTHING;
      
      v_redirect_count := v_redirect_count + 1;
      
      -- Update the event with new slug
      UPDATE tm_tbl_events 
      SET slug = new_slug, updated_at = now()
      WHERE id = event_record.id;
      
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_updated_count, v_redirect_count;
END;
$$ LANGUAGE plpgsql;