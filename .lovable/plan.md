
# Plan i18n FEELOMOVE

## Fase 0 - COMPLETADA ✅

### 1. Redirects 301 /es/* → /* en vercel.json ✅
- 16 reglas de redirect 301 agregadas (7 con :path*, 7 sin path, /es/, /es)
- Rewrite `/en/(.*)` → `/index.html` agregado antes del catch-all

### 2. Traducciones faltantes insertadas en tm_translations ✅
- Disponible, Venta finalizada, Próximamente a la venta, Entradas a la venta el, Página no encontrada, Buscar

## Fase 1 - COMPLETADA ✅: Infraestructura i18n

- `src/lib/i18nRoutes.ts` - Mapa bidireccional ES↔EN, detectLocaleFromPath, localePath, getAlternateUrl, toCanonicalPath
- `src/contexts/LanguageContext.tsx` - LanguageProvider con locale, t(), localePath(), translateCitySlug(), formatDate(), formatPrice()
- `src/hooks/useTranslation.ts` - Re-export de useLanguage como useTranslation
- App.tsx envuelto con LanguageProvider dentro de BrowserRouter
- Rutas /en/* registradas (tickets, festivals, destinations, artists, favorites, inspiration, about)
- Traducciones cargadas desde tm_translations con react-query (cache 24h)

## Fase 2 - COMPLETADA ✅: Routing (integrada en Fase 1)

- Rutas /en/* registradas en App.tsx (tickets, festivals, destinations, artists, favorites, inspiration, about)
- LanguageProvider wrapper dentro de BrowserRouter

## Fase 3 - COMPLETADA ✅: SEO

- `SEOHead.tsx` - Hreflang tags (es, en, x-default), og:locale dinámico, og:locale:alternate, html lang, inLanguage en WebPage schema
- `EventSeo.tsx` - inLanguage parametrizado (es-ES / en-US) según locale
- `useInstantSEO.ts` - Soporte para rutas /en/* (titles EN instantáneos)
- `seo-prerender/index.ts` - Detecta locale desde path, HTML bilingüe, hreflang en prerender, labels/textos traducidos
- `sitemap/index.ts` - xmlns:xhtml, xhtml:link hreflang en todas las URLs (pages, concerts, festivals, artists, destinations)

## Fase 4 - EN PROGRESO 🔄: UI Translation

### Completado ✅
- `LanguageSwitcher.tsx` - Componente ES/EN toggle compacto para Navbar
- `Navbar.tsx` - Todos los labels con t(), links con localePath(), LanguageSwitcher en desktop y mobile
- `Footer.tsx` - Todos los labels, links, categorías traducidos con t() y localePath()
- `Hero.tsx` - Headlines, búsqueda, 3 pasos, resultados de búsqueda traducidos con t()
- `Breadcrumbs.tsx` - Locale-aware: Home/Inicio, labels traducidos, soporte para EN segments (tickets, festivals, etc.)
- `Index.tsx` - Todos los headings de secciones traducidos con t(), links con localePath()

### Pendiente
- Conciertos.tsx, Festivales.tsx - Headings y filtros con t()
- About.tsx - Contenido con t()
- Otras páginas secundarias (Artistas, Destinos, etc.)

## Fase 5 - COMPLETADA ✅: Legal Compliance

- `src/pages/PoliticaPrivacidad.tsx` - Política de Privacidad bilingüe (ES/EN), GDPR/RGPD
- `src/pages/TerminosUso.tsx` - Términos de Uso bilingües (ES/EN), disclaimer de agregador
- Rutas: `/politica-privacidad`, `/terminos-uso`, `/en/privacy-policy`, `/en/terms-of-use`
- Footer actualizado con NavLink locale-aware (eliminado enlace Cookies separado)
- Redirects: `/privacidad` → `/politica-privacidad`, `/cookies` → `/politica-privacidad`
- vercel.json: redirects `/es/politica-privacidad`, `/es/terminos-uso`
- i18nRoutes.ts: segmentos `politica-privacidad` ↔ `privacy-policy`, `terminos-uso` ↔ `terms-of-use`
- Disclaimer legal en ambas páginas (revisión jurídica pendiente)

## Fase 6 - PENDIENTE: Testing

- Tests automatizados para slugs, rutas, hreflang
- Validación SEO con herramientas externas

## Acciones Search Console (post-deploy)

1. Enviar sitemap actualizado
2. Solicitar indexación de páginas clave /en/
3. Monitorizar informe de Orientación internacional
4. Comparar rendimiento semana a semana
