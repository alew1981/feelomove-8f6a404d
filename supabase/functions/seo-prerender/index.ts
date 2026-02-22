import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SITE_URL = "https://feelomove.com";

// ─── i18n route mapping ───
const EN_TO_ES_SEGMENTS: Record<string, string> = {
  tickets: "conciertos",
  festivals: "festivales",
  destinations: "destinos",
  artists: "artistas",
};

interface LocaleConfig {
  locale: "es" | "en";
  htmlLang: string;
  ogLocale: string;
  ogLocaleAlt: string;
  inLanguage: string;
  routePrefix: string; // "conciertos" or "tickets" etc
}

function detectLocale(path: string): LocaleConfig {
  if (path.startsWith("/en/") || path === "/en") {
    return {
      locale: "en",
      htmlLang: "en",
      ogLocale: "en_US",
      ogLocaleAlt: "es_ES",
      inLanguage: "en-US",
      routePrefix: "en",
    };
  }
  return {
    locale: "es",
    htmlLang: "es",
    ogLocale: "es_ES",
    ogLocaleAlt: "en_US",
    inLanguage: "es-ES",
    routePrefix: "",
  };
}

/** Build the ES canonical path for an event slug */
function esCanonical(routeType: string, slug: string): string {
  const prefix = routeType === "festival" ? "festivales" : "conciertos";
  return `${SITE_URL}/${prefix}/${slug}`;
}

/** Build the EN alternate path for an event slug */
function enAlternate(routeType: string, slug: string): string {
  const prefix = routeType === "festival" ? "festivals" : "tickets";
  return `${SITE_URL}/en/${prefix}/${slug}`;
}

/** Generate hreflang link tags */
function hreflangTags(esUrl: string, enUrl: string): string {
  return `
  <link rel="alternate" hreflang="es" href="${esUrl}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="x-default" href="${esUrl}" />`;
}

interface EventData {
  event_name: string;
  event_date: string;
  venue_name: string;
  venue_city: string;
  venue_address: string;
  primary_attraction_name: string;
  attraction_names: string[];
  image_large_url: string;
  price_min_incl_fees: number;
  event_currency: string;
  event_type: string;
  meta_description: string;
  seo_title: string;
  seo_keywords: string[];
}

