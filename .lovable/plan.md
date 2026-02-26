

# Fix /en/ pages serving Spanish content to crawlers

## Problem
When Google crawls `/en/` URLs, the raw HTML (before React hydrates) shows Spanish nav links, Spanish skeleton text, Spanish fallback content, and no Content-Language header. Google treats these as duplicates of the Spanish pages.

## Changes

### 1. Edit `index.html` -- Make SEO fallback and skeleton bilingual (MOST CRITICAL)

Extend the existing inline script on line 6 to also rewrite:
- The SEO fallback nav links (`#seo-fallback` nav) to English paths and text
- The skeleton nav links to English paths
- The skeleton title text to English
- The breadcrumb text from "Inicio" to "Home"
- The image aria-label to English
- Add a meta description tag in English

The extended script will detect `/en/` prefix and use `document.querySelector` / `innerHTML` to rewrite the static HTML elements before any rendering occurs.

### 2. Edit `vercel.json` -- Add Content-Language HTTP headers

Add a `headers` array alongside the existing `rewrites`:
- `/en/(.*)` routes get `Content-Language: en` and `Vary: Accept-Language`
- All other routes get `Content-Language: es`

No `_headers` file will be created (Vercel ignores it).

### 3. Edit `src/contexts/LanguageContext.tsx` -- Inline critical translations fallback

Add a hardcoded `CRITICAL_TRANSLATIONS` map with ~15 key UI strings (Conciertos->Concerts, Festivales->Festivals, Destinos->Destinations, Artistas->Artists, Inspiración->Inspiration, Hoteles->Hotels, Buscar->Search, Favoritos->Favorites, Entradas->Tickets, Comprar Entradas->Buy Tickets, Encuentra Hoteles->Find Hotels, Ver más->See more, Eventos->Events, Géneros Musicales->Music Genres).

Modify the `t()` function to check this map first when `locale === 'en'` and `translationMap` hasn't loaded yet. Once Supabase translations load, they take priority. This ensures the Navbar and above-the-fold content render in English on first paint.

### 4. Verify `src/pages/Producto.tsx` SEO metadata (already done)

The `seoDescription` (lines 807-813) already has full locale branching with English text for `/en/` routes. The `seoTitle` (lines 803-805) uses `t('Entradas')` which will now resolve to "Tickets" immediately thanks to the critical translations fallback. No changes needed here.

### 5. Verify `src/components/EventSeo.tsx` JSON-LD (already locale-aware)

The EventSeo component already accepts a `locale` prop and sets `inLanguage` accordingly (line 327). The `description` field comes from `seoDescription` which is already bilingual in Producto.tsx. No changes needed here.

---

## Technical details

### Files to modify

| File | Change |
|------|--------|
| `index.html` (line 6 script + lines 110-151) | Extend inline script to rewrite fallback/skeleton content for /en/ |
| `vercel.json` | Add `headers` array for Content-Language |
| `src/contexts/LanguageContext.tsx` | Add `CRITICAL_TRANSLATIONS` map and update `t()` fallback logic |

### What crawlers will see after fix

For a request to `/en/tickets/the-kooks-barcelona`:
- `<html lang="en">`
- `<title>FEELOMOVE+ | Concert Tickets & Music Festivals Spain</title>`
- `<meta name="description" content="Buy concert and festival tickets in Spain...">` 
- Nav links: Concerts, Festivals, Destinations, Artists
- Skeleton text: "FEELOMOVE+ Concerts and Festivals 2026"
- `Content-Language: en` HTTP header
- Once React hydrates: English SEO title, English description, English JSON-LD, hreflang tags

