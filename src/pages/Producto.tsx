import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEventData } from "@/hooks/useEventData";
import { useEventHotels, HotelData } from "@/hooks/useEventHotels";
import { usePageTracking } from "@/hooks/usePageTracking";
// SYNC: Header and Hero components must NOT be lazy-loaded to prevent layout shift
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import CollapsibleBadges from "@/components/CollapsibleBadges";
import { EventStatusBanner, getEventStatus } from "@/components/EventStatusBanner";
import { EventSeo, createEventSeoProps } from "@/components/EventSeo";
import ArtistDestinationsList from "@/components/ArtistDestinationsList";
import { FestivalServiceAddons } from "@/components/FestivalServiceAddons";

// LAZY: Below-the-fold components with fixed-height Suspense fallbacks
const HotelMapTabs = lazy(() => import("@/components/HotelMapTabs"));
const RelatedLinks = lazy(() => import("@/components/RelatedLinks"));
const MobileCartBar = lazy(() => import("@/components/MobileCartBar"));
const Footer = lazy(() => import("@/components/Footer"));

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart, CartTicket } from "@/contexts/CartContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";
import { getEventUrl } from "@/lib/eventUtils";
import { optimizeImageUrl, generateHeroSrcSet } from "@/lib/imageOptimization";

// === INLINE SVG ICONS (replaces lucide-react for LCP optimization) ===
const IconHeart = ({ filled, className = "" }: { filled?: boolean; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconMinus = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
  </svg>
);
const IconPlus = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);
const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IconTrash2 = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
  </svg>
);
const IconAlertCircle = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);
const IconRefreshCw = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
);
const IconTicket = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
  </svg>
);
const IconBuilding2 = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
  </svg>
);

