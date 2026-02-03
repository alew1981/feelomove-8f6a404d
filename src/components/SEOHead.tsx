import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  jsonLd?: object | object[];
  pageType?: "WebPage" | "ItemPage" | "CollectionPage" | "SearchResultsPage" | "AboutPage" | "ContactPage";
  breadcrumbs?: BreadcrumbItem[];
  preloadImage?: string;
  forceNoIndex?: boolean;
  /** Set true for VIP/Premium events to differentiate title */
  isVipEvent?: boolean;
  /** Artist name for VIP title formatting */
  artistName?: string;
}

// Parameters that should trigger noindex
const NOINDEX_PARAMS = ['sort', 'order', 'orderBy', 'page'];
const FILTER_PARAMS = ['ciudad', 'city', 'genero', 'genre', 'artista', 'artist', 'mes', 'month', 'fecha', 'date', 'precio', 'price', 'duracion', 'duration'];
// Marketing/tracking params to strip from canonical
const TRACKING_PARAMS = ['fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];

/**
 * Determines if the current URL should be noindexed
 * CRITICAL: Main content pages (concierto, festival, destinos) should ALWAYS be indexed
 */
const shouldNoIndex = (searchParams: URLSearchParams, pathname: string): boolean => {
  // FORCE INDEX: Main content routes must always be indexed (no query params = index)
  const isMainContentRoute = 
    pathname.startsWith('/concierto/') ||
    pathname.startsWith('/festival/') ||
    pathname.startsWith('/destinos/') ||
    pathname === '/conciertos' ||
    pathname === '/festivales' ||
    pathname === '/destinos' ||
    pathname === '/artistas';
  
  // If it's a main content route with no params, always index
  if (isMainContentRoute && searchParams.toString() === '') {
    return false;
  }
  
  // Search pages always noindex
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return true;
  }
  
  // Check for sorting/ordering params
  for (const param of NOINDEX_PARAMS) {
    if (searchParams.has(param)) {
      return true;
    }
  }
  
  // Multiple filter params = noindex
  let filterCount = 0;
  for (const param of FILTER_PARAMS) {
    if (searchParams.has(param) && searchParams.get(param)) {
      filterCount++;
    }
  }
  
  return filterCount > 1;
};

/**
 * Generates clean canonical URL for any page
 * - Strips ALL query parameters and tracking params
 * - Ensures lowercase
 * - Removes trailing slashes
 * - Removes numeric suffixes (-1, -2) but NOT years
 * - Always returns absolute URL
 */
const getCleanCanonical = (pathname: string, providedCanonical?: string): string => {
  const siteUrl = "https://feelomove.com";
  
  // Search pages → redirect to /conciertos
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return `${siteUrl}/conciertos`;
  }
  
  // If canonical is explicitly provided (can be absolute or relative)
  if (providedCanonical) {
    let cleanUrl = providedCanonical;
    
    // If it's already absolute, extract the path for cleaning
    if (cleanUrl.startsWith('http')) {
      try {
        const urlObj = new URL(cleanUrl);
        cleanUrl = urlObj.pathname;
      } catch {
        // If URL parsing fails, try to clean as-is
        cleanUrl = cleanUrl.replace(/^https?:\/\/[^/]+/, '');
      }
    }
    
    // Clean the path
    cleanUrl = cleanUrl
      .split('?')[0]  // Strip query params
      .split('#')[0]  // Strip hash
      .toLowerCase()
      .replace(/\/+$/, ''); // Remove trailing slashes
    
    // Ensure it starts with /
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = `/${cleanUrl}`;
    }
    
    return `${siteUrl}${cleanUrl}`;
  }
  
  // Generate from pathname - remove numeric suffixes but not years
  let cleanPath = pathname
    .toLowerCase()
    .replace(/\/+$/, ''); // Remove trailing slashes
  
  // Remove numeric suffix (-1, -2, -99) but NOT years (-2026)
  if (/-\d{1,2}$/.test(cleanPath) && !/-20[2-9]\d$/.test(cleanPath)) {
    cleanPath = cleanPath.replace(/-\d{1,2}$/, '');
  }
  
  return `${siteUrl}${cleanPath}`;
};

// Organization schema - global for all pages
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "FEELOMOVE+",
  "alternateName": "Feelomove",
  "url": "https://feelomove.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://feelomove.com/favicon.svg",
    "width": 512,
    "height": 512
  },
  "description": "Plataforma líder para reservar entradas de conciertos, festivales y hoteles en España. Gestión integral de movilidad y alojamiento para eventos musicales.",
  "sameAs": [
    "https://www.instagram.com/feelomove/",
    "https://x.com/feelomove",
    "https://www.pinterest.com/feelomove/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["Spanish", "English"],
    "email": "info@feelomove.com"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Spain"
  },
  "foundingDate": "2024",
  "slogan": "Tu música. Tu hotel. Todo resuelto."
};

