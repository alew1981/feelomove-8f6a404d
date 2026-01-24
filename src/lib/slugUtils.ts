/**
 * URL Slug Utilities for SEO-Friendly Event URLs
 * 
 * Standard URL Format:
 * - Festivals: /festival/[nombre-festival]-[ciudad]-[dia]-[mes]-[año]
 * - Concerts: /concierto/[artista]-[ciudad]-[dia]-[mes]-[año]
 * 
 * Fallback: [nombre]-[ciudad]-2026 (if no exact date)
 * Prohibited: Numeric suffixes (-1, -2), uppercase letters
 */

const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Known festival keywords for detection
 */
const FESTIVAL_KEYWORDS = [
  'festival', 'fest', 'sonorama', 'primavera-sound', 'mad-cool', 'madcool',
  'bbk-live', 'arenal-sound', 'viña-rock', 'vina-rock', 'resurrection',
  'low-festival', 'dcode', 'cabo-de-plata', 'cruilla', 'vida-festival',
  'tomorrowland', 'ultra', 'medusa', 'weekend-beach', 'dream-beach',
  'rototom', 'starlite', 'share-festival', 'mallorca-live', 'cala-mijas',
  'abono', 'bono-festival', 'pase-festival', 'camping', 'glamping'
];

/**
 * Spanish cities for slug parsing
 */
const SPANISH_CITIES = [
  'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga', 'zaragoza',
  'murcia', 'palma', 'alicante', 'cordoba', 'valladolid', 'vigo', 'gijon',
  'vitoria', 'granada', 'oviedo', 'santander', 'pamplona', 'almeria',
  'san-sebastian', 'donostia', 'burgos', 'albacete', 'salamanca', 'logrono',
  'badajoz', 'huelva', 'lleida', 'tarragona', 'leon', 'cadiz', 'jaen',
  'a-coruna', 'coruna', 'santiago', 'ferrol', 'girona', 'reus', 'mataro',
  'sitges', 'irun', 'barakaldo', 'getxo', 'fuengirola', 'marbella', 'benidorm',
  'aranda-de-duero', 'benicassim', 'villarrobledo', 'pamplona-iruna', 'chiclana'
];

/**
 * Noise words to strip from slugs (client-side cleanup)
 */
const NOISE_PATTERNS = [
  /-paquetes?-vip$/i,
  /-tickets?$/i,
  /-entradas?$/i,
  /-parking$/i,
  /-bus$/i,
  /-feed\/?$/i,
  /-vip$/i,
  /-premium$/i,
  /-general$/i,
  /-zona-\w+$/i
];

// ============================================
// PERFORMANCE: FAST PATH VALIDATORS
// ============================================

/**
 * FAST CHECK: Is this a clean SEO URL that needs no processing?
 * Pattern: /concierto/*-2026 or /festival/*-2026 with Spanish month
 */
const VALID_SEO_PATTERN = /^[a-z0-9-]+-(20[2-9]\d)$|^[a-z0-9-]+-\d{1,2}-(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)-(20[2-9]\d)$/;

export const isCleanSeoUrl = (slug: string): boolean => {
  // Quick fail conditions
  if (!slug || slug.includes('--') || /[A-Z]/.test(slug)) return false;
  
  // Check for prohibited numeric suffixes (not years)
  if (/-\d{1,2}$/.test(slug) && !/-20[2-9]\d$/.test(slug)) return false;
  
  // Check for placeholder dates
  if (slug.includes('-9999')) return false;
  
  // Check for noise patterns
  if (NOISE_PATTERNS.some(p => p.test(slug))) return false;
  
  // Valid pattern check
  return VALID_SEO_PATTERN.test(slug);
};

/**
 * FAST CHECK: Does the URL have tracking parameters?
 */
export const hasTrackingParams = (search: string): boolean => {
  if (!search) return false;
  const trackingParams = ['utm_', 'fbclid', 'gclid', 'msclkid', 'ref', 'source'];
  const lower = search.toLowerCase();
  return trackingParams.some(p => lower.includes(p));
};

// ============================================
// CLIENT-SIDE SLUG CLEANUP (NO DB QUERIES)
// ============================================

/**
 * Cleans slug without database queries
 * Returns { cleanedSlug, wasModified }
 */
export interface CleanedSlugResult {
  cleanedSlug: string;
  wasModified: boolean;
  removedSuffix: string | null;
}

