import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  // Create a Supabase client without auth storage for build-time usage
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

  // Fetch events from mv_events_cards
  const { data: events } = await supabase
    .from("mv_events_cards")
    .select("slug, event_date, primary_attraction_name")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(1000);

  if (events) {
    // Add event URLs
    events.forEach((event) => {
      if (event.slug) {
        urls.push({
          loc: `${baseUrl}/producto/${event.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.8
        });
      }
    });

    // Extract unique artists for sitemap
    const artistSlugs = new Set<string>();
    events.forEach((event) => {
      if (event.primary_attraction_name) {
        const slug = event.primary_attraction_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        artistSlugs.add(slug);
      }
    });

    artistSlugs.forEach((slug) => {
      urls.push({
        loc: `${baseUrl}/artista/${slug}`,
        changefreq: 'weekly',
        priority: 0.7
      });
    });
  }

  // Fetch unique cities from mv_destinations_cards
  const { data: cities } = await supabase
    .from("mv_destinations_cards")
    .select("city_name")
    .not("city_name", "is", null)
    .limit(100);

  if (cities) {
    cities.forEach((city) => {
      if (city.city_name && typeof city.city_name === 'string') {
        const citySlug = city.city_name.toLowerCase().replace(/\s+/g, '-');
        urls.push({
          loc: `${baseUrl}/destinos/${citySlug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }

  // Fetch genres from mv_genres_cards
  const { data: genres } = await supabase
    .from("mv_genres_cards")
    .select("genre_name")
    .not("genre_name", "is", null)
    .limit(50);

  if (genres) {
    genres.forEach((genre) => {
      if (genre.genre_name && typeof genre.genre_name === 'string') {
        const genreSlug = genre.genre_name.toLowerCase().replace(/\s+/g, '-');
        urls.push({
          loc: `${baseUrl}/musica/${genreSlug}`,
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
