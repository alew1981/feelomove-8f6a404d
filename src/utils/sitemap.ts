import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const generateUrlXml = (url: SitemapUrl): string => {
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
};

const wrapInUrlset = (urlsXml: string): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;
};

export const generateSitemap = async (): Promise<string> => {
  const supabase = createClient<Database>(
    "https://wcyjuytpxxqailtixept.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWp1eXRweHhxYWlsdGl4ZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDMzMzksImV4cCI6MjA4MDE3OTMzOX0.hp94Zif6FlBkKEa3vXVGUOVeesjDnBQWvNb0uktgj2I"
  );
  
  const baseUrl = "https://feelomove.com";
  const today = new Date().toISOString().split('T')[0];

  // ========================================
  // 1. GENERATE sitemap-concerts.xml
  // ========================================
  console.log('Generating sitemap-concerts.xml...');
  const { data: concerts } = await supabase
    .from("tm_tbl_events")
    .select("slug, event_date")
    .eq("event_type", "concert")
    .eq("cancelled", false)
    .gte("event_date", new Date().toISOString())
    .not("slug", "like", "%-paquetes-vip%")
    .not("slug", "like", "%-vip%")
    .order("event_date", { ascending: true });

  const concertUrls: SitemapUrl[] = [];
  if (concerts) {
    concerts.forEach((concert) => {
      if (concert.slug) {
        const eventDate = concert.event_date ? new Date(concert.event_date).toISOString().split('T')[0] : today;
        concertUrls.push({
          loc: `${baseUrl}/concierto/${concert.slug}`,
          lastmod: eventDate,
          changefreq: 'daily',
          priority: 0.8
        });
      }
    });
  }
  const concertsSitemapXml = wrapInUrlset(concertUrls.map(generateUrlXml).join('\n'));
  console.log(`Generated ${concertUrls.length} concert URLs`);

  // ========================================
  // 2. GENERATE sitemap-festivals.xml
  // ========================================
  console.log('Generating sitemap-festivals.xml...');
  
  // Section 1: Festival pages (listings)
  const { data: festivalPages } = await supabase
    .from("mv_festivals_cards")
    .select("canonical_slug")
    .order("canonical_slug", { ascending: true });

  const festivalUrls: SitemapUrl[] = [];
  
  // Add festival listing pages
  if (festivalPages) {
    const seenSlugs = new Set<string>();
    festivalPages.forEach((festival) => {
      if (festival.canonical_slug && !seenSlugs.has(festival.canonical_slug)) {
        seenSlugs.add(festival.canonical_slug);
        festivalUrls.push({
          loc: `${baseUrl}/festivales/${festival.canonical_slug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }
  console.log(`Generated ${festivalUrls.length} festival listing page URLs`);

  // Section 2: Individual festival events
  const { data: festivalEvents } = await supabase
    .from("tm_tbl_events")
    .select("slug, event_date")
    .eq("event_type", "festival")
    .eq("cancelled", false)
    .gte("event_date", new Date().toISOString())
    .not("slug", "like", "%-paquetes-vip%")
    .not("slug", "like", "%-vip%")
    .order("event_date", { ascending: true });

  const festivalEventCount = festivalUrls.length;
  if (festivalEvents) {
    festivalEvents.forEach((event) => {
      if (event.slug) {
        const eventDate = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : today;
        festivalUrls.push({
          loc: `${baseUrl}/festival/${event.slug}`,
          lastmod: eventDate,
          changefreq: 'daily',
          priority: 0.8
        });
      }
    });
  }
  console.log(`Generated ${festivalUrls.length - festivalEventCount} individual festival event URLs`);

  const festivalsSitemapXml = wrapInUrlset(festivalUrls.map(generateUrlXml).join('\n'));

  // ========================================
  // 3. GENERATE sitemap-artists.xml
  // ========================================
  console.log('Generating sitemap-artists.xml...');
  const { data: artists } = await supabase
    .from("mv_attractions")
    .select("attraction_slug")
    .order("attraction_slug", { ascending: true });

  const artistUrls: SitemapUrl[] = [];
  if (artists) {
    artists.forEach((artist) => {
      if (artist.attraction_slug) {
        artistUrls.push({
          loc: `${baseUrl}/conciertos/${artist.attraction_slug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }
  const artistsSitemapXml = wrapInUrlset(artistUrls.map(generateUrlXml).join('\n'));
  console.log(`Generated ${artistUrls.length} artist URLs`);

  // ========================================
  // 4. GENERATE sitemap-destinations.xml
  // ========================================
  console.log('Generating sitemap-destinations.xml...');
  const { data: destinations } = await supabase
    .from("mv_destinations_cards")
    .select("city_slug")
    .order("city_slug", { ascending: true });

  const destinationUrls: SitemapUrl[] = [];
  if (destinations) {
    destinations.forEach((dest) => {
      if (dest.city_slug) {
        destinationUrls.push({
          loc: `${baseUrl}/destinos/${dest.city_slug}`,
          changefreq: 'weekly',
          priority: 0.7
        });
      }
    });
  }
  const destinationsSitemapXml = wrapInUrlset(destinationUrls.map(generateUrlXml).join('\n'));
  console.log(`Generated ${destinationUrls.length} destination URLs`);

  // ========================================
  // 5. GENERATE sitemap-genres.xml
  // ========================================
  console.log('Generating sitemap-genres.xml...');
  const { data: genres } = await supabase
    .from("mv_genres_cards")
    .select("genre_name");

  const genreUrls: SitemapUrl[] = [];
  if (genres) {
    genres.forEach((genre) => {
      if (genre.genre_name) {
        const genreSlug = genre.genre_name.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        genreUrls.push({
          loc: `${baseUrl}/generos/${genreSlug}`,
          changefreq: 'weekly',
          priority: 0.6
        });
      }
    });
  }
  const genresSitemapXml = wrapInUrlset(genreUrls.map(generateUrlXml).join('\n'));
  console.log(`Generated ${genreUrls.length} genre URLs`);

  // ========================================
  // 6. GENERATE sitemap-pages.xml (static pages)
  // ========================================
  console.log('Generating sitemap-pages.xml...');
  const staticPages: SitemapUrl[] = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/conciertos`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/festivales`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/artistas`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/destinos`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/generos`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.5 },
  ];
  const pagesSitemapXml = wrapInUrlset(staticPages.map(generateUrlXml).join('\n'));
  console.log(`Generated ${staticPages.length} static page URLs`);

  // ========================================
  // 7. GENERATE sitemap_index.xml
  // ========================================
  console.log('Generating sitemap_index.xml...');
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-concerts.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-festivals.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-artists.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-destinations.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-genres.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  // ========================================
  // 8. WRITE ALL FILES TO PUBLIC + DIST FOLDERS
  //    (CRITICAL: if we only write to /public in closeBundle,
  //    Vite has already copied publicDir into dist)
  // ========================================
  const writeSitemapsToDir = (dir: string) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(resolve(dir, 'sitemap-concerts.xml'), concertsSitemapXml);
    writeFileSync(resolve(dir, 'sitemap-festivals.xml'), festivalsSitemapXml);
    writeFileSync(resolve(dir, 'sitemap-artists.xml'), artistsSitemapXml);
    writeFileSync(resolve(dir, 'sitemap-destinations.xml'), destinationsSitemapXml);
    writeFileSync(resolve(dir, 'sitemap-genres.xml'), genresSitemapXml);
    writeFileSync(resolve(dir, 'sitemap-pages.xml'), pagesSitemapXml);
    writeFileSync(resolve(dir, 'sitemap_index.xml'), sitemapIndex);
  };

  try {
    const publicDir = resolve(process.cwd(), 'public');
    const distDir = resolve(process.cwd(), 'dist');

    console.log('Writing sitemaps to public/...');
    writeSitemapsToDir(publicDir);
    console.log('✅ Written sitemaps to public');

    console.log('Writing sitemaps to dist/...');
    writeSitemapsToDir(distDir);
    console.log('✅ Written sitemaps to dist');

    console.log('✅ All sitemaps generated successfully!');
  } catch (error) {
    console.error('Error writing sitemap files:', error);
  }

  // Return the main sitemap index for backwards compatibility
  return sitemapIndex;
};

// Helper function to get event URL (used by components)
export const getEventUrl = (slug: string, isFestival: boolean): string => {
  return `/${isFestival ? 'festival' : 'concierto'}/${slug}`;
};
