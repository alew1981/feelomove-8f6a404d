/**
 * Slug normalization utilities for SEO-friendly URL handling
 * Handles: suffix cleaning, case normalization, and similarity matching
 */

/**
 * Detect if a slug ends with a numeric suffix like -1, -2, -3, etc.
 * These are legacy duplicates that should be redirected to clean versions.
 */
export const hasNumericSuffix = (slug: string): { hasIt: boolean; cleanSlug: string; suffix: string | null } => {
  // Match -N at the end where N is 1-99 (not years like 2025)
  const match = slug.match(/-(\d{1,2})$/);
  
  if (match) {
    const suffix = match[1];
    const suffixNum = parseInt(suffix, 10);
    
    // Only treat as numeric suffix if it's 1-99 (not part of a date)
    if (suffixNum >= 1 && suffixNum <= 99) {
      return {
        hasIt: true,
        cleanSlug: slug.replace(/-\d{1,2}$/, ''),
        suffix
      };
    }
  }
  
  return { hasIt: false, cleanSlug: slug, suffix: null };
};

/**
 * Normalize a slug to lowercase and remove special characters
 * Handles uppercase URLs and malformed slugs
 */
export const normalizeSlug = (slug: string): string => {
  return slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
};

/**
 * Check if the original slug differs from its normalized version
 * (meaning it had uppercase or special chars that need correction)
 */
export const needsNormalization = (slug: string): boolean => {
  return slug !== normalizeSlug(slug);
};

/**
 * Festival keywords that force /festival/ route
 */
export const FESTIVAL_ROUTE_KEYWORDS = [
  'festival', 'fest', 'ribera', 'sonorama', 'primavera-sound', 'mad-cool',
  'madcool', 'bbk-live', 'arenal-sound', 'vina-rock', 'viña-rock',
  'resurrection', 'low-festival', 'dcode', 'cruilla', 'vida-festival',
  'tomorrowland', 'ultra', 'medusa', 'starlite', 'rototom', 'monegros',
  'dreambeach', 'electrobeach', 'aquasella', 'marenostrum', 'boombastic',
  'rio-babel', 'rock-imperium', 'leyendas-del-rock', 'amnesia-festival',
  'abono', 'bono-general', 'pase-festival', 'camping', 'glamping',
  'cap-roig', 'porta-ferrada', 'jazz-festival', 'jazzaldia'
];

/**
 * Check if a slug should be on /festival/ route based on keywords
 */
export const shouldBeFestivalRoute = (slug: string): boolean => {
  const slugLower = slug.toLowerCase();
  
  for (const keyword of FESTIVAL_ROUTE_KEYWORDS) {
    if (slugLower.includes(keyword)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generate search patterns for similarity matching
 * Returns multiple patterns to try in order of preference
 */
export const generateSearchPatterns = (slug: string): string[] => {
  const normalized = normalizeSlug(slug);
  const parts = normalized.split('-');
  const patterns: string[] = [];
  
  // Add full normalized slug
  patterns.push(normalized);
  
  // Add pattern without numeric suffix
  const { hasIt, cleanSlug } = hasNumericSuffix(normalized);
  if (hasIt && cleanSlug) {
    patterns.push(cleanSlug);
  }
  
  // Add prefix patterns (for fuzzy matching)
  if (parts.length >= 3) {
    // First 3 words
    patterns.push(parts.slice(0, 3).join('-'));
    // First 2 words
    patterns.push(parts.slice(0, 2).join('-'));
  }
  
  // Remove duplicates
  return [...new Set(patterns)];
};

/**
 * Clean canonical URL - strip all query parameters
 */
export const cleanCanonicalUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    // If URL parsing fails, just split on ?
    return url.split('?')[0];
  }
};

/**
 * Check if URL has any query parameters
 */
export const hasQueryParams = (url: string): boolean => {
  return url.includes('?');
};

/**
 * Common tracking/marketing parameters to always strip
 */
export const TRACKING_PARAMS = [
  'fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_term', 'utm_content', 'ref', 'source', 'mc_cid', 'mc_eid',
  '_ga', '_gl', 'dclid', 'zanpid', 'msclkid', 'twclid', 'igshid'
];
