/**
 * Image optimization utility for hotel images from LiteAPI (static.cupid.travel)
 * Uses native browser optimization with fallback to Cloudinary fetch API
 */

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

/**
 * Optimizes image URLs from LiteAPI hotel images.
 * For static.cupid.travel images, uses Cloudinary's fetch API for optimization.
 * For other images, returns the original URL.
 */
export const optimizeImageUrl = (
  originalUrl: string | undefined | null,
  options: OptimizeOptions = {}
): string | undefined => {
  if (!originalUrl) {
    return undefined;
  }

  // Decode URL first in case it comes already encoded from database
  let cleanUrl = originalUrl;
  try {
    // Check if URL is encoded (contains %3A or %2F which are : and /)
    if (cleanUrl.includes('%3A') || cleanUrl.includes('%2F')) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch (e) {
    // If decode fails, use original
    cleanUrl = originalUrl;
  }

  // Only optimize LiteAPI hotel images
  const isLiteApiImage = 
    cleanUrl.includes('static.cupid.travel') || 
    cleanUrl.includes('cupid.travel');

  if (!isLiteApiImage) {
    return cleanUrl;
  }

  const {
    width = 400,
    quality = 75,
    format = 'auto'
  } = options;

  // Use Cloudinary's fetch API for optimization if configured
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  
  if (cloudName) {
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/fetch`;
    const transformations = `f_${format},q_${quality},w_${width},c_limit`;

    // Cloudinary fetch expects the remote URL as a plain URL path segment (not fully URL-encoded)
    // We decode first (handled above) and only apply encodeURI to avoid breaking spaces/
    // special characters while keeping :// and / intact.
    const remoteUrl = encodeURI(cleanUrl);

    if (import.meta.env.DEV) {
      console.log('[ImageOptimizer] originalUrl:', originalUrl);
      console.log('[ImageOptimizer] cleanUrl:', cleanUrl);
      console.log('[ImageOptimizer] remoteUrl:', remoteUrl);
    }

    return `${baseUrl}/${transformations}/${remoteUrl}`;
  }

  // Fallback: Return clean URL (static.cupid.travel should work directly)
  return cleanUrl;
};

/**
 * Hook-style function for optimizing hotel images
 * @param url - Original image URL
 * @param width - Target width (default: 400)
 * @returns Optimized image URL or original if not applicable
 */
export const useOptimizedImage = (
  url: string | undefined | null, 
  width = 400
): string | undefined => {
  if (!url) return undefined;
  return optimizeImageUrl(url, { width, quality: 75, format: 'auto' });
};

/**
 * Generates srcset for responsive images
 */
export const generateSrcSet = (
  url: string | undefined | null,
  widths: number[] = [200, 400, 600, 800]
): string | undefined => {
  if (!url) return undefined;

  return widths
    .map(w => {
      const optimized = optimizeImageUrl(url, { width: w });
      return optimized ? `${optimized} ${w}w` : null;
    })
    .filter(Boolean)
    .join(', ');
};
