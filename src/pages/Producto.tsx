import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, lazy, Suspense, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEventData } from "@/hooks/useEventData";
import { useSlugNormalization, isVipSlug, isServiceSlug } from "@/hooks/useSlugNormalization";
import { useEventHotels } from "@/hooks/useEventHotels";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useIsMobile } from "@/hooks/use-mobile";
// SYNC: Header and Hero components must NOT be lazy-loaded to prevent layout shift
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import CollapsibleBadges from "@/components/CollapsibleBadges";
import { EventStatusBanner, getEventStatus } from "@/components/EventStatusBanner";
import { EventSeo, createEventSeoProps } from "@/components/EventSeo";
import { EventFAQSchema } from "@/components/EventFAQSchema";
import ArtistDestinationsList from "@/components/ArtistDestinationsList";
import { FestivalServiceAddons } from "@/components/FestivalServiceAddons";
import RelatedEventsSection from "@/components/RelatedEventsSection";
import TicketSelector from "@/components/TicketSelector";
import WaitlistForm from "@/components/WaitlistForm";

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
import { useCart } from "@/contexts/CartContext";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";
import { getEventUrl, getCanonicalEventUrl } from "@/lib/eventUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { useMetaTags } from "@/hooks/useMetaTags";

// === INLINE SVG ICONS (replaces lucide-react for LCP optimization) ===
const IconHeart = ({ filled, className = "" }: { filled?: boolean; className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const IconMapPin = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconMinus = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
  </svg>
);
const IconPlus = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);
const IconCheck = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconTrash2 = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);
const IconAlertCircle = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);
const IconRefreshCw = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
const IconTicket = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
);
const IconBuilding2 = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);
const IconChevronRight = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

// === NATIVE DATE FORMATTING (replaces date-fns) ===
const SPANISH_MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const ENGLISH_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SPANISH_MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const ENGLISH_MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const formatDatePart = (date: Date, part: "day" | "month" | "monthLong" | "year" | "time" | "monthYear", locale: 'es' | 'en' = 'es') => {
  const monthsShort = locale === 'en' ? ENGLISH_MONTHS_SHORT : SPANISH_MONTHS_SHORT;
  const monthsLong = locale === 'en' ? ENGLISH_MONTHS_LONG : SPANISH_MONTHS_LONG;
  switch (part) {
    case "day":
      return String(date.getDate()).padStart(2, "0");
    case "month":
      return monthsShort[date.getMonth()];
    case "monthLong":
      return monthsLong[date.getMonth()];
    case "year":
      return String(date.getFullYear());
    case "time":
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    case "monthYear":
      return `${monthsLong[date.getMonth()]} ${date.getFullYear()}`;
  }
};

const formatDateISO = (date: Date) => date.toISOString().split("T")[0];

const differenceInDays = (dateA: Date, dateB: Date) =>
  Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24));
const differenceInHours = (dateA: Date, dateB: Date) =>
  Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60));

// Fixed-height skeletons omitted - moved below for cleaner structure

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

// Fixed-height skeleton fallbacks to prevent CLS
const HotelsSkeleton = memo(() => (
  <div className="w-full" style={{ minHeight: "400px" }}>
    <Skeleton className="h-10 w-48 mb-4" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </div>
  </div>
));

const MobileCartSkeleton = memo(() => (
  <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border xl:hidden" />
));

const FooterSkeleton = memo(() => <div className="w-full bg-card border-t border-border" style={{ minHeight: "200px" }} />);

interface ProductoProps {
  slugProp?: string;
}

