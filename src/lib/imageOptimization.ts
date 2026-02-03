/**
 * Image Optimization Utilities
 * Uses images.weserv.nl as a free proxy for on-the-fly WebP conversion
 * 
 * OPTIMIZATIONS APPLIED (28-01-2026):
 * - WebP conversion: 390KB JPEG → ~150KB WebP (60% reduction)
 * - Responsive srcset for different screen sizes
 * - Progressive loading with interlace
 * - No API key required, global CDN cache
 */

// Domains that should be proxied through weserv
// NOTE: Google can crawl images.weserv.nl - no robots.txt blocking needed
const PROXY_DOMAINS = [
  'ticketm.net',
  'tmimg.net',
  's1.ticketm.net',
  'static.cupid.travel',
  'supabase.co',
  'wcyjuytpxxqailtixept.supabase.co'
];

/**
 * Check if a URL should be proxied
 */
const shouldProxy = (url: string): boolean => {
  if (!url) return false;
  return PROXY_DOMAINS.some(domain => url.includes(domain));
};

/**
 * Optimizes external image URLs by converting to WebP via images.weserv.nl proxy
 * @param originalUrl - Original image URL (e.g., static.cupid.travel, ticketm.net)
 * @param options - Width, quality, and format options
 * @returns Optimized image URL
 */
export const optimizeImageUrl = (
  originalUrl: string | undefined | null,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
  } = {}
): string => {
  // Return placeholder for invalid URLs
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return originalUrl || '/placeholder.svg';
  }

  // AGGRESSIVE: Default to w=800 and q=80 for optimal mobile LCP
  const { width = 800, quality = 80, format = 'webp' } = options;

  // Decode URL if it comes encoded from database
  let cleanUrl = originalUrl;
  try {
    if (cleanUrl.includes('%3A') || cleanUrl.includes('%2F')) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch {
    cleanUrl = originalUrl;
  }

  // Only proxy URLs from known domains
  if (!shouldProxy(cleanUrl)) {
    return cleanUrl;
  }

  // Use images.weserv.nl as optimization proxy (free, no API key)
  // AGGRESSIVE OPTIMIZATION: q=80, output=webp, il (interlaced progressive)
  const params = new URLSearchParams({
    url: cleanUrl,
    w: width.toString(),
    q: quality.toString(),
    output: format,
    il: '', // Interlace for progressive loading (faster perceived load)
  });

  return `https://images.weserv.nl/?${params.toString()}`;
};

/**
 * Generates responsive srcset for different viewport sizes
 * @param originalUrl - Original image URL
 * @returns srcset string for responsive images
 */
export const generateSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [320, 640, 1024];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width })} ${width}w`)
    .join(', ');
};

/**
 * Generates srcset for hotel card images (smaller sizes, w=450 for cards)
 */
export const generateHotelSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [320, 450, 640];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width, quality: 75 })} ${width}w`)
    .join(', ');
};

/**
 * Generates srcset for card images (w=450)
 */
export const generateCardSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [320, 450, 640];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width, quality: 75 })} ${width}w`)
    .join(', ');
};

/**
 * Generates srcset for hero images (larger sizes, w=1000, q=65 for LCP)
 */
export const generateHeroSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [640, 1000, 1400];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width, quality: 65 })} ${width}w`)
    .join(', ');
};

/**
 * Get optimized card image (w=450, q=80)
 */
export const getOptimizedCardImage = (url: string | undefined | null): string => {
  return optimizeImageUrl(url, { width: 450, quality: 80 });
};

/**
 * Get optimized hero image (w=800, q=65) - AGGRESSIVE for LCP
 * Reduced from 1000px to 800px and q=80 to q=65 for faster mobile LCP
 */
export const getOptimizedHeroImage = (url: string | undefined | null): string => {
  return optimizeImageUrl(url, { width: 800, quality: 65 });
};
