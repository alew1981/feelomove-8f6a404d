
-- Fix generate_event_schema_org to return NULL for events with placeholder dates (9999)
-- This prevents Google Search Console from reporting critical "missing startDate" errors
CREATE OR REPLACE FUNCTION public.generate_event_schema_org(p_event_id text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_schema JSONB;
BEGIN
  -- Obtener datos del evento
  SELECT 
    id,
    slug,
    name,
    event_date,
    venue_name,
    venue_address,
    venue_city,
    venue_latitude,
    venue_longitude,
    url as ticketmaster_url,
    image_large_url,
    price_min_incl_fees,
    price_max_incl_fees,
    currency,
    primary_attraction_name,
    primary_subcategory_name,
    event_type,
    on_sale_date,
    sold_out
  INTO v_event
  FROM tm_tbl_events
  WHERE id = p_event_id
    AND NOT cancelled;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- CRITICAL: Return NULL for events with placeholder dates (9999-12-31)
  -- These cause GSC "missing startDate" errors because the date is invalid
  IF v_event.event_date IS NULL OR EXTRACT(YEAR FROM v_event.event_date) = 9999 THEN
    RETURN NULL;
  END IF;

  -- Construir el Schema.org JSON-LD
  v_schema := jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'MusicEvent',
    'name', v_event.name,
    'startDate', to_char(v_event.event_date, 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
    'endDate', to_char(v_event.event_date, 'YYYY-MM-DD"T"HH24:MI:SS"+00:00"'),
    'eventStatus', CASE WHEN v_event.sold_out THEN 'https://schema.org/EventCancelled' ELSE 'https://schema.org/EventScheduled' END,
    'eventAttendanceMode', 'https://schema.org/OfflineEventAttendanceMode',
    'url', 'https://feelomove.com/' || 
           CASE WHEN v_event.event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
           '/' || v_event.slug,
    
    -- Ubicación (requerido)
    'location', jsonb_build_object(
      '@type', 'Place',
      'name', COALESCE(v_event.venue_name, v_event.venue_city),
      'address', jsonb_build_object(
        '@type', 'PostalAddress',
        'streetAddress', COALESCE(v_event.venue_address, ''),
        'addressLocality', v_event.venue_city,
        'addressCountry', 'ES'
      )
    ) || 
    CASE 
      WHEN v_event.venue_latitude IS NOT NULL AND v_event.venue_longitude IS NOT NULL
      THEN jsonb_build_object(
        'geo', jsonb_build_object(
          '@type', 'GeoCoordinates',
          'latitude', v_event.venue_latitude,
          'longitude', v_event.venue_longitude
        )
      )
      ELSE '{}'::jsonb
    END,
    
    -- Imagen (requerido)
    'image', COALESCE(v_event.image_large_url, 'https://feelomove.com/og-image.jpg'),
    
    -- Descripción
    'description', v_event.name || ' en ' || v_event.venue_city || 
                   '. Consigue tus entradas para este evento ' || 
                   COALESCE(LOWER(v_event.primary_subcategory_name), 'musical') || '.',
    
    -- Artista/Performer
    'performer', jsonb_build_object(
      '@type', 'MusicGroup',
      'name', COALESCE(v_event.primary_attraction_name, v_event.name)
    ),
    
    -- Organizador
    'organizer', jsonb_build_object(
      '@type', 'Organization',
      'name', 'FEELOMOVE+',
      'url', 'https://feelomove.com'
    )
  );

  -- Añadir precio si existe
  IF v_event.price_min_incl_fees IS NOT NULL THEN
    v_schema := v_schema || jsonb_build_object(
      'offers', jsonb_build_object(
        '@type', 'Offer',
        'url', 'https://feelomove.com/' || 
               CASE WHEN v_event.event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
               '/' || v_event.slug,
        'price', v_event.price_min_incl_fees,
        'priceCurrency', COALESCE(v_event.currency, 'EUR'),
        'availability', CASE WHEN v_event.sold_out THEN 'https://schema.org/SoldOut' ELSE 'https://schema.org/InStock' END,
        'validFrom', COALESCE(to_char(v_event.on_sale_date, 'YYYY-MM-DD'), to_char(CURRENT_DATE, 'YYYY-MM-DD'))
      )
    );
  ELSE
    v_schema := v_schema || jsonb_build_object(
      'offers', jsonb_build_object(
        '@type', 'AggregateOffer',
        'url', 'https://feelomove.com/' || 
               CASE WHEN v_event.event_type = 'festival' THEN 'festivales' ELSE 'conciertos' END || 
               '/' || v_event.slug,
        'availability', CASE WHEN v_event.sold_out THEN 'https://schema.org/SoldOut' ELSE 'https://schema.org/InStock' END
      )
    );
  END IF;

  RETURN v_schema;
END;
$$;

-- Refresh the materialized view to apply changes
REFRESH MATERIALIZED VIEW mv_events_schema_org;