const Producto = ({ slugProp }: ProductoProps) => {
  const { slug: routeSlug } = useParams();
  const slug = slugProp || routeSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();

  // Ref for stable cart access in handlers
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // Deferred rendering for non-critical UI (4s delay)
  const [isInteractive, setIsInteractive] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => setIsInteractive(true), { timeout: 1000 });
      } else {
        setIsInteractive(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const { t, locale, localePath, formatDate: formatDateLocale } = useTranslation();

  // Route detection - support both singular (legacy), plural (canonical) and EN routes
  const isConcierto = location.pathname.startsWith("/concierto/") || location.pathname.startsWith("/conciertos/") || location.pathname.startsWith("/en/tickets/");
  const isFestivalRoute = location.pathname.startsWith("/festival/") || location.pathname.startsWith("/festivales/") || location.pathname.startsWith("/en/festivals/");

  // CRITICAL: URL Normalization - handles numeric suffixes, noise words, plural→singular
  // This runs BEFORE data fetch to intercept dirty URLs
  useSlugNormalization(slug, isFestivalRoute);

  const [showAllTickets, setShowAllTickets] = useState(false);

  const { data: eventResult, isLoading, isError, error, refetch } = useEventData(slug, isFestivalRoute, isConcierto);
  
  // Check if this is a VIP/Premium event for SEO differentiation
  const isVipEventFromSlug = slug ? isVipSlug(slug) : false;
  const isServiceEventFromSlug = slug ? isServiceSlug(slug) : false;

  // Fetch personalized meta tags from mv_events_meta_tags
  const { data: mvMetaTags } = useMetaTags(slug);

  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading) return;

    // Helper: convert ES redirect path to locale-aware path
    const localizePath = (esPath: string): string => {
      if (locale !== 'en') return esPath;
      // /festivales/slug → /en/festivals/slug
      // /conciertos/slug → /en/tickets/slug
      return esPath
        .replace(/^\/festivales\//, '/en/festivals/')
        .replace(/^\/conciertos\//, '/en/tickets/')
        .replace(/^\/festivales$/, '/en/festivals')
        .replace(/^\/conciertos$/, '/en/tickets');
    };

    // SEO: notFound — do NOT redirect, stay on URL with noindex
    // Google must see the original URL respond with noindex, not a redirect
    if (eventResult?.notFound) {
      console.log("[Producto] Event not found — staying on URL with noindex");
      return;
    }

    // CRITICAL SEO: Use window.location.replace for redirects to ensure Googlebot sees 301
    if (eventResult?.needsRedirect && eventResult.redirectPath) {
      console.log("[Producto] SEO redirect to:", eventResult.redirectPath);
      hasNavigatedRef.current = true;
      // Use window.location.replace for SEO-friendly redirect that Googlebot respects
      window.location.replace(localizePath(eventResult.redirectPath));
      return;
    }
    if (eventResult?.needsRouteCorrection && eventResult.correctRoutePath) {
      console.log("[Producto] Route correction to:", eventResult.correctRoutePath);
      hasNavigatedRef.current = true;
      // Use window.location.replace for SEO-friendly redirect
      window.location.replace(localizePath(eventResult.correctRoutePath));
      return;
    }
  }, [eventResult, isLoading, isFestivalRoute]);

  const eventData = eventResult?.data;
  const rpcCanonicalSlug = eventResult?.canonicalSlug || null;
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;

  // SEO: Redirect service events (transport, parking, etc.) to their parent festival
  // This transfers SEO authority from service URLs to the main festival page
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading || !eventDetails) return;
    
    // Check if this is a service event that should redirect
    const isTransportEvent = (eventDetails as any).is_transport === true;
    const eventType = (eventDetails as any).event_type;
    const eventName = (eventDetails.event_name || "").toLowerCase();
    
    // Only redirect transport/service events, not regular concerts/festivals
    if (!isTransportEvent && eventType !== 'transport') return;
    
    // Pattern to detect service events by name
    const servicePatterns = [
      /servicio\s*(de\s*)?(bus|autobus|autobús)/i,
      /^bus\s/i,
      /\bshuttle\b/i,
      /\btransfer\b/i,
    ];
    
    const isServiceByName = servicePatterns.some((p) => p.test(eventName));
    
    if (isTransportEvent || eventType === 'transport' || isServiceByName) {
      // Extract festival name from event name
      // e.g., "Servicio de Autobús - Malú - Concert Music Festival" -> "Concert Music Festival"
      // The festival name is usually after the last " - " separator
      const originalEventName = eventDetails.event_name || "";
      const venueName = (eventDetails as any).venue_name || "";
      const city = (eventDetails.venue_city || "").toLowerCase().replace(/\s+/g, "-");
      
      // Festival name patterns with their slug forms
      const festivalMappings: Array<{ pattern: RegExp; slug: string }> = [
        { pattern: /concert\s*music\s*festival/i, slug: 'concert-music-festival' },
        { pattern: /starlite/i, slug: 'starlite' },
        { pattern: /primavera\s*sound/i, slug: 'primavera-sound' },
        { pattern: /bbk\s*live/i, slug: 'bbk-live' },
        { pattern: /mad\s*cool/i, slug: 'mad-cool' },
        { pattern: /arenal\s*sound/i, slug: 'arenal-sound' },
        { pattern: /medusa/i, slug: 'medusa' },
        { pattern: /viña\s*rock/i, slug: 'vina-rock' },
        { pattern: /cruïlla/i, slug: 'cruilla' },
        { pattern: /rototom/i, slug: 'rototom' },
        { pattern: /vida\s*festival/i, slug: 'vida-festival' },
        { pattern: /low\s*festival/i, slug: 'low-festival' },
        { pattern: /dreambeach/i, slug: 'dreambeach' },
        { pattern: /a\s*summer\s*story/i, slug: 'a-summer-story' },
        { pattern: /reggaeton\s*beach/i, slug: 'reggaeton-beach' },
      ];
      
      let parentFestivalSlug: string | null = null;
      
      // Try to find festival name in event name or venue name
      for (const { pattern, slug } of festivalMappings) {
        if (pattern.test(originalEventName) || pattern.test(venueName.replace(/\s+/g, ' '))) {
          parentFestivalSlug = `${slug}_${city}_${city}`;
          break;
        }
      }
      
      if (parentFestivalSlug) {
        console.log("[Producto] Service event redirect to parent festival:", parentFestivalSlug);
        hasNavigatedRef.current = true;
        navigate(`/festivales/${parentFestivalSlug}`, { replace: true });
        return;
      }
    }
  }, [eventDetails, isLoading, navigate]);

  usePageTracking(eventDetails?.event_name);

  const { data: hotels = [] } = useEventHotels({
    eventId: eventDetails?.event_id,
    venueLatitude: eventDetails?.venue_latitude ? Number(eventDetails.venue_latitude) : null,
    venueLongitude: eventDetails?.venue_longitude ? Number(eventDetails.venue_longitude) : null,
    enabled: !!eventDetails?.event_id,
  });

  const isFestivalDisplay = location.pathname.startsWith("/festival/");

  const primaryAttractionForSearch = (eventDetails as any)?.primary_attraction_name as string | null;
  const artistNames = eventDetails?.attraction_names || [];
  const mainArtist = artistNames[0] || eventDetails?.event_name || "";
  const artistForSearch = primaryAttractionForSearch || mainArtist;
  const currentCity = eventDetails?.venue_city || "";

  const { data: artistOtherCities } = useQuery({
    queryKey: ["artist-other-cities", artistForSearch, currentCity],
    queryFn: async () => {
      if (!artistForSearch) return [];

      const [concertsRes, festivalsRes] = await Promise.all([
        supabase
          .from("mv_concerts_cards")
          .select("venue_city, venue_city_slug, image_standard_url, slug")
          .ilike("artist_name", `%${artistForSearch}%`)
          .gte("event_date", new Date().toISOString())
          .neq("venue_city", currentCity)
          .limit(50),
        supabase
          .from("mv_festivals_cards")
          .select("venue_city, venue_city_slug, image_standard_url, attraction_names, slug")
          .gte("event_date", new Date().toISOString())
          .neq("venue_city", currentCity)
          .limit(50),
      ]);

      const cityMap = new Map<string, { count: number; image: string | null; slug: string; eventSlug: string | null; eventRoute: string | null }>();

      (concertsRes.data || []).forEach((event: any) => {
        if (event.venue_city) {
          const existing = cityMap.get(event.venue_city);
          const eventSlug = event.slug;
          if (existing) {
            existing.count++;
            existing.eventSlug = null; // multiple events, can't link to single one
            existing.eventRoute = null;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, "-"),
              eventSlug: eventSlug || null,
              eventRoute: eventSlug ? `/conciertos/${eventSlug}` : null,
            });
          }
        }
      });

      (festivalsRes.data || []).forEach((event: any) => {
        const attractionNames = event.attraction_names || [];
        const artistInLineup = attractionNames.some((name: string) =>
          name.toLowerCase().includes(artistForSearch.toLowerCase()),
        );

        if (artistInLineup && event.venue_city) {
          const existing = cityMap.get(event.venue_city);
          const eventSlug = event.slug;
          if (existing) {
            existing.count++;
            existing.eventSlug = null;
            existing.eventRoute = null;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, "-"),
              eventSlug: eventSlug || null,
              eventRoute: eventSlug ? `/festivales/${eventSlug}` : null,
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

  const stay22Urls = useMemo(() => {
    const lat = eventDetails?.venue_latitude;
    const lng = eventDetails?.venue_longitude;

    if (!lat || !lng) return { map: null, accommodations: null, activities: null };

    const eventDateStr = isFestivalRoute
      ? (eventDetails as any)?.start_date || eventDetails?.event_date
      : eventDetails?.event_date;

    const endDateStr = isFestivalRoute ? (eventDetails as any)?.end_date || eventDateStr : null;

    let checkinDate: string;
    let checkoutDate: string;

    if (eventDateStr) {
      const eventDateObj = new Date(eventDateStr);
      const checkin = new Date(eventDateObj);
      checkin.setDate(checkin.getDate() - 1);
      checkinDate = formatDateISO(checkin);

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
      checkinDate = "";
      checkoutDate = "";
    }

    const aid = "feelomove";
    const baseParams = `lat=${lat}&lng=${lng}&checkin=${checkinDate}&checkout=${checkoutDate}&aid=${aid}`;

    return {
      map: `https://www.stay22.com/embed/gm?${baseParams}&zoom=14`,
      accommodations: `https://www.stay22.com/embed/gm?${baseParams}&maincolor=00FF8F&markerimage=https://feelomove.com/favicon.svg`,
      activities: `https://www.stay22.com/embed/activities?${baseParams}`,
    };
  }, [
    eventDetails?.venue_latitude,
    eventDetails?.venue_longitude,
    eventDetails?.event_date,
    (eventDetails as any)?.start_date,
    (eventDetails as any)?.end_date,
    isFestivalRoute,
  ]);

  const mapWidgetHtml = stay22Urls.map;
  const stay22Accommodations = stay22Urls.accommodations;
  const stay22Activities = stay22Urls.activities;

  // ⚡ OPTIMIZACIÓN CRÍTICA #7: URLs RESPONSIVE PARA HERO IMAGE (LCP)
  // En MÓVIL: NO cargar imagen hero para mejor LCP
  // En DESKTOP: Cargar imagen con ImageKit CDN para optimización automática
  const heroImageUrls = useMemo(() => {
    // Priorizar image_standard_url (más liviana) sobre image_large_url
    const rawUrl = eventDetails?.image_standard_url || (eventDetails as any)?.image_large_url || "/placeholder.svg";

    // Si es placeholder, retornar directo
    if (rawUrl === "/placeholder.svg" || rawUrl.startsWith("/")) {
      return { src: rawUrl, srcSet: "", showOnMobile: false };
    }

    // PASO 1: Normalizar URL de Ticketmaster a formato óptimo
    let normalizedUrl = rawUrl;
    const ticketmasterSuffixes = [
      "_CUSTOM.jpg",
      "_SOURCE.jpg",
      "_RECOMENDATION.jpg",
      "_TABLET_LANDSCAPE_LARGE_16_9.jpg",
      "_TABLET_LANDSCAPE_3_2.jpg",
    ];

    for (const suffix of ticketmasterSuffixes) {
      if (normalizedUrl.includes(suffix)) {
        normalizedUrl = normalizedUrl.replace(suffix, "_TABLET_LANDSCAPE_16_9.jpg");
        break;
      }
    }

    // PASO 2: Generar URLs para DESKTOP ONLY usando ImageKit CDN
    // Mobile NO carga imagen para LCP óptimo
    const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/feelomove";
    
    // Extract path from Ticketmaster URL: https://s1.ticketm.net/dam/... → /dam/...
    const createUrl = (width: number, quality: number = 70) => {
      try {
        const urlObj = new URL(normalizedUrl);
        const path = urlObj.pathname; // e.g., /dam/a/79f/...
        const transformations = `tr:w-${width},q-${quality},f-auto`;
        return `${IMAGEKIT_ENDPOINT}/${transformations}${path}`;
      } catch {
        // Fallback to original URL if parsing fails
        return normalizedUrl;
      }
    };

    // OPTIMIZED: Solo para desktop/tablet (sm+), mobile no carga imagen
    return {
      src: createUrl(640, 70), // Tablet-optimized default
      srcSet: `${createUrl(640, 70)} 640w, ${createUrl(800, 70)} 800w, ${createUrl(1200, 70)} 1200w`,
      showOnMobile: false, // Flag para ocultar en mobile
    };
  }, [eventDetails?.image_standard_url, (eventDetails as any)?.image_large_url, eventDetails?.event_id]);

  const prevEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentEventId = eventDetails?.event_id;
    if (!currentEventId) return;

    if (cart && cart.event_id !== currentEventId) {
      clearCart();
    }

    prevEventIdRef.current = currentEventId;
  }, [eventDetails?.event_id, cart, clearCart]);

  // Note: "Evento no encontrado" errors are handled via isNotFound inline UI, no redirect needed

  const ticketPrices = useMemo(() => {
    if (!eventDetails) return [];
    const rawTicketTypes = (eventDetails as any).ticket_types;
    if (!rawTicketTypes) return [];

    try {
      const ticketData: TicketTypesData =
        typeof rawTicketTypes === "string" ? JSON.parse(rawTicketTypes) : rawTicketTypes;

      if (!ticketData?.price_types || !Array.isArray(ticketData.price_types)) return [];

      const tickets: Array<{
        id: string;
        type: string;
        code: string;
        description: string;
        price: number;
        fees: number;
        availability: string;
      }> = [];

      for (const priceType of ticketData.price_types) {
        if (priceType.price_levels && Array.isArray(priceType.price_levels)) {
          for (let levelIndex = 0; levelIndex < priceType.price_levels.length; levelIndex++) {
            const level = priceType.price_levels[levelIndex];
            const ticketId = `${priceType.code || "ticket"}-${levelIndex}`;
            const rawAvailability = level.availability?.toLowerCase() || "available";
            const normalizedAvailability =
              rawAvailability === "none" || rawAvailability === "soldout" || rawAvailability === "sold_out"
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
              availability: normalizedAvailability,
            });
          }
        }
      }

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

  // SEO: Inject noindex for not-found events (before redirect completes)
  // This ensures Google never indexes a page for a non-existent event slug
  const isNotFound = eventResult?.notFound === true;

  if (isLoading) {
    return <ProductoSkeleton />;
  }

  if (isError) {
    if (error instanceof Error && error.message === "Evento no encontrado") {
      return (
        <>
          <SEOHead
            title="Evento no encontrado | FEELOMOVE+"
            description="Este evento no está disponible."
            noindexFollow={true}
            ogType="website"
          />
          <ProductoSkeleton />
        </>
      );
    }

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
                  <h2 className="text-xl font-semibold text-foreground mb-2">{t('Error al cargar el evento')}</h2>
                  <p className="text-muted-foreground text-sm">
                    {error instanceof Error ? error.message : "Ha ocurrido un error inesperado"}
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-2">
                  <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                    {t('Volver atrás')}
                  </Button>
                  <Button
                    onClick={() => refetch()}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <IconRefreshCw className="h-4 w-4" />
                    {t('Reintentar')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    );
  }

  // Redirects in progress — show skeleton while browser navigates
  if (eventResult?.needsRedirect || eventResult?.needsRouteCorrection) {
    return <ProductoSkeleton />;
  }

  // Not-found: stay on URL, show inline message + noindex
  if (isNotFound) {
    const listingPath = locale === 'en' ? '/en/tickets' : '/conciertos';
    const listingLabel = locale === 'en' ? 'View all concerts' : 'Ver todos los conciertos';
    const notFoundMsg = locale === 'en'
      ? "This page doesn't exist or the event is no longer available."
      : 'Esta página no existe o el evento ya no está disponible.';

    return (
      <>
        <SEOHead
          title={locale === 'en' ? 'Event not found' : 'Evento no encontrado'}
          description={notFoundMsg}
          noindexFollow={true}
          ogType="website"
        />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-24 mt-16 text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-4">{notFoundMsg}</h1>
            <Link
              to={listingPath}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              {listingLabel}
            </Link>
          </main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </div>
      </>
    );
  }

  if (!eventDetails) {
    return <ProductoSkeleton />;
  }

  // Locale-aware date formatting helper
  const fmtDate = (date: Date, part: "day" | "month" | "monthLong" | "year" | "time" | "monthYear") =>
    formatDatePart(date, part, locale);

  const isPlaceholderDate = (d: string | null | undefined) => !d || d.startsWith("9999");

  const rawEventDate = eventDetails.event_date;
  const hasValidDate = !isPlaceholderDate(rawEventDate);
  const eventDate = hasValidDate && rawEventDate ? new Date(rawEventDate) : new Date();
  const formattedTime = hasValidDate ? fmtDate(eventDate, "time") : null;
  const monthYear = hasValidDate ? fmtDate(eventDate, "monthYear") : t("Fecha por confirmar");

  const now = new Date();
  const daysUntil = hasValidDate ? differenceInDays(eventDate, now) : -1;
  const hoursUntil = hasValidDate ? differenceInHours(eventDate, now) % 24 : 0;

  const festivalLineupArtists = isFestivalDisplay
    ? ((eventDetails as any).festival_lineup_artists_manual as string[] | null) ||
      ((eventDetails as any).festival_lineup_artists as string[] | null) ||
      []
    : [];

  const primaryAttraction = (eventDetails as any).primary_attraction_name as string | null;
  const secondaryAttraction = (eventDetails as any).secondary_attraction_name as string | null;
  const isArtistEntry = isFestivalDisplay && secondaryAttraction && secondaryAttraction !== primaryAttraction;

  const displayTitle = isArtistEntry ? secondaryAttraction : eventDetails.event_name;
  const displaySubtitle = isArtistEntry 
    ? (locale === 'en' ? `at ${primaryAttraction || eventDetails.event_name}` : `en ${primaryAttraction || eventDetails.event_name}`) 
    : null;

  const eventYear = hasValidDate ? fmtDate(eventDate, "year") : "";
  
  

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 4);
  const hasMoreTickets = ticketPrices.length > 4;

  const hasVipTickets =
    ticketPrices.some(
      (ticket) =>
        /vip/i.test(ticket.type || "") || /vip/i.test(ticket.description || "") || /vip/i.test(ticket.code || ""),
    ) || (eventDetails as any).has_vip_tickets;

  const hasAvailableTickets = ticketPrices.some((ticket) => ticket.availability !== "none");
  const isEventAvailable = hasAvailableTickets && !eventDetails.sold_out;

  // === UNAVAILABLE EVENT DETECTION ===
  const isUnavailable =
    eventDetails.sold_out === true ||
    (eventDetails as any).seats_available === false ||
    (eventDetails as any).schedule_status === 'offsale' ||
    (eventDetails as any).schedule_status === 'soldout' ||
    eventDetails.cancelled === true;

  const unavailableReason: 'sold_out' | 'offsale' | 'cancelled' | null = (() => {
    if (eventDetails.cancelled === true) return 'cancelled';
    if (eventDetails.sold_out === true || (eventDetails as any).schedule_status === 'soldout') return 'sold_out';
    if ((eventDetails as any).seats_available === false || (eventDetails as any).schedule_status === 'offsale') return 'offsale';
    return null;
  })();

  const minHotelPrice = hotels.length > 0
    ? Math.min(...hotels.map((h: any) => h.selling_price || h.min_price || Infinity))
    : null;
  const minHotelPriceStr = minHotelPrice && minHotelPrice < Infinity ? `${Math.round(minHotelPrice)}€` : null;

  // Badge "A la venta" (on_sale_date futura) - se muestra en el hero
  const onSaleDateStr = (eventDetails as any).on_sale_date as string | null | undefined;
  const onSaleDate = onSaleDateStr ? new Date(onSaleDateStr) : null;
  const isNotYetOnSale = Boolean(onSaleDate && onSaleDate.getTime() > Date.now());
  const onSaleBadgeFormatted = isNotYetOnSale && onSaleDate
    ? `${onSaleDate.getDate()} ${fmtDate(onSaleDate, "month")} ${fmtDate(onSaleDate, "time")}h`
    : null;

  // ⚡ NOTA: Función normal en lugar de useCallback para evitar error de hooks
  // (Los hooks no pueden estar después de returns condicionales)
  // ⚡ Usamos ticket.id como identificador único en el carrito (guardado en CartTicket.type)
  // ⚡ FIX: Usamos cartRef.current para obtener el estado más reciente del carrito
  const handleTicketQuantityChange = (ticketId: string, change: number) => {
    const currentCart = cartRef.current;
    const existingTickets = currentCart?.event_id === eventDetails.event_id ? [...currentCart.tickets] : [];
    const ticketIndex = existingTickets.findIndex((t) => t.type === ticketId);

    const ticketData = ticketPrices.find((t) => t.id === ticketId);
    if (!ticketData) {
      console.error('[Cart] ticketData not found for ticketId:', ticketId);
      return;
    }

    let updatedTickets = [...existingTickets];

    if (ticketIndex >= 0) {
      // Ticket ya existe en carrito - actualizar cantidad
      const newQuantity = Math.max(0, Math.min(10, updatedTickets[ticketIndex].quantity + change));
      if (newQuantity === 0) {
        updatedTickets = updatedTickets.filter((t) => t.type !== ticketId);
      } else {
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          quantity: newQuantity,
        };
      }
    } else if (change > 0) {
      // Ticket nuevo - añadir al carrito
      updatedTickets.push({
        type: ticketId, // Usamos ticketId (ticket.id) como identificador único
        description: `${ticketData.type}${ticketData.description ? ` - ${ticketData.description}` : ticketData.code ? ` - ${ticketData.code}` : ''}`,
        price: ticketData.price,
        fees: ticketData.fees,
        quantity: 1,
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
    const ticket = cart.tickets.find((t) => t.type === ticketId);
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
      checkout_date:
        (eventDetails as any).package_checkout ||
        formatDateISO(new Date(eventDate.getTime() + nights * 24 * 60 * 60 * 1000)),
    });
  };

  const isEventInCart = cart?.event_id === eventDetails.event_id;
  const totalPersons = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalPersons > 0 ? totalPrice / totalPersons : 0;

  // URL de imagen optimizada para og:image (1200x630 para social sharing)
  // Usando ImageKit CDN en lugar de weserv.nl
  const ogImageUrl = (() => {
    const rawUrl = (eventDetails as any).image_large_url || eventDetails.image_standard_url || "/placeholder.svg";
    if (rawUrl === "/placeholder.svg" || rawUrl.startsWith("/")) {
      return "https://feelomove.com/og-image.jpg";
    }
    let normalizedUrl = rawUrl;
    const ticketmasterSuffixes = ["_CUSTOM.jpg", "_SOURCE.jpg", "_RECOMENDATION.jpg", "_TABLET_LANDSCAPE_LARGE_16_9.jpg"];
    for (const suffix of ticketmasterSuffixes) {
      if (normalizedUrl.includes(suffix)) {
        normalizedUrl = normalizedUrl.replace(suffix, "_TABLET_LANDSCAPE_16_9.jpg");
        break;
      }
    }
    // ImageKit URL para og:image (1200x630)
    // Extract path from Ticketmaster URL for ImageKit
    const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/feelomove";
    try {
      const urlObj = new URL(normalizedUrl);
      const path = urlObj.pathname; // e.g., /dam/a/79f/...
      const transformations = "tr:w-1200,h-630,fo-center,c-at_max,q-80,f-jpg";
      return `${IMAGEKIT_ENDPOINT}/${transformations}${path}`;
    } catch {
      // Fallback to default og-image if URL parsing fails
      return "https://feelomove.com/og-image.jpg";
    }
  })();

  // CRITICAL SEO: Use getCanonicalEventUrl for pure canonical generation
  // This ensures canonical is ALWAYS built from slug, never from window.location
  const canonicalSlug = rpcCanonicalSlug || eventDetails.event_slug || "";
  const absoluteUrl = getCanonicalEventUrl(canonicalSlug, eventDetails.is_festival || false, locale);

  const eventStatus = getEventStatus(
    eventDetails.cancelled,
    eventDetails.rescheduled,
    eventDetails.event_date || "",
  );

  const minPrice = ticketPrices[0]?.price || (eventDetails as any).price_min_incl_fees || 0;
  const maxPrice = ticketPrices[ticketPrices.length - 1]?.price || minPrice;

  // Fecha formateada para SEO: "10 Jul" (ES) / "Jul 10" (EN)
  const seoDateShort = hasValidDate
    ? locale === 'en'
      ? `${fmtDate(eventDate, "month")} ${fmtDate(eventDate, "day")}`
      : `${fmtDate(eventDate, "day")} ${fmtDate(eventDate, "month")}`
    : "";

  // Precio mínimo disponible (con fees si existe, si no el de la DB)
  const seoMinPrice = minPrice && minPrice > 0 ? `${Math.round(minPrice)}€` : null;

  // Estado de entradas para el title
  const ticketsStatusForSeo = (eventDetails as any).tickets_status as string | null;

  const seoFullDate = hasValidDate
    ? locale === 'en'
      ? `${fmtDate(eventDate, "month")} ${fmtDate(eventDate, "day")}, ${eventYear}`
      : `${fmtDate(eventDate, "day")} de ${fmtDate(eventDate, "monthLong")} de ${eventYear}`
    : "";

  // === SEO TITLE & DESCRIPTION (with unavailable override) ===
  // Strip " | FEELOMOVE+" suffix from MV titles since SEOHead appends it automatically
  const stripBrand = (t: string) => t.replace(/\s*\|\s*FEELOMOVE\+?\s*$/i, '');

  const seoTitleFallback = isUnavailable
    ? locale === 'en'
      ? `${mainArtist} in ${eventDetails.venue_city} ${eventYear} – Sold Out | FEELOMOVE`
      : `${mainArtist} en ${eventDetails.venue_city} ${eventYear} – Entradas Agotadas | FEELOMOVE`
    : isFestivalDisplay
      ? locale === 'en'
        ? `${mainArtist} ${eventYear} Tickets — ${eventDetails.venue_city}${seoMinPrice ? ` | From ${seoMinPrice}` : ""}`
        : `${t('Entradas')} ${mainArtist} ${eventYear} — ${eventDetails.venue_city}${seoMinPrice ? ` | Desde ${seoMinPrice}` : ""}`
      : ticketsStatusForSeo === 'sold_out'
        ? locale === 'en'
          ? `${mainArtist} ${eventDetails.venue_city} — SOLD OUT${seoDateShort ? ` · ${seoDateShort}` : ""}`
          : `${mainArtist} ${eventDetails.venue_city} — AGOTADO${seoDateShort ? ` · ${seoDateShort}` : ""}`
        : locale === 'en'
          ? `${mainArtist} ${eventDetails.venue_city} Tickets${seoDateShort ? ` — ${seoDateShort}` : ""}${seoMinPrice ? ` | From ${seoMinPrice}` : ""}`
          : `${t('Entradas')} ${mainArtist} ${eventDetails.venue_city}${seoDateShort ? ` — ${seoDateShort}` : ""}${seoMinPrice ? ` | Desde ${seoMinPrice}` : ""}`;

  // MV meta tags override: use personalized data from mv_events_meta_tags when available
  const seoTitle = mvMetaTags?.og_title ? stripBrand(mvMetaTags.og_title) : seoTitleFallback;

  const seoDescriptionFallback = isUnavailable
    ? locale === 'en'
      ? `${mainArtist} at ${eventDetails.venue_name || eventDetails.venue_city}, ${eventDetails.venue_city}. Tickets are sold out. Already have yours? Book a hotel near the venue${minHotelPriceStr ? ` from ${minHotelPriceStr}` : ''}.`
      : `${mainArtist} en ${eventDetails.venue_name || eventDetails.venue_city}, ${eventDetails.venue_city}. Las entradas están agotadas. ¿Ya tienes la tuya? Reserva hotel cerca del recinto${minHotelPriceStr ? ` desde ${minHotelPriceStr}` : ''}.`
    : isFestivalDisplay
      ? locale === 'en'
        ? `Buy tickets for ${mainArtist} ${eventYear} in ${eventDetails.venue_city}.${seoMinPrice ? ` From ${seoMinPrice} incl. fees.` : ""} Hotels near the venue. Book your complete festival experience!`
        : `Compra entradas para ${mainArtist} ${eventYear} en ${eventDetails.venue_city}.${seoMinPrice ? ` Desde ${seoMinPrice} con fees.` : ""} Hoteles cerca del recinto. ¡Reserva tu pack festival completo!`
      : ticketsStatusForSeo === 'sold_out'
        ? locale === 'en'
          ? `${mainArtist} in ${eventDetails.venue_city}${seoFullDate ? ` on ${seoFullDate}` : ""} is sold out. Join the waitlist to get notified when tickets become available.`
          : `${mainArtist} en ${eventDetails.venue_city}${seoFullDate ? ` el ${seoFullDate}` : ""} está agotado. Únete a la lista de espera para recibir notificación cuando haya entradas.`
        : ticketsStatusForSeo === 'off_sale'
          ? locale === 'en'
            ? `${mainArtist} in ${eventDetails.venue_city}${seoFullDate ? ` · ${seoFullDate}` : ""}. Tickets not yet on sale. Sign up for availability alerts + hotels near the venue.`
            : `${mainArtist} en ${eventDetails.venue_city}${seoFullDate ? ` · ${seoFullDate}` : ""}. Entradas próximamente a la venta. Aviso de disponibilidad + hoteles cerca del venue.`
          : locale === 'en'
            ? `Buy ${mainArtist} tickets in ${eventDetails.venue_city}${seoFullDate ? ` on ${seoFullDate}` : ""}.${seoMinPrice ? ` From ${seoMinPrice} incl. fees.` : ""} Hotels near the venue. Book your complete music pack!`
            : `Compra entradas para ${mainArtist} en ${eventDetails.venue_city}${seoFullDate ? ` el ${seoFullDate}` : ""}.${seoMinPrice ? ` Desde ${seoMinPrice} con fees.` : ""} Hoteles cerca del venue. ¡Reserva tu pack completo!`;

  // MV meta tags override: use personalized data when available
  const seoDescription = mvMetaTags?.meta_description || seoDescriptionFallback;

  const eventSeoProps = createEventSeoProps(
    {
      event_id: eventDetails.event_id || "",
      event_name: eventDetails.event_name || "",
      event_slug: eventDetails.event_slug,
      event_date: eventDetails.event_date || "",
      festival_end_date: (eventDetails as any).festival_end_date,
      door_opening_date: (eventDetails as any).door_opening_date,
      venue_name: eventDetails.venue_name,
      venue_address: eventDetails.venue_address,
      venue_city: eventDetails.venue_city || "",
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
      local_event_date: (eventDetails as any).local_event_date,
      tickets_status: (eventDetails as any).tickets_status as string | null,
      seats_available: (eventDetails as any).seats_available as boolean | null,
      schedule_status: (eventDetails as any).schedule_status as string | null,
    },
    {
      description: seoDescription,
      url: absoluteUrl,
      status: eventStatus,
      isEventAvailable,
    },
  );

  // SEO: Detect service events (transport, parking, camping, VIP, upgrades) for noindex
  const isServiceEvent = (() => {
    // Database flag: exclude_from_sitemap from MV
    if ((eventDetails as any).exclude_from_sitemap === true) return true;
    // Database flags
    if ((eventDetails as any).is_transport === true) return true;
    if ((eventDetails as any).is_package === true) return true;
    
    // Name-based detection for services
    const eventName = (eventDetails.event_name || "").toLowerCase();
    const servicePatterns = [
      /\bparking\b/i,
      /\baparcamiento\b/i,
      /\bbus\b/i,
      /\bautobus\b/i,
      /\bautobús\b/i,
      /\bshuttle\b/i,
      /\btransfer\b/i,
      /\btransporte\b/i,
      /\bupgrade\b/i,
      /\bcamping\b/i,
      /\balojamiento\b/i,
      /\bvoucher\b/i,
      /\bservicio\s*(de\s*)?(bus|autobus|autobús)/i,
    ];
    
    return servicePatterns.some((pattern) => pattern.test(eventName));
  })();

  // SEO: Past events should be noindexed to save crawl budget
  const isPastEvent = (() => {
    const eventDate = eventDetails.event_date;
    if (!eventDate) return false;
    return new Date(eventDate) < new Date();
  })();

  return (
    <>
      <EventSeo {...eventSeoProps} eventSlug={eventDetails.event_slug || slug} locale={locale} />

      <EventFAQSchema
        eventId={eventDetails.event_id || ""}
        eventName={eventDetails.event_name || ""}
        artistName={mainArtist}
        isFestival={eventDetails.is_festival || false}
        eventDate={eventDetails.event_date || null}
        doorOpeningDate={(eventDetails as any).door_opening_date || null}
        venueName={eventDetails.venue_name || null}
        venueCity={eventDetails.venue_city || null}
        venueAddress={eventDetails.venue_address || null}
        priceMin={minPrice || null}
        priceMax={maxPrice || null}
        currency="EUR"
        soldOut={eventDetails.sold_out || false}
        cancelled={eventDetails.cancelled || false}
        hasVipTickets={hasVipTickets}
        hasHotels={hotels.length > 0}
        hotelCount={hotels.length}
        locale={locale}
      />

      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={absoluteUrl}
        ogImage={ogImageUrl}
        ogType="event"
        keywords={locale === 'en' 
          ? `${mainArtist}, ${eventDetails.venue_city}, concert, tickets, hotel, ${eventDetails.event_name}`
          : `${mainArtist}, ${eventDetails.venue_city}, concierto, entradas, hotel, ${eventDetails.event_name}`}
        pageType="ItemPage"
        noindexNoFollow={isServiceEvent}
        noindexFollow={isPastEvent}
        isVipEvent={isVipEventFromSlug}
        artistName={mainArtist}
        breadcrumbs={[
          { name: t("Inicio"), url: localePath("/") },
          {
            name: eventDetails.is_festival ? t("Festivales") : t("Conciertos"),
            url: localePath(eventDetails.is_festival ? "/festivales" : "/conciertos"),
          },
          ...(eventDetails.is_festival
            ? [
                {
                  name: eventDetails.venue_city || "",
                  url: `/destinos/${(eventDetails.venue_city || "").toLowerCase().replace(/\s+/g, "-")}`,
                },
              ]
            : mainArtist
              ? [
                  {
                    name: mainArtist,
                    url: `/artista/${mainArtist
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")}`,
                  },
                ]
              : []),
          { name: eventDetails.is_festival ? eventDetails.event_name || "" : eventDetails.venue_city || "" },
        ]}
      />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 py-8 mt-20">
          <Breadcrumbs />

          <EventStatusBanner
            status={eventStatus}
            eventName={eventDetails.event_name || ""}
            eventDate={eventDetails.event_date || ""}
          />

          <h1 className="sr-only">
            {displayTitle}
            {displaySubtitle ? ` ${displaySubtitle}` : ""}
          </h1>

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

          {/* === UNAVAILABLE STATUS BADGE (mobile) === */}
          {isUnavailable && (
            <div className="md:hidden mb-3">
              {unavailableReason === 'cancelled' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background font-black text-sm shadow-lg">
                  <span>⚫</span> {t('Evento cancelado')}
                </div>
              ) : unavailableReason === 'offsale' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground font-black text-sm shadow-lg">
                  <span>🔴</span> {t('Venta cerrada')}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground font-black text-sm shadow-lg">
                  <span>🔴</span> {t('Entradas agotadas')}
                </div>
              )}
            </div>
          )}

          {/* ⚡ Hero Section - MOBILE: Sin imagen para LCP óptimo */}
          {/* MOBILE HERO: Diseño compacto sin imagen (mejor LCP) */}
          <div className="sm:hidden mb-4">
            <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-xl p-4 border border-border/50">
              <div className="flex items-start justify-between gap-3">
                {/* Fecha compacta */}
                <div className="bg-card rounded-lg shadow-sm px-3 py-2 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {fmtDate(eventDate, "month")}
                    </p>
                    <p className="text-2xl font-black text-foreground leading-none">
                      {fmtDate(eventDate, "day")}
                    </p>
                    <p className="text-xs text-muted-foreground">{fmtDate(eventDate, "year")}</p>
                  </div>
                </div>
                
                {/* Info evento */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <IconMapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{eventDetails.venue_city}</span>
                    <span className="text-sm">·</span>
                    <span className="text-sm font-bold text-foreground">{formattedTime}h</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{eventDetails.venue_name}</p>
                  
                  {/* Badges móvil */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {onSaleBadgeFormatted && (
                      <Badge className="text-[9px] font-bold px-1.5 py-0.5 bg-accent text-accent-foreground">
                        {locale === 'en' ? 'On sale:' : 'A la venta:'} {onSaleBadgeFormatted}
                      </Badge>
                    )}
                    {hasVipTickets && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">VIP</Badge>
                    )}
                  </div>
                </div>
                
                {/* Favorito */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-card shadow-sm flex-shrink-0"
                  onClick={() =>
                    toggleFavorite({
                      event_id: eventDetails.event_id!,
                      event_name: eventDetails.event_name || "",
                      event_slug: eventDetails.event_slug || "",
                      event_date: eventDetails.event_date || "",
                      venue_city: eventDetails.venue_city || "",
                      image_url: heroImageUrls.src,
                    })
                  }
                >
                  <IconHeart
                    filled={isFavorite(eventDetails.event_id!)}
                    className={`h-4 w-4 ${isFavorite(eventDetails.event_id!) ? "text-accent" : "text-muted-foreground"}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* DESKTOP/TABLET HERO: Con imagen */}
          <div className="relative rounded-2xl overflow-hidden mb-6 hidden sm:block">
            <div className="relative h-[340px] md:h-[420px]">
              {/* LCP IMAGE: Solo para tablet/desktop */}
              <img
                src={heroImageUrls.src}
                srcSet={heroImageUrls.srcSet}
                sizes="(max-width: 800px) 800px, 1200px"
                alt={eventDetails.event_name || "Evento"}
                className="w-full h-full object-cover"
                width={800}
                height={450}
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Fecha card - Desktop */}
              <div className="absolute left-4 bottom-4">
                <div className="bg-card rounded-xl shadow-lg p-5 md:p-6 min-w-[160px] md:min-w-[180px]">
                  <div className="text-center">
                    <p className="text-base font-bold text-muted-foreground uppercase tracking-wider">
                      {fmtDate(eventDate, "month")}
                    </p>
                    <p className="text-5xl md:text-6xl font-black text-foreground leading-none my-2">
                      {fmtDate(eventDate, "day")}
                    </p>
                    <p className="text-lg font-medium text-muted-foreground">
                      {fmtDate(eventDate, "year")}
                    </p>
                    <div className="border-t border-border mt-4 pt-4">
                      <p className="text-2xl md:text-3xl font-bold text-foreground">{formattedTime}h</p>
                      <div className="flex flex-col items-center gap-1 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconMapPin className="h-4 w-4" />
                          <span className="text-base font-bold">{eventDetails.venue_city}</span>
                        </div>
                        <span className="text-sm text-muted-foreground/80 line-clamp-2 text-center max-w-[140px]">
                          {eventDetails.venue_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Título central - Desktop */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center max-w-[50%] md:max-w-[45%]">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 hover:bg-white/30 flex-shrink-0 backdrop-blur-sm"
                    onClick={() =>
                      toggleFavorite({
                        event_id: eventDetails.event_id!,
                        event_name: eventDetails.event_name || "",
                        event_slug: eventDetails.event_slug || "",
                        event_date: eventDetails.event_date || "",
                        venue_city: eventDetails.venue_city || "",
                        image_url: heroImageUrls.src,
                      })
                    }
                    aria-label={isFavorite(eventDetails.event_id!) ? t("Quitar de favoritos") : t("Añadir a favoritos")}
                  >
                    <IconHeart
                      filled={isFavorite(eventDetails.event_id!)}
                      className={`h-5 w-5 md:h-6 md:w-6 ${isFavorite(eventDetails.event_id!) ? "text-accent" : "text-white"}`}
                    />
                  </Button>
                  <p
                    className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg"
                    aria-hidden="true"
                  >
                    {displayTitle}
                  </p>
                  {displaySubtitle && (
                    <p className="text-base md:text-lg text-white/80 font-medium drop-shadow-md">
                      {displaySubtitle}
                    </p>
                  )}
                  {isFestivalDisplay && festivalLineupArtists.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-full mt-3">
                      {festivalLineupArtists.map((artist, idx) => (
                        <span
                          key={idx}
                          className="text-sm md:text-base text-white/90 font-semibold drop-shadow-md px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full"
                        >
                          {artist}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Badges or Status Badge - Desktop */}
              <div className="absolute right-4 top-4 bottom-4 flex flex-col items-end justify-start">
                {isUnavailable ? (
                  <div>
                    {unavailableReason === 'cancelled' ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-black text-sm shadow-lg">
                        <span>⚫</span> {t('Evento cancelado')}
                      </div>
                    ) : unavailableReason === 'offsale' ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground font-black text-sm shadow-lg">
                        <span>🔴</span> {t('Venta cerrada')}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground font-black text-sm shadow-lg">
                        <span>🔴</span> {t('Entradas agotadas')}
                      </div>
                    )}
                  </div>
                ) : (
                  <CollapsibleBadges
                    eventDetails={eventDetails}
                    hasVipTickets={hasVipTickets}
                    isEventAvailable={isEventAvailable}
                    daysUntil={daysUntil}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">

              {/* === UNAVAILABLE LAYOUT: Hotels first, then tickets === */}
              {isUnavailable ? (
                <>
                  {/* Hotels block — promoted to first position */}
                  {(eventDetails?.venue_city || (eventDetails?.venue_latitude && eventDetails?.venue_longitude)) && (
                    <div id="hotels-section">
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-accent text-accent-foreground">1</div>
                          <h2 className="text-xl sm:text-2xl font-bold">{t('Hoteles')}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {locale === 'en'
                            ? `Already have your ticket? Find the perfect hotel near ${eventDetails.venue_name || eventDetails.venue_city} for the night of the event.`
                            : `¿Ya tienes tu entrada? Encuentra el hotel perfecto cerca de ${eventDetails.venue_name || eventDetails.venue_city} para la noche del evento.`}
                        </p>
                      </div>
                      {hotels.length > 0 ? (
                        <Suspense fallback={<HotelsSkeleton />}>
                          <HotelMapTabs
                            hotels={hotels}
                            mapWidgetHtml={mapWidgetHtml}
                            onAddHotel={handleAddHotel}
                            checkinDate={(eventDetails as any).package_checkin || formatDateISO(eventDate)}
                            checkoutDate={
                              (eventDetails as any).package_checkout ||
                              formatDateISO(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000))
                            }
                            eventName={eventDetails.event_name || undefined}
                            ticketsSelected={isEventInCart && totalPersons > 0}
                            selectedHotelId={cart?.hotel?.hotel_id || null}
                            venueCity={eventDetails.venue_city || ""}
                            stay22Accommodations={stay22Accommodations}
                            stay22Activities={stay22Activities}
                          />
                        </Suspense>
                      ) : (
                        <Card className="border border-border">
                          <CardContent className="p-6 text-center">
                            <IconBuilding2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              {t('Próximamente dispondremos de hoteles para este evento.')}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Ticket status block — moved below hotels */}
                  {(() => {
                    const ticketsStatus = (eventDetails as any).tickets_status as string | null;

                    if (ticketsStatus === 'cancelled') {
                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">2</div>
                            <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                          </div>
                          <Card className="border-2 border-foreground/20">
                            <CardContent className="p-6 text-center space-y-3">
                              <Badge className="text-sm px-4 py-1.5 bg-foreground text-background font-bold uppercase">{t('CANCELADO')}</Badge>
                              <p className="text-sm text-muted-foreground">{t('Este evento ha sido cancelado')}</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    if (ticketsStatus === 'sold_out' || eventDetails.sold_out) {
                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">2</div>
                            <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                          </div>
                          <Card className="border-2 border-destructive/30">
                            <CardContent className="p-6 space-y-3">
                              <div className="text-center">
                                <Badge variant="agotado" className="text-sm px-4 py-1.5">{t('AGOTADO')}</Badge>
                                <p className="text-sm text-muted-foreground mt-3">
                                  {t('Las entradas para este evento se han agotado. Déjanos tu email y te avisaremos si hay nuevas disponibilidades.')}
                                </p>
                              </div>
                              {eventDetails.event_id && <WaitlistForm eventId={eventDetails.event_id} />}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    // offsale / seats_available === false
                    return (
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">2</div>
                          <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                        </div>
                        <Card className="border-2 border-muted">
                          <CardContent className="p-6 space-y-3">
                            <div className="text-center">
                              <Badge className="text-sm px-4 py-1.5 bg-destructive text-destructive-foreground font-bold uppercase">{t('Venta cerrada')}</Badge>
                              <p className="text-sm text-muted-foreground mt-3">
                                {t('Las entradas aún no están a la venta')}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('Déjanos tu email y te avisaremos cuando las entradas estén disponibles.')}
                              </p>
                            </div>
                            {eventDetails.event_id && <WaitlistForm eventId={eventDetails.event_id} />}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* "Ver otros conciertos" section */}
                  {artistOtherCities && artistOtherCities.length > 0 && (
                    <section className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <IconTicket className="h-5 w-5 text-accent" />
                          {t('Ver otros conciertos de')} {mainArtist}
                        </h2>
                        <Link
                          to={localePath(`/conciertos/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
                          className="flex items-center gap-1 text-accent hover:text-accent/80 font-semibold transition-colors text-sm"
                        >
                          {t('Ver todos')} <IconChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
                        {artistOtherCities.map((city) => (
                          <Link key={city.slug} to={localePath(city.eventRoute || `/conciertos/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
                            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-foreground rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ease-out hover:bg-accent hover:-translate-y-1"
                          >
                            <span className="font-semibold text-sm text-foreground group-hover:text-accent-foreground transition-colors duration-200">
                              {city.name}
                            </span>
                            <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-accent-foreground group-hover:text-accent transition-colors duration-200">
                              {city.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <>
                  {/* === NORMAL LAYOUT: Tickets first === */}
                  {/* === TICKET STATUS BLOCK === */}
                  {(() => {
                    const ticketsStatus = (eventDetails as any).tickets_status as string | null;

                    // CANCELLED
                    if (ticketsStatus === 'cancelled') {
                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-foreground text-background">1</div>
                            <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                          </div>
                          <Card className="border-2 border-foreground/20">
                            <CardContent className="p-6 text-center space-y-3">
                              <Badge className="text-sm px-4 py-1.5 bg-foreground text-background font-bold uppercase">{t('CANCELADO')}</Badge>
                              <p className="text-sm text-muted-foreground">{t('Este evento ha sido cancelado')}</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    // SOLD OUT
                    if (ticketsStatus === 'sold_out') {
                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">1</div>
                            <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                          </div>
                          <Card className="border-2 border-destructive/30">
                            <CardContent className="p-6 space-y-3">
                              <div className="text-center">
                                <Badge variant="agotado" className="text-sm px-4 py-1.5">{t('AGOTADO')}</Badge>
                                <p className="text-sm text-muted-foreground mt-3">
                                  {t('Las entradas para este evento se han agotado. Déjanos tu email y te avisaremos si hay nuevas disponibilidades.')}
                                </p>
                              </div>
                              {eventDetails.event_id && <WaitlistForm eventId={eventDetails.event_id} />}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    // OFF SALE
                    if (ticketsStatus === 'off_sale') {
                      const onSaleDateRaw = (eventDetails as any).on_sale_date as string | null;
                      const onSaleDateObj = onSaleDateRaw ? new Date(onSaleDateRaw) : null;
                      const onSaleDateText = onSaleDateObj
                        ? `${t('Venta desde el')} ${onSaleDateObj.toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : '';

                      return (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">1</div>
                            <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                          </div>
                          <Card className="border-2 border-muted">
                            <CardContent className="p-6 space-y-3">
                              <div className="text-center">
                                <Badge className="text-sm px-4 py-1.5 bg-muted text-muted-foreground font-bold uppercase">{t('PRÓXIMAMENTE')}</Badge>
                                <p className="text-sm text-muted-foreground mt-3">
                                  {t('Las entradas aún no están a la venta')}
                                  {onSaleDateText && <span>. {onSaleDateText}</span>}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {t('Déjanos tu email y te avisaremos cuando las entradas estén disponibles.')}
                                </p>
                              </div>
                              {eventDetails.event_id && <WaitlistForm eventId={eventDetails.event_id} />}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    // AVAILABLE or null — default behavior
                    return (
                      <>
                        {!isEventAvailable && !isNotYetOnSale && (
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">1</div>
                              <h2 className="text-xl sm:text-2xl font-bold">{t('Entradas')}</h2>
                            </div>
                            <Card className="border-2 border-muted">
                              <CardContent className="p-6 text-center space-y-3">
                                <Badge variant="agotado" className="text-sm px-4 py-1.5">{t('AGOTADO')}</Badge>
                                <p className="text-sm text-muted-foreground">
                                  {t('Las entradas para este evento se han agotado')}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        {ticketPrices.length > 0 && (
                          <TicketSelector
                            tickets={ticketPrices.map((t: any) => ({
                              id: t.id,
                              name: t.type,
                              description: t.description,
                              price: t.price,
                              fees: t.fees,
                              status: t.availability === "none" ? "sold-out" as const
                                     : t.availability === "limited" ? "limited" as const
                                     : "available" as const,
                              isVip: /vip/i.test(t.type || "") || /vip/i.test(t.description || "") || /vip/i.test(t.code || ""),
                            }))}
                            quantities={ticketPrices.reduce((acc: Record<string, number>, t: any) => {
                              acc[t.id] = getTicketQuantity(t.id);
                              return acc;
                            }, {})}
                            onQuantityChange={(id, delta) => handleTicketQuantityChange(id, delta)}
                            completed={isEventInCart && totalPersons > 0}
                          />
                        )}
                      </>
                    );
                  })()}

                  {isFestivalDisplay && eventDetails?.event_id && (
                    <FestivalServiceAddons
                      eventId={eventDetails.event_id}
                      festivalName={eventDetails?.primary_attraction_name || eventDetails?.event_name}
                      className="mt-6"
                    />
                  )}

                  {/* "Ver otros conciertos" section - Only when sold out */}
                  {!isEventAvailable && !isNotYetOnSale && artistOtherCities && artistOtherCities.length > 0 && (
                    <section className="mb-10">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <IconTicket className="h-5 w-5 text-accent" />
                          {t('Ver otros conciertos de')} {mainArtist}
                        </h2>
                        <Link
                          to={localePath(`/conciertos/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
                          className="flex items-center gap-1 text-accent hover:text-accent/80 font-semibold transition-colors text-sm"
                        >
                          {t('Ver todos')} <IconChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
                        {artistOtherCities.map((city) => (
                          <Link key={city.slug} to={localePath(city.eventRoute || `/conciertos/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
                            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-foreground rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ease-out hover:bg-accent hover:-translate-y-1"
                          >
                            <span className="font-semibold text-sm text-foreground group-hover:text-accent-foreground transition-colors duration-200">
                              {city.name}
                            </span>
                            <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-accent-foreground group-hover:text-accent transition-colors duration-200">
                              {city.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  )}

                  {(eventDetails?.venue_city || (eventDetails?.venue_latitude && eventDetails?.venue_longitude)) && (
                    <div id="hotels-section">
                      <Suspense fallback={<HotelsSkeleton />}>
                        <HotelMapTabs
                          hotels={hotels}
                          mapWidgetHtml={mapWidgetHtml}
                          onAddHotel={handleAddHotel}
                          checkinDate={(eventDetails as any).package_checkin || formatDateISO(eventDate)}
                          checkoutDate={
                            (eventDetails as any).package_checkout ||
                            formatDateISO(new Date(eventDate.getTime() + 2 * 24 * 60 * 60 * 1000))
                          }
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
                </>
              )}

              {isFestivalDisplay && isUnavailable && eventDetails?.event_id && (
                <FestivalServiceAddons
                  eventId={eventDetails.event_id}
                  festivalName={eventDetails?.primary_attraction_name || eventDetails?.event_name}
                  className="mt-6"
                />
              )}

              {artistOtherCities && artistOtherCities.length > 0 && (
                <ArtistDestinationsList
                  artistName={mainArtist}
                  citiesWithData={artistOtherCities}
                  currentCity={currentCity}
                />
              )}
            </div>

            <div className="hidden xl:block xl:col-span-1">
              <Card className="sticky top-24 border-2">
                <CardHeader className="bg-foreground text-background">
                  <CardTitle className="uppercase tracking-wide text-sm flex items-center gap-2">
                    {t('Tu Pack')}
                    {isEventInCart && cart?.hotel && (
                      <span className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                        {t('COMPLETO')}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {isEventInCart && cart ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-bold text-foreground">{eventDetails.event_name}</p>
                      </div>

                      {cart.hotel && totalPersons > 0 && (
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                          <p className="text-xs text-foreground font-medium flex items-center gap-2">
                            <IconCheck className="h-3 w-3 text-accent" />
                            {t('¡Pack completo! Entradas + Hotel')}
                          </p>
                        </div>
                      )}

                      {cart.tickets.map((ticketItem, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <IconTicket className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] uppercase text-muted-foreground font-medium">{t('Entrada')}</span>
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
                            <span className="text-muted-foreground">{t('Cantidad')}:</span>
                            <span className="font-bold">{ticketItem.quantity}</span>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold">
                              €{((ticketItem.price + ticketItem.fees) * ticketItem.quantity).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              €{ticketItem.price.toFixed(2)} + €{ticketItem.fees.toFixed(2)} {t('gastos')}
                            </p>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="default"
                        className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90"
                        asChild
                      >
                        <a href={(eventDetails as any).event_url || "#"} target="_blank" rel="noopener noreferrer">
                          {t('Reservar Entradas')}
                        </a>
                      </Button>

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
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeHotel}>
                                <IconTrash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground mb-2">
                              {cart.hotel.checkin_date && cart.hotel.checkout_date && (
                                <p>
                                  {new Date(cart.hotel.checkin_date).toLocaleDateString(locale === 'en' ? "en-GB" : "es-ES", {
                                    day: "numeric",
                                    month: "short",
                                  })}{" "}
                                  -{" "}
                                  {new Date(cart.hotel.checkout_date).toLocaleDateString(locale === 'en' ? "en-GB" : "es-ES", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </p>
                              )}
                              <p>{cart.hotel.nights} {t('noches')} · 2 {t('huéspedes')}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">€{cart.hotel.total_price.toFixed(2)}</div>
                            </div>
                          </div>

                          <Button
                            className="w-full h-10 text-sm bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                            asChild
                          >
                            <a
                              href={(eventDetails as any).destination_deeplink || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('Reservar Hotel')}
                            </a>
                          </Button>
                        </>
                      )}

                      <div className="pt-4 border-t-2 space-y-3">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">{t('Total por persona')}</p>
                          <span className="text-3xl font-black text-foreground">€{pricePerPerson.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-muted-foreground">Total ({totalPersons} {t('personas')})</span>
                          <span className="text-base font-bold text-accent">€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        {isUnavailable ? (
                          <IconBuilding2 className="h-6 w-6 text-muted-foreground" />
                        ) : (
                          <IconTicket className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      {isUnavailable ? (
                        <>
                          <p className="text-foreground font-medium mb-2">{t('Encuentra tu hotel')}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'en'
                              ? `Find a hotel near ${eventDetails.venue_name || eventDetails.venue_city}`
                              : `Encuentra hotel cerca de ${eventDetails.venue_name || eventDetails.venue_city}`}
                          </p>
                        </>
                      ) : (() => {
                        const ts = (eventDetails as any).tickets_status as string | null;
                        if (ts === 'cancelled') return (
                          <>
                            <Badge className="mb-2 bg-foreground text-background font-bold uppercase">{t('CANCELADO')}</Badge>
                            <p className="text-xs text-muted-foreground">{t('Este evento ha sido cancelado')}</p>
                          </>
                        );
                        if (ts === 'sold_out') return (
                          <>
                            <Badge variant="agotado" className="mb-2">{t('AGOTADO')}</Badge>
                            <p className="text-xs text-muted-foreground">{t('Las entradas para este evento se han agotado')}</p>
                          </>
                        );
                        if (ts === 'off_sale') return (
                          <>
                            <Badge className="mb-2 bg-muted text-muted-foreground font-bold uppercase">{t('PRÓXIMAMENTE')}</Badge>
                            <p className="text-xs text-muted-foreground">{t('Las entradas aún no están a la venta')}</p>
                          </>
                        );
                        if (!isEventAvailable && !isNotYetOnSale) return (
                          <>
                            <Badge variant="agotado" className="mb-2">{t('AGOTADO')}</Badge>
                            <p className="text-xs text-muted-foreground">{t('Las entradas para este evento se han agotado')}</p>
                          </>
                        );
                        return (
                          <>
                            <p className="text-foreground font-medium mb-2">{t('Empieza seleccionando tus entradas')}</p>
                            <p className="text-xs text-muted-foreground">{t('Elige las entradas y después añade un hotel para completar tu pack')}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

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

        <div className="h-20 xl:hidden" />

        {/* CRITICAL SEO: RelatedEventsSection renders IMMEDIATELY (no delay) 
            The component skeleton includes crawlable <a> tags for bot discovery */}
        <div className="container mx-auto px-4 pb-8">
          <RelatedEventsSection 
            currentEventId={eventDetails.event_id || undefined}
            currentArtist={artistForSearch}
            currentCity={currentCity}
            currentGenre={(eventDetails as any)?.primary_category_name}
            maxItems={8}
          />
        </div>


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
