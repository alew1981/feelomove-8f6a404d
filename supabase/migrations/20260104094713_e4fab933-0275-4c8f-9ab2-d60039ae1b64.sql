-- Step 2: Handle duplicates by adding sequential suffix
-- For events with the same base slug, keep date for disambiguation

WITH numbered_slugs AS (
  SELECT 
    id,
    slug,
    regexp_replace(slug, '-\d{4}-\d{2}-\d{2}$', '') as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY regexp_replace(slug, '-\d{4}-\d{2}-\d{2}$', '')
      ORDER BY event_date ASC
    ) as rn
  FROM tm_tbl_events
  WHERE slug ~ '-\d{4}-\d{2}-\d{2}$'
)
UPDATE tm_tbl_events e
SET slug = CASE 
  WHEN n.rn = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.rn
END
FROM numbered_slugs n
WHERE e.id = n.id;