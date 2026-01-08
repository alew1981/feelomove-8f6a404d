-- Fix search_path for application-specific functions

-- calculate_event_badges
ALTER FUNCTION public.calculate_event_badges(
    p_event_type text, p_venue_city text, p_primary_subcategory_name text, 
    p_primary_attraction_name text, p_cancelled boolean, p_rescheduled boolean, 
    p_sold_out boolean, p_seats_available boolean, p_event_date timestamp with time zone, 
    p_minimum_age_required integer, p_is_package boolean, p_seatmap_interactive_detailed boolean, 
    p_seatmap_static boolean, p_price_min_incl_fees numeric, p_price_max_incl_fees numeric, 
    p_day_of_week text
) SET search_path = public;

-- calculate_hotel_nights
ALTER FUNCTION public.calculate_hotel_nights(event_date timestamp with time zone) 
SET search_path = public;

-- calculate_real_availability
ALTER FUNCTION public.calculate_real_availability(ticket_data jsonb, fallback_available boolean) 
SET search_path = public;

-- generate_event_schema_org
ALTER FUNCTION public.generate_event_schema_org(p_event_id text) 
SET search_path = public;

-- generate_seo_slug
ALTER FUNCTION public.generate_seo_slug(text_input text) 
SET search_path = public;

-- get_all_site_urls
ALTER FUNCTION public.get_all_site_urls() 
SET search_path = public;

-- get_event_badges
ALTER FUNCTION public.get_event_badges(event_id text) 
SET search_path = public;

-- get_facility_names_es
ALTER FUNCTION public.get_facility_names_es(facility_id_array integer[]) 
SET search_path = public;

-- get_homepage_data
ALTER FUNCTION public.get_homepage_data(p_featured_ids text[], p_cities text[]) 
SET search_path = public;

-- get_nearest_hotels (correct argument order)
ALTER FUNCTION public.get_nearest_hotels(p_city text, p_event_lat numeric, p_event_lng numeric, p_limit integer) 
SET search_path = public;

-- refresh_all_event_views
ALTER FUNCTION public.refresh_all_event_views() 
SET search_path = public;

-- refresh_events_cards
ALTER FUNCTION public.refresh_events_cards() 
SET search_path = public;

-- refresh_hotel_packages_view
ALTER FUNCTION public.refresh_hotel_packages_view() 
SET search_path = public;

-- refresh_product_page_view
ALTER FUNCTION public.refresh_product_page_view() 
SET search_path = public;