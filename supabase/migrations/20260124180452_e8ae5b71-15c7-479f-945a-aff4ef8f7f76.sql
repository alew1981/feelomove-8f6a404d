-- =====================================================
-- FIX: Sting Granada slug + Cáceres destination
-- =====================================================

-- PARTE 1: Actualizar slug de Sting Granada al formato correcto
UPDATE tm_tbl_events 
SET slug = 'sting-granada-15-julio-2026',
    updated_at = NOW()
WHERE id = '257761979';

-- Actualizar redirect existente para apuntar al nuevo slug
UPDATE slug_redirects 
SET new_slug = 'sting-granada-15-julio-2026'
WHERE old_slug = 'sting-granada';

-- Añadir redirect para el slug intermedio incorrecto
INSERT INTO slug_redirects (old_slug, new_slug, event_id)
VALUES ('sting-granada-2026', 'sting-granada-15-julio-2026', '257761979')
ON CONFLICT (old_slug) DO UPDATE SET new_slug = 'sting-granada-15-julio-2026';