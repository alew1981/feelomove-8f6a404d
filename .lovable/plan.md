
# Plan i18n FEELOMOVE

## Fase 0 - COMPLETADA ✅

### 1. Redirects 301 /es/* → /* en vercel.json ✅
- 16 reglas de redirect 301 agregadas (7 con :path*, 7 sin path, /es/, /es)
- Rewrite `/en/(.*)` → `/index.html` agregado antes del catch-all

### 2. Traducciones faltantes insertadas en tm_translations ✅
- Disponible, Venta finalizada, Próximamente a la venta, Entradas a la venta el, Página no encontrada, Buscar

## Fase 1 - PENDIENTE: Infraestructura i18n

- LanguageContext (detección de idioma desde URL)
- useTranslation hook (t(), localePath(), translateCitySlug())
- i18nRoutes map (ES ↔ EN route mapping)
- Carga de traducciones con react-query (cache 24h)
- Formateo de fechas y precios con Intl

## Fase 2 - PENDIENTE: Routing

- Rutas /en/* en App.tsx
- LanguageProvider wrapper

## Fase 3 - PENDIENTE: SEO

- Hreflang tags en SEOHead.tsx
- OG locale tags
- Schema.org bilingüe (inLanguage)
- Prerender edge function con locale
- Sitemap con xhtml:link hreflang

## Fase 4 - PENDIENTE: UI Translation

- Navbar, Footer, páginas principales con t()
- Language switcher
- Breadcrumbs traducidos
- Analytics tracking

## Fase 5 - PENDIENTE: Legal Compliance

- Páginas legales con disclaimer (revisión jurídica)

## Fase 6 - PENDIENTE: Testing

- Tests automatizados para slugs, rutas, hreflang
- Validación SEO con herramientas externas

## Acciones Search Console (post-deploy)

1. Enviar sitemap actualizado
2. Solicitar indexación de páginas clave /en/
3. Monitorizar informe de Orientación internacional
4. Comparar rendimiento semana a semana
