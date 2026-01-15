
-- Disable only the slug trigger
ALTER TABLE tm_tbl_events DISABLE TRIGGER trigger_generate_event_slug;

-- Update slugs with proper handling of duplicates and collisions
WITH cleaned AS (
  SELECT 
    id,
    slug as original_slug,
    regexp_replace(slug, '-\d{4}-\d{2}-\d{2}(-\d+)?$', '', 'g') as base_slug,
    event_date
  FROM tm_tbl_events
  WHERE slug ~ '-\d{4}-\d{2}-\d{2}'
),
existing_max_suffix AS (
  -- Find max suffix for each base slug among events WITHOUT dates
  SELECT 
    regexp_replace(slug, '-(\d+)$', '', 'g') as base_slug,
    COALESCE(MAX(
      CASE 
        WHEN slug ~ '-\d+$' THEN (regexp_match(slug, '-(\d+)$'))[1]::int
        ELSE 0
      END
    ), 0) + 1 as next_suffix
  FROM tm_tbl_events
  WHERE slug !~ '-\d{4}-\d{2}-\d{2}'
  GROUP BY regexp_replace(slug, '-(\d+)$', '', 'g')
),
ranked AS (
  SELECT 
    c.id,
    c.original_slug,
    c.base_slug,
    c.event_date,
    ROW_NUMBER() OVER (
      PARTITION BY c.base_slug
      ORDER BY c.event_date ASC, c.id
    ) as rn,
    COUNT(*) OVER (PARTITION BY c.base_slug) as group_count,
    COALESCE(e.next_suffix, 1) as start_suffix,
    CASE WHEN EXISTS (SELECT 1 FROM tm_tbl_events t WHERE t.slug = c.base_slug) THEN true ELSE false END as base_exists
  FROM cleaned c
  LEFT JOIN existing_max_suffix e ON e.base_slug = c.base_slug
)
UPDATE tm_tbl_events ev
SET slug = CASE 
  -- If no collision with existing and only one in group
  WHEN r.base_exists = false AND r.group_count = 1 AND r.start_suffix = 1 THEN r.base_slug
  -- Otherwise add suffix
  ELSE r.base_slug || '-' || (r.start_suffix + r.rn - 1)
END
FROM ranked r
WHERE ev.id = r.id;

-- Re-enable the trigger
ALTER TABLE tm_tbl_events ENABLE TRIGGER trigger_generate_event_slug;
