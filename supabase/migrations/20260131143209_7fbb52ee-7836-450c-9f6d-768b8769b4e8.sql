
-- Migration: Mark technical/service events to exclude from sitemap
-- is_transport is a generated column, so we only update exclude_from_sitemap

-- Step 1: Mark Parking events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE name ILIKE '%parking%'
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 2: Mark Ticketless events  
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE name ILIKE '%ticketless%'
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 3: Mark Upgrade events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE name ILIKE '%upgrade%'
  AND name NOT ILIKE '%tour%'
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 4: Mark Voucher events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE name ILIKE '%voucher%'
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 5: Mark Shuttle/Transfer events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE (name ILIKE '%shuttle%' OR name ILIKE '%transfer%')
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 6: Mark VIP Package events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE (name ILIKE '%paquetes vip%' OR name ILIKE '%vip packages%' OR name ILIKE '%vip package%')
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 7: Mark "Plaza de Parking" events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE name ILIKE 'plaza de parking%'
  AND exclude_from_sitemap IS NOT TRUE;

-- Step 8: Mark Bus service events
UPDATE tm_tbl_events 
SET exclude_from_sitemap = true
WHERE (name ILIKE 'servicio de autobus%' OR name ILIKE '%+ bus %' OR name ILIKE 'bus +%')
  AND exclude_from_sitemap IS NOT TRUE;
