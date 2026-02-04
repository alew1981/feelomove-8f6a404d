/**
 * ImageKit Utility Functions
 * 
 * Centralized image optimization using ImageKit CDN
 * 
 * CONFIGURACIÓN:
 * - Ticketmaster origin: s1.ticketm.net → img/tat/dam/...
 * - Supabase origin: wcyjuytpxxqailtixept.supabase.co → storage/v1/object/public/...
 * 
 * FEATURES:
 * - Automatic WebP/AVIF conversion
 * - Responsive srcset generation
 * - Clean URLs for maximum browser caching (no timestamps)
 */

const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/feelomove";

/**
 * Domain mapping for ImageKit origins
 * Maps the original URL domain to the path structure used in ImageKit
 */
/**
 * Origin types for ImageKit processing
 * - 'path': Uses path-based proxy (e.g., Ticketmaster, Supabase)
 * - 'url': Uses full URL proxy (e.g., cupid.travel)
 */
const ORIGIN_MAPPINGS: Array<{
  match: RegExp;
  type: 'path' | 'url';
  extractPath: (url: string) => string | null;
}> = [
  {
    // Ticketmaster: s1.ticketm.net → extracts /img/tat/dam/... or /dam/...
    match: /s1\.ticketm\.net/,
    type: 'path',
    extractPath: (url) => {
      const urlObj = new URL(url);
      return urlObj.pathname;
    }
  },
  {
    // Supabase storage: wcyjuytpxxqailtixept.supabase.co → /storage/v1/object/public/...
    match: /wcyjuytpxxqailtixept\.supabase\.co/,
    type: 'path',
    extractPath: (url) => {
      const urlObj = new URL(url);
      return urlObj.pathname;
    }
  },
  {
    // Cupid.travel hotel images - uses full URL proxy
    match: /static\.cupid\.travel/,
    type: 'url',
    extractPath: (url) => url // Return full URL for proxy
  }
];

/**
 * Check if URL should be optimized via ImageKit
 */
export const shouldOptimize = (url: string): boolean => {
  if (!url) return false;
  if (url.includes("ik.imagekit.io")) return true;
  if (url.startsWith("/")) return false; // Local images
  return ORIGIN_MAPPINGS.some(m => m.match.test(url));
};

/**
 * Check if URL is from a configured ImageKit origin (Ticketmaster or Supabase)
 */
const isConfiguredOrigin = (url: string): boolean => {
  return ORIGIN_MAPPINGS.some(m => m.match.test(url));
};

/**
 * Clean and decode URL if needed
 */
const cleanUrl = (url: string): string => {
  let clean = url;
  try {
    if (clean.includes("%3A") || clean.includes("%2F")) {
      clean = decodeURIComponent(clean);
    }
  } catch {
    // Use original if decode fails
  }
  return clean;
};

/**
 * Extract the path/URL for ImageKit from the original URL
 * Returns { path, type } where type determines the proxy format
 */
const extractImageKitPath = (url: string): { path: string; type: 'path' | 'url' } | null => {
  const clean = cleanUrl(url);
  
  for (const mapping of ORIGIN_MAPPINGS) {
    if (mapping.match.test(clean)) {
      try {
        const path = mapping.extractPath(clean);
        if (path) {
          return { path, type: mapping.type };
        }
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Build ImageKit optimized URL
 * 
 * For configured origins (Ticketmaster/Supabase):
 *   https://ik.imagekit.io/feelomove/tr:w-800,q-80,f-auto/{path}
 * 
 * For non-configured origins:
 *   Returns original URL (no proxy available)
 */
export const getOptimizedUrl = (
  originalUrl: string | undefined | null,
  options: {
    width?: number;
    quality?: number;
    format?: "auto" | "webp" | "avif";
  } = {}
): string => {
  if (!originalUrl) return "/placeholder.svg";
  if (originalUrl.startsWith("/")) return originalUrl;

  const clean = cleanUrl(originalUrl);

  // Skip if already ImageKit URL
  if (clean.includes("ik.imagekit.io")) return clean;

  // Only process URLs from configured origins
  if (!isConfiguredOrigin(clean)) {
    return clean; // Return original for non-configured domains
  }

  // Extract the path/URL info
  const pathInfo = extractImageKitPath(clean);
  if (!pathInfo) {
    return clean; // Fallback to original if extraction fails
  }

  const { width = 800, quality = 80, format = "auto" } = options;

  // Build transformation string
  const transformations = `tr:w-${width},q-${quality},f-${format}`;

  // Two proxy formats:
  // 1. Path-based (Ticketmaster/Supabase): endpoint/transformations/path
  // 2. URL-based (cupid.travel): endpoint/transformations/full_url
  if (pathInfo.type === 'url') {
    return `${IMAGEKIT_ENDPOINT}/${transformations}/${pathInfo.path}`;
  }
  
  return `${IMAGEKIT_ENDPOINT}/${transformations}${pathInfo.path}`;
};

/**
 * Get optimized card image (w=450, q=75)
 */
export const getOptimizedCardImage = (url: string | undefined | null): string => {
  return getOptimizedUrl(url, { width: 450, quality: 75 });
};

/**
 * Get optimized hero image for desktop (w=1200, q=70)
 */
export const getOptimizedHeroImage = (url: string | undefined | null): string => {
  return getOptimizedUrl(url, { width: 1200, quality: 70 });
};

/**
 * Get optimized hotel image (w=450, q=75)
 */
export const getOptimizedHotelImage = (url: string | undefined | null): string => {
  return getOptimizedUrl(url, { width: 450, quality: 75 });
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (
  originalUrl: string | undefined | null,
  widths: number[] = [320, 640, 960, 1200],
  quality: number = 80
): string => {
  if (!originalUrl || !isConfiguredOrigin(originalUrl)) return "";

  return widths
    .map((w) => `${getOptimizedUrl(originalUrl, { width: w, quality })} ${w}w`)
    .join(", ");
};

/**
 * Generate srcset for card images
 */
export const generateCardSrcSet = (url: string | undefined | null): string => {
  return generateSrcSet(url, [320, 450, 640], 75);
};

/**
 * Generate srcset for hotel images
 */
export const generateHotelSrcSet = (url: string | undefined | null): string => {
  return generateSrcSet(url, [320, 450, 640], 75);
};

/**
 * Generate srcset for hero images
 */
export const generateHeroSrcSet = (url: string | undefined | null): string => {
  return generateSrcSet(url, [640, 960, 1200], 70);
};
