-- Remove dates from event slugs - Step by step approach
-- First, update all slugs removing dates where there won't be conflicts

-- Step 1: Identify and update unique slugs (no conflicts when date is removed)
WITH slug_counts AS (
  SELECT 
    regexp_replace(slug, '-\d{4}-\d{2}-\d{2}$', '') as base_slug,
    COUNT(*) as cnt
  FROM tm_tbl_events 
  WHERE slug ~ '-\d{4}-\d{2}-\d{2}$'
  GROUP BY regexp_replace(slug, '-\d{4}-\d{2}-\d{2}$', '')
  HAVING COUNT(*) = 1
)
UPDATE tm_tbl_events e
SET slug = regexp_replace(e.slug, '-\d{4}-\d{2}-\d{2}$', '')
FROM slug_counts sc
WHERE regexp_replace(e.slug, '-\d{4}-\d{2}-\d{2}$', '') = sc.base_slug
  AND e.slug ~ '-\d{4}-\d{2}-\d{2}$';