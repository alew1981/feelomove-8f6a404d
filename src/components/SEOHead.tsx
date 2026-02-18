import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getOptimizedUrl } from "@/lib/imagekitUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAlternateUrl, detectLocaleFromPath } from "@/lib/i18nRoutes";

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

/**
 * Determines if the current URL should be noindexed
 * CRITICAL: Main content pages (conciertos, festivales, destinos) should ALWAYS be indexed
 */
const shouldNoIndex = (searchParams: URLSearchParams, pathname: string): boolean => {
  // FORCE INDEX: Main content routes must always be indexed (no query params = index)
  // Support both singular (legacy), plural (canonical), and EN routes
  const isMainContentRoute = 
    pathname.startsWith('/conciertos/') ||
    pathname.startsWith('/concierto/') ||
    pathname.startsWith('/festivales/') ||
    pathname.startsWith('/festival/') ||
    pathname.startsWith('/destinos/') ||
    pathname.startsWith('/en/tickets/') ||
    pathname.startsWith('/en/festivals/') ||
    pathname.startsWith('/en/destinations/') ||
    pathname.startsWith('/en/artists') ||
    pathname === '/conciertos' ||
    pathname === '/festivales' ||
    pathname === '/destinos' ||
    pathname === '/artistas' ||
    pathname === '/en/tickets' ||
    pathname === '/en/festivals' ||
    pathname === '/en/destinations' ||
    pathname === '/en/artists';
  
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
 * CRITICAL SEO: This is the SINGLE SOURCE OF TRUTH for canonical URLs
 * - Uses plural routes (/conciertos/, /festivales/) as canonical standard
 * - For EN routes, canonical points to the EN version
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
    // If already absolute URL starting with our domain, use it directly
    if (providedCanonical.startsWith(siteUrl)) {
      return providedCanonical.split('?')[0].split('#')[0].replace(/\/+$/, '');
    }
    
    let cleanUrl = providedCanonical;
    
    // If it's another absolute URL, extract the path for cleaning
    if (cleanUrl.startsWith('http')) {
      try {
        const urlObj = new URL(cleanUrl);
        cleanUrl = urlObj.pathname;
      } catch {
        cleanUrl = cleanUrl.replace(/^https?:\/\/[^/]+/, '');
      }
    }
    
    // Clean the path
    cleanUrl = cleanUrl
      .split('?')[0]
      .split('#')[0]
      .toLowerCase()
      .replace(/\/+$/, '');
    
    // CRITICAL: Normalize singular routes to plural for canonical
    if (cleanUrl.startsWith('/concierto/')) {
      cleanUrl = cleanUrl.replace('/concierto/', '/conciertos/');
    }
    if (cleanUrl.startsWith('/festival/')) {
      cleanUrl = cleanUrl.replace('/festival/', '/festivales/');
    }
    
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = `/${cleanUrl}`;
    }
    
    return `${siteUrl}${cleanUrl}`;
  }
  
  // Generate from pathname
  let cleanPath = pathname
    .toLowerCase()
    .replace(/\/+$/, '');
  
  // CRITICAL: Normalize singular routes to plural for canonical
  if (cleanPath.startsWith('/concierto/')) {
    cleanPath = cleanPath.replace('/concierto/', '/conciertos/');
  }
  if (cleanPath.startsWith('/festival/')) {
    cleanPath = cleanPath.replace('/festival/', '/festivales/');
  }
  
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
const generateBreadcrumbSchema = (breadcrumbs: BreadcrumbItem[], currentUrl: string) => {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  const validBreadcrumbs = breadcrumbs.filter((item) => item.name && item.name.trim());
  if (validBreadcrumbs.length === 0) return null;

  const safeCurrentUrl = (currentUrl || "https://feelomove.com").split("?")[0].split("#")[0];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": validBreadcrumbs.map((item, index, arr) => {
      const isLast = index === arr.length - 1;

      const absoluteItemUrl = item.url
        ? item.url.startsWith("http")
          ? item.url
          : `https://feelomove.com${item.url}`
        : "https://feelomove.com";

      const finalItemUrl = isLast ? safeCurrentUrl : absoluteItemUrl;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": finalItemUrl,
      };
    }),
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
  const { locale } = useLanguage();
  const searchParams = new URLSearchParams(location.search);
  
  // Determine if page should be noindexed
  const isNoIndex = forceNoIndex || shouldNoIndex(searchParams, location.pathname);
  
  // CRITICAL: Differentiate VIP titles to avoid duplicate content
  const finalTitle = isVipEvent 
    ? generateVipTitle(title, artistName)
    : title;
  
  const fullTitle = `${finalTitle} | FEELOMOVE+`;
  
  // Use unified canonical generator
  const fullCanonical = getCleanCanonical(location.pathname, canonical);

  // --- i18n: hreflang alternate URLs ---
  const currentPath = location.pathname;
  const esUrl = getAlternateUrl(currentPath, 'es');
  const enUrl = getAlternateUrl(currentPath, 'en');

  // OG locale values
  const ogLocale = locale === 'en' ? 'en_US' : 'es_ES';
  const ogLocaleAlternate = locale === 'en' ? 'es_ES' : 'en_US';

  // inLanguage for WebPage schema
  const inLanguage = locale === 'en' ? 'en-US' : 'es-ES';

  // For event pages (og:type="event"), we skip the generic WebPage schema
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
    "inLanguage": inLanguage
  } : null;

  // Generate breadcrumb schema if provided
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs || [], fullCanonical);

  // Combine all JSON-LD schemas
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
      <html lang={locale === 'en' ? 'en' : 'es'} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* CRITICAL: Preconnect for image domains on event detail pages (LCP optimization) */}
      {isEventDetailPage && (
        <>
          <link rel="preconnect" href="https://s1.ticketm.net" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://s1.ticketm.net" />
          <link rel="dns-prefetch" href="https://ik.imagekit.io" />
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
      
      {/* CRITICAL: Preload LCP image via ImageKit for optimal size & speed */}
      {preloadImage && (
        <link 
          rel="preload" 
          as="image" 
          href={getOptimizedUrl(preloadImage, { width: 800, quality: 70 })}
          type="image/webp"
          // @ts-expect-error - fetchpriority is valid HTML attribute but React doesn't recognize it
          fetchpriority="high"
        />
      )}
      
      {/* Canonical URL */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* CRITICAL i18n: Hreflang tags - bidirectional + x-default */}
      <link rel="alternate" hrefLang="es" href={esUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={esUrl} />
      
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
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlternate} />
      
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