export const cleanSlugClientSide = (slug: string): CleanedSlugResult => {
  let working = slug.toLowerCase();
  let wasModified = false;
  let removedSuffix: string | null = null;
  
  // Remove trailing feed (WordPress legacy)
  if (/\/feed\/?$/.test(working)) {
    working = working.replace(/\/feed\/?$/, '');
    wasModified = true;
    removedSuffix = '/feed';
  }
  
  // Remove numeric suffix (-1, -2, -99) but NOT years
  const numericSuffix = working.match(/-(\d{1,2})$/);
  if (numericSuffix && !/-20[2-9]\d$/.test(working)) {
    working = working.replace(/-\d{1,2}$/, '');
    wasModified = true;
    removedSuffix = `-${numericSuffix[1]}`;
  }
  
  // Remove noise patterns
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(working)) {
      const match = working.match(pattern);
      working = working.replace(pattern, '');
      wasModified = true;
      removedSuffix = match?.[0] || null;
    }
  }
  
  // Remove placeholder years
  if (working.includes('-9999')) {
    working = working.replace(/-9999(-\d{2})?(-\d{2})?$/, '');
    wasModified = true;
    removedSuffix = '-9999';
  }
  
  // Clean double hyphens
  if (working.includes('--')) {
    working = working.replace(/--+/g, '-');
    wasModified = true;
  }
  
  // Trim edge hyphens
  if (working.startsWith('-') || working.endsWith('-')) {
    working = working.replace(/^-|-$/g, '');
    wasModified = true;
  }
  
  return { cleanedSlug: working, wasModified, removedSuffix };
};

// ============================================
// REDIRECT CACHE (MEMOIZATION)
// ============================================

/**
 * In-memory cache for common redirects (avoids DB lookup)
 * Key: old_slug, Value: { new_slug, event_id, event_type }
 */
interface CachedRedirect {
  new_slug: string;
  event_id: string;
  event_type: string;
}

const redirectCache = new Map<string, CachedRedirect | null>();
const CACHE_MAX_SIZE = 500;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
let cacheTimestamp = Date.now();

export const getCachedRedirect = (slug: string): CachedRedirect | null | undefined => {
  // Check if cache is stale
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    redirectCache.clear();
    cacheTimestamp = Date.now();
    return undefined;
  }
  return redirectCache.get(slug);
};

export const setCachedRedirect = (slug: string, redirect: CachedRedirect | null): void => {
  // Prevent cache from growing too large
  if (redirectCache.size >= CACHE_MAX_SIZE) {
    const firstKey = redirectCache.keys().next().value;
    if (firstKey) redirectCache.delete(firstKey);
  }
  redirectCache.set(slug, redirect);
};

// ============================================
// EXISTING UTILITIES (OPTIMIZED)
// ============================================

/**
 * Normalizes text to slug format (lowercase, no accents, hyphens)
 */
export const normalizeToSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Generates SEO-friendly slug with Spanish date
 */
export const generateSeoSlug = (
  artistOrFestival: string,
  city: string,
  eventDate: Date | string | null
): string => {
  const normalizedName = normalizeToSlug(artistOrFestival);
  const normalizedCity = normalizeToSlug(city);
  
  if (!eventDate) {
    const currentYear = new Date().getFullYear();
    return `${normalizedName}-${normalizedCity}-${currentYear}`;
  }
  
  const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  
  // Handle placeholder dates (9999)
  if (date.getFullYear() === 9999) {
    const nextYear = new Date().getFullYear() + 1;
    return `${normalizedName}-${normalizedCity}-${nextYear}`;
  }
  
  const day = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  
  return `${normalizedName}-${normalizedCity}-${day}-${month}-${year}`;
};

/**
 * Checks if a slug appears to be a festival
 */
export const isFestivalSlug = (slug: string): boolean => {
  const slugLower = slug.toLowerCase();
  return FESTIVAL_KEYWORDS.some(keyword => slugLower.includes(keyword));
};

/**
 * Extracts city from slug (optimized with early exit)
 */
export const extractCityFromSlug = (slug: string): string | null => {
  const parts = slug.toLowerCase().split('-');
  const partsLen = parts.length;
  
  // Start from the end (cities usually at end)
  for (let i = partsLen - 1; i >= Math.max(0, partsLen - 5); i--) {
    // Check multi-word city (e.g., "pamplona-iruna", "aranda-de-duero")
    if (i >= 2) {
      const threeWord = parts.slice(i - 2, i + 1).join('-');
      if (SPANISH_CITIES.includes(threeWord)) return threeWord;
    }
    if (i >= 1) {
      const twoWord = parts.slice(i - 1, i + 1).join('-');
      if (SPANISH_CITIES.includes(twoWord)) return twoWord;
    }
    // Single word city
    if (SPANISH_CITIES.includes(parts[i])) return parts[i];
  }
  return null;
};

/**
 * Parses a legacy slug to extract components
 */
export interface ParsedSlug {
  baseSlug: string;
  date: string | null;
  hasLegacySuffix: boolean;
  hasNumericSuffix: boolean;
  isPlaceholderDate: boolean;
  isSpanishDateFormat: boolean;
}

