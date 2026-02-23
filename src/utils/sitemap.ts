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
  // 1. CONCERTS (ES + EN)
  // ========================================
  console.log('Generating concert sitemaps...');
  const { data: concerts } = await supabase
    .from("tm_tbl_events")
    .select("slug, event_date")
    .eq("event_type", "concert")
    .eq("cancelled", false)
    .gte("event_date", new Date().toISOString())
    .not("slug", "like", "%-paquetes-vip%")
    .not("slug", "like", "%-vip%")
    .order("event_date", { ascending: true });

  const concertUrlsEs: SitemapUrl[] = [];
  const concertUrlsEn: SitemapUrl[] = [];
  if (concerts) {
    concerts.forEach((concert) => {
      if (concert.slug) {
        const eventDate = concert.event_date ? new Date(concert.event_date).toISOString().split('T')[0] : today;
        concertUrlsEs.push({ loc: `${baseUrl}/conciertos/${concert.slug}`, lastmod: eventDate, changefreq: 'daily', priority: 0.8 });
        concertUrlsEn.push({ loc: `${baseUrl}/en/tickets/${concert.slug}`, lastmod: eventDate, changefreq: 'daily', priority: 0.8 });
      }
    });
  }
  console.log(`Generated ${concertUrlsEs.length} concert URLs (ES + EN)`);

  // ========================================
  // 2. FESTIVALS (ES + EN)
  // ========================================
  console.log('Generating festival sitemaps...');
  const { data: festivalPages } = await supabase
    .from("mv_festivals_cards")
    .select("canonical_slug")
    .order("canonical_slug", { ascending: true });

  const festivalUrlsEs: SitemapUrl[] = [];
  const festivalUrlsEn: SitemapUrl[] = [];
  if (festivalPages) {
    const seenSlugs = new Set<string>();
    festivalPages.forEach((festival) => {
      if (festival.canonical_slug && !seenSlugs.has(festival.canonical_slug)) {
        seenSlugs.add(festival.canonical_slug);
        festivalUrlsEs.push({ loc: `${baseUrl}/festivales/${festival.canonical_slug}`, changefreq: 'weekly', priority: 0.7 });
        festivalUrlsEn.push({ loc: `${baseUrl}/en/festivals/${festival.canonical_slug}`, changefreq: 'weekly', priority: 0.7 });
      }
    });
  }

  const { data: festivalEvents } = await supabase
    .from("tm_tbl_events")
    .select("slug, event_date")
    .eq("event_type", "festival")
    .eq("cancelled", false)
    .gte("event_date", new Date().toISOString())
    .not("slug", "like", "%-paquetes-vip%")
    .not("slug", "like", "%-vip%")
    .order("event_date", { ascending: true });

  if (festivalEvents) {
    festivalEvents.forEach((event) => {
      if (event.slug) {
        const eventDate = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : today;
        festivalUrlsEs.push({ loc: `${baseUrl}/festivales/${event.slug}`, lastmod: eventDate, changefreq: 'daily', priority: 0.8 });
        festivalUrlsEn.push({ loc: `${baseUrl}/en/festivals/${event.slug}`, lastmod: eventDate, changefreq: 'daily', priority: 0.8 });
      }
    });
  }
  console.log(`Generated ${festivalUrlsEs.length} festival URLs (ES + EN)`);

  // ========================================
  // 3. ARTISTS (ES + EN)
  // ========================================
  console.log('Generating artist sitemaps...');
  const { data: artists } = await supabase
    .from("mv_attractions")
    .select("attraction_slug")
    .order("attraction_slug", { ascending: true });

  const artistUrlsEs: SitemapUrl[] = [];
  const artistUrlsEn: SitemapUrl[] = [];
  if (artists) {
    artists.forEach((artist) => {
      if (artist.attraction_slug) {
        artistUrlsEs.push({ loc: `${baseUrl}/conciertos/${artist.attraction_slug}`, changefreq: 'weekly', priority: 0.7 });
        artistUrlsEn.push({ loc: `${baseUrl}/en/tickets/${artist.attraction_slug}`, changefreq: 'weekly', priority: 0.7 });
      }
    });
  }
  console.log(`Generated ${artistUrlsEs.length} artist URLs (ES + EN)`);

  // ========================================
  // 4. DESTINATIONS (ES + EN)
  // ========================================
  console.log('Generating destination sitemaps...');
  const { data: destinations } = await supabase
    .from("mv_destinations_cards")
    .select("city_slug")
    .order("city_slug", { ascending: true });

  const destinationUrlsEs: SitemapUrl[] = [];
  const destinationUrlsEn: SitemapUrl[] = [];
  if (destinations) {
    destinations.forEach((dest) => {
      if (dest.city_slug) {
        destinationUrlsEs.push({ loc: `${baseUrl}/destinos/${dest.city_slug}`, changefreq: 'weekly', priority: 0.7 });
        destinationUrlsEn.push({ loc: `${baseUrl}/en/destinations/${dest.city_slug}`, changefreq: 'weekly', priority: 0.7 });
      }
    });
  }
  console.log(`Generated ${destinationUrlsEs.length} destination URLs (ES + EN)`);

  // ========================================
  // 5. STATIC PAGES (ES + EN)
  // ========================================
  const staticPagesEs: SitemapUrl[] = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/conciertos`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/festivales`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/artistas`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/destinos`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.5 },
  ];
  const staticPagesEn: SitemapUrl[] = [
    { loc: `${baseUrl}/en/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/en/tickets`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/en/festivals`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/en/artists`, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/en/destinations`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/en/inspiration`, changefreq: 'weekly', priority: 0.6 },
    { loc: `${baseUrl}/en/about`, changefreq: 'monthly', priority: 0.5 },
  ];

  // ========================================
  // 6. GENERATE ALL XML
  // ========================================
  const concertsEsXml = wrapInUrlset(concertUrlsEs.map(generateUrlXml).join('\n'));
  const concertsEnXml = wrapInUrlset(concertUrlsEn.map(generateUrlXml).join('\n'));
  const festivalsEsXml = wrapInUrlset(festivalUrlsEs.map(generateUrlXml).join('\n'));
  const festivalsEnXml = wrapInUrlset(festivalUrlsEn.map(generateUrlXml).join('\n'));
  const artistsEsXml = wrapInUrlset(artistUrlsEs.map(generateUrlXml).join('\n'));
  const artistsEnXml = wrapInUrlset(artistUrlsEn.map(generateUrlXml).join('\n'));
  const destinationsEsXml = wrapInUrlset(destinationUrlsEs.map(generateUrlXml).join('\n'));
  const destinationsEnXml = wrapInUrlset(destinationUrlsEn.map(generateUrlXml).join('\n'));
  const pagesEsXml = wrapInUrlset(staticPagesEs.map(generateUrlXml).join('\n'));
  const pagesEnXml = wrapInUrlset(staticPagesEn.map(generateUrlXml).join('\n'));

  // ES index
  const sitemapIndexEs = `<?xml version="1.0" encoding="UTF-8"?>
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
</sitemapindex>`;

  // EN index
  const sitemapIndexEn = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-en-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-en-tickets.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-en-festivals.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-en-artists.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-en-destinations.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  // ========================================
  // 7. WRITE ALL FILES
  // ========================================
  const writeSitemapsToDir = (dir: string) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // ES sitemaps
    writeFileSync(resolve(dir, 'sitemap-concerts.xml'), concertsEsXml);
    writeFileSync(resolve(dir, 'sitemap-festivals.xml'), festivalsEsXml);
    writeFileSync(resolve(dir, 'sitemap-artists.xml'), artistsEsXml);
    writeFileSync(resolve(dir, 'sitemap-destinations.xml'), destinationsEsXml);
    writeFileSync(resolve(dir, 'sitemap-pages.xml'), pagesEsXml);
    writeFileSync(resolve(dir, 'sitemap_index.xml'), sitemapIndexEs);

    // EN sitemaps
    writeFileSync(resolve(dir, 'sitemap-en.xml'), sitemapIndexEn);
    writeFileSync(resolve(dir, 'sitemap-en-tickets.xml'), concertsEnXml);
    writeFileSync(resolve(dir, 'sitemap-en-festivals.xml'), festivalsEnXml);
    writeFileSync(resolve(dir, 'sitemap-en-artists.xml'), artistsEnXml);
    writeFileSync(resolve(dir, 'sitemap-en-destinations.xml'), destinationsEnXml);
    writeFileSync(resolve(dir, 'sitemap-en-pages.xml'), pagesEnXml);
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

    console.log('✅ All sitemaps (ES + EN) generated successfully!');
  } catch (error) {
    console.error('Error writing sitemap files:', error);
  }

  return sitemapIndexEs;
};

// Helper function to get event URL (used by components)
export const getEventUrl = (slug: string, isFestival: boolean): string => {
  return `/${isFestival ? 'festival' : 'concierto'}/${slug}`;
};
