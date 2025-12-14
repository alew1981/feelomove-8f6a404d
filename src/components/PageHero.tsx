import { useEffect, useRef, useState } from "react";

interface PageHeroProps {
  title: string;
  imageUrl?: string;
  className?: string;
}

const PageHero = ({ title, imageUrl, className = "" }: PageHeroProps) => {
  // Use a default concert image if none provided
  const defaultImage = "https://s1.ticketm.net/dam/a/512/655083a1-b8c6-45f5-ba9a-f7c3bca2c512_EVENT_DETAIL_PAGE_16_9.jpg";
  const finalImage = imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : defaultImage;
  
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          // Only apply parallax when hero is visible
          setScrollOffset(window.scrollY * 0.3);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return (
    <div 
      ref={heroRef}
      className={`relative h-[200px] md:h-[280px] overflow-hidden rounded-xl mb-6 ${className}`}
    >
      <img
        src={finalImage}
        alt={title}
        className="w-full h-full object-cover parallax-bg"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        style={{ transform: `translateY(${scrollOffset}px) scale(1.1)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6">
        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
          {title}
        </h1>
      </div>
    </div>
  );
};

export default PageHero;