export const parseLegacySlug = (slug: string): ParsedSlug => {
  let workingSlug = slug;
  let hasNumericSuffix = false;
  
  // Check for Spanish month date format: -DD-month-YYYY
  const spanishMonthPattern = new RegExp(
    `-(\\d{1,2})-(${SPANISH_MONTHS.join('|')})-(20[2-9]\\d)$`,
    'i'
  );
  const spanishMonthMatch = workingSlug.match(spanishMonthPattern);
  
  if (spanishMonthMatch) {
    const baseSlug = workingSlug.replace(spanishMonthPattern, '');
    const day = spanishMonthMatch[1].padStart(2, '0');
    const monthName = spanishMonthMatch[2].toLowerCase();
    const year = spanishMonthMatch[3];
    const monthNum = String(SPANISH_MONTHS.indexOf(monthName) + 1).padStart(2, '0');
    
    return {
      baseSlug,
      date: `${year}-${monthNum}-${day}`,
      hasLegacySuffix: false,
      hasNumericSuffix: false,
      isPlaceholderDate: false,
      isSpanishDateFormat: true
    };
  }
  
  // Check for numeric suffix (-1, -2, etc.) - PROHIBITED
  const numericSuffixPattern = /-(\d{1,2})$/;
  const numericMatch = workingSlug.match(numericSuffixPattern);
  if (numericMatch && parseInt(numericMatch[1]) <= 99 && !/-20[2-9]\d$/.test(workingSlug)) {
    hasNumericSuffix = true;
    workingSlug = workingSlug.replace(numericSuffixPattern, '');
  }
  
  // Check for placeholder year (-9999)
  const placeholderPattern = /-9999(-\d{2})?(-\d{2})?$/;
  if (placeholderPattern.test(workingSlug)) {
    return {
      baseSlug: workingSlug.replace(placeholderPattern, ''),
      date: null,
      hasLegacySuffix: true,
      hasNumericSuffix,
      isPlaceholderDate: true,
      isSpanishDateFormat: false
    };
  }
  
  // Check for YYYY-MM-DD format
  const isoDatePattern = /-(20[2-9]\d)-(\d{2})-(\d{2})$/;
  const isoMatch = workingSlug.match(isoDatePattern);
  if (isoMatch) {
    return {
      baseSlug: workingSlug.replace(isoDatePattern, ''),
      date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      hasLegacySuffix: true,
      hasNumericSuffix,
      isPlaceholderDate: false,
      isSpanishDateFormat: false
    };
  }
  
  // Check for year-only suffix (-2026)
  const yearPattern = /-(20[2-9]\d)$/;
  const yearMatch = workingSlug.match(yearPattern);
  if (yearMatch) {
    return {
      baseSlug: workingSlug.replace(yearPattern, ''),
      date: null,
      hasLegacySuffix: false, // Year-only is valid
      hasNumericSuffix,
      isPlaceholderDate: false,
      isSpanishDateFormat: false
    };
  }
  
  return {
    baseSlug: hasNumericSuffix ? workingSlug : slug,
    date: null,
    hasLegacySuffix: hasNumericSuffix,
    hasNumericSuffix,
    isPlaceholderDate: false,
    isSpanishDateFormat: false
  };
};

/**
 * Generates the correct URL for an event
 */
export const getEventUrl = (
  slug: string,
  eventType: string | null
): string => {
  const isFestival = eventType === 'festival' || isFestivalSlug(slug);
  const prefix = isFestival ? '/festival' : '/concierto';
  return `${prefix}/${slug}`;
};

/**
 * Generates URL with SEO-friendly slug
 */
export const generateEventUrl = (
  name: string,
  city: string,
  eventDate: Date | string | null,
  eventType: string | null
): string => {
  const slug = generateSeoSlug(name, city, eventDate);
  return getEventUrl(slug, eventType);
};

/**
 * Validates that a slug follows SEO standards
 * Returns true if valid, false if it needs cleanup
 */
export const isValidSeoSlug = (slug: string): boolean => {
  // No uppercase
  if (slug !== slug.toLowerCase()) return false;
  
  // No numeric suffix at the end (except year)
  if (/-\d{1,2}$/.test(slug) && !/-20[2-9]\d$/.test(slug)) return false;
  
  // No placeholder year
  if (/-9999/.test(slug)) return false;
  
  // No double hyphens
  if (/--/.test(slug)) return false;
  
  return true;
};

/**
 * Cleans a slug to meet SEO standards
 */
export const cleanSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .replace(/-9999(-\d{2})?(-\d{2})?$/, '')
    .replace(/-\d{1,2}$/, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
};
