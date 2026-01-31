
-- Eliminar el redirect corrupto que causa el 404
-- El evento 791465077 tiene slug tokio-hotel-madrid, pero hay un redirect
-- que intenta enviar a tokio-hotel-madrid-2026 (que no existe)
DELETE FROM slug_redirects 
WHERE event_id = '791465077' 
  AND old_slug = 'tokio-hotel-madrid' 
  AND new_slug = 'tokio-hotel-madrid-2026';
