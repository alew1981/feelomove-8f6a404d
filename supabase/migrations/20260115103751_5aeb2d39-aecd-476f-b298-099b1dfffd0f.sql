
-- Update the generate_event_slug function to NOT include dates
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from name
  base_slug := regexp_replace(lower(unaccent(NEW.name)), '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Add city if available
  IF NEW.venue_city IS NOT NULL THEN
    base_slug := base_slug || '-' || regexp_replace(lower(unaccent(NEW.venue_city)), '[^a-z0-9]+', '-', 'g');
  END IF;
  
  -- NO LONGER ADDING DATE TO SLUG
  -- This was causing SEO issues with duplicate content and ugly URLs
  
  final_slug := base_slug;
  
  -- Handle duplicates by adding counter
  WHILE EXISTS (SELECT 1 FROM tm_tbl_events WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
