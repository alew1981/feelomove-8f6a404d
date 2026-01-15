import { useState, useRef, useEffect, memo, useMemo } from "react";
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
  /** Explicit width for CLS prevention */
  width?: number;
  /** Explicit height for CLS prevention */
  height?: number;
}

// Detect mobile for smaller image sizes - cached once at module level
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
  mobileOptimized = true,
  width,
  height
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(priority); // Start loaded for priority images
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Memoize srcSet and placeholder to prevent recalculation
  const srcSet = useMemo(() => generateSrcSet(src, mobileOptimized), [src, mobileOptimized]);
  const blurPlaceholder = useMemo(() => generateBlurPlaceholder(src), [src]);
  
  // Use smaller default image size on mobile
  const defaultWidth = mobileOptimized && isMobile ? 400 : 800;

  // Intersection Observer for lazy loading - only for non-priority images
  useEffect(() => {
    if (priority) return; // Priority images load immediately
    
    // Use native lazy loading - no custom observer needed
    setIsInView(true);
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  // Compute container style with explicit dimensions for CLS prevention
  const containerStyle = useMemo(() => {
    const style: React.CSSProperties = {};
    if (aspectRatio) style.aspectRatio = aspectRatio;
    if (width) style.width = width;
    if (height) style.height = height;
    return style;
  }, [aspectRatio, width, height]);

  return (
    <div 
      ref={imgRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={Object.keys(containerStyle).length > 0 ? containerStyle : undefined}
    >
      {/* Blur placeholder - only for non-priority */}
      {!priority && blurPlaceholder && !isLoaded && !hasError && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-lg"
        />
      )}

      {/* Skeleton while loading - only for non-priority */}
      {!priority && !isLoaded && !hasError && !blurPlaceholder && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
      )}

      {/* Actual image - use proxy for Ticketmaster */}
      {(isInView || priority) && (
        <img
          src={hasError ? "/placeholder.svg" : getOptimizedImageUrl(src, { width: defaultWidth, quality: mobileOptimized && isMobile ? 70 : 80 })}
          srcSet={!hasError && srcSet ? srcSet : undefined}
          sizes={!hasError && srcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover",
            priority ? "opacity-100" : (isLoaded ? "opacity-100 transition-opacity duration-200" : "opacity-0 transition-opacity duration-200")
          )}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
