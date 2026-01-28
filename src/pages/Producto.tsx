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
import {
  optimizeImageUrl,
  getOptimizedHeroImage,
  generateHeroSrcSet,
  generateCardSrcSet,
} from "@/lib/imageOptimization";

// === INLINE SVG ICONS (to prevent separate requests) ===
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

// === NATIVE DATE FORMATTING (to replace date-fns) ===
const SPANISH_MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SPANISH_MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const formatDatePart = (date: Date, part: "day" | "month" | "monthLong" | "year" | "time" | "monthYear") => {
  switch (part) {
    case "day":
      return String(date.getDate()).padStart(2, "0");
    case "month":
      return SPANISH_MONTHS_SHORT[date.getMonth()];
    case "monthLong":
      return SPANISH_MONTHS_LONG[date.getMonth()];
    case "year":
      return String(date.getFullYear());
    case "time":
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    case "monthYear":
      return `${SPANISH_MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
  }
};

const formatDateISO = (date: Date) => {
  return date.toISOString().split("T")[0];
};

const differenceInDays = (dateA: Date, dateB: Date) => {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24));
};

const differenceInHours = (dateA: Date, dateB: Date) => {
  return Math.floor((dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60));
};

// === LOCAL SKELETONS ===
const HotelsSkeleton = () => (
  <div className="w-full" style={{ minHeight: "400px" }}>
    <Skeleton className="h-10 w-48 mb-4 animate-shimmer" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl animate-shimmer" />
      ))}
    </div>
  </div>
);

const RelatedLinksSkeleton = () => (
  <div className="w-full py-4" style={{ minHeight: "120px" }}>
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

const FooterSkeleton = () => <div className="w-full bg-card border-t border-border" style={{ minHeight: "200px" }} />;

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

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, removeTicket, removeHotel, getTotalPrice, getTotalTickets, clearCart } =
    useCart();

  // Performance: Track interaction for ultra-lazy loading
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    // Treat as interactive after 4s or user activity
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => setIsInteractive(true), { timeout: 500 });
      } else {
        setIsInteractive(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const isConcierto = location.pathname.startsWith("/concierto/");
  const isFestivalRoute = location.pathname.startsWith("/festival/");
  const [showAllTickets, setShowAllTickets] = useState(false);

  const { data: eventResult, isLoading, isError, error, refetch } = useEventData(slug, isFestivalRoute, isConcierto);

  // Prevent multiple navigations
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading) return;

    if (eventResult?.needsRedirect && eventResult.redirectPath) {
      hasNavigatedRef.current = true;
      navigate(eventResult.redirectPath, { replace: true });
      return;
    }

    if (eventResult?.needsRouteCorrection && eventResult.correctRoutePath) {
      hasNavigatedRef.current = true;
      navigate(eventResult.correctRoutePath, { replace: true });
      return;
    }
  }, [eventResult, navigate, isLoading]);

  const eventData = eventResult?.data;
  const eventDetails = eventData?.[0] as unknown as EventProductPage | null;

  usePageTracking(eventDetails?.event_name);

  const { data: hotels = [] } = useEventHotels({
    eventId: eventDetails?.event_id,
    venueLatitude: eventDetails?.venue_latitude ? Number(eventDetails.venue_latitude) : null,
    venueLongitude: eventDetails?.venue_longitude ? Number(eventDetails.venue_longitude) : null,
    enabled: !!eventDetails?.event_id,
  });

  // === LOGIC FOR ARTIST OTHER CITIES ===
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
          .limit(50),
      ]);

      const cityMap = new Map<string, { count: number; image: string | null; slug: string }>();

      (concertsRes.data || []).forEach((event: any) => {
        if (event.venue_city) {
          const existing = cityMap.get(event.venue_city);
          if (existing) {
            existing.count++;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, "-"),
            });
          }
        }
      });

      (festivalsRes.data || []).forEach((event: any) => {
        const attractionNames = event.attraction_names || [];
        if (
          attractionNames.some((name: string) => name.toLowerCase().includes(artistForSearch.toLowerCase())) &&
          event.venue_city
        ) {
          const existing = cityMap.get(event.venue_city);
          if (existing) {
            existing.count++;
          } else {
            cityMap.set(event.venue_city, {
              count: 1,
              image: event.image_standard_url,
              slug: event.venue_city_slug || event.venue_city.toLowerCase().replace(/\s+/g, "-"),
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
        const checkout = new Date(new Date(endDateStr));
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
  }, [eventDetails, isFestivalRoute]);

  const mapWidgetHtml = stay22Urls.map;
  const stay22Accommodations = stay22Urls.accommodations;
  const stay22Activities = stay22Urls.activities;

  useEffect(() => {
    const currentEventId = eventDetails?.event_id;
    if (currentEventId && cart && cart.event_id !== currentEventId) {
      clearCart();
    }
  }, [eventDetails?.event_id, cart, clearCart]);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (isLoading) return;
    if (isError && error instanceof Error && error.message === "Evento no encontrado") {
      hasNavigatedRef.current = true;
      navigate("/404", { replace: true });
    }
  }, [isError, error, navigate, isLoading]);

  const ticketPrices = useMemo(() => {
    if (!eventDetails) return [];

    const rawTicketTypes = (eventDetails as any).ticket_types;
    if (!rawTicketTypes) return [];

    try {
      const ticketData: TicketTypesData =
        typeof rawTicketTypes === "string" ? JSON.parse(rawTicketTypes) : rawTicketTypes;
      if (!ticketData?.price_types || !Array.isArray(ticketData.price_types)) return [];

      const tickets: any[] = [];
      for (const priceType of ticketData.price_types) {
        if (priceType.price_levels && Array.isArray(priceType.price_levels)) {
          for (let levelIndex = 0; levelIndex < priceType.price_levels.length; levelIndex++) {
            const level = priceType.price_levels[levelIndex];
            const rawAvailability = level.availability?.toLowerCase() || "available";
            const normalizedAvailability = ["none", "soldout", "sold_out"].includes(rawAvailability)
              ? "none"
              : rawAvailability === "limited"
                ? "limited"
                : "available";

            tickets.push({
              id: `${priceType.code || "ticket"}-${levelIndex}`,
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
        const availOrder = (a.availability !== "none" ? 0 : 1) - (b.availability !== "none" ? 0 : 1);
        if (availOrder !== 0) return availOrder;
        return a.price - b.price;
      });
    } catch (e) {
      console.error("Error parsing ticket types:", e);
      return [];
    }
  }, [eventDetails]);

  if (isLoading || eventResult?.needsRedirect || eventResult?.needsRouteCorrection || !eventDetails) {
    return <ProductoSkeleton />;
  }

  const rawEventDate = eventDetails.event_date;
  const hasValidDate = rawEventDate && !rawEventDate.startsWith("9999");
  const eventDate = hasValidDate ? new Date(rawEventDate) : new Date();
  const day = hasValidDate ? formatDatePart(eventDate, "day") : null;
  const month = hasValidDate ? formatDatePart(eventDate, "month") : null;
  const year = hasValidDate ? formatDatePart(eventDate, "year") : null;
  const monthYear = hasValidDate ? formatDatePart(eventDate, "monthYear") : "Fecha por confirmar";

  const isArtistEntry =
    isFestivalDisplay &&
    (eventDetails as any).secondary_attraction_name &&
    (eventDetails as any).secondary_attraction_name !== (eventDetails as any).primary_attraction_name;
  const displayTitle = isArtistEntry ? (eventDetails as any).secondary_attraction_name : eventDetails.event_name;
  const displaySubtitle = isArtistEntry
    ? `en ${(eventDetails as any).primary_attraction_name || eventDetails.event_name}`
    : null;

  const getTicketQuantity = (ticketId: string) => {
    if (!cart || cart.event_id !== eventDetails.event_id) return 0;
    const item = cart.tickets.find((t) => t.type === ticketId);
    return item ? item.quantity : 0;
  };

  const handleTicketQuantityChange = (ticketId: string, change: number) => {
    const existingTickets = cart?.event_id === eventDetails.event_id ? cart.tickets : [];
    const ticketData = ticketPrices.find((t) => t.id === ticketId);

    if (!ticketData) return;

    let updatedTickets = [...existingTickets];
    const existingIndex = updatedTickets.findIndex((t) => t.type === ticketId);

    if (existingIndex >= 0) {
      const newQuantity = Math.max(0, Math.min(10, updatedTickets[existingIndex].quantity + change));
      if (newQuantity === 0) {
        updatedTickets = updatedTickets.filter((t) => t.type !== ticketId);
      } else {
        updatedTickets[existingIndex] = {
          ...updatedTickets[existingIndex],
          quantity: newQuantity,
        };
      }
    } else if (change > 0) {
      updatedTickets.push({
        type: ticketId,
        description: `${ticketData.type} - ${ticketData.description || ticketData.code}`,
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

  const displayedTickets = showAllTickets ? ticketPrices : ticketPrices.slice(0, 4);
  const hasVipTickets =
    ticketPrices.some((t) => /vip/i.test(t.type || "") || /vip/i.test(t.description || "")) ||
    (eventDetails as any).has_vip_tickets;
  const isEventAvailable = ticketPrices.some((t) => t.availability !== "none") && !eventDetails.sold_out;

  const eventImage =
    (eventDetails as any).image_large_url || (eventDetails as any).image_standard_url || "/placeholder.svg";

  return (
    <>
      <EventSeo {...createEventSeoProps(eventDetails as any)} />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-16 lg:pt-20">
          {/* Hero Section */}
          <section className="relative w-full bg-muted overflow-hidden">
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0">
              <img
                src={eventImage}
                alt={eventDetails.event_name || ""}
                className="w-full h-full object-cover blur-[2px] opacity-40 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            <div className="container relative z-10 mx-auto px-4 py-8 lg:py-16">
              <Breadcrumbs className="mb-6" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                          variant="secondary"
                          className="bg-accent/10 text-accent-foreground border-accent/20 backdrop-blur-md"
                        >
                          {eventDetails.primary_category_name || "Evento"}
                        </Badge>
                        {hasVipTickets && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-md"
                          >
                            VIP Disponible
                          </Badge>
                        )}
                      </div>

                      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">{displayTitle}</h1>
                      {displaySubtitle && (
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium">{displaySubtitle}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <IconMapPin className="h-5 w-5 text-accent" />
                        <span className="font-medium">
                          {eventDetails.venue_name}, {eventDetails.venue_city}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block lg:col-span-5 relative group">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl relative">
                    <img
                      src={eventImage}
                      alt={eventDetails.event_name || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
                  </div>

                  {/* Event Date floating badge */}
                  {hasValidDate && (
                    <div className="absolute -top-4 -right-4 bg-background p-4 rounded-xl shadow-xl flex flex-col items-center justify-center min-w-[80px] border border-border">
                      <span className="text-2xl font-bold text-accent leading-none">{day}</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        {month}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Tickets and Hotels */}
              <div className="lg:col-span-8 space-y-12">
                {/* Tickets Section */}
                <section id="tickets" className="scroll-mt-24">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">Entradas Disponibles</h2>
                      <Badge variant="outline" className="rounded-full">
                        {ticketPrices.length}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(eventDetails.event_id!)}
                        className="h-9 gap-2"
                      >
                        <IconHeart
                          filled={isFavorite(eventDetails.event_id!)}
                          className={isFavorite(eventDetails.event_id!) ? "text-red-500" : ""}
                        />
                        {isFavorite(eventDetails.event_id!) ? "En favoritos" : "Guardar para luego"}
                      </Button>
                    </div>
                  </div>

                  {ticketPrices.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <IconTicket className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium">No hay entradas disponibles en este momento</p>
                        <p className="text-sm text-muted-foreground">
                          Vuelve a consultar más tarde para nuevas actualizaciones.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {displayedTickets.map((ticket) => (
                        <Card
                          key={ticket.id}
                          className={`overflow-hidden transition-all duration-300 ${ticket.availability === "none" ? "opacity-60 grayscale" : "hover:border-accent/50 hover:shadow-md"}`}
                        >
                          <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
                              <div className="flex-1 space-y-1">
                                <h3 className="font-bold text-lg">{ticket.type}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.description || "Entrada para el evento"}
                                </p>
                                {ticket.availability === "limited" && (
                                  <Badge
                                    variant="outline"
                                    className="text-orange-500 border-orange-500/20 bg-orange-500/5 text-[10px] uppercase tracking-wider"
                                  >
                                    Últimas unidades
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="text-right">
                                  <span className="block text-2xl font-black text-accent">{ticket.price}€</span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                    + {ticket.fees}€ gastos gestión
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 bg-secondary/50 p-1 rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md"
                                    onClick={() => handleTicketQuantityChange(ticket.id, -1)}
                                    disabled={getTicketQuantity(ticket.id) === 0}
                                  >
                                    <IconMinus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-4 text-center font-bold">{getTicketQuantity(ticket.id)}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md"
                                    onClick={() => handleTicketQuantityChange(ticket.id, 1)}
                                    disabled={ticket.availability === "none" || getTicketQuantity(ticket.id) >= 10}
                                  >
                                    <IconPlus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {ticketPrices.length > 4 && (
                        <Button
                          variant="outline"
                          className="w-full py-6 border-dashed hover:bg-muted"
                          onClick={() => setShowAllTickets(!showAllTickets)}
                        >
                          {showAllTickets
                            ? "Ver menos opciones"
                            : `Ver las ${ticketPrices.length} opciones de entradas`}
                        </Button>
                      )}
                    </div>
                  )}
                </section>

                {/* Hotels Section */}
                <section id="hotels" className="scroll-mt-24">
                  <Suspense fallback={<HotelsSkeleton />}>
                    <HotelMapTabs
                      hotels={hotels}
                      onAddHotel={addHotel}
                      eventId={eventDetails.event_id!}
                      eventData={eventDetails as any}
                      stay22MapUrl={mapWidgetHtml}
                      stay22AccommodationsUrl={stay22Accommodations}
                      stay22ActivitiesUrl={stay22Activities}
                    />
                  </Suspense>
                </section>

                {/* Artist Other Cities Section */}
                {artistOtherCities && artistOtherCities.length > 0 && (
                  <section className="pt-8">
                    <h2 className="text-2xl font-bold mb-6">{mainArtist} en otras ciudades</h2>
                    <ArtistDestinationsList destinations={artistOtherCities} />
                  </section>
                )}
              </div>

              {/* Right Column: Cart Summary */}
              <div className="lg:col-span-4 sticky top-24">
                <Card className="border-accent/20 shadow-xl overflow-hidden">
                  <div className="bg-accent p-4 text-accent-foreground">
                    <CardTitle className="text-lg flex items-center gap-2 font-bold">
                      <IconTicket className="h-5 w-5" /> Tu Pack Feelomove+
                    </CardTitle>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {!cart || cart.tickets.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                          <IconTicket className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Selecciona tus entradas para empezar a configurar tu viaje
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          {cart.tickets.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm group">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-accent">{t.quantity}x</span>
                                  <span className="text-foreground/80 font-medium">{t.description.split("-")[0]}</span>
                                </div>
                                <button
                                  onClick={() => handleTicketQuantityChange(t.type, -t.quantity)}
                                  className="text-[10px] text-muted-foreground hover:text-red-500 uppercase font-bold tracking-tighter mt-1 flex items-center gap-1"
                                >
                                  <IconTrash2 className="h-3 w-3" /> Eliminar
                                </button>
                              </div>
                              <span className="font-bold">{(t.price + t.fees) * t.quantity}€</span>
                            </div>
                          ))}

                          {cart.hotel && (
                            <div className="pt-3 border-t border-dashed">
                              <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                                    <IconMapPin className="h-4 w-4 text-accent" />
                                  </div>
                                  <div>
                                    <p className="font-bold leading-none">{cart.hotel.hotel_name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">
                                      Hotel en {eventDetails.venue_city}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-bold">{cart.hotel.total_price}€</span>
                              </div>
                              <button
                                onClick={removeHotel}
                                className="text-[10px] text-muted-foreground hover:text-red-500 uppercase font-bold tracking-tighter mt-2 flex items-center gap-1 ml-10"
                              >
                                <IconTrash2 className="h-3 w-3" /> Quitar hotel
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-muted-foreground">Total del pack</span>
                            <div className="text-right">
                              <span className="block text-3xl font-black text-accent">{getTotalPrice()}€</span>
                              {getTotalTickets() > 0 && (
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">
                                  {Math.round(getTotalPrice() / getTotalTickets())}€ / persona
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            className="w-full py-7 text-lg font-bold shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90 transition-all duration-300"
                            onClick={() => navigate("/checkout")}
                          >
                            Reservar Pack
                          </Button>

                          <div className="flex items-center gap-2 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                            <IconCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <p className="text-[10px] text-green-700 font-medium leading-tight">
                              Precio final garantizado. Sin cargos ocultos al finalizar la compra.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!cart?.hotel && cart?.tickets.length > 0 && (
                      <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 animate-pulse-subtle">
                        <p className="text-xs font-bold text-accent uppercase mb-1">Tip Pro</p>
                        <p className="text-xs text-muted-foreground">
                          Elige las entradas y después añade un hotel para completar tu pack
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
              <RelatedLinks slug={slug || ""} type="event" />
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
