import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/searchUtils";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useEffect, useMemo } from "react";

// Helper to generate slug from name (accent-insensitive)
const generateSlug = (name: string): string => {
  return normalizeSearch(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const linkClass = "hover:text-foreground hover:underline transition-colors";

export interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  /** Override automatic breadcrumb generation with custom items */
  items?: BreadcrumbItem[];
  /** Whether to inject JSON-LD (default: true) */
  injectJsonLd?: boolean;
}

/**
 * Generates BreadcrumbList JSON-LD schema for SEO
 */
const generateBreadcrumbJsonLd = (items: BreadcrumbItem[]) => {
  if (!items || items.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { 
        "item": item.url.startsWith('http') 
          ? item.url 
          : `https://feelomove.com${item.url}` 
      })
    }))
  };
};

/**
 * Injects BreadcrumbList JSON-LD into document head
 */
const useBreadcrumbJsonLd = (items: BreadcrumbItem[], enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled || !items || items.length === 0) return;
    
    const scriptId = 'breadcrumb-jsonld';
    
    // Remove existing script
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create and inject new script
    const jsonLd = generateBreadcrumbJsonLd(items);
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    
    // Cleanup on unmount
    return () => {
      const script = document.getElementById(scriptId);
      if (script) {
        script.remove();
      }
    };
  }, [items, enabled]);
};

