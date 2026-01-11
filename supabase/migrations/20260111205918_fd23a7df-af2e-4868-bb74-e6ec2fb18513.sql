-- Drop and recreate lovable_mv_event_product_page_festivales with simplified columns
-- Remove: hotels_list_widget_html, map_widget_html
-- Add: stay22_map_general (simplified URL like in concerts view)

DROP MATERIALIZED VIEW IF EXISTS lovable_mv_event_product_page_festivales;

CREATE MATERIALIZED VIEW lovable_mv_event_product_page_festivales AS
SELECT 
    e.id AS event_id,
    TRIM(BOTH FROM e.name) AS event_name,
    e.slug AS event_slug,
    e.event_date,
    e.timezone,
    e.url AS event_url,
    e.venue_id,
    e.venue_name,
    e.venue_city,
    e.venue_address,
    e.venue_postal_code,
    e.venue_country,
    e.venue_latitude,
    e.venue_longitude,
    e.venue_url,
    e.primary_category_name,
    e.primary_subcategory_name,
    TRIM(BOTH FROM e.primary_attraction_name) AS primary_attraction_name,
    e.primary_attraction_id,
    e.secondary_attraction_name,
    e.secondary_attraction_id,
    e.attraction_ids,
    e.attraction_names,
    e.image_large_url,
    e.image_standard_url,
    e.cancelled,
    e.sold_out,
    e.rescheduled,
    e.schedule_status,
    e.seats_available,
    e.has_real_availability,
    e.is_transport,
    e.is_package,
    e.ticket_types,
    e.currency AS event_currency,
    e.price_min_incl_fees,
    COALESCE(
        e.price_min_incl_fees,
        (SELECT MIN((elem->>'total')::numeric) 
         FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
         ) AS elem 
         WHERE elem->>'total' IS NOT NULL AND elem->>'availability' <> 'none')
    ) AS ticket_price_min,
    EXISTS (
        SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
        ) AS t WHERE t->>'name' ILIKE '%vip%' OR t->>'name' ILIKE '%platinum%'
    ) AS has_vip_tickets,
    EXISTS (
        SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
        ) AS t WHERE t->>'availability' = 'limited'
    ) AS low_availability,
    e.event_type,
    EXTRACT(DAY FROM e.event_date - CURRENT_DATE)::integer AS days_until_event,
    EXTRACT(DAY FROM e.event_date - CURRENT_DATE) <= 7 AS is_last_minute,
    EXTRACT(DAY FROM e.event_date - CURRENT_DATE) <= 30 AS is_coming_soon,
    e.day_of_week,
    CASE EXTRACT(DOW FROM e.event_date)
        WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles' WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
    END AS event_day_name_es,
    CASE EXTRACT(MONTH FROM e.event_date)
        WHEN 1 THEN 'Enero' WHEN 2 THEN 'Febrero' WHEN 3 THEN 'Marzo'
        WHEN 4 THEN 'Abril' WHEN 5 THEN 'Mayo' WHEN 6 THEN 'Junio'
        WHEN 7 THEN 'Julio' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Septiembre'
        WHEN 10 THEN 'Octubre' WHEN 11 THEN 'Noviembre' WHEN 12 THEN 'Diciembre'
    END AS event_month_name_es,
    EXTRACT(YEAR FROM e.event_date)::integer AS event_year,
    EXTRACT(DOW FROM e.event_date) IN (0, 6) AS is_weekend,
    CASE
        WHEN EXTRACT(MONTH FROM e.event_date) = 12 THEN 'navidad'
        WHEN EXTRACT(MONTH FROM e.event_date) IN (1, 2) THEN 'invierno'
        WHEN EXTRACT(MONTH FROM e.event_date) IN (3, 4, 5) THEN 'primavera'
        WHEN EXTRACT(MONTH FROM e.event_date) IN (6, 7, 8) THEN 'verano'
        WHEN EXTRACT(MONTH FROM e.event_date) IN (9, 10, 11) THEN 'otoño'
    END AS event_season,
    e.created_at,
    e.updated_at,
    e.on_sale_date,
    e.off_sale_date,
    e.minimum_age_required,
    -- SEO fields
    e.name || ' en ' || e.venue_city || ' | Entradas desde €' || COALESCE(e.price_min_incl_fees::text, 'XX') || ' - ' || EXTRACT(YEAR FROM e.event_date) AS seo_title,
    e.name || ' en ' || e.venue_city || ' el ' || to_char(e.event_date, 'DD/MM/YYYY') || '. ¡Compra tus entradas desde €' || COALESCE(e.price_min_incl_fees::text, 'XX') || ' y no te lo pierdas!' AS meta_description,
    ARRAY[generate_seo_slug(e.name), generate_seo_slug(e.primary_attraction_name), generate_seo_slug('entradas ' || e.name)] AS seo_keywords,
    -- Destination deeplink
    (SELECT CASE 
        WHEN cm.place_id IS NOT NULL THEN 
            'https://feelomove.nuitee.link/hotels?placeId=' || cm.place_id ||
            '&checkin=' || e.event_date::date ||
            '&checkout=' || (e.event_date::date + INTERVAL '1 day')::date ||
            '&occupancies=' || encode(convert_to('[{"adults":2}]', 'UTF8'), 'base64') ||
            '&language=es&currency=EUR'
        ELSE NULL 
    END FROM lite_tbl_city_mapping cm WHERE cm.ticketmaster_city = e.venue_city LIMIT 1) AS destination_deeplink,
    -- Stay22 Map URL (simplified - just the iframe src URL)
    (SELECT CASE 
        WHEN e.venue_latitude IS NOT NULL AND e.venue_longitude IS NOT NULL THEN
            'https://www.stay22.com/embed/gm?lat=' || e.venue_latitude ||
            '&lng=' || e.venue_longitude ||
            '&checkin=' || e.event_date::date ||
            '&checkout=' || (e.event_date::date + INTERVAL '1 day')::date ||
            '&adults=2&children=0' ||
            '&maincolor=00FF8F&markertype=dot&zoom=14&aid=feelomove'
        ELSE NULL
    END) AS stay22_map_general,
    -- Hotels aggregated data
    (SELECT jsonb_agg(
        jsonb_build_object(
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
                THEN earth_distance(ll_to_earth(e.venue_latitude::float, e.venue_longitude::float), ll_to_earth(h.latitude::float, h.longitude::float))::integer
                ELSE NULL 
            END,
            'checkin_time', h.checkin_time,
            'checkout_time', h.checkout_time
        ) ORDER BY hp.min_price
    ) FROM lite_tbl_event_hotel_prices hp
    LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id
    WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true) AS hotels_prices_aggregated_jsonb,
    -- Hotel stats
    (SELECT COUNT(*) FROM lite_tbl_event_hotel_prices hp 
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id 
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true) AS total_hotels_available,
    (SELECT MIN(hp.min_price) FROM lite_tbl_event_hotel_prices hp 
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id 
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND hp.min_price IS NOT NULL) AS min_hotel_price,
    (SELECT AVG(CASE 
        WHEN e.venue_latitude IS NOT NULL AND e.venue_longitude IS NOT NULL AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL 
        THEN earth_distance(ll_to_earth(e.venue_latitude::float, e.venue_longitude::float), ll_to_earth(h.latitude::float, h.longitude::float))
        ELSE NULL 
    END)::integer FROM lite_tbl_event_hotel_prices hp 
    LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id 
    WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true) AS avg_hotel_distance_meters,
    (SELECT COUNT(*) FROM lite_tbl_event_hotel_prices hp 
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id 
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND h.rating >= 8.5) AS hotels_with_high_rating,
    (SELECT COUNT(*) > 0 FROM lite_tbl_event_hotel_prices hp 
     LEFT JOIN lite_tbl_hotels h ON hp.hotel_id = h.id 
     WHERE hp.event_id = e.id AND h.deleted_at IS NULL AND h.active = true AND h.stars = 5) AS has_5_star_hotels,
    -- Festival-specific fields
    COALESCE(fd.start_date, e.event_date::date) AS festival_start_date,
    COALESCE(fd.end_date, e.event_date::date) AS festival_end_date,
    COALESCE(fd.end_date, e.event_date::date) - COALESCE(fd.start_date, e.event_date::date) + 1 AS festival_duration_days,
    COALESCE(fd.lineup_artists, e.attraction_names) AS festival_lineup_artists,
    COALESCE(fd.lineup_artist_ids, e.attraction_ids) AS festival_lineup_artist_ids,
    fd.headliners AS festival_headliners,
    array_length(COALESCE(fd.lineup_artists, e.attraction_names), 1) AS festival_total_artists,
    fd.festival_stages,
    array_length(fd.festival_stages, 1) AS festival_total_stages,
    fd.transport_event_ids AS festival_transport_event_ids,
    fd.has_official_transport AS festival_has_official_transport,
    (SELECT COUNT(*) FROM tm_tbl_events t WHERE t.id = ANY(fd.transport_event_ids) AND NOT t.cancelled) AS festival_available_transport_options,
    fd.camping_available AS festival_camping_available,
    -- Festival ticket type detection
    EXISTS (SELECT 1 FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
    ) AS t WHERE t->>'name' ILIKE '%abono%' OR t->>'code' ILIKE '%ABO%') AS has_festival_pass,
    EXISTS (SELECT 1 FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
    ) AS t WHERE t->>'name' ILIKE '%día%' OR t->>'name' ILIKE '%day%' OR t->>'code' ILIKE '%D%') AS has_daily_tickets,
    EXISTS (SELECT 1 FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
    ) AS t WHERE t->>'name' ILIKE '%camping%' OR t->>'name' ILIKE '%acampada%') AS has_camping_tickets,
    EXISTS (SELECT 1 FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(e.ticket_types) = 'array' THEN e.ticket_types ELSE '[]'::jsonb END
    ) AS t WHERE t->>'name' ILIKE '%parking%' OR t->>'name' ILIKE '%aparcamiento%') AS has_parking_tickets,
    fd.manually_edited AS festival_manually_edited,
    fd.last_manual_edit_at AS festival_last_manual_edit_at
FROM tm_tbl_events e
LEFT JOIN tm_tbl_festival_details fd ON e.id = fd.festival_event_id
WHERE e.event_type = 'festival' AND NOT e.cancelled AND NOT e.is_transport;

-- Create indexes for fast lookups
CREATE UNIQUE INDEX idx_festivales_event_id ON lovable_mv_event_product_page_festivales (event_id);
CREATE INDEX idx_festivales_event_slug ON lovable_mv_event_product_page_festivales (event_slug);
CREATE INDEX idx_festivales_event_date ON lovable_mv_event_product_page_festivales (event_date);

-- Refresh the view
REFRESH MATERIALIZED VIEW lovable_mv_event_product_page_festivales;