/**
 * ImageKit Utility Functions
 * 
 * Centralized image optimization using ImageKit CDN
 * Replaces images.weserv.nl with ImageKit for better performance and caching
 * 
 * FEATURES:
 * - Automatic WebP/AVIF conversion
 * - DPR-aware responsive images
 * - Clean URLs for maximum browser caching (no timestamps)
 * - Consistent API for all image components
 */

const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/feelomove";

// Domains that should be proxied through ImageKit
const PROXY_DOMAINS = [
  "ticketm.net",
  "tmimg.net",
  "s1.ticketm.net",
  "static.cupid.travel",
  "supabase.co",
  "wcyjuytpxxqailtixept.supabase.co",
];

/**
 * Check if URL should be optimized via ImageKit
 */
export const shouldOptimize = (url: string): boolean => {
  if (!url) return false;
  if (url.includes("ik.imagekit.io")) return true;
  if (url.startsWith("/")) return false; // Local images
  return PROXY_DOMAINS.some((domain) => url.includes(domain));
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
 * Build ImageKit optimized URL
 * 
 * ImageKit web proxy format:
 * https://ik.imagekit.io/{id}/tr:w-{width},q-{quality}/https://example.com/image.jpg
 * 
 * @param originalUrl - Source image URL
 * @param options - Transformation options
 * @returns Optimized ImageKit URL
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

  // Don't proxy non-matching domains
  if (!shouldOptimize(clean)) return clean;

  const { width = 800, quality = 80, format = "auto" } = options;

  // Build transformation string
  // Format: tr:w-{width},q-{quality},f-{format}
  const transformations = `tr:w-${width},q-${quality},f-${format}`;

  // ImageKit web proxy format - URL NOT encoded
  // https://ik.imagekit.io/{id}/tr:transformations/https://example.com/image.jpg
  return `${IMAGEKIT_ENDPOINT}/${transformations}/${clean}`;
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
  if (!originalUrl || !shouldOptimize(originalUrl)) return "";

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
