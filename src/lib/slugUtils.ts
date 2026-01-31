/**
 * URL Slug Utilities for SEO-Friendly Event URLs
 * 
 * Standard URL Format:
 * - Festivals: /festival/[nombre-festival]-[ciudad]-[dia]-[mes]-[año]
 * - Concerts: /concierto/[artista]-[ciudad]-[dia]-[mes]-[año]
 * 
 * Fallback: [nombre]-[ciudad]-2026 (if no exact date)
 * Prohibited: Numeric suffixes (-1, -2), uppercase letters, noise words
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
 * CRITICAL: Noise patterns that ALWAYS require redirect
 * These patterns indicate a legacy/dirty URL that should NEVER render directly
 */
const NOISE_WORDS = [
  // VIP packages
  'paquetes-vip', 'paquete-vip', 'vip-paquetes', 'vip-paquete',
  'vip-packages', 'vip-package',
  // Tours
  'world-tour', 'tour-mundial', 'gira-mundial',
  'everyone-s-star', 'everyones-star',
  // Ticket types
  'tickets', 'ticket', 'entradas', 'entrada',
  'ticketless', 'upgrade', 'voucher',
  // Transport/Services (CRITICAL: These should never be indexed)
  'parking', 'plaza-de-parking', 'shuttle', 'transfer',
  'bus', 'autobus', 'servicio-de-autobus', 'transporte',
  // Other noise
  'feed', 'rss',
  'premium', 'gold', 'platinum', 'silver',
  'general', 'pista', 'grada', 'tribuna',
  'zona-a', 'zona-b', 'zona-c', 'zona-vip',
  // Hotel packages
  'hotel-package', 'hotel-'
];

/**
 * Regex patterns for noise detection (compiled once)
 */
const NOISE_REGEX = new RegExp(
  `(${NOISE_WORDS.map(w => w.replace(/-/g, '\\-?')).join('|')})`,
  'i'
);

/**
 * Numeric suffix pattern (end of slug): -1, -2, -99 but NOT years like -2026
 */
const NUMERIC_SUFFIX_REGEX = /-(\d{1,2})$/;

// ============================================
// PERFORMANCE: FAST PATH VALIDATORS
// ============================================

/**
 * CRITICAL: Detects if a slug contains noise that requires cleanup
 * This runs BEFORE any DB query to intercept dirty URLs
 */
export const hasNoisePatterns = (slug: string): boolean => {
  const lower = slug.toLowerCase();
  
  // Check for any noise word
  if (NOISE_REGEX.test(lower)) {
    console.log(`[SEO Debug] Noise detected in slug: ${slug}`);
    return true;
  }
  
  // Check for numeric suffix (NOT years)
  if (NUMERIC_SUFFIX_REGEX.test(lower) && !/-20[2-9]\d$/.test(lower)) {
    console.log(`[SEO Debug] Numeric suffix detected in slug: ${slug}`);
    return true;
  }
  
  return false;
};

/**
 * FAST CHECK: Is this a clean SEO URL that needs no processing?
 * A clean URL:
 * - Has no noise patterns (paquetes-vip, tour, tickets, etc.)
 * - Has no numeric suffixes (-1, -2)
 * - Ends with a year OR Spanish date format
 * - Is all lowercase
 */
const VALID_SEO_PATTERN = /^[a-z0-9-]+-(20[2-9]\d)$|^[a-z0-9-]+-\d{1,2}-(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)-(20[2-9]\d)$/;

export const isCleanSeoUrl = (slug: string): boolean => {
  // Quick fail conditions
  if (!slug) return false;
  
  // Uppercase = dirty
  if (/[A-Z]/.test(slug)) {
    console.log(`[SEO Debug] Uppercase detected: ${slug}`);
    return false;
  }
  
  // Double hyphens = dirty
  if (slug.includes('--')) {
    console.log(`[SEO Debug] Double hyphens detected: ${slug}`);
    return false;
  }
  
  // CRITICAL: Check for noise patterns FIRST
  if (hasNoisePatterns(slug)) {
    return false;
  }
  
  // Placeholder dates = dirty
  if (slug.includes('-9999')) {
    console.log(`[SEO Debug] Placeholder date detected: ${slug}`);
    return false;
  }
  
  // Valid pattern check (must end with year or Spanish date)
  const isValid = VALID_SEO_PATTERN.test(slug);
  if (!isValid) {
    console.log(`[SEO Debug] Does not match SEO pattern: ${slug}`);
  }
  return isValid;
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

export interface CleanedSlugResult {
  cleanedSlug: string;
  wasModified: boolean;
  removedParts: string[];
  artistSlug: string | null;
  citySlug: string | null;
}

/**
 * CRITICAL: Cleans slug without database queries
 * This is the main cleanup function that strips all noise
 */
export const cleanSlugClientSide = (slug: string): CleanedSlugResult => {
  console.log(`[SEO Debug] Cleaning slug: ${slug}`);
  
  let working = slug.toLowerCase();
  let wasModified = false;
  const removedParts: string[] = [];
  
  // Remove trailing feed (WordPress legacy)
  if (/\/feed\/?$/.test(working) || /-feed$/.test(working)) {
    working = working.replace(/\/feed\/?$/, '').replace(/-feed$/, '');
    wasModified = true;
    removedParts.push('feed');
  }
  
  // Remove all noise words (order matters - remove longer patterns first)
  for (const noiseWord of NOISE_WORDS.sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`-?${noiseWord.replace(/-/g, '-?')}-?`, 'gi');
    if (pattern.test(working)) {
      working = working.replace(pattern, '-');
      wasModified = true;
      removedParts.push(noiseWord);
    }
  }
  
  // Remove numeric suffix (-1, -2, -99) but NOT years
  const numericSuffix = working.match(/-(\d{1,2})$/);
  if (numericSuffix && !/-20[2-9]\d$/.test(working)) {
    working = working.replace(/-\d{1,2}$/, '');
    wasModified = true;
    removedParts.push(`-${numericSuffix[1]}`);
  }
  
  // Remove placeholder years
  if (working.includes('-9999')) {
    working = working.replace(/-9999(-\d{2})?(-\d{2})?$/, '');
    wasModified = true;
    removedParts.push('-9999');
  }
  
  // Clean double hyphens
  while (working.includes('--')) {
    working = working.replace(/--+/g, '-');
    wasModified = true;
  }
  
  // Trim edge hyphens
  if (working.startsWith('-') || working.endsWith('-')) {
    working = working.replace(/^-+|-+$/g, '');
    wasModified = true;
  }
  
  // Extract city (for fuzzy search)
  const city = extractCityFromSlug(working);
  
  // Extract artist (everything before city and date)
  let artistSlug: string | null = null;
  if (city) {
    const cityIndex = working.lastIndexOf(`-${city}`);
    if (cityIndex > 0) {
      artistSlug = working.substring(0, cityIndex);
    }
  }
  
  console.log(`[SEO Debug] Cleaned: ${slug} → ${working} (modified: ${wasModified}, removed: ${removedParts.join(', ')})`);
  
  return { 
    cleanedSlug: working, 
    wasModified, 
    removedParts,
    artistSlug,
    citySlug: city
  };
};

