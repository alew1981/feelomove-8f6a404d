import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://wcyjuytpxxqailtixept.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWp1eXRweHhxYWlsdGl4ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMzMzksImV4cCI6MjA4MDE3OTMzOX0.hp94Zif6FlBkKEa3vXVGUOVeesjDnBQWvNb0uktgj2I";
const BASE_URL = "https://feelomove.com";

function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ñ]/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const today = new Date().toISOString().split('T')[0];

  try {
    if (type === "index") {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-concerts.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-festivals.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-artists.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-destinations.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>`, { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "pages") {
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/conciertos</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/festivales</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/artistas</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/destinos</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
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
        return `  <url><loc>${BASE_URL}/conciertos/${e.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, 
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
        return `  <url><loc>${BASE_URL}/conciertos/${a.attraction_slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    if (type === "destinations") {
      const { data, error } = await supabase
        .from("mv_destinations_cards")
        .select("city_slug")
        .not("city_slug", "is", null)
        .limit(1000);

      if (error) throw error;

      const urls = (data || []).filter(d => d.city_slug).map(d => 
        `  <url><loc>${BASE_URL}/destinos/${d.city_slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      ).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, 
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
        return `  <url><loc>${BASE_URL}/festivales/${f.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
      }).join('\n');

      return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`, 
        { headers: { ...corsHeaders, "Content-Type": "application/xml" } });
    }

    return new Response("Invalid sitemap type", { status: 400 });

  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response(`Error: ${error instanceof Error ? error.message : "Unknown"}`, { status: 500, headers: corsHeaders });
  }
});
