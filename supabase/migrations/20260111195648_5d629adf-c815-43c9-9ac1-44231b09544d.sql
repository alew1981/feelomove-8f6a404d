-- Simplify lovable_mv_event_product_page_conciertos MATERIALIZED VIEW
-- Remove unused HTML columns (hotels_list_widget_html, map_widget_html)
-- Simplify stay22_map_general from ~130 lines to just the iframe URL

DROP MATERIALIZED VIEW IF EXISTS lovable_mv_event_product_page_conciertos;

CREATE MATERIALIZED VIEW lovable_mv_event_product_page_conciertos AS
SELECT 
    id AS event_id,
    TRIM(BOTH FROM name) AS event_name,
    slug AS event_slug,
    event_date,
    timezone,
    url AS event_url,
    venue_id,
    venue_name,
    venue_city,
    venue_address,
    venue_postal_code,
    venue_country,
    venue_latitude,
    venue_longitude,
    venue_url,
    primary_category_name,
    primary_subcategory_name,
    TRIM(BOTH FROM primary_attraction_name) AS primary_attraction_name,
    primary_attraction_id,
    secondary_attraction_name,
    secondary_attraction_id,
    attraction_ids,
    attraction_names,
    image_large_url,
    image_standard_url,
    cancelled,
    sold_out,
    rescheduled,
    schedule_status,
    seats_available,
    has_real_availability,
    is_transport,
    is_package,
    ticket_types,
    currency AS event_currency,
    price_min_incl_fees,
    -- Ticket price minimum calculation
    COALESCE(price_min_incl_fees, (
        SELECT MIN((elem.value ->> 'total')::numeric)
        FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
        ) elem
        WHERE (elem.value ->> 'total') IS NOT NULL 
        AND (elem.value ->> 'availability') <> 'none'
    )) AS ticket_price_min,
    -- Has VIP tickets
    (EXISTS (
        SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
        ) t
        WHERE (t.value ->> 'name') ILIKE '%vip%' OR (t.value ->> 'name') ILIKE '%platinum%'
    )) AS has_vip_tickets,
    -- Low availability
    (EXISTS (
        SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
        ) t
        WHERE (t.value ->> 'availability') = 'limited'
    )) AS low_availability,
    event_type,
    -- Date calculations
    EXTRACT(day FROM event_date - CURRENT_DATE::timestamp with time zone)::integer AS days_until_event,
    EXTRACT(day FROM event_date - CURRENT_DATE::timestamp with time zone) <= 7 AS is_last_minute,
    EXTRACT(day FROM event_date - CURRENT_DATE::timestamp with time zone) <= 30 AS is_coming_soon,
    day_of_week,
    CASE EXTRACT(dow FROM event_date)
        WHEN 0 THEN 'Domingo'
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END AS event_day_name_es,
    CASE EXTRACT(month FROM event_date)
        WHEN 1 THEN 'Enero'
        WHEN 2 THEN 'Febrero'
        WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Mayo'
        WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre'
        WHEN 11 THEN 'Noviembre'
        WHEN 12 THEN 'Diciembre'
    END AS event_month_name_es,
    EXTRACT(year FROM event_date)::integer AS event_year,
    EXTRACT(dow FROM event_date) = ANY (ARRAY[0::numeric, 6::numeric]) AS is_weekend,
    CASE
        WHEN EXTRACT(month FROM event_date) = 12 THEN 'navidad'
        WHEN EXTRACT(month FROM event_date) IN (1, 2) THEN 'invierno'
        WHEN EXTRACT(month FROM event_date) IN (3, 4, 5) THEN 'primavera'
        WHEN EXTRACT(month FROM event_date) IN (6, 7, 8) THEN 'verano'
        WHEN EXTRACT(month FROM event_date) IN (9, 10, 11) THEN 'otoño'
    END AS event_season,
    created_at,
    updated_at,
    on_sale_date,
    off_sale_date,
    minimum_age_required,
    -- SEO fields
    name || ' en ' || venue_city || ' | Entradas desde €' || COALESCE(price_min_incl_fees::text, 'XX') || ' - ' || EXTRACT(year FROM event_date) AS seo_title,
    name || ' en ' || venue_city || ' el ' || to_char(event_date, 'DD/MM/YYYY') || '. ¡Compra tus entradas desde €' || COALESCE(price_min_incl_fees::text, 'XX') || ' y no te lo pierdas!' AS meta_description,
    ARRAY[
        generate_seo_slug(name),
        generate_seo_slug(primary_attraction_name),
        generate_seo_slug('entradas ' || name)
    ] AS seo_keywords,
    -- Destination deeplink
    (SELECT 
        CASE WHEN cm.place_id IS NOT NULL THEN
            'https://feelomove.nuitee.link/hotels?placeId=' || cm.place_id ||
            '&checkin=' || e.event_date::date ||
            '&checkout=' || (e.event_date::date + '1 day'::interval)::date ||
            '&occupancies=' || encode(convert_to('[{"adults":2}]', 'UTF8'), 'base64') ||
            '&language=es&currency=EUR'
        ELSE NULL END
    FROM lite_tbl_city_mapping cm
    WHERE cm.ticketmaster_city = e.venue_city
    LIMIT 1) AS destination_deeplink,
    
    -- SIMPLIFIED: stay22_map_general - Just the iframe src URL (frontend renders the iframe)
    'https://www.stay22.com/embed/gm?aid=alewgarcias' ||
    '&campaign=' || lower(replace(replace(COALESCE(TRIM(BOTH FROM primary_attraction_name), TRIM(BOTH FROM name)), ' ', '_'), 'á', 'a')) || 
    '_' || lower(replace(venue_city, ' ', '_')) || 
    '_' || EXTRACT(year FROM event_date) ||
    '&lat=' || COALESCE(venue_latitude::text, '0') ||
    '&lng=' || COALESCE(venue_longitude::text, '0') ||
    '&checkin=' || event_date::date ||
    '&checkout=' || (event_date::date + '1 day'::interval)::date ||
    '&venue=' || replace(venue_name, ' ', '+') ||
    '&maincolor=00ff59&fontcolor=000000&navbarcolor=000000&priceslidercolor=00ff59&loadingbarcolor=00ff59' ||
    '&markerimage=' || COALESCE(replace(image_standard_url, ' ', '%20'), replace(image_large_url, ' ', '%20'), '') ||
    '&chpincolor=00ff59&chpinfontcolor=000000&ljs=es&currency=EUR&adults=2&rooms=1' ||
    '&showhotels=true&showairbnbs=true&zoom=12&scroll=enabled&minguestrating=3.5' ||
    '&hidecurrency=true&hidelanguage=true&customfont=Inter' ||
    '&customfontlink=https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'
    AS stay22_map_general,
    
    -- Hotel aggregated data (unchanged)
    (SELECT jsonb_agg(jsonb_build_object(
        'hotel_id', hp.hotel_id,
        'hotel_slug', h.slug,
        'name', h.name,
        'city', h.city,
        'address', h.address,
        'stars', h.stars,
        'rating', h.rating,
        'review_count', h.review_count,
        'hotel_description', h.hotel_description,
        'main_photo', h.main_photo,
        'thumbnail', h.thumbnail,
        'min_price', hp.min_price,
        'ssp_price', hp.suggested_selling_price,
        'currency', hp.currency,
        'checkin_date', hp.checkin_date,
        'checkout_date', hp.checkout_date,
        'nights', hp.nights,
        'is_available', hp.is_available,
        'facility_names_es', h.facility_names_es,
        'facility_count', CASE WHEN h.facility_names_es IS NOT NULL THEN array_length(h.facility_names_es, 1) ELSE 0 END,
        'latitude', h.latitude,
        'longitude', h.longitude,
        'distance_meters', CASE 
            WHEN e.venue_latitude IS NOT NULL AND e.venue_longitude IS NOT NULL AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL 
            THEN earth_distance(ll_to_earth(e.venue_latitude::double precision, e.venue_longitude::double precision), ll_to_earth(h.latitude::double precision, h.longitude::double precision))::integer
            ELSE NULL 
        END,
        'checkin_time', h.checkin_time,
        'checkout_time', h.checkout_time
    ) ORDER BY hp.min_price)
    FROM lite_tbl_event_hotel_prices hp
    LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
    WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true
    ) AS hotels_prices_aggregated_jsonb,
    
    -- Hotel stats (unchanged)
    (SELECT count(*) FROM lite_tbl_event_hotel_prices hp
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true) AS total_hotels_available,
    
    (SELECT min(hp.min_price) FROM lite_tbl_event_hotel_prices hp
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND hp.min_price IS NOT NULL) AS min_hotel_price,
    
    (SELECT avg(CASE 
        WHEN e.venue_latitude IS NOT NULL AND e.venue_longitude IS NOT NULL AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL 
        THEN earth_distance(ll_to_earth(e.venue_latitude::double precision, e.venue_longitude::double precision), ll_to_earth(h.latitude::double precision, h.longitude::double precision))
        ELSE NULL 
    END)::integer
    FROM lite_tbl_event_hotel_prices hp
    LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
    WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true) AS avg_hotel_distance_meters,
    
    (SELECT count(*) FROM lite_tbl_event_hotel_prices hp
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND h.rating >= 8.5) AS hotels_with_high_rating,
    
    (SELECT count(*) > 0 FROM lite_tbl_event_hotel_prices hp
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND h.stars = 5) AS has_5_star_hotels

FROM tm_tbl_events e
WHERE event_type = 'concert' AND NOT cancelled AND NOT is_transport;

-- Create index for performance
CREATE UNIQUE INDEX idx_mv_conciertos_event_id ON lovable_mv_event_product_page_conciertos (event_id);
CREATE INDEX idx_mv_conciertos_event_slug ON lovable_mv_event_product_page_conciertos (event_slug);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW lovable_mv_event_product_page_conciertos;