import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean; // LCP images should have priority=true
  sizes?: string;
  aspectRatio?: string;
  onLoad?: () => void;
}

// Generate srcset for Ticketmaster/Unsplash images
const generateSrcSet = (src: string): string => {
  // Ticketmaster images support size suffixes
  if (src.includes("ticketm.net") || src.includes("tmimg.net")) {
    const baseSrc = src.replace(/_[0-9]+_[0-9]+\.(jpg|png|webp)/, "");
    return `
      ${baseSrc}_320_180.jpg 320w,
      ${baseSrc}_640_360.jpg 640w,
      ${baseSrc}_1024_576.jpg 1024w
    `.trim();
  }
  
  // Unsplash supports w parameter
  if (src.includes("unsplash.com")) {
    const baseUrl = src.split("?")[0];
    return `
      ${baseUrl}?w=400&q=75 400w,
      ${baseUrl}?w=800&q=80 800w,
      ${baseUrl}?w=1200&q=85 1200w
    `.trim();
  }
  
  return "";
};

// Generate blur placeholder URL (low quality image)
const generateBlurPlaceholder = (src: string): string => {
  if (src.includes("unsplash.com")) {
    const baseUrl = src.split("?")[0];
    return `${baseUrl}?w=20&q=10&blur=10`;
  }
  
  if (src.includes("ticketm.net") || src.includes("tmimg.net")) {
    // Use smallest available size
    return src.replace(/_[0-9]+_[0-9]+\.(jpg|png|webp)/, "_100_56.jpg");
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
  onLoad
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const srcSet = generateSrcSet(src);
  const blurPlaceholder = generateBlurPlaceholder(src);

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

      {/* Actual image */}
      {(isInView || priority) && (
        <img
          src={hasError ? "/placeholder.svg" : src}
          srcSet={!hasError && srcSet ? srcSet : undefined}
          sizes={!hasError && srcSet ? sizes : undefined}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
