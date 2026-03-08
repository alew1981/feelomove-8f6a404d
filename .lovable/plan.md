
## Plan: Limpiar y normalizar sitemaps

### Tareas:
1. **Eliminar 5 archivos obsoletos** de `public/`:
   - sitemap-en-artists.xml
   - sitemap-en-destinations.xml
   - sitemap-en-festivals.xml
   - sitemap-en-pages.xml
   - sitemap-en-tickets.xml

2. **Reformatear `public/sitemap.xml`**:
   - Cambiar de una línea a múltiples líneas con indentación
   - Mantener exactamente las 6 entradas del índice

3. **Publish** a producción después de confirmar cambios

### Verificación previa a deploy:
- Listar archivos finales en `public/`
- Mostrar contenido formateado de `public/sitemap.xml`
- Confirmar que solo existen `sitemap.xml` y `sitemap-en.xml`