// === NATIVE DATE FORMATTING (replaces date-fns) ===
const SPANISH_MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const SPANISH_MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const formatDatePart = (date: Date, part: 'day' | 'month' | 'monthLong' | 'year' | 'time' | 'monthYear') => {
  switch (part) {
    case 'day': return String(date.getDate()).padStart(2, '0');
    case 'month': return SPANISH_MONTHS_SHORT[date.getMonth()];
    case 'monthLong': return SPANISH_MONTHS_LONG[date.getMonth()];
    case 'year': return String(date.getFullYear());
    case 'time': return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    case 'monthYear': return `${SPANISH_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }
};

const formatDateISO = (date: Date) => date.toISOString().split('T')[0];

const differenceInDays = (dateA: Date, dateB: Date) => Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24));
const differenceInHours = (dateA: Date, dateB: Date) => Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60));

// Fixed-height skeleton fallbacks to prevent CLS (400px matches HotelMapTabs)
const HotelsSkeleton = () => (
  <div className="w-full" style={{ minHeight: '400px' }}>
    <Skeleton className="h-10 w-48 mb-4 animate-shimmer" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl animate-shimmer" />
      ))}
    </div>
  </div>
);

const RelatedLinksSkeleton = () => (
  <div className="w-full py-4" style={{ minHeight: '120px' }}>
    <Skeleton className="h-6 w-32 mb-3 animate-shimmer" />
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full animate-shimmer" />
      ))}
    </div>
  </div>
);

const MobileCartSkeleton = () => (
  <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border xl:hidden" />
);

interface PriceLevel {
  id: number;
  name: string;
  face_value: number;
  ticket_fees: number;
  total_price: number;
  availability: string;
}

interface PriceType {
  id: number;
  code: string;
  name: string;
  description: string;
  regular: boolean;
  price_levels: PriceLevel[];
}

interface TicketTypesData {
  currency: string;
  price_types: PriceType[];
}

// HotelData interface is now imported from useEventHotels hook

// === ULTRA-LAZY HYDRATION: Below-fold content only renders after 3s ===
const FooterSkeleton = () => (
  <div className="w-full bg-card border-t border-border" style={{ minHeight: '200px' }} />
);

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();
  
  // Split loading states: hotels are CRITICAL (render immediately), footer/links are not
  const [isInteractive, setIsInteractive] = useState(false);
  const [renderHotels] = useState(true); // Hotels render immediately when data available
  
  useEffect(() => {
    // Keep 4s delay ONLY for non-critical components (footer, related links, mobile cart)
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setIsInteractive(true), { timeout: 500 });
      } else {
        setIsInteractive(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  
  // Detect route type for canonical URL
  const isConcierto = location.pathname.startsWith('/concierto/');
  const isFestivalRoute = location.pathname.startsWith('/festival/');
  
  const [showAllTickets, setShowAllTickets] = useState(false);

  // OPTIMIZED: Use parallelized event data hook (Promise.all instead of waterfall)
  const { data: eventResult, isLoading, isError, error, refetch } = useEventData(
    slug,
    isFestivalRoute,
    isConcierto
  );

  // STABILITY FIX: Track if we've already navigated to prevent loops
  const hasNavigatedRef = useRef(false);
  
  // Handle redirects from the optimized hook - with loop prevention
  useEffect(() => {
    // Exit conditions to prevent loops
    if (hasNavigatedRef.current) return;
    if (isLoading) return;
    
    if (eventResult?.needsRedirect && eventResult.redirectPath) {
      console.log('[Producto] Redirecting to:', eventResult.redirectPath);
      hasNavigatedRef.current = true;
      navigate(eventResult.redirectPath, { replace: true });
      return;
    }
    if (eventResult?.needsRouteCorrection && eventResult.correctRoutePath) {
      console.log('[Producto] Route correction to:', eventResult.correctRoutePath);
      hasNavigatedRef.current = true;
      navigate(eventResult.correctRoutePath, { replace: true });
      return;
    }
  }, [eventResult, navigate, isLoading]);

  // Extract event data and canonical slug from result
  const eventData = eventResult?.data;
  const rpcCanonicalSlug = eventResult?.canonicalSlug || null;

  // Process data - first row has event details
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;

  // Track page view with proper title (fixes "Page Name not defined" in Matomo)
  usePageTracking(eventDetails?.event_name);
  
  // RESTORED: Fetch hotels from lite_tbl_event_hotel_prices + lite_tbl_hotels
  // Uses venue coordinates for distance calculation
  // CRITICAL: This hook MUST be called before any early returns to satisfy React hooks rules
  const { data: hotels = [] } = useEventHotels({
    eventId: eventDetails?.event_id,
    venueLatitude: eventDetails?.venue_latitude ? Number(eventDetails.venue_latitude) : null,
    venueLongitude: eventDetails?.venue_longitude ? Number(eventDetails.venue_longitude) : null,
    enabled: !!eventDetails?.event_id,
  });
  
  // Detect route type for display logic - used throughout the component
  const isFestivalDisplay = location.pathname.startsWith('/festival/');
  
  // CRITICAL: All useQuery hooks MUST be called before early returns
  // Artist for "Ver en otros destinos" section
  const primaryAttractionForSearch = (eventDetails as any)?.primary_attraction_name as string | null;
  const artistNames = eventDetails?.attraction_names || [];
  const mainArtist = artistNames[0] || eventDetails?.event_name || '';
  const artistForSearch = primaryAttractionForSearch || mainArtist;
  const currentCity = eventDetails?.venue_city || '';
  
  // Fetch other destinations where this artist has events
  const { data: artistOtherCities } = useQuery({
    queryKey: ["artist-other-cities", artistForSearch, currentCity],
    queryFn: async () => {
      if (!artistForSearch) return [];
      
      // Search for concerts and festivals with this artist in other cities
      const [concertsRes, festivalsRes] = await Promise.all([
        supabase
          .from("mv_concerts_cards")
          .select("venue_city, venue_city_slug, image_standard_url")
          .ilike("artist_name", `%${artistForSearch}%`)
          .gte("event_date", new Date().toISOString())
          .neq("venue_city", currentCity)
          .limit(50),
        supabase
          .from("mv_festivals_cards")
          .select("venue_city, venue_city_slug, image_standard_url, attraction_names")
          .gte("event_date", new Date().toISOString())
          .neq("venue_city", currentCity)
          .limit(50)
      ]);
      
      // Group by city with counts
      const cityMap = new Map<string, { count: number; image: string | null; slug: string }>();
      
      // Process concerts
      (concertsRes.data || []).forEach((event: any) => {
        if (event.venue_city) {
          const existing = cityMap.get(event.venue_city);
          if (existing) {
            existing.count++;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, '-')
            });
          }
        }
      });
      
      // Process festivals (check if artist is in lineup)
      (festivalsRes.data || []).forEach((event: any) => {
        const attractionNames = event.attraction_names || [];
        const artistInLineup = attractionNames.some((name: string) => 
          name.toLowerCase().includes(artistForSearch.toLowerCase())
        );
        
        if (artistInLineup && event.venue_city) {
          const existing = cityMap.get(event.venue_city);
          if (existing) {
            existing.count++;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, '-')
            });
          }
        }
      });
      
      return Array.from(cityMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
    enabled: !!artistForSearch && !!currentCity,
    staleTime: 5 * 60 * 1000,
  });

  // Generate Stay22 widget URLs dynamically from venue coordinates and event dates
  // These are used as fallback when no pre-fetched hotel data exists
  const stay22Urls = useMemo(() => {
    const lat = eventDetails?.venue_latitude;
    const lng = eventDetails?.venue_longitude;
    
    if (!lat || !lng) return { map: null, accommodations: null, activities: null };
    
    // Use event_date for concerts, start_date for festivals
    const eventDateStr = isFestivalRoute 
      ? ((eventDetails as any)?.start_date || eventDetails?.event_date)
      : eventDetails?.event_date;
    
    // Get end_date for festivals, or calculate checkout for concerts
    const endDateStr = isFestivalRoute 
      ? ((eventDetails as any)?.end_date || eventDateStr)
      : null;
    
    // Calculate check-in/check-out dates
    let checkinDate: string;
    let checkoutDate: string;
    
    if (eventDateStr) {
      const eventDateObj = new Date(eventDateStr);
      // Check-in: day before event
      const checkin = new Date(eventDateObj);
      checkin.setDate(checkin.getDate() - 1);
      checkinDate = formatDateISO(checkin);
      
      // Check-out: day after event (or end_date for festivals)
      if (endDateStr) {
        const endDateObj = new Date(endDateStr);
        const checkout = new Date(endDateObj);
        checkout.setDate(checkout.getDate() + 1);
        checkoutDate = formatDateISO(checkout);
      } else {
        const checkout = new Date(eventDateObj);
        checkout.setDate(checkout.getDate() + 1);
        checkoutDate = formatDateISO(checkout);
      }
    } else {
      checkinDate = '';
      checkoutDate = '';
    }
    
    // Stay22 affiliate ID (using generic for now)
    const aid = 'feelomove';
    
    // Build Stay22 URLs
    const baseParams = `lat=${lat}&lng=${lng}&checkin=${checkinDate}&checkout=${checkoutDate}&aid=${aid}`;
    
    return {
      map: `https://www.stay22.com/embed/gm?${baseParams}&zoom=14`,
      accommodations: `https://www.stay22.com/embed/gm?${baseParams}&maincolor=00FF8F&markerimage=https://feelomove.com/favicon.svg`,
      activities: `https://www.stay22.com/embed/activities?${baseParams}`
    };
  }, [eventDetails?.venue_latitude, eventDetails?.venue_longitude, eventDetails?.event_date, (eventDetails as any)?.start_date, (eventDetails as any)?.end_date, isFestivalRoute]);
  
  // Use generated URLs (Stay22) - always available if coordinates exist
  const mapWidgetHtml = stay22Urls.map;
  const stay22Accommodations = stay22Urls.accommodations;
  const stay22Activities = stay22Urls.activities;

  // Clear cart when viewing a different event than what's in the cart
  // This handles both: navigation between events AND page load with stale cart in localStorage
  const prevEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentEventId = eventDetails?.event_id;
    if (!currentEventId) return;
    
    // Check if cart belongs to a different event
    if (cart && cart.event_id !== currentEventId) {
      // Cart has items from a different event - clear it
      clearCart();
    }
    
    prevEventIdRef.current = currentEventId;
  }, [eventDetails?.event_id, cart, clearCart]);

  // Redirect to 404 when event not found - with loop prevention
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading) return;
    
    if (isError && error instanceof Error && error.message === "Evento no encontrado") {
      console.log('[Producto] Event not found, redirecting to 404');
      hasNavigatedRef.current = true;
      navigate("/404", { replace: true });
    }
  }, [isError, error, navigate, isLoading]);

  // Schema.org is handled by SEOHead with jsonLd prop - no duplicate injection needed
  // Meta tags are now handled by SEOHead component - removed useMetaTags hook to avoid duplicate query

  // PERFORMANCE: Parse ticket prices using useMemo
  // CRITICAL: This hook MUST be called before any early returns to satisfy React hooks rules
  const ticketPrices = useMemo(() => {
    if (!eventDetails) return [];
    const rawTicketTypes = (eventDetails as any).ticket_types;
    if (!rawTicketTypes) return [];
    
    try {
      // Parse JSON string if needed
      const ticketData: TicketTypesData = typeof rawTicketTypes === 'string' 
        ? JSON.parse(rawTicketTypes) 
        : rawTicketTypes;
      
      if (!ticketData?.price_types || !Array.isArray(ticketData.price_types)) return [];
      
      // Flatten price_types -> price_levels into individual ticket options
      const tickets: Array<{id: string; type: string; code: string; description: string; price: number; fees: number; availability: string}> = [];
      
      for (const priceType of ticketData.price_types) {
        if (priceType.price_levels && Array.isArray(priceType.price_levels)) {
          for (let levelIndex = 0; levelIndex < priceType.price_levels.length; levelIndex++) {
            const level = priceType.price_levels[levelIndex];
            const ticketId = `${priceType.code || 'ticket'}-${levelIndex}`;
            // Normalize availability - treat missing/unknown values as "available"
            const rawAvailability = level.availability?.toLowerCase() || "available";
            const normalizedAvailability = rawAvailability === "none" || rawAvailability === "soldout" || rawAvailability === "sold_out" 
              ? "none" 
              : rawAvailability === "limited" 
                ? "limited" 
                : "available";
            
            tickets.push({
              id: ticketId,
              type: priceType.name || level.name || "Entrada General",
              code: priceType.code || "",
              description: priceType.description || "",
              price: Number(level.face_value || 0),
              fees: Number(level.ticket_fees || 0),
              availability: normalizedAvailability
            });
          }
        }
      }
      
      // Sort by: 1. Available first (not sold out), 2. Then by price
      return tickets.sort((a, b) => {
        const aAvailable = a.availability !== "none" ? 0 : 1;
        const bAvailable = b.availability !== "none" ? 0 : 1;
        if (aAvailable !== bAvailable) return aAvailable - bAvailable;
        return a.price - b.price;
      });
    } catch (e) {
      console.error("Error parsing ticket_types:", e);
      return [];
    }
  }, [eventDetails]);

  // CRITICAL FOR PAGESPEED: Show skeleton during loading states
  // This prevents PageSpeed from measuring 404 content during async data loading
  if (isLoading) {
    return <ProductoSkeleton />;
  }

  if (isError) {
    // If "Evento no encontrado", redirect is handled by useEffect above
    // Show skeleton while redirect happens to avoid PageSpeed seeing 404 content
    if (error instanceof Error && error.message === "Evento no encontrado") {
      return <ProductoSkeleton />;
    }
    
    // Other errors: show error UI (this is rare and acceptable)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-20">
          <Card className="max-w-lg mx-auto border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <IconAlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Error al cargar el evento</h2>
                  <p className="text-muted-foreground text-sm">
                    {error instanceof Error ? error.message : "Ha ocurrido un error inesperado"}
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(-1)}
                    className="gap-2"
                  >
                    Volver atrás
                  </Button>
                  <Button 
                    onClick={() => refetch()}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <IconRefreshCw className="h-4 w-4" />
                    Reintentar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    );
  }

  // CRITICAL FOR PAGESPEED: If eventResult indicates redirect pending, show skeleton
  // This prevents PageSpeed from measuring intermediate states
  if (eventResult?.needsRedirect || eventResult?.needsRouteCorrection) {
    return <ProductoSkeleton />;
  }

  // Only show "not found" UI if data explicitly indicates no event exists
  // AND we're not waiting for a redirect
  if (!eventDetails) {
    // Show skeleton for a brief moment before showing not found
    // This gives the redirect useEffect time to execute
    return <ProductoSkeleton />;
  }

  // Helper to check placeholder dates
  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith('9999');
  
  const rawEventDate = eventDetails.event_date;
  const hasValidDate = !isPlaceholderDate(rawEventDate);
  const eventDate = hasValidDate && rawEventDate ? new Date(rawEventDate) : new Date();
  const formattedTime = hasValidDate ? formatDatePart(eventDate, 'time') : null;
  const monthYear = hasValidDate ? formatDatePart(eventDate, 'monthYear') : "Fecha por confirmar";
  
  // Calculate countdown only if valid date
  const now = new Date();
  const daysUntil = hasValidDate ? differenceInDays(eventDate, now) : -1;
  const hoursUntil = hasValidDate ? differenceInHours(eventDate, now) % 24 : 0;
  
  // Festival lineup artists - prioritize manual lineup over automatic
  const festivalLineupArtists = isFestivalDisplay 
    ? ((eventDetails as any).festival_lineup_artists_manual as string[] | null) 
      || ((eventDetails as any).festival_lineup_artists as string[] | null) 
      || []
    : [];
  
  // Display logic for festivals based on primary/secondary attraction
  // Case A: Full festival pass (secondary = null or same as primary)
  // Case B: Artist-specific entry (secondary = different artist name)
  const primaryAttraction = (eventDetails as any).primary_attraction_name as string | null;
  const secondaryAttraction = (eventDetails as any).secondary_attraction_name as string | null;
  const isArtistEntry = isFestivalDisplay && secondaryAttraction && secondaryAttraction !== primaryAttraction;
  
  // For display purposes
  const displayTitle = isArtistEntry ? secondaryAttraction : eventDetails.event_name;
  const displaySubtitle = isArtistEntry ? `en ${primaryAttraction || eventDetails.event_name}` : null;

  // artistOtherCities is already fetched above (before early returns)

  // Generate SEO title - optimized for 60 chars: [Artist] en [City] [Year] - Entradas y Hotel
  const eventYear = hasValidDate ? formatDatePart(eventDate, 'year') : '';
  const seoTitle = `${mainArtist} en ${eventDetails.venue_city}${eventYear ? ` ${eventYear}` : ''} - Entradas y Hotel`;
  
  // Generate SEO description - optimized for ~155 chars
  const seoDescription = `Compra entradas para ${mainArtist} en ${eventDetails.venue_city}${eventYear ? ` ${eventYear}` : ''}. Concierto en ${eventDetails.venue_name}. Reserva tu pack de entradas + hotel con Feelomove+.`;

  // ticketPrices is already computed above (before early returns) - no duplicate needed
  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 4);
  const hasMoreTickets = ticketPrices.length > 4;
  
  // Calculate if event has VIP tickets from ticket data (more reliable than has_vip_tickets field)
  const hasVipTickets = ticketPrices.some(ticket => 
    /vip/i.test(ticket.type || '') || 
    /vip/i.test(ticket.description || '') || 
    /vip/i.test(ticket.code || '')
  ) || (eventDetails as any).has_vip_tickets;
  
  // Calculate real availability based on ticket data
  const hasAvailableTickets = ticketPrices.some(ticket => ticket.availability !== "none");
  const isEventAvailable = hasAvailableTickets && !eventDetails.sold_out;

  const handleTicketQuantityChange = (ticketId: string, change: number) => {
    const existingTickets = cart?.event_id === eventDetails.event_id ? cart.tickets : [];
    const ticketIndex = existingTickets.findIndex(t => t.type === ticketId);
    
    const ticketData = ticketPrices.find(t => t.id === ticketId);
    if (!ticketData) return;

    let updatedTickets = [...existingTickets];
    
    if (ticketIndex >= 0) {
      // Existing ticket - increment/decrement
      const newQuantity = Math.max(0, Math.min(10, updatedTickets[ticketIndex].quantity + change));
      if (newQuantity === 0) {
        updatedTickets = updatedTickets.filter(t => t.type !== ticketId);
      } else {
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          quantity: newQuantity
        };
      }
    } else if (change > 0) {
      // New ticket - start with quantity 1
      updatedTickets.push({
        type: ticketId,
        description: `${ticketData.type} - ${ticketData.description || ticketData.code}`,
        price: ticketData.price,
        fees: ticketData.fees,
        quantity: 1
      });
    }

    if (updatedTickets.length > 0) {
      addTickets(eventDetails.event_id!, eventDetails as any, updatedTickets);
    } else {
      clearCart();
    }
  };

  const getTicketQuantity = (ticketId: string) => {
    if (!cart || cart.event_id !== eventDetails.event_id) return 0;
    const ticket = cart.tickets.find(t => t.type === ticketId);
    return ticket ? ticket.quantity : 0;
  };

  const handleAddHotel = (hotel: any) => {
    const nights = (eventDetails as any).package_nights || 1;
    const pricePerNight = Number(hotel.selling_price || hotel.price || 0);
    addHotel(eventDetails.event_id!, eventDetails, {
      hotel_id: hotel.hotel_id,
      hotel_name: hotel.hotel_name,
      nights: nights,
      price_per_night: pricePerNight,
      total_price: pricePerNight * nights,
      image: hotel.hotel_main_photo || hotel.hotel_thumbnail || "/placeholder.svg",
      description: hotel.hotel_description || "Hotel confortable cerca del venue",
      checkin_date: (eventDetails as any).package_checkin || formatDateISO(eventDate),
      checkout_date: (eventDetails as any).package_checkout || formatDateISO(new Date(eventDate.getTime() + nights * 24 * 60 * 60 * 1000)),
    });
  };

  const isEventInCart = cart?.event_id === eventDetails.event_id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  // Get image - prioritize image_large_url and optimize for LCP
  // Use optimized Ticketmaster image variant (max 800px width for mobile LCP)
  const rawEventImage = (eventDetails as any).image_large_url || (eventDetails as any).image_standard_url || "/placeholder.svg";
  
  // Optimize Ticketmaster images: replace CUSTOM/large variants with smaller ones
  // Reduces ~2MB images to ~100KB for faster LCP
  const eventImage = (() => {
    if (!rawEventImage || rawEventImage === "/placeholder.svg") return rawEventImage;
    
    // Ticketmaster image optimization: use TABLET_LANDSCAPE_16_9 variant (~800px wide)
    // Patterns: s1.ticketm.net/img/tat/dam/a/xxx/xxx_CUSTOM.jpg -> xxx_TABLET_LANDSCAPE_16_9.jpg
    if (rawEventImage.includes('ticketm.net')) {
      // Replace common large variants with optimized mobile variant
      return rawEventImage
        .replace(/_CUSTOM\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_RETINA_PORTRAIT_16_9\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_RETINA_LANDSCAPE_16_9\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1')
        .replace(/_SOURCE\.(jpg|png|webp)$/i, '_TABLET_LANDSCAPE_16_9.$1');
    }
    
    return rawEventImage;
  })();

  // Build canonical URL using RPC canonical slug, VIP/Upgrade variant detection, or current slug
  const currentSlug = eventDetails.event_slug || '';
  const eventName = eventDetails.event_name?.toLowerCase() || '';
  
  // Detect VIP/Upgrade variants by slug patterns AND event name keywords
  const vipSlugPatterns = [
    '-paquetes-vip', '-vip', '-upgrade', '-meet-greet', '-pack', '-parking'
  ];
  const vipNameKeywords = [
    'vip', 'upgrade', 'meet & greet', 'meet and greet', 'paquete', 
    'pack', 'parking', 'golden circle', 'premium', 'platinum'
  ];
  
  const hasVipSlugPattern = vipSlugPatterns.some(pattern => currentSlug.includes(pattern));
  const hasVipNameKeyword = vipNameKeywords.some(keyword => eventName.includes(keyword));
  const isVipVariant = hasVipSlugPattern || hasVipNameKeyword;
  
  // Priority: 1. RPC canonical slug, 2. VIP variant cleanup (remove suffix), 3. Current slug
  // For VIP variants, the canonical should point to the main event (same artist, same day)
  const cleanedVipSlug = vipSlugPatterns.reduce(
    (slug, pattern) => slug.replace(new RegExp(pattern + '(-\\d+)?$', 'g'), ''),
    currentSlug
  );
  
  const canonicalSlug = rpcCanonicalSlug 
    ? rpcCanonicalSlug 
    : isVipVariant 
      ? cleanedVipSlug
      : currentSlug;
  
  // Build canonical URL - always use the canonical slug
  const eventType = isFestivalDisplay ? 'festival' : 'concierto';
  const canonicalUrl = `/${eventType}/${canonicalSlug}`;
  const absoluteUrl = `https://feelomove.com${canonicalUrl}`;

  // Determine event status for banner and JSON-LD
  const eventStatus = getEventStatus(
    eventDetails.cancelled,
    eventDetails.rescheduled,
    eventDetails.event_date
  );
  
  // Build comprehensive Event JSON-LD using EventSeo component
  const minPrice = ticketPrices[0]?.price || (eventDetails as any).price_min_incl_fees || 0;
  const maxPrice = ticketPrices[ticketPrices.length - 1]?.price || minPrice;
  
  // Create EventSeo props using helper function
  const eventSeoProps = createEventSeoProps(
    {
      event_id: eventDetails.event_id || '',
      event_name: eventDetails.event_name || '',
      event_slug: eventDetails.event_slug,
      event_date: eventDetails.event_date || '',
      festival_end_date: (eventDetails as any).festival_end_date,
      door_opening_date: (eventDetails as any).door_opening_date,
      venue_name: eventDetails.venue_name,
      venue_address: eventDetails.venue_address,
      venue_city: eventDetails.venue_city || '',
      venue_postal_code: eventDetails.venue_postal_code,
      venue_latitude: eventDetails.venue_latitude,
      venue_longitude: eventDetails.venue_longitude,
      venue_url: (eventDetails as any).venue_url,
      image_large_url: eventDetails.image_large_url,
      image_standard_url: eventDetails.image_standard_url,
      attraction_names: eventDetails.attraction_names,
      price_min_incl_fees: minPrice,
      price_max_incl_fees: maxPrice,
      on_sale_date: (eventDetails as any).on_sale_date,
      sold_out: eventDetails.sold_out,
      cancelled: eventDetails.cancelled,
      rescheduled: eventDetails.rescheduled,
      is_festival: eventDetails.is_festival,
    },
    {
      description: seoDescription,
      url: absoluteUrl,
      status: eventStatus,
      isEventAvailable,
    }
  );

  return (
    <>
      {/* EventSeo component injects JSON-LD structured data */}
      <EventSeo {...eventSeoProps} />
      
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={absoluteUrl}
        ogImage={eventImage}
        ogType="event"
        keywords={`${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
        pageType="ItemPage"
        preloadImage={optimizeImageUrl(eventImage, { width: 1200, quality: 90 })}
        breadcrumbs={[
          { name: "Inicio", url: "/" },
          { name: eventDetails.is_festival ? "Festivales" : "Conciertos", url: eventDetails.is_festival ? "/festivales" : "/conciertos" },
          // For concerts: link to artist profile; for festivals: link to destination
          ...(eventDetails.is_festival 
            ? [{ name: eventDetails.venue_city || "", url: `/destinos/${(eventDetails.venue_city || "").toLowerCase().replace(/\s+/g, '-')}` }]
            : mainArtist 
              ? [{ name: mainArtist, url: `/artista/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}` }]
              : []
          ),
          { name: eventDetails.is_festival ? eventDetails.event_name || "" : eventDetails.venue_city || "" }
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 mt-20">
          {/* Breadcrumbs above hero */}
          <Breadcrumbs />
          
          {/* Event Status Banner for cancelled, rescheduled, or past events */}
          <EventStatusBanner 
            status={eventStatus} 
            eventName={eventDetails.event_name || ''} 
            eventDate={eventDetails.event_date || ''}
          />
          
          {/* Single H1 for SEO - screen reader accessible, visually hidden on mobile */}
          <h1 className="sr-only">
            {displayTitle}{displaySubtitle ? ` ${displaySubtitle}` : ''}
          </h1>
          
          {/* Mobile: Event Name above hero - decorative visual title */}
          <div className="md:hidden mb-3">
            <p className="text-xl font-black text-foreground leading-tight" aria-hidden="true">
              {displayTitle}
            </p>
            {displaySubtitle && (
              <p className="text-sm text-muted-foreground font-medium mt-1" aria-hidden="true">
                {displaySubtitle}
              </p>
            )}
          </div>
          
          {/* Hero Section */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            {/* Background Image */}
            <div className="relative h-[200px] sm:h-[340px] md:h-[420px]">
              <img
                src={optimizeImageUrl(eventImage, { width: 1200, quality: 90 })}
                srcSet={generateHeroSrcSet(eventImage)}
                sizes="100vw"
                alt={eventDetails.event_name || "Evento"}
                className="w-full h-full object-cover"
                width={1200}
                height={675}
                loading="eager"
                decoding="sync"
                // @ts-expect-error - fetchpriority is valid HTML but React doesn't recognize camelCase
                fetchpriority="high"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              
              {/* Mobile: Compact date/city badge */}
              <div className="absolute left-2 bottom-2 sm:hidden">
                <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 py-2 flex items-center gap-2">
                  <div className="text-center border-r border-border pr-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {formatDatePart(eventDate, 'month')}
                    </p>
                    <p className="text-xl font-black text-foreground leading-none">
                      {formatDatePart(eventDate, 'day')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{formattedTime}h</p>
                    <div className="flex items-center gap-0.5 text-muted-foreground">
                      <IconMapPin className="h-3 w-3" />
                      <span className="text-[10px] font-medium">{eventDetails.venue_city}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Full Date Card with Venue */}
              <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 hidden sm:block">
                <div className="bg-card rounded-xl shadow-lg p-4 sm:p-5 md:p-6 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]">
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold text-muted-foreground uppercase tracking-wider">
                      {formatDatePart(eventDate, 'month')}
                    </p>
                    <p className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-none my-1 sm:my-2">
                      {formatDatePart(eventDate, 'day')}
                    </p>
                    <p className="text-base sm:text-lg font-medium text-muted-foreground">
                      {formatDatePart(eventDate, 'year')}
                    </p>
                    <div className="border-t border-border mt-3 pt-3 sm:mt-4 sm:pt-4">
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{formattedTime}h</p>
                      <div className="flex flex-col items-center gap-1 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconMapPin className="h-4 w-4" />
                          <span className="text-sm sm:text-base font-bold">{eventDetails.venue_city}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 text-center max-w-[120px] sm:max-w-[140px]">{eventDetails.venue_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Desktop: Center - Event Name with Lineup (for festivals) and Favorite above */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center max-w-[55%] sm:max-w-[50%] md:max-w-[45%] hidden sm:block">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full bg-white/20 hover:bg-white/30 flex-shrink-0 backdrop-blur-sm"
                    onClick={() => toggleFavorite({
                      event_id: eventDetails.event_id!,
                      event_name: eventDetails.event_name || '',
                      event_slug: eventDetails.event_slug || '',
                      event_date: eventDetails.event_date || '',
                      venue_city: eventDetails.venue_city || '',
                      image_url: eventImage
                    })}
                  >
                    <IconHeart filled={isFavorite(eventDetails.event_id!)} className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${isFavorite(eventDetails.event_id!) ? 'text-accent' : 'text-white'}`} />
                  </Button>
                  {/* Desktop title display - decorative since H1 is above hero */}
                  <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg" aria-hidden="true">
                    {displayTitle}
                  </p>
                  {displaySubtitle && (
                    <p className="text-sm sm:text-base md:text-lg text-white/80 font-medium drop-shadow-md">
                      {displaySubtitle}
                    </p>
                  )}
                  {/* Lineup for festivals - below event name */}
                  {isFestivalDisplay && festivalLineupArtists.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full mt-3">
                      {festivalLineupArtists.map((artist, idx) => (
                        <span 
                          key={idx} 
                          className="text-xs sm:text-sm md:text-base text-white/90 font-semibold drop-shadow-md px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile: Favorite button and vertical badges */}
              <div className="absolute right-2 top-2 bottom-2 sm:hidden flex flex-col items-end justify-between">
                {/* Favorite button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                  onClick={() => toggleFavorite({
                    event_id: eventDetails.event_id!,
                    event_name: eventDetails.event_name || '',
                    event_slug: eventDetails.event_slug || '',
                    event_date: eventDetails.event_date || '',
                    venue_city: eventDetails.venue_city || '',
                    image_url: eventImage
                  })}
                >
                  <IconHeart filled={isFavorite(eventDetails.event_id!)} className={`h-4 w-4 ${isFavorite(eventDetails.event_id!) ? 'text-accent' : 'text-white'}`} />
                </Button>
                
                {/* Vertical badges */}
                <div className="flex flex-col gap-1 items-end">
                  {eventDetails.sold_out && (
                    <Badge className="bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5">AGOTADO</Badge>
                  )}

                  {hasVipTickets && (
                    <Badge variant="outline" className="bg-background/80 text-[9px] px-1.5 py-0.5">VIP</Badge>
                  )}
                </div>
              </div>
              
              {/* Desktop: Right Side - Badges and Event Image */}
              <div className="absolute right-3 top-3 bottom-3 sm:right-4 sm:top-4 sm:bottom-4 hidden sm:flex flex-col items-end justify-between">
                {/* Badges - collapsible on mobile */}
                <CollapsibleBadges eventDetails={eventDetails} hasVipTickets={hasVipTickets} isEventAvailable={isEventAvailable} daysUntil={daysUntil} />
                
                {/* Event Image with hover zoom */}
                <div className="flex flex-col items-end gap-2 mb-6">
                  <div className="overflow-hidden rounded-xl shadow-2xl border-4 border-background group">
                    <img
                      src={optimizeImageUrl((eventDetails as any).image_large_url || eventImage, { width: 400 })}
                      srcSet={generateHeroSrcSet((eventDetails as any).image_large_url || eventImage)}
                      sizes="(max-width: 768px) 150px, 225px"
                      alt={eventDetails.event_name || "Evento"}
                      className="w-[150px] h-[200px] md:w-[225px] md:h-[305px] object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Ticket Cards - List Format */}
              {ticketPrices.length > 0 && (
                <div>
                  {/* Section Header with Step Number */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isEventInCart && totalPersons > 0 
                        ? "bg-accent text-accent-foreground" 
                        : "bg-foreground text-background"
                    }`}>
                      {isEventInCart && totalPersons > 0 ? <IconCheck className="h-4 w-4" /> : "1"}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">Selecciona tus entradas</h2>
                      {isEventInCart && totalPersons > 0 && (
                        <p className="text-sm text-foreground flex items-center gap-1 mt-0.5">
                          <IconCheck className="h-3 w-3 text-accent" />
                          ¡Entradas añadidas! Ahora elige tu alojamiento abajo
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {displayedTickets.map((ticket: any) => {
                      const quantity = getTicketQuantity(ticket.id);
                      const isSoldOut = ticket.availability === "none";
                      const isLimited = ticket.availability === "limited";
                      const isVIP = /vip/i.test(ticket.type || '') || /vip/i.test(ticket.description || '') || /vip/i.test(ticket.code || '');
                      
                      return (
                        <Card 
                          key={ticket.id} 
                          className={`border-2 overflow-hidden transition-all ${
                            isSoldOut 
                              ? 'opacity-60 border-muted' 
                              : quantity > 0 
                                ? 'border-accent shadow-lg shadow-accent/20' 
                                : 'hover:border-accent/50'
                          }`}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start sm:items-center justify-between gap-3">
                              {/* Left: Ticket info */}
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {isVIP && (
                                    <span className="text-[10px] font-bold text-white bg-foreground px-2 py-0.5 rounded">
                                      VIP
                                    </span>
                                  )}
                                  {isSoldOut ? (
                                    <span className="text-[10px] font-bold text-destructive bg-destructive/15 px-2 py-0.5 rounded border border-destructive/30">
                                      AGOTADO
                                    </span>
                                  ) : isLimited ? (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 dark:text-amber-200 dark:bg-amber-900/50 dark:border-amber-700">
                                      ÚLTIMAS
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 dark:text-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700">
                                      DISPONIBLE
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm sm:text-base font-bold uppercase text-foreground">
                                  {ticket.type}
                                </p>
                                {ticket.description && ticket.description !== ticket.type && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
                                    {ticket.description}
                                  </p>
                                )}
                              </div>

                              {/* Right: Price stacked above Quantity Selector */}
                              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                {/* Price */}
                                <div className="text-center">
                                  <span className="text-xl sm:text-2xl font-black text-foreground">
                                    €{ticket.price.toFixed(0)}
                                  </span>
                                  {ticket.fees > 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                      + €{ticket.fees.toFixed(2)} gastos
                                    </p>
                                  )}
                                </div>

                                {/* Quantity Selector */}
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 rounded-full p-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ticket-qty-decrease h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-background hover:text-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                                    disabled={quantity === 0 || isSoldOut}
                                    aria-label={`Reducir cantidad de ${ticket.type}`}
                                    data-ticket-type={ticket.type}
                                  >
                                    <IconMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                  <span className="w-6 sm:w-8 text-center font-bold text-base sm:text-lg">{quantity}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ticket-qty-increase h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-colors disabled:opacity-30"
                                    onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                                    disabled={quantity >= 10 || isSoldOut}
                                    aria-label={`Aumentar cantidad de ${ticket.type}`}
                                    data-ticket-type={ticket.type}
                                  >
                                    <IconPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {hasMoreTickets && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllTickets(!showAllTickets)}
                        className="border-2 hover:border-accent hover:text-accent font-bold px-8"
                      >
                        {showAllTickets ? "Ver menos" : `Ver ${ticketPrices.length - 4} más`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Festival Services & Add-ons Section (Transport, Parking, Camping) */}
              {isFestivalDisplay && eventDetails?.event_id && (
                <FestivalServiceAddons 
                  eventId={eventDetails.event_id}
                  festivalName={eventDetails?.primary_attraction_name || eventDetails?.event_name}
                  className="mt-6"
                />
              )}

              {/* Hotels & Map Section - Always show for events with venue coordinates OR city */}
              {/* CRITICAL: Show section even if hotels array is empty - use Stay22 map as fallback */}
              {renderHotels && (eventDetails?.venue_city || (eventDetails?.venue_latitude && eventDetails?.venue_longitude)) && (
                <div id="hotels-section">
                  <Suspense fallback={<HotelsSkeleton />}>
                    <HotelMapTabs 
                      hotels={hotels} 
                      mapWidgetHtml={mapWidgetHtml} 
                      onAddHotel={handleAddHotel}
                      checkinDate={(eventDetails as any).package_checkin || formatDateISO(eventDate)}
                      checkoutDate={(eventDetails as any).package_checkout || formatDateISO(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000))}
                      eventName={eventDetails.event_name || undefined}
                      ticketsSelected={isEventInCart && totalPersons > 0}
                      selectedHotelId={cart?.hotel?.hotel_id || null}
                      venueCity={eventDetails.venue_city || ""}
                      stay22Accommodations={stay22Accommodations}
                      stay22Activities={stay22Activities}
                    />
                  </Suspense>
                </div>
              )}

              {/* Artist Destinations Section - Show other cities where this artist has events */}
              {artistOtherCities && artistOtherCities.length > 0 && (
                <ArtistDestinationsList 
                  artistName={mainArtist}
                  citiesWithData={artistOtherCities}
                  currentCity={currentCity}
                />
              )}
            </div>

            {/* Sidebar - Shopping Cart (Hidden on mobile/tablet, replaced by MobileCartBar) */}
            <div className="hidden xl:block xl:col-span-1">
              <Card className="sticky top-24 border-2">
                <CardHeader className="bg-foreground text-background">
                  <CardTitle className="uppercase tracking-wide text-sm flex items-center gap-2">
                    Tu Pack
                    {isEventInCart && cart?.hotel && (
                      <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                        COMPLETO
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {isEventInCart && cart ? (
                    <>
                      {/* Event Info */}
                      <div className="mb-4">
                        <p className="text-sm font-bold text-foreground">
                          {eventDetails.event_name}
                        </p>
                      </div>

                      {/* Pack complete success */}
                      {cart.hotel && totalPersons > 0 && (
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                          <p className="text-xs text-foreground font-medium flex items-center gap-2">
                            <IconCheck className="h-3 w-3 text-accent" />
                            ¡Pack completo! Entradas + Hotel
                          </p>
                        </div>
                      )}

                      {/* Tickets in cart */}
                      {cart.tickets.map((ticketItem, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <IconTicket className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">Entrada</span>
                              </div>
                              <h3 className="font-bold text-sm">{ticketItem.type}</h3>
                              {ticketItem.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {ticketItem.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeTicket(ticketItem.type)}
                            >
                              <IconTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Cantidad:</span>
                            <span className="font-bold">{ticketItem.quantity}</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold">€{((ticketItem.price + ticketItem.fees) * ticketItem.quantity).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                              €{ticketItem.price.toFixed(2)} + €{ticketItem.fees.toFixed(2)} gastos
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Reserve tickets button */}
                      <Button
                        variant="default"
                        className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90"
                        asChild
                      >
                        <a href={(eventDetails as any).event_url || "#"} target="_blank" rel="noopener noreferrer">
                          Reservar Entradas
                        </a>
                      </Button>

                      {/* Hotel in cart */}
                      {cart.hotel && (
                        <>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <IconBuilding2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Hotel</span>
                                </div>
                                <h3 className="font-bold text-sm">{cart.hotel.hotel_name}</h3>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={removeHotel}
                              >
                                <IconTrash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground mb-2">
                              {cart.hotel.checkin_date && cart.hotel.checkout_date && (
                                <p>
                                  {new Date(cart.hotel.checkin_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(cart.hotel.checkout_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                              <p>{cart.hotel.nights} noches · 2 huéspedes</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">€{cart.hotel.total_price.toFixed(2)}</div>
                            </div>
                          </div>

                      {/* Reserve hotel button with deeplink */}
                          <Button 
                            className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                            asChild
                          >
                            <a href={(eventDetails as any).destination_deeplink || "#"} target="_blank" rel="noopener noreferrer">
                              Reservar Hotel
                            </a>
                          </Button>
                        </>
                      )}

                      {/* Summary - Inverted: Por persona grande, Total pequeño */}
                      <div className="pt-4 border-t-2 space-y-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Total por persona</p>
                          <span className="text-3xl font-black text-foreground">€{pricePerPerson.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">Total ({totalPersons} personas)</span>
                          <span className="text-base font-bold text-accent">€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <IconTicket className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-foreground font-medium mb-2">
                        Empieza seleccionando tus entradas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Elige las entradas y después añade un hotel para completar tu pack
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Mobile Cart Bar - ULTRA-LAZY: only after 4s */}
        {isInteractive && (
          <Suspense fallback={<MobileCartSkeleton />}>
            <MobileCartBar 
              eventId={eventDetails.event_id || undefined}
              eventUrl={(eventDetails as any).event_url}
              hotelUrl={(eventDetails as any).destination_deeplink}
              eventName={eventDetails.event_name || undefined}
            />
          </Suspense>
        )}

        {/* Add padding at bottom for mobile/tablet cart bar */}
        <div className="h-20 xl:hidden" />
        
        {/* Related Links for SEO - ULTRA-LAZY: only after 4s */}
        {isInteractive && (
          <div className="container mx-auto px-4 pb-8">
            <Suspense fallback={<RelatedLinksSkeleton />}>
              <RelatedLinks slug={slug || ''} type="event" />
            </Suspense>
          </div>
        )}
        
        {/* Footer - ULTRA-LAZY: only after 4s */}
        {isInteractive ? (
          <Suspense fallback={<FooterSkeleton />}>
            <Footer />
          </Suspense>
        ) : (
          <FooterSkeleton />
        )}
      </div>
    </>
  );
};

export default Producto;
