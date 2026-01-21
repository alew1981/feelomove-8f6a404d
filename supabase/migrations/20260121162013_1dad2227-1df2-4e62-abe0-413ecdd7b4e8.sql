-- Function to generate slug-friendly text (remove accents, special chars)
CREATE OR REPLACE FUNCTION public.slugify(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(text_input);
  result := translate(result, 
    'áàâäãåāéèêëēíìîïīóòôöõōúùûüūñç',
    'aaaaaaaeeeeeiiiiioooooouuuuunc');
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := trim(both '-' from result);
  result := regexp_replace(result, '-+', '-', 'g');
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Spanish month names for slugs
CREATE OR REPLACE FUNCTION public.get_spanish_month_name(month_num INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE month_num
    WHEN 1 THEN 'enero'
    WHEN 2 THEN 'febrero'
    WHEN 3 THEN 'marzo'
    WHEN 4 THEN 'abril'
    WHEN 5 THEN 'mayo'
    WHEN 6 THEN 'junio'
    WHEN 7 THEN 'julio'
    WHEN 8 THEN 'agosto'
    WHEN 9 THEN 'septiembre'
    WHEN 10 THEN 'octubre'
    WHEN 11 THEN 'noviembre'
    WHEN 12 THEN 'diciembre'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to generate new concert slugs
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
  
  IF p_event_name ~* 'paquetes?\s*vip|vip\s*package' THEN
    variant_suffix := '-vip';
  ELSIF p_event_name ~* 'meet\s*&?\s*greet|upgrade' THEN
    variant_suffix := '-upgrade';
  ELSIF p_event_name ~* 'pack' AND p_event_name !~* 'linkin park' THEN
    variant_suffix := '-pack';
  END IF;
  
  final_slug := base_slug || '-' || city_slug || '-' || date_part || variant_suffix;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;