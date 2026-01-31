import { useEffect, useRef, useState } from "react";
import { getOptimizedHeroImage, generateHeroSrcSet } from "@/lib/imageOptimization";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  className?: string;
  priority?: boolean; // LCP optimization
}

const PageHero = ({ title, subtitle, imageUrl, className = "", priority = true }: PageHeroProps) => {
  // Use a default concert image if none provided
  const defaultImage = "https://s1.ticketm.net/dam/a/512/655083a1-b8c6-45f5-ba9a-f7c3bca2c512_EVENT_DETAIL_PAGE_16_9.jpg";
  const rawImage = imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : defaultImage;
  
  // AGGRESSIVE optimization: compress via weserv proxy
  const finalImage = getOptimizedHeroImage(rawImage);
  const srcSet = generateHeroSrcSet(rawImage);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Parallax effect on scroll - deferred to avoid blocking LCP
  useEffect(() => {
    // Delay parallax registration to not block initial render
    const timeoutId = setTimeout(() => {
      const handleScroll = () => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            setScrollOffset(window.scrollY * 0.3);
          }
        }
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, 100); // Small delay to prioritize LCP

    return () => clearTimeout(timeoutId);
  }, []);
  
  return (
    <div 
      ref={heroRef}
      className={`relative h-[200px] md:h-[280px] overflow-hidden rounded-xl mb-6 ${className}`}
      style={{ 
        minHeight: '200px',
        // Prevent CLS with explicit aspect ratio
        aspectRatio: '3 / 1'
      }}
    >
      {/* LCP-optimized hero image with WebP proxy */}
      <img
        src={finalImage}
        srcSet={srcSet || undefined}
        sizes="(max-width: 768px) 100vw, 1200px"
        alt={`${title} - FEELOMOVE+`}
        title={`${title} - FEELOMOVE+`}
        className="w-full h-full object-cover parallax-bg"
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        {...(priority ? { fetchpriority: "high" as const } : {})}
        width={1200}
        height={400}
        style={{
          transform: `translateY(${scrollOffset}px) scale(1.1)`,
          contentVisibility: priority ? 'visible' : 'auto',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 mt-2 drop-shadow-md">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default PageHero;