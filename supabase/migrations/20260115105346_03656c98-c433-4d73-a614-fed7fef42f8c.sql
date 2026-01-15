
-- Disable the trigger temporarily
ALTER TABLE tm_tbl_events DISABLE TRIGGER trigger_generate_event_slug;

-- Step 1: Save old slugs to redirect table and update with new slugs
WITH old_slugs AS (
  SELECT id, slug as old_slug, name, venue_city, venue_name, event_date
  FROM tm_tbl_events
  WHERE slug IS NOT NULL
),
new_slugs AS (
  SELECT 
    o.id,
    o.old_slug,
    generate_event_slug(o.name, o.venue_city, o.venue_name, o.event_date, o.id) as new_slug
  FROM old_slugs o
)
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
SELECT old_slug, new_slug, id
FROM new_slugs
WHERE old_slug != new_slug
ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug;

-- Step 2: Update the events with new slugs
UPDATE tm_tbl_events e
SET slug = generate_event_slug(e.name, e.venue_city, e.venue_name, e.event_date, e.id)
WHERE slug IS NOT NULL;

-- Re-enable the trigger
ALTER TABLE tm_tbl_events ENABLE TRIGGER trigger_generate_event_slug;
