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
}

// Parameters that should trigger noindex
const NOINDEX_PARAMS = ['sort', 'order', 'orderBy', 'page'];
const FILTER_PARAMS = ['ciudad', 'city', 'genero', 'genre', 'artista', 'artist', 'mes', 'month', 'fecha', 'date', 'precio', 'price', 'duracion', 'duration'];
// Marketing/tracking params to strip from canonical
const TRACKING_PARAMS = ['fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];

/**
 * Determines if the current URL should be noindexed
 */
const shouldNoIndex = (searchParams: URLSearchParams, pathname: string): boolean => {
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return true;
  }
  
  for (const param of NOINDEX_PARAMS) {
    if (searchParams.has(param)) {
      return true;
    }
  }
  
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
 * - Strips ALL query parameters
 * - Ensures lowercase
 * - Removes trailing slashes
 * - Handles /festival/ and /concierto/ routes
 */
const getCleanCanonical = (pathname: string, providedCanonical?: string): string => {
  const siteUrl = "https://feelomove.com";
  
  // Search pages → redirect to /conciertos
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return `${siteUrl}/conciertos`;
  }
  
  // If canonical is explicitly provided, clean it
  if (providedCanonical) {
    const cleanProvided = providedCanonical
      .split('?')[0]  // Strip query params
      .split('#')[0]  // Strip hash
      .replace(/\/+$/, ''); // Remove trailing slashes
    
    return cleanProvided.startsWith('http') ? cleanProvided : `${siteUrl}${cleanProvided.startsWith('/') ? cleanProvided : `/${cleanProvided}`}`;
  }
  
  // Generate from pathname
  const cleanPath = pathname
    .toLowerCase()
    .replace(/\/+$/, ''); // Remove trailing slashes
  
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
  forceNoIndex = false
}: SEOHeadProps) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Determine if page should be noindexed
  const isNoIndex = forceNoIndex || shouldNoIndex(searchParams, location.pathname);
  
  const fullTitle = `${title} | FEELOMOVE+`;
  
  // Use unified canonical generator - strips all query params and tracking
  const fullCanonical = getCleanCanonical(location.pathname, canonical);

  // Build WebPage schema
  const webPageSchema = {
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
  };

  // Generate breadcrumb schema if provided
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs || []);

  // Combine all JSON-LD schemas
  const allSchemas = [
    organizationSchema,
    siteNavigationSchema,
    webPageSchema,
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
  ];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Preload LCP image for better performance */}
      {preloadImage && (
        <link rel="preload" as="image" href={preloadImage} fetchPriority="high" />
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
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="FEELOMOVE+" />
      <meta property="og:locale" content="es_ES" />
      
      {/* Twitter Card - summary_large_image */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@feelomove" />
      <meta name="twitter:creator" content="@feelomove" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Dynamic robots meta - noindex for filtered/sorted/search pages */}
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