function formatDate(dateStr: string, locale: "es" | "en" = "es"): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateHTML(event: EventData, slug: string, routeType: "concierto" | "festival", lc: LocaleConfig): string {
  const isEN = lc.locale === "en";
  
  // Titles & descriptions
  const title = isEN
    ? `${event.event_name} - Tickets & Hotel | FEELOMOVE+`
    : (event.seo_title || `${event.event_name} - Entradas y Hotel | FEELOMOVE+`);
  
  const description = isEN
    ? `Buy tickets for ${event.event_name} in ${event.venue_city}. ${formatDate(event.event_date, "en")} at ${event.venue_name}. Book a nearby hotel.`
    : (event.meta_description || 
      `Compra entradas para ${event.event_name} en ${event.venue_city}. ${formatDate(event.event_date)} en ${event.venue_name}. Reserva hotel cercano incluido.`);
  
  const canonicalUrl = isEN ? enAlternate(routeType, slug) : esCanonical(routeType, slug);
  const esUrl = esCanonical(routeType, slug);
  const enUrl = enAlternate(routeType, slug);
  
  const rawImageUrl = event.image_large_url || `${SITE_URL}/og-image.jpg`;
  const imageUrl = rawImageUrl.includes('lovable.app') ? `${SITE_URL}/og-image.jpg` : rawImageUrl;
  
  const artists = event.attraction_names?.length 
    ? event.attraction_names.join(", ") 
    : event.primary_attraction_name || event.event_name;
  
  const priceText = event.price_min_incl_fees 
    ? (isEN ? `From €${event.price_min_incl_fees}` : `Desde ${event.price_min_incl_fees}€`)
    : (isEN ? "Check price" : "Consultar precio");

  const keywords = event.seo_keywords?.join(", ") || 
    `${event.event_name}, ${isEN ? 'tickets' : 'entradas'} ${event.venue_city}`;

  // CRITICAL: Skip startDate/endDate for placeholder dates (9999) to avoid GSC errors
  const hasValidDate = event.event_date && !event.event_date.startsWith('9999');
  
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": event.event_type === "Festival" ? "Festival" : "MusicEvent",
    "name": event.event_name,
    "description": description,
    ...(hasValidDate && { "startDate": event.event_date }),
    ...(hasValidDate && { "endDate": event.event_date }),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "url": canonicalUrl,
    "image": [imageUrl],
    "location": {
      "@type": "Place",
      "name": event.venue_name || (isEN ? "Event venue" : "Recinto del evento"),
      "address": {
        "@type": "PostalAddress",
        "streetAddress": event.venue_address || event.venue_name || "",
        "addressLocality": event.venue_city,
        "addressRegion": isEN ? "Spain" : "España",
        "addressCountry": "ES"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "FEELOMOVE+",
      "url": SITE_URL
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "price": event.price_min_incl_fees || 0,
      "priceCurrency": event.event_currency || "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    },
    "performer": {
      "@type": "MusicGroup",
      "name": event.primary_attraction_name || event.event_name
    },
    "inLanguage": lc.inLanguage
  };

  // Labels
  const lbl = isEN
    ? { details: "Event Details", artist: "Artist(s)", date: "Date", venue: "Venue", city: "City", price: "Price", about: "About this event", cta: "View tickets & hotels", footer: "Tickets for Concerts and Festivals in Spain + Hotel" }
    : { details: "Detalles del evento", artist: "Artista(s)", date: "Fecha", venue: "Lugar", city: "Ciudad", price: "Precio", about: "Sobre este evento", cta: "Ver entradas y hoteles disponibles", footer: "Entradas para Conciertos y Festivales en España + Hotel" };

  return `<!DOCTYPE html>
<html lang="${lc.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="author" content="FEELOMOVE+">
  <meta name="language" content="${lc.locale}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="publisher" href="${SITE_URL}">
  ${hreflangTags(esUrl, enUrl)}
  
  <!-- Open Graph -->
  <meta property="og:type" content="event">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="FEELOMOVE+">
  <meta property="og:locale" content="${lc.ogLocale}">
  <meta property="og:locale:alternate" content="${lc.ogLocaleAlt}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@feelomove">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #fff; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 1rem; color: #00ff8f; }
    .meta { color: #888; margin-bottom: 1rem; }
    .description { line-height: 1.6; margin-bottom: 2rem; }
    .details { background: #1a1a1a; padding: 1.5rem; border-radius: 8px; }
    .detail-row { display: flex; margin-bottom: 0.5rem; }
    .label { color: #888; width: 120px; }
    .value { color: #fff; }
    img { max-width: 100%; border-radius: 8px; margin-bottom: 1rem; }
    .cta { display: inline-block; background: #00ff8f; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="${SITE_URL}" style="color: #00ff8f; text-decoration: none; font-weight: bold;">← FEELOMOVE+</a>
    </header>
    
    <main>
      <article>
        <h1>${escapeHtml(event.event_name)}</h1>
        
        <p class="meta">
          <time datetime="${event.event_date}">${formatDate(event.event_date, lc.locale)}</time>
          · ${escapeHtml(event.venue_name)}, ${escapeHtml(event.venue_city)}
        </p>
        
        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(event.event_name)}">` : ""}
        
        <p class="description">${escapeHtml(description)}</p>
        
        <div class="details">
          <h2>${lbl.details}</h2>
          <div class="detail-row"><span class="label">${lbl.artist}:</span><span class="value">${escapeHtml(artists)}</span></div>
          <div class="detail-row"><span class="label">${lbl.date}:</span><span class="value">${formatDate(event.event_date, lc.locale)}</span></div>
          <div class="detail-row"><span class="label">${lbl.venue}:</span><span class="value">${escapeHtml(event.venue_name)}</span></div>
          <div class="detail-row"><span class="label">${lbl.city}:</span><span class="value">${escapeHtml(event.venue_city)}</span></div>
          <div class="detail-row"><span class="label">${lbl.price}:</span><span class="value">${priceText}</span></div>
        </div>
        
        <a href="${canonicalUrl}" class="cta">${lbl.cta}</a>
      </article>
    </main>
    
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #333; color: #666;">
      <p>© ${new Date().getFullYear()} FEELOMOVE+ - ${lbl.footer}</p>
      <nav>
        <a href="${SITE_URL}/${isEN ? 'en/tickets' : 'conciertos'}" style="color: #888; margin-right: 1rem;">${isEN ? 'Tickets' : 'Conciertos'}</a>
        <a href="${SITE_URL}/${isEN ? 'en/festivals' : 'festivales'}" style="color: #888; margin-right: 1rem;">${isEN ? 'Festivals' : 'Festivales'}</a>
        <a href="${SITE_URL}/${isEN ? 'en/destinations' : 'destinos'}" style="color: #888; margin-right: 1rem;">${isEN ? 'Destinations' : 'Destinos'}</a>
        <a href="${SITE_URL}/${isEN ? 'en/artists' : 'artistas'}" style="color: #888;">${isEN ? 'Artists' : 'Artistas'}</a>
      </nav>
    </footer>
  </div>
</body>
</html>`;
}

function buildDestinationSeoDescription(params: {
  cityName: string;
  totalEvents: number;
  concertsCount: number;
  festivalsCount: number;
  topArtists: string[];
  minPriceEur: number | null;
}, locale: "es" | "en"): string {
  const { cityName, totalEvents, concertsCount, festivalsCount, topArtists, minPriceEur } = params;
  const parts: string[] = [];
  if (locale === "en") {
    parts.push(`Discover concerts and festivals in ${cityName}.`);
    parts.push(`${totalEvents} events: ${concertsCount} concerts and ${festivalsCount} festivals.`);
    const artistsText = topArtists.filter(Boolean).slice(0, 6).join(", ");
    if (artistsText) parts.push(`Artists & headliners: ${artistsText}.`);
    if (minPriceEur && minPriceEur > 0) parts.push(`Prices from €${Math.round(minPriceEur)}.`);
    parts.push("Buy tickets and book a hotel near the venue.");
  } else {
    parts.push(`Descubre conciertos y festivales en ${cityName}.`);
    parts.push(`Hay ${totalEvents} eventos: ${concertsCount} conciertos y ${festivalsCount} festivales.`);
    const artistsText = topArtists.filter(Boolean).slice(0, 6).join(", ");
    if (artistsText) parts.push(`Artistas y headliners: ${artistsText}.`);
    if (minPriceEur && minPriceEur > 0) parts.push(`Precios desde ${Math.round(minPriceEur)}€.`);
    parts.push("Compra entradas y reserva hotel cerca del evento.");
  }
  return parts.join(" ");
}

function formatSlugToName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function generateDestinationHTML(params: {
  citySlug: string;
  cityName: string;
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  itemList: Array<{ name: string; startDate: string; url: string; image: string }>;
  lc: LocaleConfig;
}): string {
  const { citySlug, cityName, title, description, canonicalUrl, imageUrl, itemList, lc } = params;
  const isEN = lc.locale === "en";
  
  const esUrl = `${SITE_URL}/destinos/${citySlug}`;
  const enUrl = `${SITE_URL}/en/destinations/${citySlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": isEN ? `Concerts and Festivals in ${cityName}` : `Conciertos y Festivales en ${cityName}`,
    "description": description,
    "url": canonicalUrl,
    "numberOfItems": itemList.length,
    "itemListElement": itemList.map((e, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "MusicEvent",
        "name": e.name,
        "startDate": e.startDate,
        "url": e.url,
        "image": [e.image],
        "location": {
          "@type": "Place",
          "name": isEN ? "Event venue" : "Recinto del evento",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": cityName,
            "addressRegion": isEN ? "Spain" : "España",
            "addressCountry": "ES"
          }
        },
        "inLanguage": lc.inLanguage
      }
    }))
  };

  return `<!DOCTYPE html>
<html lang="${lc.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="FEELOMOVE+">
  <meta name="language" content="${lc.locale}">
  <link rel="canonical" href="${canonicalUrl}">
  ${hreflangTags(esUrl, enUrl)}

  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="FEELOMOVE+">
  <meta property="og:locale" content="${lc.ogLocale}">
  <meta property="og:locale:alternate" content="${lc.ogLocaleAlt}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@feelomove">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">

  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #0a0a0a; color: #fff; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; color: #00ff8f; }
    h2 { font-size: 1.25rem; margin: 0 0 1rem; color: #cfcfcf; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
    .card { background: #141414; border: 1px solid #2a2a2a; border-radius: 10px; overflow: hidden; }
    .card img { width: 100%; height: 140px; object-fit: cover; display: block; }
    .card .p { padding: 12px; }
    .card a { color: #fff; text-decoration: none; }
    .card .name { font-weight: 700; margin: 0 0 6px; }
    .card .date { color: #9a9a9a; margin: 0; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="${SITE_URL}" style="color:#00ff8f;text-decoration:none;font-weight:700;">← FEELOMOVE+</a>
    </header>

    <main>
      <h1>${escapeHtml(cityName)}</h1>
      <h2>${isEN ? `Events and experiences in ${escapeHtml(cityName)}` : `Eventos y experiencias destacadas en ${escapeHtml(cityName)}`}</h2>

      ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(cityName)} - FEELOMOVE+" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;margin:12px 0 18px;" />` : ""}

      <p style="line-height:1.6;color:#cfcfcf;margin:0 0 18px;">${escapeHtml(description)}</p>

      <section class="grid">
        ${itemList.map((e) => `
          <article class="card">
            ${e.image ? `<img src="${e.image}" alt="${escapeHtml(e.name)}">` : ""}
            <div class="p">
              <p class="name">${escapeHtml(e.name)}</p>
              <p class="date">${escapeHtml(formatDate(e.startDate, lc.locale))}</p>
              <a href="${e.url}" style="display:inline-block;margin-top:8px;color:#00ff8f;">${isEN ? 'View event' : 'Ver evento'}</a>
            </div>
          </article>
        `).join("")}
      </section>
    </main>

    <footer style="margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #333; color: #666;">
      <p>© ${new Date().getFullYear()} FEELOMOVE+</p>
    </footer>
  </div>
