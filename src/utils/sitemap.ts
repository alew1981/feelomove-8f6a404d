import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  const supabase = createClient<Database>(
    "https://ycgnutvyklpohfwwabes.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZ251dHZ5a2xwb2hmd3dhYmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjM4MzgsImV4cCI6MjA3ODU5OTgzOH0.hdrVQtNWYV4LtP1e89zFJTkTcIqgpc4Qmj8pTrHm2pc"
  );
  
  const baseUrl = "https://feelomove.com";
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push(
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/eventos`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/conciertos`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/festivales`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/artistas`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/musica`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/destinos`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/favoritos`, changefreq: 'weekly', priority: 0.5 }
  );

  // Fetch events
  const { data: events } = await supabase
    .from("lovable_mv_event_product_page")
    .select("event_slug, event_date, primary_attraction_name, venue_city, primary_subcategory_name, is_festival")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(1000);

  if (events) {
    const seenSlugs = new Set<string>();
    const artistSlugs = new Set<string>();
    const cities = new Set<string>();
    const genres = new Set<string>();

    events.forEach((event) => {
      // Add event URLs with correct path based on type
      if (event.event_slug && !seenSlugs.has(event.event_slug)) {
        seenSlugs.add(event.event_slug);
        const eventPath = event.is_festival ? 'festival' : 'concierto';
        urls.push({
          loc: `${baseUrl}/${eventPath}/${event.event_slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.8
        });
      }

      // Collect artists
      if (event.primary_attraction_name) {
        const slug = event.primary_attraction_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        artistSlugs.add(slug);
      }

      // Collect cities
      if (event.venue_city) {
        cities.add(event.venue_city);
      }

      // Collect genres
      if (event.primary_subcategory_name) {
        genres.add(event.primary_subcategory_name);
      }
    });

    // Add artist URLs
    artistSlugs.forEach((slug) => {
      urls.push({
        loc: `${baseUrl}/artista/${slug}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    });

    // Add city URLs
    cities.forEach((city) => {
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        loc: `${baseUrl}/destinos/${citySlug}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    });

    // Add genre URLs
    genres.forEach((genre) => {
      const genreSlug = encodeURIComponent(genre);
      urls.push({
        loc: `${baseUrl}/musica/${genreSlug}`,
        changefreq: 'weekly',
        priority: 0.7
      });
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
