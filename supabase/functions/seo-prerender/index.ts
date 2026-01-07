import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SITE_URL = "https://feelomove.com";

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

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
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

function generateHTML(event: EventData, slug: string, routeType: "conciertos" | "festivales"): string {
  const title = event.seo_title || `${event.event_name} - Entradas y Hotel | FEELOMOVE+`;
  const description = event.meta_description || 
    `Compra entradas para ${event.event_name} en ${event.venue_city}. ${formatDate(event.event_date)} en ${event.venue_name}. Reserva hotel cercano incluido.`;
  const canonicalUrl = `${SITE_URL}/${routeType}/${slug}`;
  // Ensure image URL is always from production domain or fallback to og-image
  const rawImageUrl = event.image_large_url || `${SITE_URL}/og-image.jpg`;
  const imageUrl = rawImageUrl.includes('lovable.app') ? `${SITE_URL}/og-image.jpg` : rawImageUrl;
  
  const artists = event.attraction_names?.length 
    ? event.attraction_names.join(", ") 
    : event.primary_attraction_name || event.event_name;
  
  const priceText = event.price_min_incl_fees 
    ? `Desde ${event.price_min_incl_fees}€` 
    : "Consultar precio";

  const keywords = event.seo_keywords?.join(", ") || 
    `${event.event_name}, entradas ${event.venue_city}, conciertos ${event.venue_city}, hotel ${event.venue_city}`;

  // Generate JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.event_name,
    startDate: event.event_date,
    location: {
      "@type": "Place",
      name: event.venue_name,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.venue_city,
        streetAddress: event.venue_address || "",
        addressCountry: "ES",
      },
    },
    image: imageUrl,
    description: description,
    performer: {
      "@type": "MusicGroup",
      name: event.primary_attraction_name || event.event_name,
    },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: event.event_currency || "EUR",
      price: event.price_min_incl_fees || 0,
      availability: "https://schema.org/InStock",
    },
    organizer: {
      "@type": "Organization",
      name: "FEELOMOVE+",
      url: SITE_URL,
    },
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="author" content="FEELOMOVE+">
  <meta name="language" content="es">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="publisher" href="${SITE_URL}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="event">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:site_name" content="FEELOMOVE+">
  <meta property="og:locale" content="es_ES">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@feelomove">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg">
  
  <!-- JSON-LD Schema -->
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
      <article itemscope itemtype="https://schema.org/MusicEvent">
        <h1 itemprop="name">${escapeHtml(event.event_name)}</h1>
        
        <p class="meta">
          <time itemprop="startDate" datetime="${event.event_date}">${formatDate(event.event_date)}</time>
          · <span itemprop="location" itemscope itemtype="https://schema.org/Place">
            <span itemprop="name">${escapeHtml(event.venue_name)}</span>, 
            <span itemprop="address">${escapeHtml(event.venue_city)}</span>
          </span>
        </p>
        
        ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(event.event_name)} - Entradas en ${escapeHtml(event.venue_city)}" itemprop="image">` : ""}
        
        <p class="description" itemprop="description">${escapeHtml(description)}</p>
        
        <div class="details">
          <h2>Detalles del evento</h2>
          <div class="detail-row">
            <span class="label">Artista(s):</span>
            <span class="value" itemprop="performer">${escapeHtml(artists)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha:</span>
            <span class="value">${formatDate(event.event_date)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Lugar:</span>
            <span class="value">${escapeHtml(event.venue_name)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Ciudad:</span>
            <span class="value">${escapeHtml(event.venue_city)}</span>
          </div>
          <div class="detail-row" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span class="label">Precio:</span>
            <span class="value">
              <span itemprop="price" content="${event.price_min_incl_fees || 0}">${priceText}</span>
              <meta itemprop="priceCurrency" content="${event.event_currency || 'EUR'}">
              <meta itemprop="availability" content="https://schema.org/InStock">
            </span>
          </div>
        </div>
        
        <a href="${canonicalUrl}" class="cta">Ver entradas y hoteles disponibles</a>
        
        <section style="margin-top: 2rem;">
          <h2>Sobre este evento</h2>
          <p>
            Disfruta de ${escapeHtml(event.event_name)} en ${escapeHtml(event.venue_city)}. 
            FEELOMOVE+ te ofrece la mejor experiencia combinando entradas oficiales con alojamiento 
            en hoteles cercanos al recinto. ${event.venue_address ? `El evento se celebra en ${escapeHtml(event.venue_address)}.` : ""}
          </p>
          <p>
            Reserva ahora tus entradas para ${escapeHtml(artists)} y asegura tu hotel cerca de ${escapeHtml(event.venue_name)}.
            Gestión integral de tu viaje musical con transporte y alojamiento incluido.
          </p>
        </section>
      </article>
    </main>
    
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #333; color: #666;">
      <p>© ${new Date().getFullYear()} FEELOMOVE+ - Entradas para Conciertos y Festivales en España + Hotel</p>
      <nav>
        <a href="${SITE_URL}/conciertos" style="color: #888; margin-right: 1rem;">Conciertos</a>
        <a href="${SITE_URL}/festivales" style="color: #888; margin-right: 1rem;">Festivales</a>
        <a href="${SITE_URL}/destinos" style="color: #888; margin-right: 1rem;">Destinos</a>
        <a href="${SITE_URL}/artistas" style="color: #888;">Artistas</a>
      </nav>
    </footer>
  </div>
  
  <!-- This page is pre-rendered for SEO crawlers. Full interactive version at: ${canonicalUrl} -->
  <noscript>
    <p>Este contenido requiere JavaScript para la experiencia completa. 
    <a href="${canonicalUrl}">Visita la página completa</a>.</p>
  </noscript>
</body>
</html>`;
}

function generate404HTML(slug: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evento no encontrado | FEELOMOVE+</title>
  <meta name="robots" content="noindex">
</head>
<body style="font-family: system-ui; background: #0a0a0a; color: #fff; padding: 40px; text-align: center;">
  <h1>Evento no encontrado</h1>
  <p>El evento "${escapeHtml(slug)}" no existe o ya ha pasado.</p>
  <a href="${SITE_URL}/conciertos" style="color: #00ff8f;">Ver todos los conciertos</a>
</body>
</html>`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";
    
    // Parse the path: /conciertos/slug or /festivales/slug
    const pathMatch = path.match(/^\/(conciertos|festivales)\/(.+)$/);
    
    if (!pathMatch) {
      return new Response("Invalid path", { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" }
      });
    }

    const [, routeType, slug] = pathMatch;
    const viewName = routeType === "festivales" 
      ? "lovable_mv_event_product_page_festivales" 
      : "lovable_mv_event_product_page_conciertos";

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch event data
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
      return new Response(generate404HTML(slug), {
        status: 404,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300"
        },
      });
    }

    const html = generateHTML(data as EventData, slug, routeType as "conciertos" | "festivales");

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
