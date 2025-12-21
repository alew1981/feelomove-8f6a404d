import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = "https://wcyjuytpxxqailtixept.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWp1eXRweHhxYWlsdGl4ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMzMzksImV4cCI6MjA4MDE3OTMzOX0.hp94Zif6FlBkKEa3vXVGUOVeesjDnBQWvNb0uktgj2I";
const BASE_URL = "https://feelomove.com";

// Normalize text for slugs (remove accents)
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
    // Sitemap Index
    if (type === "index") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-concerts.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-festivals.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-artists.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-destinations.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-genres.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Static Pages Sitemap
    if (type === "pages") {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/conciertos</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/festivales</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/artistas</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/destinos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/generos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Concerts Sitemap (only concerts, using /concierto/, excluding VIP variants)
    if (type === "concerts") {
      const { data: concerts, error } = await supabase
        .from("tm_tbl_events")
        .select("slug, event_date")
        .eq("event_type", "concert")
        .eq("cancelled", false)
        .gte("event_date", new Date().toISOString())
        .not("slug", "like", "%-paquetes-vip%")
        .not("slug", "like", "%-vip%")
        .order("event_date", { ascending: true })
        .limit(5000);

      if (error) throw error;

      const urlsXml = (concerts || [])
        .filter(e => e.slug)
        .map(e => {
          const lastmod = e.event_date ? e.event_date.split('T')[0] : today;
          return `  <url>
    <loc>${BASE_URL}/concierto/${e.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Artists Sitemap - using URL structure /conciertos/:artist
    if (type === "artists") {
      const { data: artists, error } = await supabase
        .from("mv_attractions")
        .select("attraction_slug, attraction_name")
        .not("attraction_slug", "is", null)
        .limit(5000);

      if (error) throw error;

      const urlsXml = (artists || [])
        .filter(a => a.attraction_slug)
        .map(a => `  <url>
    <loc>${BASE_URL}/conciertos/${a.attraction_slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Destinations Sitemap
    if (type === "destinations") {
      const { data: destinations, error } = await supabase
        .from("mv_destinations_cards")
        .select("city_slug, city_name")
        .not("city_slug", "is", null)
        .limit(1000);

      if (error) throw error;

      const urlsXml = (destinations || [])
        .filter(d => d.city_slug)
        .map(d => `  <url>
    <loc>${BASE_URL}/destinos/${d.city_slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Genres Sitemap - using URL structure /generos/:genre
    if (type === "genres") {
      const { data: genres, error } = await supabase
        .from("mv_genres_cards")
        .select("genre_name")
        .not("genre_name", "is", null)
        .limit(500);

      if (error) throw error;

      const urlsXml = (genres || [])
        .filter(g => g.genre_name)
        .map(g => {
          const genreSlug = normalizeSlug(g.genre_name);
          return `  <url>
    <loc>${BASE_URL}/generos/${genreSlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        })
        .join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Festivals Sitemap (festival pages + individual festival events using /festival/, excluding VIP variants)
    if (type === "festivals") {
      // Get festival page slugs
      const { data: festivalPages, error: pagesError } = await supabase
        .from("mv_festivals_cards")
        .select("canonical_slug")
        .not("canonical_slug", "is", null)
        .order("canonical_slug", { ascending: true })
        .limit(2000);

      if (pagesError) throw pagesError;

      // Get individual festival events (excluding VIP variants)
      const { data: festivalEvents, error: eventsError } = await supabase
        .from("tm_tbl_events")
        .select("slug, event_date")
        .eq("event_type", "festival")
        .eq("cancelled", false)
        .gte("event_date", new Date().toISOString())
        .not("slug", "like", "%-paquetes-vip%")
        .not("slug", "like", "%-vip%")
        .order("event_date", { ascending: true })
        .limit(5000);

      if (eventsError) throw eventsError;

      // Get unique festival page slugs
      const festivalPageSlugs = new Set<string>();
      const urlsArr: string[] = [];

      // Add festival group pages (using /festivales/)
      (festivalPages || []).forEach(f => {
        if (f.canonical_slug && !festivalPageSlugs.has(f.canonical_slug)) {
          festivalPageSlugs.add(f.canonical_slug);
          urlsArr.push(`  <url>
    <loc>${BASE_URL}/festivales/${f.canonical_slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
        }
      });

      // Add individual festival events (using /festival/)
      (festivalEvents || []).forEach(f => {
        if (f.slug) {
          const lastmod = f.event_date ? f.event_date.split('T')[0] : today;
          urlsArr.push(`  <url>
    <loc>${BASE_URL}/festival/${f.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
        }
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsArr.join('\n')}
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    return new Response("Invalid sitemap type", { status: 400 });

  } catch (error) {
    console.error("Sitemap error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(`Error generating sitemap: ${message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
