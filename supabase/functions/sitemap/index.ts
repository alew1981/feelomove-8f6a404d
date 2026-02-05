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
</urlset>`;

      return new Response(xml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }

    // Concerts Sitemap (only concerts, using /conciertos/ plural, excluding VIP variants)
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
          // CRITICAL SEO: Use plural route /conciertos/ as canonical
          return `  <url>
    <loc>${BASE_URL}/conciertos/${e.slug}</loc>
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

    // Artists Sitemap - ONLY artists with future events (excluding festivals)
    if (type === "artists") {
      // Query from mv_attractions which has proper slugs, then filter by future events
      const { data: attractions, error: attractionsError } = await supabase
        .from("mv_attractions")
        .select("attraction_id, attraction_slug, attraction_name, next_event_date")
        .not("attraction_slug", "is", null)
        .not("attraction_id", "is", null)
        .gte("next_event_date", today)
        .limit(5000);

      if (attractionsError) {
        console.error("Error fetching attractions:", attractionsError);
        throw attractionsError;
      }

      // Exclusion patterns for non-artist entries AND festivals
      const excludePatterns = [
        'servicio de autobus',
        'servicio-de-autobus',
        'plaza de parking',
        'plaza-de-parking',
        'artista invisible',
        'artista-invisible',
        'parking',
        'alojamiento',
        'camping',
        'upgrade',
        'transporte',
        // Festival-related patterns to exclude from artists sitemap
        'festival',
        'fest',
        'sound',
        'sonorama',
        'primavera',
        'mad-cool',
        'madcool',
        'bbk-live',
        'arenal',
        'viña-rock',
        'vina-rock',
        'resurrection',
        'low-festival',
        'dcode',
        'tomorrowland',
        'medusa',
        'rototom',
        'starlite',
        'cruilla',
        'vida-festival',
        'les-arts',
        'cap-roig',
        'porta-ferrada',
        'abono',
        'bono-general',
        'bono-festival'
      ];

      // Filter and generate URLs
      const urlsXml = (attractions || [])
        .filter(a => {
          if (!a.attraction_slug || a.attraction_slug === '') return false;
          
          const nameLower = (a.attraction_name || '').toLowerCase();
          const slugLower = a.attraction_slug.toLowerCase();
          
          // Skip excluded patterns (including festivals)
          for (const pattern of excludePatterns) {
            if (nameLower.includes(pattern) || slugLower.includes(pattern)) {
              return false;
            }
          }
          
          return true;
        })
        .map(a => {
          const lastmod = a.next_event_date ? a.next_event_date.split('T')[0] : today;
          return `  <url>
    <loc>${BASE_URL}/conciertos/${a.attraction_slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join('\n');

      console.log(`Generated ${(attractions || []).length} artist URLs for sitemap (festivals excluded)`);

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
    // Festivals Sitemap (individual festival events using /festivales/ plural, excluding VIP variants)
    if (type === "festivals") {
      // Get individual festival events (INCLUDING festivals without confirmed date - 9999)
      const { data: festivalEvents, error: eventsError } = await supabase
        .from("tm_tbl_events")
        .select("slug, event_date, updated_at, name, primary_attraction_name, exclude_from_sitemap, event_type")
        .eq("event_type", "festival")
        .eq("cancelled", false)
        .gte("event_date", new Date().toISOString())
        .not("slug", "is", null)
        .order("event_date", { ascending: true })
        .limit(5000);

      if (eventsError) throw eventsError;

      // Filter out problematic events
      const excludePatterns = ['parking', 'alojamiento', 'camping', 'upgrade', 'paquetes-vip', 'vip'];
      const slugWithLongNumbers = /\d{5,}/; // Slugs with 5+ consecutive digits
      
      const filteredFestivalEvents = (festivalEvents || []).filter(f => {
        if (!f.slug || f.slug === '') return false;
        if (f.exclude_from_sitemap === true) return false;
        if (slugWithLongNumbers.test(f.slug)) return false;
        
        const nameLower = (f.name || '').toLowerCase();
        const attractionLower = (f.primary_attraction_name || '').toLowerCase();
        
        for (const pattern of excludePatterns) {
          if (nameLower.includes(pattern) || attractionLower.includes(pattern)) {
            return false;
          }
          if (f.slug.includes(pattern)) {
            return false;
          }
        }
        
        // Also exclude "artista invisible"
        if (attractionLower.includes('artista invisible')) return false;
        
        return true;
      });

      // Generate unique festival group pages from festival events
      // Format: festival-name_city (matching ParentFestivalCard slug generation)
      const festivalGroupSlugs = new Map<string, { name: string; city: string; lastmod: string }>();
      
      filteredFestivalEvents.forEach(f => {
        const festivalName = f.primary_attraction_name || f.name || '';
        const city = 'España'; // We don't have city in this query, will be handled by the page
        const slug = normalizeSlug(festivalName);
        
        if (slug && !festivalGroupSlugs.has(slug)) {
          const lastmod = f.event_date?.startsWith('9999') ? today : (f.updated_at?.split('T')[0] || today);
          festivalGroupSlugs.set(slug, { name: festivalName, city, lastmod });
        }
      });

      const urlsArr: string[] = [];

      // Add individual festival events (using /festivales/ plural) - deduplicate by slug
      const addedSlugs = new Set<string>();
      filteredFestivalEvents.forEach(f => {
        if (f.slug && !addedSlugs.has(f.slug)) {
          addedSlugs.add(f.slug);
          
          // For lastmod: if event_date is 9999 (TBC), use today's date, otherwise use updated_at
          let lastmod = today;
          if (f.event_date) {
            const eventYear = new Date(f.event_date).getFullYear();
            if (eventYear >= 9999) {
              // Festival without confirmed date - use current date
              lastmod = today;
            } else if (f.updated_at) {
              lastmod = f.updated_at.split('T')[0];
            } else {
              lastmod = f.event_date.split('T')[0];
            }
          }
          
          // CRITICAL SEO: Use plural route /festivales/ as canonical
          urlsArr.push(`  <url>
    <loc>${BASE_URL}/festivales/${f.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
        }
      });

      console.log(`Generated ${urlsArr.length} festival URLs for sitemap`);

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