// ============================================
// REDIRECT CACHE (MEMOIZATION)
// ============================================

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

// Pre-populate cache with known high-traffic artists
const HIGH_TRAFFIC_ARTISTS = [
  '5-seconds-of-summer', '5sos', 'bad-bunny', 'rosalia', 'morat',
  'duki', 'rauw-alejandro', 'karol-g', 'shakira', 'taylor-swift',
  'coldplay', 'ed-sheeran', 'aitana', 'dani-fernandez', 'lola-indigo'
];

export const isHighTrafficArtist = (slug: string): boolean => {
  const lower = slug.toLowerCase();
  return HIGH_TRAFFIC_ARTISTS.some(artist => lower.includes(artist));
};

// ============================================
// EXISTING UTILITIES (OPTIMIZED)
// ============================================

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
  
  if (date.getFullYear() === 9999) {
    const nextYear = new Date().getFullYear() + 1;
    return `${normalizedName}-${normalizedCity}-${nextYear}`;
  }
  
  const day = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  
  return `${normalizedName}-${normalizedCity}-${day}-${month}-${year}`;
};

export const isFestivalSlug = (slug: string): boolean => {
  const slugLower = slug.toLowerCase();
  return FESTIVAL_KEYWORDS.some(keyword => slugLower.includes(keyword));
};

export const extractCityFromSlug = (slug: string): string | null => {
  const parts = slug.toLowerCase().split('-');
  const partsLen = parts.length;
  
  // Start from the end (cities usually at end, before date)
  for (let i = partsLen - 1; i >= Math.max(0, partsLen - 6); i--) {
    // Skip if this looks like a date part
    if (/^\d+$/.test(parts[i]) || SPANISH_MONTHS.includes(parts[i])) continue;
    
    // Check multi-word city
    if (i >= 2) {
      const threeWord = parts.slice(i - 2, i + 1).join('-');
      if (SPANISH_CITIES.includes(threeWord)) return threeWord;
    }
    if (i >= 1) {
      const twoWord = parts.slice(i - 1, i + 1).join('-');
      if (SPANISH_CITIES.includes(twoWord)) return twoWord;
    }
    if (SPANISH_CITIES.includes(parts[i])) return parts[i];
  }
  return null;
};

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
  
  // Check for Spanish month date format
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
  
  // Check for numeric suffix
  const numericSuffixPattern = /-(\d{1,2})$/;
  const numericMatch = workingSlug.match(numericSuffixPattern);
  if (numericMatch && parseInt(numericMatch[1]) <= 99 && !/-20[2-9]\d$/.test(workingSlug)) {
    hasNumericSuffix = true;
    workingSlug = workingSlug.replace(numericSuffixPattern, '');
  }
  
  // Check for placeholder year
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
  
  // Check for ISO date format
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
  
  // Check for year-only suffix
  const yearPattern = /-(20[2-9]\d)$/;
  const yearMatch = workingSlug.match(yearPattern);
  if (yearMatch) {
    return {
      baseSlug: workingSlug.replace(yearPattern, ''),
      date: null,
      hasLegacySuffix: false,
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

export const getEventUrl = (
  slug: string,
  eventType: string | null
): string => {
  const isFestival = eventType === 'festival' || isFestivalSlug(slug);
  const prefix = isFestival ? '/festival' : '/concierto';
  return `${prefix}/${slug}`;
};

export const generateEventUrl = (
  name: string,
  city: string,
  eventDate: Date | string | null,
  eventType: string | null
): string => {
  const slug = generateSeoSlug(name, city, eventDate);
  return getEventUrl(slug, eventType);
};

export const isValidSeoSlug = (slug: string): boolean => {
  if (slug !== slug.toLowerCase()) return false;
  if (/-\d{1,2}$/.test(slug) && !/-20[2-9]\d$/.test(slug)) return false;
  if (/-9999/.test(slug)) return false;
  if (/--/.test(slug)) return false;
  if (hasNoisePatterns(slug)) return false;
  return true;
};

export const cleanSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .replace(/-9999(-\d{2})?(-\d{2})?$/, '')
    .replace(/-\d{1,2}$/, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
};
