
-- Corregir eventos VIP adicionales de Bad Bunny
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-barcelona-23-mayo-2026' WHERE id = '338486201';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-31-mayo-2026' WHERE id = '1847087954';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-2-junio-2026' WHERE id = '307419660';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-3-junio-2026' WHERE id = '1787182539';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-6-junio-2026' WHERE id = '1799691883';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-7-junio-2026' WHERE id = '1307503495';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-10-junio-2026' WHERE id = '235340041';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-11-junio-2026' WHERE id = '1077929915';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-14-junio-2026' WHERE id = '1560608596';
UPDATE tm_tbl_events SET slug = 'vip-bad-bunny-madrid-15-junio-2026' WHERE id = '1050194662';

-- Añadir redirecciones para estos VIP
INSERT INTO slug_redirects (old_slug, new_slug, event_id) VALUES
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-barcelona-1', 'vip-bad-bunny-barcelona-23-mayo-2026', '338486201'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-1', 'vip-bad-bunny-madrid-31-mayo-2026', '1847087954'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-2', 'vip-bad-bunny-madrid-2-junio-2026', '307419660'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-3', 'vip-bad-bunny-madrid-3-junio-2026', '1787182539'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-4', 'vip-bad-bunny-madrid-6-junio-2026', '1799691883'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-5', 'vip-bad-bunny-madrid-7-junio-2026', '1307503495'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-6', 'vip-bad-bunny-madrid-10-junio-2026', '235340041'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-7', 'vip-bad-bunny-madrid-11-junio-2026', '1077929915'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-8', 'vip-bad-bunny-madrid-14-junio-2026', '1560608596'),
  ('bad-bunny-debi-tirar-mas-fotos-world-tour-paquetes-vip-madrid-9', 'vip-bad-bunny-madrid-15-junio-2026', '1050194662')
ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug, event_id = EXCLUDED.event_id;
