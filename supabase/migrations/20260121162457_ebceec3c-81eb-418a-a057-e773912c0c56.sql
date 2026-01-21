-- Improved function to handle parking/transport events and duplicates
CREATE OR REPLACE FUNCTION public.generate_concert_slug(
  p_artist_name TEXT,
  p_city TEXT,
  p_event_date TIMESTAMPTZ,
  p_event_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  city_slug TEXT;
  date_part TEXT;
  variant_suffix TEXT := '';
  final_slug TEXT;
BEGIN
  base_slug := public.slugify(p_artist_name);
  city_slug := public.slugify(p_city);
  city_slug := regexp_replace(city_slug, '-de-la-frontera$', '', 'i');
  city_slug := regexp_replace(city_slug, '-de-llobregat$', '', 'i');
  city_slug := regexp_replace(city_slug, '-vaciamadrid$', '', 'i');
  
  date_part := EXTRACT(DAY FROM p_event_date)::TEXT || '-' ||
               public.get_spanish_month_name(EXTRACT(MONTH FROM p_event_date)::INTEGER) || '-' ||
               EXTRACT(YEAR FROM p_event_date)::TEXT;
  
  -- Detect variants based on event name
  IF p_event_name ~* 'plaza\s*de\s*parking' THEN
    variant_suffix := '-parking';
  ELSIF p_event_name ~* 'paquetes?\s*vip|vip\s*package' THEN
    variant_suffix := '-vip';
  ELSIF p_event_name ~* 'meet\s*&?\s*greet|upgrade' THEN
    variant_suffix := '-upgrade';
  ELSIF p_event_name ~* 'pack' AND p_event_name !~* 'linkin park' THEN
    variant_suffix := '-pack';
  ELSIF p_event_name ~* 'the\s*wall' THEN
    variant_suffix := '-the-wall';
  ELSIF p_event_name ~* 'dark\s*side' THEN
    variant_suffix := '-dark-side';
  ELSIF p_event_name ~* 'hans\s*zimmer' THEN
    variant_suffix := '-hans-zimmer';
  ELSIF p_event_name ~* 'harry\s*potter' THEN
    variant_suffix := '-harry-potter';
  ELSIF p_event_name ~* 'lord.*rings|hobbit|rings.*power' THEN
    variant_suffix := '-lotr';
  ELSIF p_event_name ~* 'zero\s*frontier.*vip' THEN
    variant_suffix := '-vip';
  END IF;
  
  final_slug := base_slug || '-' || city_slug || '-' || date_part || variant_suffix;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public