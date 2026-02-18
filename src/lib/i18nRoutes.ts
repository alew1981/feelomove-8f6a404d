/**
 * i18n Route Mapping - Bidirectional ES ↔ EN route segments
 * 
 * ES routes are the canonical (no prefix).
 * EN routes live under /en/ prefix with translated segments.
 */

export type Locale = 'es' | 'en';

/** Route segment translations: ES key → EN value */
const ROUTE_SEGMENTS: Record<string, string> = {
  conciertos: 'tickets',
  festivales: 'festivals',
  destinos: 'destinations',
  artistas: 'artists',
  favoritos: 'favorites',
  inspiration: 'inspiration',
  about: 'about',
};

/** Reverse map: EN → ES */
const ROUTE_SEGMENTS_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTE_SEGMENTS).map(([es, en]) => [en, es])
);

/**
 * Translate a route segment between locales
 */
export function translateSegment(segment: string, targetLocale: Locale): string {
  if (targetLocale === 'en') {
    return ROUTE_SEGMENTS[segment] || segment;
  }
  return ROUTE_SEGMENTS_REVERSE[segment] || segment;
}

/**
 * Get the ES route segments (keys)
 */
export function getESSegments(): string[] {
  return Object.keys(ROUTE_SEGMENTS);
}

/**
 * Get the EN route segments (values)
 */
export function getENSegments(): string[] {
  return Object.values(ROUTE_SEGMENTS);
}

/**
 * Detect locale from a pathname
 */
export function detectLocaleFromPath(pathname: string): Locale {
  return pathname.startsWith('/en/') || pathname === '/en' ? 'en' : 'es';
}

/**
 * Strip locale prefix from pathname, returning the bare path
 * /en/tickets/coldplay → /tickets/coldplay
 * /conciertos/coldplay → /conciertos/coldplay
 */
export function stripLocalePrefix(pathname: string): string {
  if (pathname.startsWith('/en/')) return pathname.slice(3);
  if (pathname === '/en') return '/';
  return pathname;
}

/**
 * Build a localized path from an ES canonical path
 * 
 * localePath('/conciertos/slug', 'en') → '/en/tickets/slug'
 * localePath('/conciertos/slug', 'es') → '/conciertos/slug'
 * localePath('/', 'en') → '/en/'
 */
export function localePath(esPath: string, locale: Locale): string {
  if (locale === 'es') return esPath;

  // Home
  if (esPath === '/') return '/en/';

  const parts = esPath.split('/').filter(Boolean); // e.g. ['conciertos', 'slug']
  if (parts.length === 0) return '/en/';

  // Translate first segment
  const translatedFirst = translateSegment(parts[0], 'en');
  const rest = parts.slice(1).join('/');

  return `/en/${translatedFirst}${rest ? `/${rest}` : ''}`;
}

/**
 * Convert any localized path to its ES canonical equivalent
 * 
 * toCanonicalPath('/en/tickets/slug') → '/conciertos/slug'
 * toCanonicalPath('/conciertos/slug') → '/conciertos/slug'
 */
export function toCanonicalPath(pathname: string): string {
  const locale = detectLocaleFromPath(pathname);
  if (locale === 'es') return pathname;

  const bare = stripLocalePrefix(pathname); // /tickets/slug
  const parts = bare.split('/').filter(Boolean);
  if (parts.length === 0) return '/';

  const esFirst = translateSegment(parts[0], 'es');
  const rest = parts.slice(1).join('/');

  return `/${esFirst}${rest ? `/${rest}` : ''}`;
}

/**
 * Generate the alternate URL for hreflang tags
 * Given current path and target locale, returns the full path in that locale
 */
export function getAlternateUrl(
  currentPath: string,
  targetLocale: Locale,
  baseUrl = 'https://feelomove.com'
): string {
  const canonical = toCanonicalPath(currentPath);
  const translated = localePath(canonical, targetLocale);
  return `${baseUrl}${translated}`;
}