const Breadcrumbs = ({ items: customItems, injectJsonLd = true }: BreadcrumbsProps) => {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { prefetch } = usePrefetch();

  // Detect if we're on a product page (/concierto/:slug or /festival/:slug)
  const isProductPage = pathnames[0] === "concierto" || pathnames[0] === "festival";
  const productSlug = isProductPage ? params.slug : null;
  const isFestivalProduct = pathnames[0] === "festival";

  // Get event name and genre for product page
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb", productSlug],
    queryFn: async () => {
      if (!productSlug) return null;
      
      // Use festival-specific view for festivals, concert-specific for concerts
      const viewName = isFestivalProduct 
        ? "lovable_mv_event_product_page_festivales" 
        : "lovable_mv_event_product_page_conciertos";
      
      const { data, error } = await supabase
        .from(viewName)
        .select("event_name, primary_subcategory_name, primary_category_name, venue_city, event_slug")
        .eq("event_slug", productSlug)
        .maybeSingle();
      
      if (error) {
        // Fallback to generic view
        const { data: fallbackData } = await supabase
          .from("lovable_mv_event_product_page")
          .select("event_name, primary_subcategory_name, primary_category_name, venue_city, event_slug")
          .eq("event_slug", productSlug)
          .maybeSingle();
        return fallbackData;
      }
      return data;
    },
    enabled: !!productSlug,
  });

  // Get artist name from database for artist detail page
  const artistSlugRaw = pathnames[0] === "conciertos" && pathnames.length === 2 && params.artistSlug 
    ? decodeURIComponent(params.artistSlug) 
    : null;
  const artistSlug = artistSlugRaw ? artistSlugRaw.toLowerCase().replace(/-+/g, '-') : null;
  
  const { data: artistData } = useQuery({
    queryKey: ["artist-breadcrumb", artistSlug],
    queryFn: async () => {
      if (!artistSlug) return null;
      
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("attraction_name")
        .eq("attraction_slug", artistSlug)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.attraction_name || null;
    },
    enabled: !!artistSlug,
  });

  // Get destination name from database for destination detail page
  const destinoSlug = pathnames[0] === "destinos" && params.destino 
    ? decodeURIComponent(params.destino) 
    : null;
  
  const { data: destinoData } = useQuery({
    queryKey: ["destino-breadcrumb", destinoSlug],
    queryFn: async () => {
      if (!destinoSlug) return null;
      
      const { data, error } = await supabase
        .from("mv_destinations_cards")
        .select("city_name")
        .eq("city_slug", destinoSlug)
        .maybeSingle();
      
      if (error) return null;
      return data?.city_name || null;
    },
    enabled: !!destinoSlug,
  });

  // Extract genre from event (prefer subcategory, fallback to category)
  const eventGenre = eventDetails?.primary_subcategory_name || eventDetails?.primary_category_name || null;
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;

  // Build breadcrumb items based on current route
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    // If custom items provided, use those
    if (customItems && customItems.length > 0) {
      return customItems;
    }
    
    const items: BreadcrumbItem[] = [
      { name: "Inicio", url: "/" }
    ];

    // Product page: Inicio > Género > Evento
    if (isProductPage && eventDetails) {
      // Add genre if available
      if (eventGenre) {
        const genreSlug = generateSlug(eventGenre);
        items.push({
          name: eventGenre.split(' - ')[0], // Clean up genre name
          url: `/musica/${genreSlug}`
        });
      }
      
      // Add event name (no URL - current page)
      items.push({
        name: eventDetails.event_name || ''
      });
      
      return items;
    }

    // Genre page: Inicio > Géneros > Nombre del Género
    if (pathnames[0] === "generos" && genreFromPath) {
      items.push({ name: "Géneros", url: "/musica" });
      items.push({ name: genreFromPath });
      return items;
    }
    
    // Music/Genre page: Inicio > Géneros > Nombre del Género
    if (pathnames[0] === "musica" && pathnames.length === 2) {
      items.push({ name: "Géneros", url: "/musica" });
      const genreName = pathnames[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ name: genreName });
      return items;
    }

    // Destination page: Inicio > Destinos > Ciudad
    if (pathnames[0] === "destinos" && destinoSlug) {
      items.push({ name: "Destinos", url: "/destinos" });
      const cityName = destinoData || destinoSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ name: cityName });
      return items;
    }

    // Artist page: Inicio > Artistas > Nombre del Artista
    if (pathnames[0] === "conciertos" && artistSlug) {
      items.push({ name: "Artistas", url: "/artistas" });
      const artistName = artistData || artistSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ name: artistName });
      return items;
    }

    // Festival detail page: Inicio > Festivales > Nombre del Festival
    if (pathnames[0] === "festivales" && pathnames.length === 2) {
      items.push({ name: "Festivales", url: "/festivales" });
      const festivalName = pathnames[1].split('_')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      items.push({ name: festivalName });
      return items;
    }

    // Default: map pathnames to breadcrumb names
    const breadcrumbNames: Record<string, string> = {
      about: "Nosotros",
      destinos: "Destinos",
      musica: "Géneros",
      generos: "Géneros",
      eventos: "Eventos",
      conciertos: "Conciertos",
      festivales: "Festivales",
      artistas: "Artistas",
      favoritos: "Favoritos",
    };

    pathnames.forEach((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
      const isLast = index === pathnames.length - 1;
      const displayName = breadcrumbNames[name] || decodeURIComponent(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      items.push({
        name: displayName,
        url: isLast ? undefined : routeTo
      });
    });

    return items;
  }, [customItems, isProductPage, eventDetails, eventGenre, genreFromPath, pathnames, destinoSlug, destinoData, artistSlug, artistData]);

  // Inject BreadcrumbList JSON-LD for SEO
  useBreadcrumbJsonLd(breadcrumbItems, injectJsonLd);

  return (
    <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4 pb-1" aria-label="Breadcrumb">
      <ol className="flex items-center text-xs sm:text-sm text-muted-foreground whitespace-nowrap" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li 
              key={`${item.name}-${index}`} 
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {/* Separator (not for first item) */}
              {!isFirst && (
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60 flex-shrink-0" />
              )}
              
              {/* Home icon for first item */}
              {isFirst ? (
                <Link
                  to={item.url || "/"}
                  className="flex items-center hover:text-foreground transition-colors p-1 -m-1 rounded"
                  aria-label="Inicio"
                  itemProp="item"
                  onMouseEnter={() => prefetch("/")}
                >
                  <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <meta itemProp="name" content={item.name} />
                </Link>
              ) : isLast || !item.url ? (
                // Last item or no URL: display as text
                <span 
                  className="text-foreground font-semibold truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" 
                  itemProp="name"
                  title={item.name}
                >
                  {item.name}
                </span>
              ) : (
                // Middle items: display as links
                <Link
                  to={item.url}
                  className={`${linkClass} truncate max-w-[80px] sm:max-w-[150px] md:max-w-none`}
                  itemProp="item"
                  onMouseEnter={() => item.url && prefetch(item.url)}
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              
              {/* Position meta for schema */}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;

// Re-export types and utilities for external use
export { generateBreadcrumbJsonLd };
export type { BreadcrumbItem as BreadcrumbItemType };
