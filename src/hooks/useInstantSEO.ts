import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * CRITICAL SEO HOOK: Injects meta tags INSTANTLY from URL slug before Supabase data loads.
 * This prevents Google from seeing duplicate/empty meta tags on SPA pages.
 * 
 * Strategy:
 * IMPORTANT (2026-02): To avoid duplicated tags in Google Search Console,
 * this hook MUST NOT create <meta> or <link rel="canonical"> elements directly.
 * All SEO tags are generated via react-helmet-async in SEOHead.tsx.
 *
 * We keep ONLY an instant document.title update (single node) for fast feedback
 * while route-level components fetch data and render <SEOHead />.
 */

// Spanish month names for date extraction
const SPANISH_MONTHS: Record<string, string> = {
  'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
  'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
  'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
};

// Capitalize first letter of each word
const toTitleCase = (str: string): string => {
  return str
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface ParsedSlug {
  artistName: string;
  cityName: string;
  year: string;
  month: string;
  isFestival: boolean;
}

/**
 * Parse event slug to extract artist, city, and date
 * Slug format: artista-ciudad-mes-año or festival-name-ciudad-mes-año
 */
const parseEventSlug = (slug: string, isFestival: boolean): ParsedSlug => {
  const parts = slug.split('-');
  
  // Find year (4 digits at end)
  const yearIndex = parts.findIndex(p => /^20\d{2}$/.test(p));
  const year = yearIndex !== -1 ? parts[yearIndex] : new Date().getFullYear().toString();
  
  // Find month (Spanish month name before year)
  const monthIndex = parts.findIndex(p => SPANISH_MONTHS[p.toLowerCase()]);
  const month = monthIndex !== -1 ? parts[monthIndex] : '';
  
  // City is usually before month, artist/festival name is everything before city
  // Typical: bad-bunny-madrid-mayo-2026
  let artistEndIndex = parts.length;
  
  // Find where the location/date info starts (usually Spanish city names)
  const commonCities = ['madrid', 'barcelona', 'sevilla', 'valencia', 'bilbao', 'malaga', 
    'zaragoza', 'murcia', 'palma', 'granada', 'alicante', 'cordoba', 'santiago', 'pamplona',
    'san-sebastian', 'donostia', 'santander', 'gijon', 'vigo', 'cadiz', 'ibiza', 'tenerife',
    'las-palmas', 'a-coruna', 'benidorm', 'marbella', 'tarragona', 'lleida', 'girona'];
  
  const cityIndex = parts.findIndex(p => commonCities.includes(p.toLowerCase()));
  
  if (cityIndex !== -1) {
    artistEndIndex = cityIndex;
  } else if (monthIndex !== -1) {
    artistEndIndex = monthIndex;
  } else if (yearIndex !== -1) {
    artistEndIndex = yearIndex;
  }
  
  const artistName = toTitleCase(parts.slice(0, artistEndIndex).join(' '));
  const cityName = cityIndex !== -1 ? toTitleCase(parts[cityIndex]) : 'España';
  
  return {
    artistName,
    cityName,
    year,
    month: month ? toTitleCase(month) : '',
    isFestival
  };
};

/**
 * Generate SEO title based on page type and parsed slug
 */
const generateSEOTitle = (parsed: ParsedSlug): string => {
  const { artistName, cityName, year, isFestival } = parsed;
  
  if (isFestival) {
    return `${artistName} ${year} - Entradas y Hotel | FEELOMOVE+`;
  }
  
  // Concert format: Entradas [Artista] [Ciudad] [Año] | FEELOMOVE+
  return `Entradas ${artistName} ${cityName} ${year} | FEELOMOVE+`;
};

/**
 * Generate SEO description based on page type
 */
const generateSEODescription = (parsed: ParsedSlug): string => {
  const { artistName, cityName, year, isFestival } = parsed;
  
  if (isFestival) {
    return `Compra tus entradas para ${artistName} ${year}. Incluye opciones de alojamiento cerca del festival. ¡Reserva tu experiencia musical completa!`;
  }
  
  // Concert format
  return `Compra tus entradas para el concierto de ${artistName} en ${cityName}. Incluye opciones de alojamiento y transporte. ¡Reserva tu experiencia musical completa!`;
};

/**
 * Generate artist page SEO
 */
const generateArtistSEO = (artistSlug: string): { title: string; description: string } => {
  const artistName = toTitleCase(artistSlug.replace(/-/g, ' '));
  const year = new Date().getFullYear();
  
  return {
    title: `${artistName}: Conciertos, Gira y Entradas ${year} | FEELOMOVE+`,
    description: `Consulta todas las fechas confirmadas de la gira de ${artistName}. Información actualizada de conciertos y venta de entradas oficial.`
  };
};

/**
 * Main hook - call this on route pages to instantly inject SEO tags
 * This runs BEFORE React Helmet and BEFORE Supabase data loads
 */
export const useInstantSEO = () => {
  const location = useLocation();
  
  // useLayoutEffect runs synchronously before browser paint
  useLayoutEffect(() => {
    const pathname = location.pathname;
    const cleanPath = pathname.split('?')[0].split('#')[0];
    
    let title = 'FEELOMOVE+ | Entradas Conciertos y Festivales España';
    
    // Concert detail page: /concierto/:slug or /conciertos/:slug
    if (cleanPath.startsWith('/concierto/') || cleanPath.startsWith('/conciertos/')) {
      const slug = cleanPath.replace('/concierto/', '').replace('/conciertos/', '');
      if (slug) {
        const parsed = parseEventSlug(slug, false);
        title = generateSEOTitle(parsed);
        // description handled by SEOHead.tsx
      }
    }
    
    // Festival detail page: /festival/:slug
    else if (cleanPath.startsWith('/festival/')) {
      const slug = cleanPath.replace('/festival/', '');
      if (slug) {
        const parsed = parseEventSlug(slug, true);
        title = generateSEOTitle(parsed);
        // description handled by SEOHead.tsx
      }
    }
    
    // Artist page: /conciertos/:artistSlug
    else if (cleanPath.startsWith('/conciertos/') && cleanPath !== '/conciertos') {
      const artistSlug = cleanPath.replace('/conciertos/', '');
      if (artistSlug) {
        const seo = generateArtistSEO(artistSlug);
        title = seo.title;
        // description handled by SEOHead.tsx
      }
    }
    
    // Destination page: /destinos/:city
    else if (cleanPath.startsWith('/destinos/') && cleanPath !== '/destinos') {
      const citySlug = cleanPath.replace('/destinos/', '');
      if (citySlug) {
        const cityName = toTitleCase(citySlug.replace(/-/g, ' '));
        const year = new Date().getFullYear();
        title = `Conciertos en ${cityName} ${year} | FEELOMOVE+`;
        // description handled by SEOHead.tsx
      }
    }
    
    // IMPORTANT: Only update <title>. Do NOT write meta/canonical here;
    // that would create duplicates alongside react-helmet-async (data-rh="true").
    document.title = title;
    
  }, [location.pathname]);
};

export default useInstantSEO;
