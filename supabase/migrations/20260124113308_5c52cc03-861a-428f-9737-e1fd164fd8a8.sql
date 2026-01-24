
-- Actualizar slugs de parking Bad Bunny
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-30-mayo-2026' WHERE id = '602424274';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-31-mayo-2026' WHERE id = '1442512508';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-2-junio-2026' WHERE id = '824078800';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-3-junio-2026' WHERE id = '1888856540';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-6-junio-2026' WHERE id = '676046362';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-7-junio-2026' WHERE id = '1907662258';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-10-junio-2026' WHERE id = '1214172267';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-11-junio-2026' WHERE id = '1264661970';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-14-junio-2026' WHERE id = '346539480';
UPDATE tm_tbl_events SET slug = 'parking-bad-bunny-madrid-15-junio-2026' WHERE id = '34711555';

-- Insertar redirecciones para URLs legacy de Bad Bunny
INSERT INTO slug_redirects (old_slug, new_slug, event_id) VALUES
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-barcelona', 'bad-bunny-barcelona-22-mayo-2026', '653666176'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-barcelona-1', 'bad-bunny-barcelona-23-mayo-2026', '1116290311'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid', 'bad-bunny-madrid-30-mayo-2026', '417009905'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-1', 'bad-bunny-madrid-31-mayo-2026', '1848567714'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-2', 'bad-bunny-madrid-2-junio-2026', '1589736692'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-3', 'bad-bunny-madrid-3-junio-2026', '961888291'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-4', 'bad-bunny-madrid-6-junio-2026', '1852247887'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-5', 'bad-bunny-madrid-7-junio-2026', '1341715816'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-6', 'bad-bunny-madrid-10-junio-2026', '412370092'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-7', 'bad-bunny-madrid-11-junio-2026', '2035589996'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-8', 'bad-bunny-madrid-14-junio-2026', '1378879656'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-madrid-9', 'bad-bunny-madrid-15-junio-2026', '1566404077'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-barcelona', 'vip-bad-bunny-barcelona-22-mayo-2026', '579652547'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid', 'vip-bad-bunny-madrid-30-mayo-2026', '1875547694'),
  ('bad-bunny-barcelona', 'bad-bunny-barcelona-22-mayo-2026', '653666176'),
  ('bad-bunny-madrid', 'bad-bunny-madrid-30-mayo-2026', '417009905')
ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug, event_id = EXCLUDED.event_id;
