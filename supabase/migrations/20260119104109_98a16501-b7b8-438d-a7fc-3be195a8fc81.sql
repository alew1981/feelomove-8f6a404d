-- Ensure 'Latino' genre exists in lite_tbl_genres so mv_genres_cards can pick up its image
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.lite_tbl_genres WHERE genre_name = 'Latino') THEN
    INSERT INTO public.lite_tbl_genres (genre_id, genre_name, image_genres, is_active)
    VALUES (
      900001,
      'Latino',
      -- Temporary: reuse an existing genre image from Storage until a dedicated Latino image is uploaded
      'https://wcyjuytpxxqailtixept.supabase.co/storage/v1/object/sign/Generos/world.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wZDZlYWM3Mi05NWIwLTQ2MDItYTZiNC01NWRmY2U1YmUyMWIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJHZW5lcm9zL3dvcmxkLmpwZyIsImlhdCI6MTc2NTg4NjQwOCwiZXhwIjoxNzk3NDIyNDA4fQ.d_WNdfAS3PGVb59oyezVR7-QZMm2hQBnAY1HM9nuR2k',
      true
    );
  END IF;
END $$;

-- Note: refresh_genres_view() is a trigger function (cannot be called directly).
-- The insert above will fire your AFTER INSERT trigger and refresh the view automatically.