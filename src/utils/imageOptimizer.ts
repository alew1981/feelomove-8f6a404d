/**
 * Image optimization utility for hotel images from LiteAPI (static.cupid.travel)
 * Simply returns the original URL - Cloudinary removed for simplicity
 */

/**
 * Returns image URL directly.
 * For static.cupid.travel images, returns the URL as-is.
 */
export const optimizeImageUrl = (
  originalUrl: string | undefined | null
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

  return cleanUrl;
};

/**
 * Hook-style function for hotel images
 * @param url - Original image URL
 * @returns Clean image URL
 */
export const useOptimizedImage = (
  url: string | undefined | null, 
  _width = 400
): string | undefined => {
  if (!url) return undefined;
  return optimizeImageUrl(url);
};

/**
 * Generates srcset for responsive images (simplified - returns original)
 */
export const generateSrcSet = (
  url: string | undefined | null,
  widths: number[] = [200, 400, 600, 800]
): string | undefined => {
  if (!url) return undefined;
  const cleanUrl = optimizeImageUrl(url);
  if (!cleanUrl) return undefined;
  
  return widths.map(w => `${cleanUrl} ${w}w`).join(', ');
};
