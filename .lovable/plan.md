

# Task 1: English-default HTML shell + Task 2: Server-side 301 redirects

## Task 1 -- Make English the default HTML shell

### Problem
The raw HTML defaults to Spanish (`<html lang="es">`, Spanish `<title>`, Spanish nav links). The inline script switches TO English for `/en/` routes, but crawlers that don't execute JS see Spanish content for ALL URLs including `/en/`.

### Solution: Invert the default language

**File: `index.html`**

1. Line 2: Change `<html lang="es">` to `<html lang="en">`

2. Line 54: Change `<title>` to `FEELOMOVE+ | Concert Tickets & Music Festivals Spain`

3. Lines 6-45: Completely rewrite the inline script to invert the logic -- detect NON-English routes and switch TO Spanish:
   ```js
   (function(){
     var isES = !location.pathname.startsWith('/en/') && location.pathname!=='/en';
     if(!isES) return;
     document.documentElement.lang='es';
     document.title='FEELOMOVE+ | Entradas Conciertos y Festivales España';
     var md=document.querySelector('meta[name="description"]');
     if(md) md.content='Compra entradas para conciertos y festivales en España. Encuentra eventos en Barcelona, Madrid, Sevilla y más con FEELOMOVE+';
     document.addEventListener('DOMContentLoaded',function(){
       // Rewrite SEO fallback to Spanish
       var fb=document.getElementById('seo-fallback');
       if(fb){
         var nav=fb.querySelector('nav');
         if(nav){
           nav.setAttribute('aria-label','Navegación principal');
           nav.innerHTML='<a href="/conciertos">Conciertos en España</a><a href="/festivales">Festivales de Música</a><a href="/destinos">Destinos</a><a href="/artistas">Artistas</a><a href="/musica">Géneros Musicales</a>';
         }
         var h2=document.getElementById('seo-fallback-h2');
         if(h2) h2.textContent='Próximos Conciertos y Festivales';
       }
       // Rewrite skeleton to Spanish
       var sk=document.getElementById('critical-skeleton');
       if(sk){
         var navLinks=sk.querySelectorAll('.nav-skeleton a');
         if(navLinks.length>=3){
           navLinks[0].href='/conciertos';navLinks[0].textContent='Conciertos';
           navLinks[1].href='/festivales';navLinks[1].textContent='Festivales';
           navLinks[2].href='/destinos';navLinks[2].textContent='Destinos';
         }
         sk.querySelector('.nav-skeleton').setAttribute('aria-label','Navegación');
         var bc=sk.querySelector('.breadcrumb');
         if(bc) bc.textContent='Inicio';
         var img=sk.querySelector('.image-container');
         if(img) img.setAttribute('aria-label','Imagen del evento');
         var title=sk.querySelector('.content-skeleton .title');
         if(title) title.textContent='FEELOMOVE+ Conciertos y Festivales 2026';
       }
     });
   })();
   ```

4. Add a `<meta name="description">` tag in the `<head>` with the English default content (currently there's no default description tag -- only added dynamically for EN)

5. Lines 150-163: Rewrite `#seo-fallback` nav to English defaults:
   - `aria-label="Main navigation"`
   - Links: `/en/tickets` "Concerts in Spain", `/en/festivals` "Music Festivals", `/en/destinations` "Destinations", `/en/artists` "Artists", `/en/music` "Music Genres"

6. Lines 170-180: Rewrite `#critical-skeleton` nav to English defaults:
   - `aria-label="Navigation"`
   - Links: `/en/tickets` "Concerts", `/en/festivals` "Festivals", `/en/destinations` "Destinations"
   - Logo link title: "FEELOMOVE+ - Home"

7. Lines 183-190: Rewrite skeleton main content to English defaults:
   - Breadcrumb: "Home"
   - Image aria-label: "Event image"
   - Title: "FEELOMOVE+ Concerts and Festivals 2026"

8. Lines 210-241: Update popular-events fetch script to detect locale:
   ```js
   var isEN = location.pathname.startsWith('/en/') || location.pathname==='/en';
   // ...inside forEach:
   a.href = isEN ? '/en/tickets/' + e.slug : '/conciertos/' + e.slug;
   a.textContent = isEN ? 'Tickets ' + name : 'Entradas ' + name;
   // aria-label based on locale
   ul.setAttribute('aria-label', isEN ? 'Popular events' : 'Eventos populares');
   ```

---

## Task 2 -- Add 301 server-side redirects to vercel.json

### Problem
623 URLs in Google Search Console are flagged as "redirect" errors because old URL patterns (`/concierto/`, `/producto/`, `/festival/`, `/generos/`) are handled client-side by React, which Google doesn't resolve correctly.

### Solution

**File: `vercel.json`**

Add a `redirects` array BEFORE the `rewrites` array (Vercel processes redirects before rewrites):

```json
"redirects": [
  { "source": "/concierto/:slug", "destination": "/conciertos/:slug", "permanent": true },
  { "source": "/producto/:slug", "destination": "/conciertos/:slug", "permanent": true },
  { "source": "/festival/:slug", "destination": "/festivales/:slug", "permanent": true },
  { "source": "/generos/:slug", "destination": "/musica/:slug", "permanent": true },
  { "source": "/generos", "destination": "/musica", "permanent": true }
]
```

Note: The query-string-based redirect (`?q={search_term_string}`) requires Vercel's `has` condition syntax which is supported. However, this particular pattern is a Google Search Console artifact from sitelinks search box and redirecting it to the same URL without the query may cause a loop. Instead, this is better handled by ignoring it in GSC or adding the query redirect only if it truly causes crawl waste.

---

## Files to modify

| File | Changes |
|------|---------|
| `index.html` | Invert lang default to EN, rewrite all static HTML to English, script switches to Spanish for non-/en/ routes |
| `vercel.json` | Add `redirects` array with 5 permanent redirect rules |

## Verification
- View Source of `/en/tickets/the-kooks-barcelona`: raw `<title>` shows English WITHOUT JS execution
- View Source of `/conciertos/the-kooks-barcelona`: script switches to Spanish immediately
- `feelomove.com/concierto/slug` returns HTTP 301 to `/conciertos/slug` (no React loading screen)

