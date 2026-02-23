

## Fix: Error XML en sitemap-en.xml

### Problema
El archivo `sitemap-en.xml` tiene URLs con `&lang=en` que rompen el XML porque `&` es un carácter especial en XML y debe escribirse como `&amp;`. Google Search Console no puede leer el sitemap.

### Solucion
Cambiar `sitemap-en.xml` para que apunte a archivos estaticos locales, exactamente igual que el sitemap ES. Esto elimina el problema del `&` y ademas hace que el sitemap EN funcione identicamente al ES.

### Cambios

**1. Actualizar `public/sitemap-en.xml`**
Reemplazar las URLs de la edge function por archivos estaticos:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://feelomove.com/sitemap-en-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://feelomove.com/sitemap-en-tickets.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://feelomove.com/sitemap-en-festivals.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://feelomove.com/sitemap-en-artists.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://feelomove.com/sitemap-en-destinations.xml</loc>
  </sitemap>
</sitemapindex>
```

**2. Poblar los archivos EN con datos reales**
Los archivos `sitemap-en-tickets.xml`, `sitemap-en-festivals.xml`, `sitemap-en-artists.xml` y `sitemap-en-destinations.xml` actualmente estan vacios (solo tienen el `urlset` vacio). Se poblaran con las URLs EN correctas consultando la base de datos, usando el mismo patron que `src/utils/sitemap.ts` ya usa para los archivos ES.

**3. Actualizar `src/utils/sitemap.ts`**
Agregar generacion de los 5 archivos EN (pages, tickets, festivals, artists, destinations) al script que ya genera los archivos ES. Asi cuando se ejecute, se generaran ambos idiomas automaticamente.

### Resultado
- `sitemap-en.xml` sera identico en estructura al `sitemap.xml` (ES)
- Sin errores XML
- Google Search Console podra indexar todas las paginas EN correctamente
