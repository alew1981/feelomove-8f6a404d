INSERT INTO tm_translations (spanish_text, english_text, field_type) VALUES
  ('A la venta', 'On sale', 'ui'),
  ('LUNES', 'MONDAY', 'ui'),
  ('MARTES', 'TUESDAY', 'ui'),
  ('MIÉRCOLES', 'WEDNESDAY', 'ui'),
  ('JUEVES', 'THURSDAY', 'ui'),
  ('VIERNES', 'FRIDAY', 'ui'),
  ('SÁBADO', 'SATURDAY', 'ui'),
  ('DOMINGO', 'SUNDAY', 'ui')
ON CONFLICT (spanish_text) DO UPDATE SET english_text = EXCLUDED.english_text;