/**
 * Image Optimization Utilities
 * Uses wsrv.nl as a free proxy for on-the-fly WebP conversion
 * 
 * OPTIMIZATIONS APPLIED (25-01-2026):
 * - WebP conversion: 390KB JPEG → ~150KB WebP (60% reduction)
 * - Responsive srcset for different screen sizes
 * - Progressive loading with interlace
 * - No API key required, global CDN cache
 */

/**
 * Optimizes external image URLs by converting to WebP via wsrv.nl proxy
 * @param originalUrl - Original image URL (e.g., static.cupid.travel)
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

  const { width = 640, quality = 85, format = 'webp' } = options;

  // Decode URL if it comes encoded from database
  let cleanUrl = originalUrl;
  try {
    if (cleanUrl.includes('%3A') || cleanUrl.includes('%2F')) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch {
    cleanUrl = originalUrl;
  }

  // Use wsrv.nl as optimization proxy (free, no API key)
  // Docs: https://wsrv.nl/
  const params = new URLSearchParams({
    url: cleanUrl,
    w: width.toString(),
    q: quality.toString(),
    output: format,
    il: '', // Interlace for progressive loading
  });

  return `https://wsrv.nl/?${params.toString()}`;
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
 * Generates srcset for hotel card images (smaller sizes)
 */
export const generateHotelSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [400, 640, 800];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width, quality: 80 })} ${width}w`)
    .join(', ');
};

/**
 * Generates srcset for hero images (larger sizes)
 */
export const generateHeroSrcSet = (
  originalUrl: string | undefined | null
): string => {
  if (!originalUrl || originalUrl.includes('placeholder')) {
    return '';
  }

  const sizes = [800, 1200, 1920];
  return sizes
    .map(width => `${optimizeImageUrl(originalUrl, { width, quality: 90 })} ${width}w`)
    .join(', ');
};
