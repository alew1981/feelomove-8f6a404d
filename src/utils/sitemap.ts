import { supabase } from "../integrations/supabase/client";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = "https://feelomove.com";
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push(
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/eventos`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/artistas`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/musica`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/destinos`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/favoritos`, changefreq: 'weekly', priority: 0.5 }
  );

  // Fetch events
  const { data: events } = await supabase
    .from("vw_events_with_hotels")
    .select("event_slug, event_updated_at")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(1000);

  if (events) {
    events.forEach((event: any) => {
      urls.push({
        loc: `${baseUrl}/producto/${event.event_slug}`,
        lastmod: event.event_updated_at || new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.8
      });
    });
  }

  // Fetch unique artists
  const { data: artistData } = await supabase
    .from("vw_events_with_hotels")
    .select("attraction_slug")
    .gte("event_date", new Date().toISOString())
    .not("attraction_slug", "is", null);

  if (artistData) {
    const uniqueArtistSlugs = [...new Set(artistData.map((a: any) => a.attraction_slug))];
    uniqueArtistSlugs.forEach((slug) => {
      if (slug) {
        urls.push({
          loc: `${baseUrl}/artista/${slug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }

  // Fetch unique cities
  const { data: cities } = await supabase
    .from("vw_events_with_hotels")
    .select("venue_city")
    .gte("event_date", new Date().toISOString())
    .not("venue_city", "is", null);

  if (cities) {
    const uniqueCities = [...new Set(cities.map((c: any) => c.venue_city))];
    uniqueCities.forEach((city: any) => {
      if (city && typeof city === 'string') {
        const citySlug = city.toLowerCase().replace(/\s+/g, '-');
        urls.push({
          loc: `${baseUrl}/destinos/${citySlug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }

  // Generate XML
  const xmlUrls = urls.map(url => {
    let urlXml = `  <url>\n    <loc>${url.loc}</loc>`;
    if (url.lastmod) {
      urlXml += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }
    if (url.changefreq) {
      urlXml += `\n    <changefreq>${url.changefreq}</changefreq>`;
    }
    if (url.priority !== undefined) {
      urlXml += `\n    <priority>${url.priority}</priority>`;
    }
    urlXml += `\n  </url>`;
    return urlXml;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
};
