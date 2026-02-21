

## Sitemap EN separado para las rutas en ingles

### Problema actual

El sitemap actual solo lista URLs en espanol (`/conciertos/`, `/festivales/`, etc.) como `<loc>` principal, con hreflang apuntando a las versiones EN. Esto funciona para SEO basico, pero:

- Google recomienda que cada URL indexable aparezca como `<loc>` en al menos un sitemap
- Con miles de URLs en dos idiomas, un solo sitemap por categoria puede superar los 50.000 URLs o hacerse lento
- Edu (Greta) recomienda sitemaps separados por idioma para escalabilidad

### Solucion

Anadir un parametro `lang=en` a la edge function existente. Cuando se pasa `lang=en`, las URLs `<loc>` seran las versiones EN (`/en/tickets/`, `/en/festivals/`, etc.) pero manteniendo los mismos hreflang alternates.

### Estructura final de sitemaps

```text
sitemap.xml (ES index)                 sitemap-en.xml (EN index)
  sitemap-pages.xml                       sitemap-en-pages.xml
  sitemap-concerts.xml                    sitemap-en-tickets.xml
  sitemap-festivals.xml                   sitemap-en-festivals.xml
  sitemap-artists.xml                     sitemap-en-artists.xml
  sitemap-destinations.xml                sitemap-en-destinations.xml
```

### Archivos a modificar

**1. `supabase/functions/sitemap/index.ts`**

- Leer nuevo query param `lang` (default `"es"`)
- Cuando `lang=en`:
  - `type=index` devuelve el sitemapindex apuntando a `sitemap-en-*.xml`
  - Cada tipo (`concerts`, `festivals`, etc.) genera `<loc>` con rutas EN (`/en/tickets/slug`) en vez de ES
  - Los hreflang siguen iguales (es, en, x-default) para ambas versiones
- Mapeo de segmentos: concerts -> tickets, festivals -> festivals, artists -> artists, destinations -> destinations

**2. `vercel.json`** (seccion rewrites)

Anadir 6 nuevos rewrites:

```text
/sitemap-en.xml          -> sitemap?type=index&lang=en
/sitemap-en-pages.xml    -> sitemap?type=pages&lang=en
/sitemap-en-tickets.xml  -> sitemap?type=concerts&lang=en
/sitemap-en-festivals.xml -> sitemap?type=festivals&lang=en
/sitemap-en-artists.xml  -> sitemap?type=artists&lang=en
/sitemap-en-destinations.xml -> sitemap?type=destinations&lang=en
```

**3. `public/robots.txt`**

Anadir las rutas EN al Allow y el segundo sitemap:

```text
Allow: /en/
Allow: /en/tickets
Allow: /en/festivals
Allow: /en/artists
Allow: /en/destinations

Sitemap: https://feelomove.com/sitemap_index.xml
Sitemap: https://feelomove.com/sitemap-en.xml
```

**4. Sitemap index ES (`type=index`, sin lang)**

Actualizar para incluir tambien referencia al sitemap EN, de modo que Google descubra ambos desde cualquier punto de entrada:

```xml
<sitemapindex>
  <!-- ES sitemaps -->
  <sitemap><loc>.../sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>.../sitemap-concerts.xml</loc></sitemap>
  ...
  <!-- EN sitemaps -->
  <sitemap><loc>.../sitemap-en.xml</loc></sitemap>
</sitemapindex>
```

### Detalle tecnico de la edge function

La logica principal cambia minimamente. Ejemplo para `concerts`:

- ES (actual): `<loc>feelomove.com/conciertos/slug</loc>`
- EN (nuevo):  `<loc>feelomove.com/en/tickets/slug</loc>`

Ambos incluyen exactamente los mismos hreflang tags, lo cual es correcto segun las directrices de Google.

### Acciones post-deploy

1. Publicar los cambios
2. En Google Search Console: anadir `https://feelomove.com/sitemap-en.xml` como nuevo sitemap
3. Eliminar `sitemap-pages.xml` si sigue registrado por separado (ya esta dentro del index)

