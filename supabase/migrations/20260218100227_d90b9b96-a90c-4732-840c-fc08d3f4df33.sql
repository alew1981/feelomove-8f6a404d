INSERT INTO tm_translations (spanish_text, english_text, field_type) VALUES
  ('Disponible', 'Available', 'events'),
  ('Venta finalizada', 'Sale Ended', 'events'),
  ('Próximamente a la venta', 'Coming Soon', 'events'),
  ('Entradas a la venta el', 'Tickets on sale on', 'events'),
  ('Página no encontrada', 'Page not found', 'page'),
  ('Buscar', 'Search', 'nav')
ON CONFLICT DO NOTHING;