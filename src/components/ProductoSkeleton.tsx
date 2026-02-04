import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { useParams, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
/**
 * ProductoSkeleton - CLS-optimized skeleton for concert/festival detail pages
 * 
 * CRITICAL FOR PAGESPEED & SEO: 
 * - Includes SEO meta tags so bots see valid content during loading
 * - Generates H1 and title IMMEDIATELY from slug (no fetch required)
 * - This prevents Google from seeing empty content → avoids Soft 404
 * 
 * CRITICAL: All dimensions MUST match the real Producto.tsx layout exactly
 */

/**
 * Smart title generation from slug
 * Converts: "bad-bunny-madrid-15-marzo-2026" → "Bad Bunny en Madrid"
 * Also extracts: artist, city, date for SEO
 */
const parseSlugForSeo = (slug: string | undefined): {
  title: string;
  artist: string;
  city: string;
  dateText: string;
  h1: string;
  description: string;
} => {
  if (!slug) {
    return {
      title: 'Cargando evento...',
      artist: '',
      city: '',
      dateText: '',
      h1: 'Cargando evento...',
      description: 'Compra entradas y reserva hotel para tu evento favorito.'
    };
  }
  
  const parts = slug.split('-');
  
  // Spanish months for date detection
  const spanishMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  // Extended list of Spanish cities (lowercase)
  const knownCities = new Set([
    'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'malaga', 'zaragoza',
    'murcia', 'palma', 'alicante', 'cordoba', 'valladolid', 'vigo', 'gijon',
    'granada', 'santander', 'pamplona', 'almeria', 'burgos', 'salamanca',
    'barakaldo', 'vitoria', 'donostia', 'logroño', 'oviedo', 'leon', 'cadiz',
    'huelva', 'jaen', 'toledo', 'albacete', 'badajoz', 'caceres', 'castellon',
    'tarragona', 'girona', 'lleida', 'huesca', 'teruel', 'soria', 'segovia',
    'avila', 'zamora', 'palencia', 'cuenca', 'guadalajara', 'ciudad real',
    'tenerife', 'las palmas', 'ibiza', 'menorca', 'mallorca', 'benidorm',
    'marbella', 'torremolinos', 'fuengirola', 'estepona', 'ronda', 'nerja',
    'elche', 'cartagena', 'lorca', 'alcoy', 'orihuela', 'torrevieja', 'denia',
    'gandia', 'sagunto', 'alzira', 'ontinyent', 'xativa', 'manises', 'mislata',
    'getafe', 'leganes', 'alcorcon', 'mostoles', 'fuenlabrada', 'parla',
    'alcobendas', 'pozuelo', 'rivas', 'majadahonda', 'boadilla', 'arganda',
    'coslada', 'torrejon', 'alcala', 'aranjuez', 'villalba', 'collado',
    'hospitalet', 'badalona', 'sabadell', 'terrassa', 'mataro', 'rubi',
    'sant cugat', 'viladecans', 'granollers', 'vic', 'manresa', 'igualada',
    'santiago', 'coruna', 'lugo', 'ourense', 'pontevedra', 'ferrol'
  ]);
  
  // Words that should NOT be capitalized (Spanish articles/prepositions)
  const lowercaseWords = new Set(['de', 'la', 'el', 'y', 'los', 'las', 'del', 'en', 'con', 'por', 'a']);
  
  // Smart capitalization function
  const smartCapitalize = (text: string): string => {
    return text.split(' ').map((word, index) => {
      const lowerWord = word.toLowerCase();
      // First word always capitalized, rest check against lowercaseWords
      if (index === 0 || !lowercaseWords.has(lowerWord)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return lowerWord;
    }).join(' ');
  };
  
  let artist = '';
  let city = '';
  let day = '';
  let month = '';
  let year = '';
  
  // Step 1: Find month index (anchor for date detection)
  let monthIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (spanishMonths.includes(parts[i].toLowerCase())) {
      monthIndex = i;
      month = parts[i];
      // Day is the number before month
      if (i > 0 && /^\d{1,2}$/.test(parts[i - 1])) {
        day = parts[i - 1];
      }
      // Year is the number after month
      if (i < parts.length - 1 && /^\d{4}$/.test(parts[i + 1])) {
        year = parts[i + 1];
      }
      break;
    }
  }
  
  // Step 2: Find city - search from the end, before any date components
  let cityIndex = -1;
  const searchEndIndex = monthIndex > 0 
    ? (day ? monthIndex - 2 : monthIndex - 1) // Stop before date
    : parts.length - 1; // No date, check last part
  
  // Check from end backwards for a known city
  for (let i = searchEndIndex; i >= 0; i--) {
    const potentialCity = parts[i].toLowerCase();
    if (knownCities.has(potentialCity)) {
      city = smartCapitalize(parts[i]);
      cityIndex = i;
      break;
    }
    // Also check for two-word cities like "las palmas"
    if (i > 0) {
      const twoWordCity = `${parts[i-1].toLowerCase()} ${potentialCity}`;
      if (knownCities.has(twoWordCity)) {
        city = smartCapitalize(twoWordCity);
        cityIndex = i - 1;
        break;
      }
    }
  }
  
  // If no known city found, assume the part right before date (or last part) is the city
  if (!city && searchEndIndex >= 0) {
    // Only if it doesn't look like a common word
    const lastPart = parts[searchEndIndex].toLowerCase();
    if (!lowercaseWords.has(lastPart) && lastPart.length > 2) {
      city = smartCapitalize(parts[searchEndIndex]);
      cityIndex = searchEndIndex;
    }
  }
  
  // Step 3: Extract artist - everything before city (or before date if no city before date)
  const artistEndIndex = cityIndex > 0 
    ? cityIndex 
    : (monthIndex > 0 && day ? monthIndex - 2 : (monthIndex > 0 ? monthIndex - 1 : parts.length));
  
  if (artistEndIndex > 0) {
    const artistParts = parts.slice(0, artistEndIndex);
    artist = smartCapitalize(artistParts.join(' '));
  }
  
  // Format date text
  const dateText = month 
    ? `${day} de ${smartCapitalize(month)}${year ? ` ${year}` : ''}`
    : year || '';
  
  // Build title and H1
  const title = city 
    ? `${artist} en ${city}${year ? ` ${year}` : ''} - Entradas y Hotel`
    : `${artist} - Entradas y Hotel`;
  
  const h1 = city 
    ? `${artist} en ${city}`
    : artist || 'Evento';
  
  const description = city
    ? `Compra entradas para ${artist} en ${city}. ${dateText ? `Fecha: ${dateText}.` : ''} Reserva tu hotel cerca del recinto y disfruta del concierto sin preocupaciones.`
    : `Compra entradas para ${artist}. Reserva tu hotel y disfruta del evento sin preocupaciones.`;
  
  return { title, artist, city, dateText, h1, description };
};

const ProductoSkeleton = () => {
  const { slug } = useParams();
  const location = useLocation();
  
  // CRITICAL: Generate SEO content IMMEDIATELY from slug (no fetch)
  const { title, h1, description, artist, city, dateText } = parseSlugForSeo(slug);
  
  const isFestival = location.pathname.startsWith('/festival/');
  const eventType = isFestival ? 'Festival' : 'Concierto';
  const canonicalUrl = `https://feelomove.com${location.pathname}`;
  
  // CRITICAL SEO: Update #seo-fallback in index.html with dynamic content
  // This runs BEFORE paint so crawlers see relevant content immediately
  // Uses specific IDs for reliable element targeting
  useLayoutEffect(() => {
    if (!h1) return;
    
    // Update H1 with event name using ID
    const fallbackH1 = document.getElementById('seo-fallback-h1');
    if (fallbackH1) {
      fallbackH1.textContent = `Entradas ${h1} | FEELOMOVE+`;
    }
    
    // Update description using ID
    const fallbackDescription = document.getElementById('seo-fallback-description');
    if (fallbackDescription) {
      fallbackDescription.textContent = description;
    }
    
    // Update section heading using ID
    const fallbackH2 = document.getElementById('seo-fallback-h2');
    if (fallbackH2) {
      fallbackH2.textContent = `${eventType}: ${h1}`;
    }
    
    // Update section description using ID
    const fallbackSectionText = document.getElementById('seo-fallback-section-text');
    if (fallbackSectionText) {
      fallbackSectionText.textContent = city 
        ? `Compra entradas para ${artist || h1} en ${city}. ${dateText ? `Fecha: ${dateText}.` : ''} Reserva hotel y disfruta del evento.`
        : `Compra entradas para ${artist || h1}. Reserva hotel cerca del recinto.`;
    }
    
    // Cleanup: restore minimal content when unmounting
    return () => {
      const h1El = document.getElementById('seo-fallback-h1');
      if (h1El) h1El.textContent = 'FEELOMOVE+';
      
      const descEl = document.getElementById('seo-fallback-description');
      if (descEl) descEl.textContent = '';
      
      const h2El = document.getElementById('seo-fallback-h2');
      if (h2El) h2El.textContent = '';
      
      const sectionEl = document.getElementById('seo-fallback-section-text');
      if (sectionEl) sectionEl.textContent = '';
    };
  }, [h1, description, artist, city, dateText, eventType]);
  // JSON-LD for immediate SEO (even during loading)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://feelomove.com" },
      { "@type": "ListItem", "position": 2, "name": isFestival ? "Festivales" : "Conciertos", "item": `https://feelomove.com/${isFestival ? 'festivales' : 'conciertos'}` },
      ...(city ? [{ "@type": "ListItem", "position": 3, "name": city, "item": `https://feelomove.com/destinos/${city.toLowerCase()}` }] : []),
      { "@type": "ListItem", "position": city ? 4 : 3, "name": artist || h1, "item": canonicalUrl }
    ]
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* CRITICAL SEO: Full meta tags from slug - Google sees valid content immediately */}
      <Helmet>
        <title>{title} | FEELOMOVE+</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        {/* IMPORTANT: index,follow during loading - NOT noindex */}
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={`${title} | FEELOMOVE+`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="event" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Breadcrumbs Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-5 w-64 rounded" />
        </div>
        
        {/* CRITICAL: H1 with real content from slug - NOT skeleton */}
        {/* This is what Google reads for semantic content */}
        <div className="md:hidden mb-3">
          <h1 className="text-xl font-black text-foreground">{h1}</h1>
          {city && dateText && (
            <p className="text-muted-foreground text-sm mt-1">{city} · {dateText}</p>
          )}
        </div>
        
        {/* Hero Skeleton */}
        <div 
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{ minHeight: '200px', aspectRatio: '16/9' }}
        >
          <div className="relative h-[200px] sm:h-[340px] md:h-[420px] w-full">
            <Skeleton className="absolute inset-0 w-full h-full animate-shimmer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            
            {/* Mobile: Date badge skeleton */}
            <div className="absolute left-2 bottom-2 sm:hidden">
              <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 py-2 flex items-center gap-2">
                <div className="text-center border-r border-border pr-2">
                  <Skeleton className="h-2.5 w-6 mx-auto mb-1 rounded" />
                  <Skeleton className="h-6 w-6 mx-auto rounded" />
                </div>
                <div className="text-left">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="h-3 w-16 mt-1 rounded" />
                </div>
              </div>
            </div>
            
            {/* Desktop: Date Card skeleton */}
            <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 hidden sm:block">
              <div className="bg-card rounded-xl shadow-lg p-4 sm:p-5 md:p-6 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]">
                <div className="text-center">
                  <Skeleton className="h-4 sm:h-5 w-10 mx-auto rounded" />
                  <Skeleton className="h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 mx-auto my-1 sm:my-2 rounded-lg" />
                  <Skeleton className="h-5 sm:h-6 w-12 mx-auto rounded" />
                  <div className="border-t border-border mt-3 pt-3 sm:mt-4 sm:pt-4">
                    <Skeleton className="h-6 sm:h-7 md:h-8 w-16 mx-auto rounded" />
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <Skeleton className="h-4 sm:h-5 w-20 rounded" />
                      <Skeleton className="h-3 sm:h-4 w-24 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop: Center title - REAL H1 on desktop */}
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center max-w-[50%] hidden sm:flex flex-col items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">{h1}</h1>
            </div>
          </div>
        </div>

        {/* SEO Text: Visible semantic content for Google */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            {description} Cargando información del {eventType.toLowerCase()}...
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tickets & Hotels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tickets Section */}
            <Card className="border-border/50" style={{ minHeight: '280px' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-7 w-40 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="border border-border/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3"
                      style={{ minHeight: '140px' }}
                    >
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <div className="flex items-center justify-between pt-1 sm:pt-2">
                        <Skeleton className="h-6 w-16 rounded" />
                        <Skeleton className="h-8 w-20 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hotels Section */}
            <Card className="border-border/50" style={{ minHeight: '400px' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-7 w-52 rounded-md" />
                  </div>
                  <Skeleton className="h-9 w-28 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="flex gap-3 sm:gap-4 p-3 sm:p-4 border border-border/30 rounded-xl"
                      style={{ minHeight: '120px' }}
                    >
                      <Skeleton className="h-24 sm:h-28 w-28 sm:w-36 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <Skeleton className="h-5 w-3/4 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                        <div className="flex gap-2 flex-wrap">
                          <Skeleton className="h-5 w-14 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full rounded" />
                      </div>
                      <div className="text-right space-y-2 flex-shrink-0 hidden sm:block">
                        <Skeleton className="h-6 w-20 ml-auto rounded" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Cart Skeleton */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-border/50" style={{ minHeight: '300px' }}>
              <CardHeader>
                <Skeleton className="h-7 w-32 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <Skeleton className="h-12 w-12 mx-auto rounded-full mb-3" />
                  <Skeleton className="h-5 w-40 mx-auto rounded" />
                  <Skeleton className="h-4 w-48 mx-auto mt-2 rounded" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductoSkeleton;
