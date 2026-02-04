/**
 * ImageKit Smart Image Component
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Automatic WebP/AVIF conversion via ImageKit
 * - DPR-aware responsive images
 * - Mobile LCP optimization: hero images not rendered on mobile
 * - Clean URLs for maximum browser caching (no timestamps/random params)
 * - Lazy loading for non-priority images
 */

import { memo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ImageKit endpoint configured in the project
const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/feelomove";

// Domains that should be proxied through ImageKit
const PROXY_DOMAINS = [
  "ticketm.net",
  "tmimg.net",
  "s1.ticketm.net",
  "static.cupid.travel",
  "supabase.co",
  "wcyjuytpxxqailtixept.supabase.co",
  "images.weserv.nl", // Migrate existing weserv URLs
];

interface IKImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean; // LCP images should have priority=true
  isHero?: boolean; // Hero images are not rendered on mobile
  quality?: number;
  sizes?: string;
}

/**
 * Check if a URL should be proxied through ImageKit
 */
const shouldProxy = (url: string): boolean => {
  if (!url) return false;
  // Already an ImageKit URL
  if (url.includes("ik.imagekit.io")) return true;
  return PROXY_DOMAINS.some((domain) => url.includes(domain));
};

/**
 * Build ImageKit URL with transformations
 * Uses path-based transformations for cleaner URLs and better caching
 * 
 * ImageKit web proxy format:
 * https://ik.imagekit.io/{id}/tr:w-{width},q-{quality}/https://example.com/image.jpg
 */
const buildImageKitUrl = (
  originalUrl: string,
  options: {
    width?: number;
    quality?: number;
  } = {}
): string => {
  if (!originalUrl || originalUrl.startsWith("/")) {
    return originalUrl; // Local images, return as-is
  }

  // Decode URL if encoded
  let cleanUrl = originalUrl;
  try {
    if (cleanUrl.includes("%3A") || cleanUrl.includes("%2F")) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch {
    cleanUrl = originalUrl;
  }

  // Skip if already ImageKit URL
  if (cleanUrl.includes("ik.imagekit.io")) {
    return cleanUrl;
  }

  // Don't proxy non-matching domains
  if (!shouldProxy(cleanUrl)) {
    return cleanUrl;
  }

  // Build transformation string
  const { width = 800, quality = 80 } = options;
  const transformations = `tr:w-${width},q-${quality},f-auto`;

  // ImageKit web proxy format - URL NOT encoded
  return `${IMAGEKIT_ENDPOINT}/${transformations}/${cleanUrl}`;
};

/**
 * Generate srcset for responsive images
 */
const generateSrcSet = (
  originalUrl: string,
  widths: number[] = [320, 640, 960, 1200],
  quality: number = 80
): string => {
  if (!originalUrl || originalUrl.startsWith("/") || !shouldProxy(originalUrl)) {
    return "";
  }

  return widths
    .map((width) => `${buildImageKitUrl(originalUrl, { width, quality })} ${width}w`)
    .join(", ");
};

/**
 * Smart Image Component with ImageKit CDN
 * - Automatic format conversion (WebP/AVIF)
 * - DPR-aware serving
 * - Mobile LCP optimization for hero images
 */
const IKImage = memo(
  ({
    src,
    alt,
    className,
    width,
    height,
    priority = false,
    isHero = false,
    quality = 80,
    sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  }: IKImageProps) => {
    const isMobile = useIsMobile();
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // CRITICAL: Don't render hero images on mobile for LCP optimization
    // This prevents the browser from even starting the download
    if (isHero && isMobile) {
      return null;
    }

    // Determine optimal width based on context
    const targetWidth = width || (isHero ? 1200 : 640);

    // Build optimized URL
    const optimizedSrc = hasError
      ? "/placeholder.svg"
      : buildImageKitUrl(src, { width: targetWidth, quality });

    // Generate responsive srcset
    const srcSet = hasError ? undefined : generateSrcSet(src, [320, 640, 960, 1200], quality);

    return (
      <img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width || targetWidth}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "low"}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    );
  }
);

IKImage.displayName = "IKImage";

// Export utilities for use in other components
export { buildImageKitUrl, generateSrcSet, shouldProxy, IMAGEKIT_ENDPOINT };
export default IKImage;
