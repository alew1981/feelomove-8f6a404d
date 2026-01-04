-- Enable RLS on tables that are missing it

-- lite_tbl_genres
ALTER TABLE public.lite_tbl_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_access" ON public.lite_tbl_genres
FOR SELECT USING (true);

CREATE POLICY "service_role_full_access" ON public.lite_tbl_genres
FOR ALL USING (true) WITH CHECK (true);

-- tm_tbl_festival_details
ALTER TABLE public.tm_tbl_festival_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_access" ON public.tm_tbl_festival_details
FOR SELECT USING (true);

CREATE POLICY "service_role_full_access" ON public.tm_tbl_festival_details
FOR ALL USING (true) WITH CHECK (true);

-- total_events
ALTER TABLE public.total_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_access" ON public.total_events
FOR SELECT USING (true);

CREATE POLICY "service_role_full_access" ON public.total_events
FOR ALL USING (true) WITH CHECK (true);

-- Create function to get all URLs for sitemap/SEO purposes
CREATE OR REPLACE FUNCTION public.get_all_site_urls()
RETURNS TABLE (
    url_type text,
    url text,
    last_modified timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Static pages
    SELECT 
        'page'::text as url_type,
        page_url as url,
        now() as last_modified
    FROM (VALUES 
        ('/'),
        ('/festivales'),
        ('/conciertos'),
        ('/destinos'),
        ('/artistas'),
        ('/musica'),
        ('/favoritos'),
        ('/sobre-nosotros')
    ) AS pages(page_url)
    
    UNION ALL
    
    -- Concert URLs from mv_concerts_cards
    SELECT 
        'concierto'::text as url_type,
        '/concierto/' || slug as url,
        now() as last_modified
    FROM mv_concerts_cards
    WHERE slug IS NOT NULL
    
    UNION ALL
    
    -- Festival URLs from mv_festivals_cards
    SELECT 
        'festival'::text as url_type,
        '/festival/' || slug as url,
        now() as last_modified
    FROM mv_festivals_cards
    WHERE slug IS NOT NULL
    
    UNION ALL
    
    -- Artist URLs from mv_attractions
    SELECT 
        'artista'::text as url_type,
        '/artista/' || attraction_slug as url,
        now() as last_modified
    FROM mv_attractions
    WHERE attraction_slug IS NOT NULL
    
    UNION ALL
    
    -- Destination URLs from mv_destinations_cards
    SELECT 
        'destino'::text as url_type,
        '/destino/' || city_slug as url,
        now() as last_modified
    FROM mv_destinations_cards
    WHERE city_slug IS NOT NULL
    
    UNION ALL
    
    -- Genre URLs from mv_genres_cards
    SELECT 
        'genero'::text as url_type,
        '/genero/' || LOWER(REPLACE(REPLACE(genre_name, ' ', '-'), '&', 'and')) as url,
        now() as last_modified
    FROM mv_genres_cards
    WHERE genre_name IS NOT NULL
    
    ORDER BY url_type, url;
$$;