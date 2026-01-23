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
  preloadImage?: string; // LCP image URL for preloading
  forceNoIndex?: boolean; // Force noindex regardless of URL params
  is404?: boolean; // If true, don't render canonical (404 pages should not have canonical)
}

// Parameters that should trigger noindex when present
const NOINDEX_PARAMS = ['sort', 'order', 'orderBy', 'page'];
// Filter parameters - noindex if more than one is present
const FILTER_PARAMS = ['ciudad', 'city', 'genero', 'genre', 'artista', 'artist', 'mes', 'month', 'fecha', 'date', 'precio', 'price', 'duracion', 'duration'];

/**
 * Determines if the current URL should be noindexed based on query parameters
 */
const shouldNoIndex = (searchParams: URLSearchParams, pathname: string): boolean => {
  // Search pages should not be indexed
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return true;
  }
  
  // Check for sorting/pagination params - always noindex
  for (const param of NOINDEX_PARAMS) {
    if (searchParams.has(param)) {
      return true;
    }
  }
  
  // Count filter parameters - noindex if more than 1
  let filterCount = 0;
  for (const param of FILTER_PARAMS) {
    if (searchParams.has(param) && searchParams.get(param)) {
      filterCount++;
    }
  }
  
  return filterCount > 1;
};

/**
 * Gets the canonical URL for search pages
 */
const getSearchCanonical = (pathname: string): string | null => {
  if (pathname === '/buscar' || pathname.startsWith('/buscar')) {
    return 'https://feelomove.com/conciertos';
  }
  return null;
};

/**
 * Gets the clean canonical URL for festival pages (strips query params)
 */
const getFestivalCanonical = (pathname: string): string | null => {
  if (pathname.startsWith('/festival/')) {
    // Return clean URL without query parameters
    return `https://feelomove.com${pathname}`;
  }
  return null;
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
  forceNoIndex = false,
  is404 = false
}: SEOHeadProps) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Determine if page should be noindexed
  const isNoIndex = forceNoIndex || shouldNoIndex(searchParams, location.pathname);
  
  // Get canonical - special handling for search and festival pages
  const searchCanonical = getSearchCanonical(location.pathname);
  const festivalCanonical = getFestivalCanonical(location.pathname);
  
  const fullTitle = `${title} | FEELOMOVE+`;
  const siteUrl = "https://feelomove.com";
  
  // For 404 pages, don't generate a canonical URL at all
  // This prevents Google from associating the error page with any URL
  let fullCanonical: string | null = null;
  
  if (!is404) {
    // Ensure canonical is always absolute URL and strips ALL query params
    // Priority: festival canonical > search canonical > provided canonical > current path (WITHOUT params)
    const baseCanonical = festivalCanonical || searchCanonical || canonical;
    
    if (baseCanonical) {
      // Always strip query params from canonical
      const cleanedCanonical = baseCanonical.split('?')[0];
      fullCanonical = cleanedCanonical.startsWith('http') 
        ? cleanedCanonical
        : `${siteUrl}${cleanedCanonical.startsWith('/') ? cleanedCanonical : `/${cleanedCanonical}`}`;
    } else {
      // Use current path without query params
      fullCanonical = `${siteUrl}${location.pathname}`;
    }
  }

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
