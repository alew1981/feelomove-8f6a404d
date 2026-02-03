import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * CRITICAL SEO HOOK: Injects meta tags INSTANTLY from URL slug before Supabase data loads.
 * This prevents Google from seeing duplicate/empty meta tags on SPA pages.
 * 
 * Strategy:
 * 1. Parse the slug from URL immediately
 * 2. Generate SEO-optimized title/description from slug patterns
 * 3. Inject into DOM using useLayoutEffect (synchronous, before paint)
 * 4. Set canonical URL cleaned of all query params
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
 * Clean canonical URL - strips all query params and tracking
 */
const getCleanCanonical = (pathname: string): string => {
  const siteUrl = 'https://feelomove.com';
  
  // Clean the path
  let cleanPath = pathname
    .toLowerCase()
    .replace(/\/+$/, ''); // Remove trailing slashes
  
  // Remove numeric suffix (-1, -2) but NOT years (-2026)
  if (/-\d{1,2}$/.test(cleanPath) && !/-20[2-9]\d$/.test(cleanPath)) {
    cleanPath = cleanPath.replace(/-\d{1,2}$/, '');
  }
  
  return `${siteUrl}${cleanPath}`;
};

/**
 * Inject meta tag into document head
 */
const setMetaTag = (name: string, content: string, isProperty = false): void => {
  const attribute = isProperty ? 'property' : 'name';
  let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  
  tag.setAttribute('content', content);
};

/**
 * Set or update canonical link
 */
const setCanonical = (href: string): void => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
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
    let description = 'Compra entradas para conciertos y festivales en España. Reserva hotel cerca del evento.';
    
    // Concert detail page: /concierto/:slug
    if (cleanPath.startsWith('/concierto/')) {
      const slug = cleanPath.replace('/concierto/', '');
      if (slug) {
        const parsed = parseEventSlug(slug, false);
        title = generateSEOTitle(parsed);
        description = generateSEODescription(parsed);
      }
    }
    
    // Festival detail page: /festival/:slug
    else if (cleanPath.startsWith('/festival/')) {
      const slug = cleanPath.replace('/festival/', '');
      if (slug) {
        const parsed = parseEventSlug(slug, true);
        title = generateSEOTitle(parsed);
        description = generateSEODescription(parsed);
      }
    }
    
    // Artist page: /conciertos/:artistSlug
    else if (cleanPath.startsWith('/conciertos/') && cleanPath !== '/conciertos') {
      const artistSlug = cleanPath.replace('/conciertos/', '');
      if (artistSlug) {
        const seo = generateArtistSEO(artistSlug);
        title = seo.title;
        description = seo.description;
      }
    }
    
    // Destination page: /destinos/:city
    else if (cleanPath.startsWith('/destinos/') && cleanPath !== '/destinos') {
      const citySlug = cleanPath.replace('/destinos/', '');
      if (citySlug) {
        const cityName = toTitleCase(citySlug.replace(/-/g, ' '));
        const year = new Date().getFullYear();
        title = `Conciertos en ${cityName} ${year} | FEELOMOVE+`;
        description = `Descubre todos los conciertos y festivales en ${cityName}. Compra entradas + hotel para los mejores eventos musicales.`;
      }
    }
    
    // Set document title immediately
    document.title = title;
    
    // Inject meta tags synchronously
    setMetaTag('description', description);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    
    // CRITICAL: Set canonical URL (cleaned of query params)
    const canonical = getCleanCanonical(pathname);
    setCanonical(canonical);
    setMetaTag('og:url', canonical, true);
    
  }, [location.pathname]);
};

export default useInstantSEO;
