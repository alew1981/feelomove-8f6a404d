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
  if (!originalUrl) return undefined;

  // Only optimize LiteAPI hotel images
  const isLiteApiImage = 
    originalUrl.includes('static.cupid.travel') || 
    originalUrl.includes('cupid.travel');

  if (!isLiteApiImage) {
    return originalUrl;
  }

  const {
    width = 400,
    quality = 75,
    format = 'auto'
  } = options;

  // Use Cloudinary's fetch API for optimization if configured
  const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME;
  
  if (cloudName) {
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/fetch`;
    const transformations = `f_${format},q_${quality},w_${width},c_limit`;
    return `${baseUrl}/${transformations}/${encodeURIComponent(originalUrl)}`;
  }

  // Fallback: Use URL parameters if supported by the image server
  // Most CDNs support these parameters
  const url = new URL(originalUrl);
  url.searchParams.set('w', width.toString());
  url.searchParams.set('q', quality.toString());
  
  return url.toString();
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