</body>
</html>`;
}

function generate404HTML(slug: string, locale: "es" | "en"): string {
  const isEN = locale === "en";
  return `<!DOCTYPE html>
<html lang="${isEN ? 'en' : 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEN ? 'Event not found' : 'Evento no encontrado'} | FEELOMOVE+</title>
  <meta name="robots" content="noindex">
</head>
<body style="font-family: system-ui; background: #0a0a0a; color: #fff; padding: 40px; text-align: center;">
  <h1>${isEN ? 'Event not found' : 'Evento no encontrado'}</h1>
  <p>${isEN ? `The event "${escapeHtml(slug)}" does not exist or has already passed.` : `El evento "${escapeHtml(slug)}" no existe o ya ha pasado.`}</p>
  <a href="${SITE_URL}/${isEN ? 'en/tickets' : 'conciertos'}" style="color: #00ff8f;">${isEN ? 'View all concerts' : 'Ver todos los conciertos'}</a>
</body>
</html>`;
}

function generateHomepageHTML(lc: LocaleConfig): string {
  const isEN = lc.locale === "en";
  const title = isEN
    ? "FEELOMOVE+ | Concert & Festival Tickets + Hotels in Spain"
    : "FEELOMOVE+ | Entradas Conciertos, Festivales y Hoteles en España";
  const description = isEN
    ? "Buy concert and festival tickets in Spain. Book a hotel near the venue and save. All-in-one music travel platform."
    : "Compra entradas para conciertos y festivales en España 2025. Reserva hotel cerca del evento y ahorra.";
  const canonicalUrl = isEN ? `${SITE_URL}/en/` : SITE_URL;
  const esUrl = SITE_URL;
  const enUrl = `${SITE_URL}/en/`;
  const imageUrl = `${SITE_URL}/og-image.jpg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "FEELOMOVE+",
    "url": SITE_URL,
    "description": description,
    "inLanguage": lc.inLanguage,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/conciertos?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const mainCities = [
    { name: "Madrid", slug: "madrid" },
    { name: "Barcelona", slug: "barcelona" },
    { name: "Valencia", slug: "valencia" },
    { name: "Sevilla", slug: isEN ? "seville" : "sevilla" },
    { name: "Bilbao", slug: "bilbao" },
    { name: "Málaga", slug: "malaga" },
    { name: "Granada", slug: "granada" },
    { name: "Zaragoza", slug: "zaragoza" }
  ];

  const destPath = isEN ? "en/destinations" : "destinos";
  const ticketsPath = isEN ? "en/tickets" : "conciertos";
  const festivalsPath = isEN ? "en/festivals" : "festivales";
  const artistsPath = isEN ? "en/artists" : "artistas";

  return `<!DOCTYPE html>
<html lang="${lc.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="language" content="${lc.locale}">
  <link rel="canonical" href="${canonicalUrl}">
  ${hreflangTags(esUrl, enUrl)}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="FEELOMOVE+">
  <meta property="og:locale" content="${lc.ogLocale}">
  <meta property="og:locale:alternate" content="${lc.ogLocaleAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Feelomove">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #0a0a0a; color: #fff; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #00ff8f; }
    h2 { font-size: 1.5rem; color: #cfcfcf; margin-top: 2rem; }
    .hero { background: linear-gradient(180deg, rgba(0,255,143,0.1) 0%, transparent 100%); padding: 60px 20px; text-align: center; }
    .description { line-height: 1.8; color: #cfcfcf; max-width: 800px; margin: 0 auto 2rem; }
    .cities { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin: 2rem 0; }
    .city-link { display: inline-block; background: #1a1a1a; color: #00ff8f; padding: 12px 24px; border-radius: 8px; text-decoration: none; border: 1px solid #2a2a2a; }
    .nav-links { display: flex; gap: 24px; justify-content: center; margin: 2rem 0; }
    .nav-links a { color: #fff; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <header style="padding: 20px 0;">
      <a href="${SITE_URL}" style="color: #00ff8f; text-decoration: none; font-weight: bold; font-size: 1.5rem;">FEELOMOVE+</a>
      <nav class="nav-links" style="margin-top: 1rem;">
        <a href="${SITE_URL}/${ticketsPath}">${isEN ? 'Tickets' : 'Conciertos'}</a>
        <a href="${SITE_URL}/${festivalsPath}">${isEN ? 'Festivals' : 'Festivales'}</a>
        <a href="${SITE_URL}/${destPath}">${isEN ? 'Destinations' : 'Destinos'}</a>
        <a href="${SITE_URL}/${artistsPath}">${isEN ? 'Artists' : 'Artistas'}</a>
      </nav>
    </header>
    <main>
      <section class="hero">
        <h1>${escapeHtml(title)}</h1>
        <p class="description">${escapeHtml(description)}</p>
      </section>
      <section>
        <h2>${isEN ? 'Events by City' : 'Conciertos y Festivales por Ciudad'}</h2>
        <div class="cities">
          ${mainCities.map(city => `<a href="${SITE_URL}/${destPath}/${city.slug}" class="city-link">${isEN ? `Events in ${city.name}` : `Eventos en ${city.name}`}</a>`).join("\n          ")}
        </div>
      </section>
    </main>
    <footer style="margin-top: 3rem; padding: 2rem 0; border-top: 1px solid #333; color: #666;">
      <p>© ${new Date().getFullYear()} FEELOMOVE+</p>
    </footer>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    const lc = detectLocale(path);
    
    // Strip /en/ prefix to get the effective path for routing
    const effectivePath = lc.locale === "en" ? path.replace(/^\/en\/?/, "/") : path;
    
    // Handle homepage prerender
    if (effectivePath === "/" || effectivePath === "") {
      const html = generateHomepageHTML(lc);
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Robots-Tag": "index, follow",
        },
      });
    }
    
    // Map EN segments to ES for DB lookup: /tickets/slug -> /conciertos/slug
    let lookupPath = effectivePath;
    if (lc.locale === "en") {
      for (const [en, es] of Object.entries(EN_TO_ES_SEGMENTS)) {
        if (lookupPath.startsWith(`/${en}/`) || lookupPath === `/${en}`) {
          lookupPath = lookupPath.replace(`/${en}`, `/${es}`);
          break;
        }
      }
    }
    
    // Parse the path: /conciertos/slug, /concierto/slug, /festivales/slug, /festival/slug, /destinos/slug
    const pathMatch = lookupPath.match(/^\/(conciertos?|festivales?|destinos)\/(.+)$/);
    
    if (!pathMatch) {
      return new Response("Invalid path", { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    const [, routeTypeParsed, slug] = pathMatch;
    const routeType = routeTypeParsed.endsWith('s') && routeTypeParsed !== 'destinos' 
      ? routeTypeParsed.slice(0, -1) 
      : routeTypeParsed;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Destinos
    if (routeType === "destinos") {
      const citySlug = slug;

      const [{ data: concerts }, { data: festivals }] = await Promise.all([
        supabase
          .from("mv_concerts_cards")
          .select("name, event_date, slug, image_large_url, image_standard_url, price_min_incl_fees, venue_city, venue_city_slug")
          .eq("venue_city_slug", citySlug)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true }),
        supabase
          .from("mv_festivals_cards")
          .select("name, event_date, slug, image_large_url, image_standard_url, price_min_incl_fees, venue_city, venue_city_slug")
          .eq("venue_city_slug", citySlug)
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true }),
      ]);

      const all = ([...(concerts || []), ...(festivals || [])] as any[]).sort(
        (a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime(),
      );

      const cityName = all[0]?.venue_city || formatSlugToName(citySlug);

      const prices = all.map((e) => e.price_min_incl_fees).filter((p) => typeof p === "number" && p > 0) as number[];
      const minPriceEur = prices.length ? Math.min(...prices) : null;

      const { data: cityMapping } = await supabase
        .from("lite_tbl_city_mapping")
        .select("ticketmaster_city, imagen_ciudad")
        .not("imagen_ciudad", "is", null);

      const mapped = (cityMapping || []).find((c: any) =>
        (c.ticketmaster_city || "").toLowerCase().replace(/\s+/g, "-") === citySlug.toLowerCase(),
      );

      const rawImageUrl = mapped?.imagen_ciudad || all[0]?.image_large_url || all[0]?.image_standard_url || `${SITE_URL}/og-image.jpg`;
      const imageUrl = rawImageUrl.includes("lovable.app") ? `${SITE_URL}/og-image.jpg` : rawImageUrl;

      const isEN = lc.locale === "en";
      const canonicalUrl = isEN ? `${SITE_URL}/en/destinations/${citySlug}` : `${SITE_URL}/destinos/${citySlug}`;

      const topArtists: string[] = [];
      for (const e of all) {
        if (topArtists.length >= 6) break;
        if (typeof e.name === "string" && e.name.trim()) topArtists.push(e.name.trim());
      }

      const description = buildDestinationSeoDescription({
        cityName,
        totalEvents: all.length,
        concertsCount: concerts?.length || 0,
        festivalsCount: festivals?.length || 0,
        topArtists,
        minPriceEur,
      }, lc.locale);

      const title = isEN
        ? `Events in ${cityName} - Concerts & Festivals | FEELOMOVE+`
        : `Eventos en ${cityName} - Conciertos y Festivales | FEELOMOVE+`;

      const ticketsPrefix = isEN ? "en/tickets" : "conciertos";
      const festivalsPrefix = isEN ? "en/festivals" : "festivales";

      const itemList = all.slice(0, 10).map((e) => {
        const isConcert = !!concerts?.some((c: any) => c.slug === e.slug);
        const prefix = isConcert ? ticketsPrefix : festivalsPrefix;
        const eventUrl = `${SITE_URL}/${prefix}/${e.slug}`;
        const evImage = (e.image_large_url || e.image_standard_url || imageUrl) as string;
        return {
          name: e.name,
          startDate: e.event_date,
          url: eventUrl,
          image: evImage.includes("lovable.app") ? `${SITE_URL}/og-image.jpg` : evImage,
        };
      });

      const html = generateDestinationHTML({
        citySlug,
        cityName,
        title,
        description,
        canonicalUrl,
        imageUrl,
        itemList,
        lc,
      });

      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Robots-Tag": "index, follow",
        },
      });
    }

    const viewName = routeType === "festival" 
      ? "lovable_mv_event_product_page_festivales" 
      : "lovable_mv_event_product_page_conciertos";

    const { data, error } = await supabase
      .from(viewName)
      .select(`
        event_name,
        event_date,
        venue_name,
        venue_city,
        venue_address,
        primary_attraction_name,
        attraction_names,
        image_large_url,
        price_min_incl_fees,
        event_currency,
        event_type,
        meta_description,
        seo_title,
        seo_keywords
      `)
      .eq("event_slug", slug)
      .single();

    if (error || !data) {
      console.error("Event not found:", slug, error);
      return new Response(generate404HTML(slug, lc.locale), {
        status: 404,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300"
        },
      });
    }

    const html = generateHTML(data as EventData, slug, routeType as "concierto" | "festival", lc);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "index, follow",
      },
    });
  } catch (err) {
    console.error("Prerender error:", err);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