// Site navigation schema
const siteNavigationSchema = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  "name": "Main Navigation",
  "hasPart": [
    {
      "@type": "SiteNavigationElement",
      "name": "Conciertos",
      "url": "https://feelomove.com/conciertos"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Festivales",
      "url": "https://feelomove.com/festivales"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Destinos",
      "url": "https://feelomove.com/destinos"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Artistas",
      "url": "https://feelomove.com/artistas"
    }
  ]
};

// Generate BreadcrumbList schema from breadcrumbs array
const generateBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[]) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": item.url.startsWith('http') ? item.url : `https://feelomove.com${item.url}` })
    }))
  };
};

/**
 * Generate VIP-differentiated title to avoid duplicate content
 */
const generateVipTitle = (baseTitle: string, artistName?: string): string => {
  if (artistName) {
    return `Experiencia VIP: ${artistName} - Entradas Premium y Hotel`;
  }
  return `Experiencia VIP: ${baseTitle}`;
};

export const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  ogImage = "https://feelomove.com/og-image.jpg",
  ogType = "website",
  keywords,
  jsonLd,
  pageType = "WebPage",
  breadcrumbs,
  preloadImage,
  forceNoIndex = false,
  isVipEvent = false,
  artistName
}: SEOHeadProps) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Determine if page should be noindexed
  const isNoIndex = forceNoIndex || shouldNoIndex(searchParams, location.pathname);
  
  // CRITICAL: Differentiate VIP titles to avoid duplicate content
  const finalTitle = isVipEvent 
    ? generateVipTitle(title, artistName)
    : title;
  
  const fullTitle = `${finalTitle} | FEELOMOVE+`;
  
  // Use unified canonical generator - strips all query params and tracking
  // ALWAYS returns absolute URL (https://feelomove.com/...)
  const fullCanonical = getCleanCanonical(location.pathname, canonical);

  // For event pages (og:type="event"), we skip the generic WebPage schema
  // since EventSeo component provides the proper Event structured data
  
  // Detect if we're on event detail page for critical preconnects (LCP optimization)
  const isEventDetailPage = location.pathname.startsWith('/concierto/') || location.pathname.startsWith('/festival/');
  const isEventPage = ogType === 'event';

  // Build WebPage schema only for non-event pages
  const webPageSchema = !isEventPage ? {
    "@context": "https://schema.org",
    "@type": pageType,
    "name": fullTitle,
    "description": description,
    "url": fullCanonical,
    "isPartOf": {
      "@type": "WebSite",
      "name": "FEELOMOVE+",
      "url": "https://feelomove.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FEELOMOVE+"
    },
    "inLanguage": "es-ES"
  } : null;

  // Generate breadcrumb schema if provided
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs || []);

  // Combine all JSON-LD schemas
  // For event pages, skip Organization and WebPage schemas (handled by EventSeo)
  const allSchemas = isEventPage
    ? [
        ...(breadcrumbSchema ? [breadcrumbSchema] : []),
        ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
      ]
    : [
        organizationSchema,
        siteNavigationSchema,
        ...(webPageSchema ? [webPageSchema] : []),
        ...(breadcrumbSchema ? [breadcrumbSchema] : []),
        ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
      ];

  // Detect if we're on destinations page for preconnect hints
  const isDestinationsPage = location.pathname === '/destinos' || location.pathname.startsWith('/destinos');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* CRITICAL: Preconnect for image domains on event detail pages (LCP optimization) */}
      {isEventDetailPage && (
        <>
          <link rel="preconnect" href="https://s1.ticketm.net" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://images.weserv.nl" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://s1.ticketm.net" />
          <link rel="dns-prefetch" href="https://images.weserv.nl" />
        </>
      )}
      
      {/* Preconnect for image domains - critical path optimization */}
      {isDestinationsPage && (
        <>
          <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://s1.ticketm.net" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://images.unsplash.com" />
          <link rel="dns-prefetch" href="https://s1.ticketm.net" />
        </>
      )}
      
      {/* CRITICAL: Preload LCP image BEFORE JS execution for faster discovery */}
      {preloadImage && (
        <link 
          rel="preload" 
          as="image" 
          href={preloadImage}
          type="image/webp"
          // @ts-expect-error - fetchpriority is valid HTML attribute but React doesn't recognize it
          fetchpriority="high"
        />
      )}
      
      {/* Canonical URL */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Open Graph / Facebook - Optimized 1200x630 */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:site_name" content="FEELOMOVE+" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card - summary_large_image */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@feelomove" />
      <meta name="twitter:creator" content="@feelomove" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
      {/* CRITICAL: Force index,follow for main content pages */}
      <meta 
        name="robots" 
        content={isNoIndex 
          ? "noindex, follow" 
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        } 
      />
      <meta name="revisit-after" content="7 days" />
      <meta name="geo.region" content="ES" />
      <meta name="geo.placename" content="España" />
      
      {/* JSON-LD Structured Data - All schemas inside Helmet */}
      {allSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
