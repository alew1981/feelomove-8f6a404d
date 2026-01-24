-- 1. Actualizar slugs en tm_tbl_events al formato SEO correcto con fecha española
UPDATE tm_tbl_events SET slug = 'morat-barcelona-16-octubre-2026' WHERE id = '985932005';
UPDATE tm_tbl_events SET slug = 'morat-barcelona-17-octubre-2026' WHERE id = '659122207';
UPDATE tm_tbl_events SET slug = 'morat-pamplona-iruna-21-octubre-2026' WHERE id = '1811980147';
UPDATE tm_tbl_events SET slug = 'morat-valencia-23-octubre-2026' WHERE id = '1856771310';
UPDATE tm_tbl_events SET slug = 'morat-sevilla-25-octubre-2026' WHERE id = '694038250';
UPDATE tm_tbl_events SET slug = 'morat-madrid-27-octubre-2026' WHERE id = '795138495';
UPDATE tm_tbl_events SET slug = 'morat-madrid-28-octubre-2026' WHERE id = '1423899329';
UPDATE tm_tbl_events SET slug = 'morat-madrid-30-octubre-2026' WHERE id = '944130086';
UPDATE tm_tbl_events SET slug = 'morat-madrid-31-octubre-2026' WHERE id = '446952508';

-- 2. Eliminar redirecciones antiguas incorrectas de Morat
DELETE FROM slug_redirects WHERE old_slug ILIKE '%morat%';

-- 3. Insertar redirecciones correctas desde los slugs antiguos a los nuevos
INSERT INTO slug_redirects (old_slug, new_slug, event_id) VALUES
  ('morat-barcelona', 'morat-barcelona-16-octubre-2026', '985932005'),
  ('morat-barcelona-1', 'morat-barcelona-17-octubre-2026', '659122207'),
  ('morat-barcelona-2', 'morat-barcelona-17-octubre-2026', '659122207'),
  ('morat-pamplona-iruna', 'morat-pamplona-iruna-21-octubre-2026', '1811980147'),
  ('morat-pamplona-iruna-2026', 'morat-pamplona-iruna-21-octubre-2026', '1811980147'),
  ('morat-valencia', 'morat-valencia-23-octubre-2026', '1856771310'),
  ('morat-valencia-2026', 'morat-valencia-23-octubre-2026', '1856771310'),
  ('morat-sevilla', 'morat-sevilla-25-octubre-2026', '694038250'),
  ('morat-sevilla-2026', 'morat-sevilla-25-octubre-2026', '694038250'),
  ('morat-madrid', 'morat-madrid-27-octubre-2026', '795138495'),
  ('morat-madrid-1', 'morat-madrid-28-octubre-2026', '1423899329'),
  ('morat-madrid-2', 'morat-madrid-30-octubre-2026', '944130086'),
  ('morat-madrid-3', 'morat-madrid-31-octubre-2026', '446952508'),
  ('morat-madrid-4', 'morat-madrid-31-octubre-2026', '446952508'),
  ('morat-madrid-2026', 'morat-madrid-27-octubre-2026', '795138495')
ON CONFLICT (old_slug) DO UPDATE SET 
  new_slug = EXCLUDED.new_slug,
  event_id = EXCLUDED.event_id;