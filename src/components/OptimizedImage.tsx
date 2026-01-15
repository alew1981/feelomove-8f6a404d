import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedImageUrl, getOptimizedSrcSet } from "@/lib/imageProxy";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean; // LCP images should have priority=true
  sizes?: string;
  aspectRatio?: string;
  onLoad?: () => void;
  /** Mobile-optimized: use smaller widths for srcset */
  mobileOptimized?: boolean;
}

// Detect mobile for smaller image sizes
const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

// Generate srcset for images - use proxy for Ticketmaster, native for others
const generateSrcSet = (src: string, mobileOptimized = false): string => {
  // Use smaller widths on mobile for faster loading
  const widths = mobileOptimized && isMobile ? [280, 400, 560] : [320, 640, 1024];
  
  // Use proxy for Ticketmaster images (CDN cached, optimized)
  const proxySrcSet = getOptimizedSrcSet(src, widths);
  if (proxySrcSet) return proxySrcSet;
  
  // Unsplash supports w parameter natively
  if (src.includes("unsplash.com")) {
    const baseUrl = src.split("?")[0];
    const sizes = mobileOptimized && isMobile 
      ? [280, 400, 560]
      : [400, 800, 1200];
    return sizes.map(w => `${baseUrl}?w=${w}&q=75 ${w}w`).join(', ');
  }
  
  return "";
};

// Generate blur placeholder URL (low quality image via proxy)
const generateBlurPlaceholder = (src: string): string => {
  if (src.includes("unsplash.com")) {
    const baseUrl = src.split("?")[0];
    return `${baseUrl}?w=20&q=10&blur=10`;
  }
  
  // Use proxy with very low quality for Ticketmaster images
  if (src.includes("ticketm.net") || src.includes("tmimg.net") || src.includes("ticketmaster.com")) {
    return getOptimizedImageUrl(src, { width: 40, quality: 20 });
  }
  
  // For other images, just return the original (no blur available)
  return "";
};

const OptimizedImage = memo(({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  aspectRatio,
  onLoad,
  mobileOptimized = true
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading - optimized for performance
  useEffect(() => {
    if (priority || isInView) return;

    // Use native lazy loading support check
    if ('loading' in HTMLImageElement.prototype && !priority) {
      // Browser supports native lazy loading, let it handle it
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "400px", // Reduced from 600px for better initial load
        threshold: 0
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const srcSet = generateSrcSet(src, mobileOptimized);
  const blurPlaceholder = generateBlurPlaceholder(src);
  
  // Use smaller default image size on mobile
  const defaultWidth = mobileOptimized && isMobile ? 400 : 800;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div 
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blur placeholder */}
      {blurPlaceholder && !isLoaded && !hasError && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}

      {/* Skeleton while loading */}
      {!isLoaded && !hasError && !blurPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      )}

      {/* Actual image - use proxy for Ticketmaster */}
      {(isInView || priority) && (
        <img
          src={hasError ? "/placeholder.svg" : getOptimizedImageUrl(src, { width: defaultWidth, quality: mobileOptimized && isMobile ? 70 : 80 })}
          srcSet={!hasError && srcSet ? srcSet : undefined}
          sizes={!hasError && srcSet ? sizes : undefined}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
