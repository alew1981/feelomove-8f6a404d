-- Function to get all homepage data in a single call
CREATE OR REPLACE FUNCTION get_homepage_data(
  p_featured_ids text[] DEFAULT ARRAY['172524182', '35655583', '854574106', '2034594644'],
  p_cities text[] DEFAULT ARRAY['Barcelona', 'Madrid', 'Valencia', 'Sevilla']
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  featured_events jsonb;
  city_events jsonb;
  concerts jsonb;
  festivals jsonb;
  destinations jsonb;
  artists jsonb;
  genres jsonb;
BEGIN
  -- Get featured "Feelomove + love" events
  SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
  INTO featured_events
  FROM (
    SELECT * FROM mv_concerts_cards WHERE id = ANY(p_featured_ids)
    UNION ALL
    SELECT * FROM mv_festivals_cards WHERE id = ANY(p_featured_ids)
  ) e;

  -- Get city events (4 per city)
  SELECT jsonb_object_agg(city, events)
  INTO city_events
  FROM (
    SELECT 
      unnest(p_cities) as city,
      (
        SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
        FROM (
          SELECT * FROM mv_concerts_cards 
          WHERE venue_city ILIKE '%' || unnest || '%'
            AND event_date >= NOW()
          ORDER BY event_date ASC
          LIMIT 4
        ) c
      ) as events
    FROM unnest(p_cities)
  ) city_data;

  -- Get upcoming concerts (limit 4)
  SELECT COALESCE(jsonb_agg(row_to_json(c)), '[]'::jsonb)
  INTO concerts
  FROM (
    SELECT * FROM mv_concerts_cards 
    WHERE event_date >= NOW()
    ORDER BY event_date ASC
    LIMIT 4
  ) c;

  -- Get upcoming festivals (limit 4)
  SELECT COALESCE(jsonb_agg(row_to_json(f)), '[]'::jsonb)
  INTO festivals
  FROM (
    SELECT * FROM mv_festivals_cards 
    WHERE event_date >= NOW()
    ORDER BY event_date ASC
    LIMIT 4
  ) f;

  -- Get top destinations (limit 4)
  SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
  INTO destinations
  FROM (
    SELECT * FROM mv_destinations_cards 
    ORDER BY event_count DESC
    LIMIT 4
  ) d;

  -- Get top artists (limit 4)
  SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
  INTO artists
  FROM (
    SELECT * FROM mv_attractions 
    ORDER BY event_count DESC
    LIMIT 4
  ) a;

  -- Get top genres with sample images (limit 4)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'genre_id', g.genre_id,
      'genre_name', g.genre_name,
      'event_count', g.event_count,
      'sample_image_url', (
        SELECT image_standard_url 
        FROM mv_concerts_cards 
        WHERE genre = g.genre_name 
          AND image_standard_url IS NOT NULL 
        LIMIT 1
      )
    )
  ), '[]'::jsonb)
  INTO genres
  FROM (
    SELECT * FROM mv_genres_cards 
    ORDER BY event_count DESC
    LIMIT 4
  ) g;

  -- Build final result
  result := jsonb_build_object(
    'featured_events', featured_events,
    'city_events', city_events,
    'concerts', concerts,
    'festivals', festivals,
    'destinations', destinations,
    'artists', artists,
    'genres', genres
  );

  RETURN result;
END;
$$;