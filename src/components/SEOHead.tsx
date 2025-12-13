import { Helmet } from "react-helmet-async";

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
}

// Organization schema - global for all pages
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "FEELOMOVE+",
  "alternateName": "Feelomove",
  "url": "https://feelomove.com",
  "logo": "https://feelomove.com/favicon.svg",
  "description": "Plataforma líder para reservar conciertos, festivales y hoteles en España",
  "sameAs": [
    "https://www.instagram.com/feelomove/",
    "https://x.com/feelomove",
    "https://www.pinterest.com/feelomove/"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["Spanish", "English"]
  },
  "areaServed": {
    "@type": "Country",
    "name": "Spain"
  }
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
      "name": "Géneros",
      "url": "https://feelomove.com/musica"
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
  breadcrumbs
}: SEOHeadProps) => {
  const fullTitle = `${title} | FEELOMOVE+`;
  const siteUrl = "https://feelomove.com";
  const fullCanonical = canonical 
    ? canonical.startsWith('http') 
      ? canonical 
      : `${siteUrl}${canonical.startsWith('/') ? '' : '/'}${canonical}`
    : undefined;

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
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="language" content="Spanish" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="FEELOMOVE+" />
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
