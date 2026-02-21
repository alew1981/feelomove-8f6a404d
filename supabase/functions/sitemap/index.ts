import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://wcyjuytpxxqailtixept.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWp1eXRweHhxYWlsdGl4ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMzMzksImV4cCI6MjA4MDE3OTMzOX0.hp94Zif6FlBkKEa3vXVGUOVeesjDnBQWvNb0uktgj2I";
const BASE_URL = "https://feelomove.com";

const XMLNS_XHTML = 'xmlns:xhtml="http://www.w3.org/1999/xhtml"';

/** Route segments per language */
const SEGMENTS = {
  es: { concerts: "conciertos", festivals: "festivales", artists: "conciertos", destinations: "destinos", pages: "" },
  en: { concerts: "en/tickets", festivals: "en/festivals", artists: "en/tickets", destinations: "en/destinations", pages: "" },
};

/** Sitemap file names per language */
const SITEMAP_NAMES = {
  es: { pages: "sitemap-pages.xml", concerts: "sitemap-concerts.xml", festivals: "sitemap-festivals.xml", artists: "sitemap-artists.xml", destinations: "sitemap-destinations.xml" },
  en: { pages: "sitemap-en-pages.xml", concerts: "sitemap-en-tickets.xml", festivals: "sitemap-en-festivals.xml", artists: "sitemap-en-artists.xml", destinations: "sitemap-en-destinations.xml" },
};

function hreflangLinks(esLoc: string, enLoc: string): string {
  return `
    <xhtml:link rel="alternate" hreflang="es" href="${esLoc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enLoc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${esLoc}" />`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";
  const lang = (url.searchParams.get("lang") || "es") as "es" | "en";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const today = new Date().toISOString().split('T')[0];
  const names = SITEMAP_NAMES[lang] || SITEMAP_NAMES.es;

  try {
    if (type === "index") {
      const items = Object.values(names).map(n => 
        `  <sitemap><loc>${BASE_URL}/${n}</loc><lastmod>${today}</lastmod></sitemap>`
      ).join('\n');

      // ES index also references the EN index for cross-discovery
      const enRef = lang === "es" 
        ? `\n  <sitemap><loc>${BASE_URL}/sitemap-en.xml</loc><lastmod>${today}</lastmod></sitemap>` 
        : "";

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}${enRef}
</sitemapindex>`, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    const seg = SEGMENTS[lang] || SEGMENTS.es;
    const segEs = SEGMENTS.es;
    const segEn = SEGMENTS.en;

    if (type === "pages") {
      const pages = [
        { es: "/", en: "/en/", priority: "1.0", freq: "daily" },
        { es: "/conciertos", en: "/en/tickets", priority: "0.9", freq: "daily" },
        { es: "/festivales", en: "/en/festivals", priority: "0.9", freq: "daily" },
        { es: "/artistas", en: "/en/artists", priority: "0.9", freq: "daily" },
        { es: "/destinos", en: "/en/destinations", priority: "0.8", freq: "weekly" },
        { es: "/inspiration", en: "/en/inspiration", priority: "0.6", freq: "weekly" },
        { es: "/about", en: "/en/about", priority: "0.5", freq: "monthly" },
      ];

      const urls = pages.map(p => {
        const loc = lang === "en" ? p.en : p.es;
        return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>${hreflangLinks(`${BASE_URL}${p.es}`, `${BASE_URL}${p.en}`)}
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${XMLNS_XHTML}>
${urls}
</urlset>`, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "concerts") {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("slug, updated_at, event_date")
        .eq("event_type", "concert")
        .eq("cancelled", false)
        .gte("event_date", new Date().toISOString())
        .not("slug", "like", "%-vip%")
        .order("event_date", { ascending: true })
        .limit(5000);

      if (error) throw error;

      const urls = (data || []).filter(e => e.slug).map(e => {
        const lastmod = e.updated_at?.split('T')[0] || e.event_date?.split('T')[0] || today;
        const esLoc = `${BASE_URL}/${segEs.concerts}/${e.slug}`;
        const enLoc = `${BASE_URL}/${segEn.concerts}/${e.slug}`;
        const loc = lang === "en" ? enLoc : esLoc;
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${hreflangLinks(esLoc, enLoc)}
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${XMLNS_XHTML}>\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "artists") {
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("attraction_slug, next_event_date")
        .not("attraction_slug", "is", null)
        .gte("next_event_date", today)
        .limit(5000);

      if (error) throw error;

      const exclude = ['parking', 'alojamiento', 'camping', 'festival', 'fest', 'abono'];
      const urls = (data || []).filter(a => {
        if (!a.attraction_slug) return false;
        const slug = a.attraction_slug.toLowerCase();
        return !exclude.some(p => slug.includes(p));
      }).map(a => {
        const lastmod = a.next_event_date?.split('T')[0] || today;
        const esLoc = `${BASE_URL}/${segEs.artists}/${a.attraction_slug}`;
        const enLoc = `${BASE_URL}/${segEn.artists}/${a.attraction_slug}`;
        const loc = lang === "en" ? enLoc : esLoc;
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${hreflangLinks(esLoc, enLoc)}
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${XMLNS_XHTML}>\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "destinations") {
      const { data, error } = await supabase
        .from("mv_destinations_cards")
        .select("city_slug")
        .not("city_slug", "is", null)
        .limit(1000);

      if (error) throw error;

      const urls = (data || []).filter(d => d.city_slug).map(d => {
        const esLoc = `${BASE_URL}/${segEs.destinations}/${d.city_slug}`;
        const enLoc = `${BASE_URL}/${segEn.destinations}/${d.city_slug}`;
        const loc = lang === "en" ? enLoc : esLoc;
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${hreflangLinks(esLoc, enLoc)}
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${XMLNS_XHTML}>\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "festivals") {
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("slug, updated_at, event_date")
        .eq("event_type", "festival")
        .eq("cancelled", false)
        .gte("event_date", new Date().toISOString())
        .not("slug", "like", "%-vip%")
        .order("event_date", { ascending: true })
        .limit(5000);

      if (error) throw error;

      const seen = new Set<string>();
      const urls = (data || []).filter(f => {
        if (!f.slug || seen.has(f.slug)) return false;
        seen.add(f.slug);
        return true;
      }).map(f => {
        const lastmod = f.updated_at?.split('T')[0] || f.event_date?.split('T')[0] || today;
        const esLoc = `${BASE_URL}/${segEs.festivals}/${f.slug}`;
        const enLoc = `${BASE_URL}/${segEn.festivals}/${f.slug}`;
        const loc = lang === "en" ? enLoc : esLoc;
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>${hreflangLinks(esLoc, enLoc)}
  </url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ${XMLNS_XHTML}>\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    return new Response("Invalid sitemap type", { status: 400 });

  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(`Error: ${error instanceof Error ? error.message : "Unknown"}`, { status: 500, headers: corsHeaders });
  }
});
