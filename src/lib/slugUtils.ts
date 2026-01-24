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
  'aranda-de-duero', 'benicassim', 'villarrobledo', 'pamplona-iruna'
];

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
 * Extracts city from slug
 */
export const extractCityFromSlug = (slug: string): string | null => {
  const parts = slug.split('-');
  
  for (let i = parts.length - 1; i >= 0; i--) {
    // Check multi-word city (e.g., "pamplona-iruna")
    for (let j = 1; j <= 2 && i - j >= 0; j++) {
      const possibleCity = parts.slice(i - j, i + 1).join('-');
      if (SPANISH_CITIES.includes(possibleCity.toLowerCase())) {
        return possibleCity;
      }
    }
    // Check single word city
    if (SPANISH_CITIES.includes(parts[i].toLowerCase())) {
      return parts[i];
    }
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
  if (numericMatch && parseInt(numericMatch[1]) <= 99) {
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
      hasLegacySuffix: true,
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
