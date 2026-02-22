
-- Fix mv_events_schema_org to exclude events with placeholder dates (9999)
-- and use plural routes (/conciertos/, /festivales/) for canonical URLs
DROP MATERIALIZED VIEW IF EXISTS mv_events_schema_org;

CREATE MATERIALIZED VIEW mv_events_schema_org AS
SELECT 
  id,
  slug,
  event_type,
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'MusicEvent',
    'name', name,
    'startDate', to_char(event_date, 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
    'endDate', to_char(event_date, 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
    'eventStatus', CASE WHEN sold_out THEN 'https://schema.org/SoldOut' ELSE 'https://schema.org/EventScheduled' END,
    'eventAttendanceMode', 'https://schema.org/OfflineEventAttendanceMode',
    'url', 'https://feelomove.com/' || 
           CASE WHEN event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
           '/' || slug,
    'location', jsonb_build_object(
      '@type', 'Place',
      'name', COALESCE(venue_name, venue_city),
      'address', jsonb_build_object(
        '@type', 'PostalAddress',
        'streetAddress', COALESCE(venue_address, ''),
        'addressLocality', venue_city,
        'addressCountry', 'ES'
      ),
      'geo', jsonb_build_object(
        '@type', 'GeoCoordinates',
        'latitude', COALESCE(venue_latitude::text, '0'),
        'longitude', COALESCE(venue_longitude::text, '0')
      )
    ),
    'image', COALESCE(image_large_url, 'https://feelomove.com/og-image.jpg'),
    'description', name || ' en ' || venue_city || 
                   '. Consigue tus entradas para este evento ' || 
                   COALESCE(LOWER(primary_subcategory_name), 'musical') || '.',
    'performer', jsonb_build_object(
      '@type', 'MusicGroup',
      'name', COALESCE(primary_attraction_name, name)
    ),
    'organizer', jsonb_build_object(
      '@type', 'Organization',
      'name', 'FEELOMOVE+',
      'url', 'https://feelomove.com'
    ),
    'offers', CASE 
      WHEN price_min_incl_fees IS NOT NULL THEN 
        jsonb_build_object(
          '@type', 'Offer',
          'url', 'https://feelomove.com/' || 
                 CASE WHEN event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
                 '/' || slug,
          'price', price_min_incl_fees,
          'priceCurrency', COALESCE(currency, 'EUR'),
          'availability', CASE WHEN sold_out THEN 'https://schema.org/SoldOut' ELSE 'https://schema.org/InStock' END,
          'validFrom', COALESCE(to_char(on_sale_date, 'YYYY-MM-DD'), to_char(CURRENT_DATE, 'YYYY-MM-DD'))
        )
      ELSE 
        jsonb_build_object(
          '@type', 'AggregateOffer',
          'url', 'https://feelomove.com/' || 
                 CASE WHEN event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
                 '/' || slug,
          'availability', CASE WHEN sold_out THEN 'https://schema.org/SoldOut' ELSE 'https://schema.org/InStock' END
        )
    END
  ) AS schema_org_json
FROM tm_tbl_events e
WHERE NOT cancelled 
  AND event_date >= CURRENT_DATE
  AND EXTRACT(YEAR FROM event_date) < 9999;
