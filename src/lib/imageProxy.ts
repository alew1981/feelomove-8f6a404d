/**
 * Image Proxy Utility
 * Routes Ticketmaster images through our Edge Function proxy for optimization and CDN caching
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wcyjuytpxxqailtixept.supabase.co';
const IMAGE_PROXY_PATH = '/functions/v1/image-proxy';

// Domains that should be proxied
const PROXY_DOMAINS = [
  's1.ticketm.net',
  'media.ticketmaster.com',
  'tmimg.net'
];

interface ImageProxyOptions {
  width?: number;
  quality?: number;
}

/**
 * Check if a URL should be proxied
 */
function shouldProxy(url: string): boolean {
  if (!url || url === '/placeholder.svg') return false;
  
  try {
    const parsedUrl = new URL(url);
    return PROXY_DOMAINS.some(domain => parsedUrl.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Get an optimized image URL through the proxy
 * For Ticketmaster images, routes through Edge Function with CDN caching
 * For other images, returns the original URL
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageProxyOptions = {}
): string {
  // Return original if not a proxyable image
  if (!shouldProxy(originalUrl)) {
    return originalUrl;
  }

  const { width = 400, quality = 80 } = options;

  // Build proxy URL with query params
  const proxyUrl = new URL(`${SUPABASE_URL}${IMAGE_PROXY_PATH}`);
  proxyUrl.searchParams.set('url', originalUrl);
  proxyUrl.searchParams.set('w', width.toString());
  proxyUrl.searchParams.set('q', quality.toString());

  return proxyUrl.toString();
}

/**
 * Generate srcset for responsive images through the proxy
 */
export function getOptimizedSrcSet(
  originalUrl: string,
  widths: number[] = [320, 480, 640, 800]
): string {
  if (!shouldProxy(originalUrl)) {
    return '';
  }

  return widths
    .map(w => `${getOptimizedImageUrl(originalUrl, { width: w })} ${w}w`)
    .join(', ');
}
