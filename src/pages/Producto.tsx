import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEventData } from "@/hooks/useEventData";
import { useEventHotels } from "@/hooks/useEventHotels";
import { usePageTracking } from "@/hooks/usePageTracking";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductoSkeleton from "@/components/ProductoSkeleton";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/contexts/CartContext";
import { SEOHead } from "@/components/SEOHead";
import { EventProductPage } from "@/types/events.types";

// Iconos y auxiliares omitidos por brevedad, se mantienen igual que en tu original
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

const HotelMapTabs = lazy(() => import("@/components/HotelMapTabs"));
const Footer = lazy(() => import("@/components/Footer"));

const Producto = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { cart, addTickets, addHotel, getTotalPrice, getTotalTickets, clearCart } = useCart();

  const isConcierto = location.pathname.startsWith("/concierto/");
  const isFestivalRoute = location.pathname.startsWith("/festival/");

  const { data: eventResult, isLoading, isError } = useEventData(slug, isFestivalRoute, isConcierto);
  const eventDetails = eventResult?.data?.[0] as unknown as EventProductPage | null;

  usePageTracking(eventDetails?.event_name);

  // Optimizamos la imagen principal para el LCP (Se elimina la miniatura)
  const eventImage = useMemo(() => {
    const rawImg =
      (eventDetails as any)?.image_large_url || (eventDetails as any)?.image_standard_url || "/placeholder.svg";
    return rawImg.replace(/_RETINA_LANDSCAPE_16_9|_RETINA_PORTRAIT_16_9|_SOURCE|_CUSTOM/i, "_TABLET_LANDSCAPE_16_9");
  }, [eventDetails]);

  const { data: hotels = [] } = useEventHotels({
    eventId: eventDetails?.event_id,
    venueLatitude: eventDetails?.venue_latitude ? Number(eventDetails.venue_latitude) : null,
    venueLongitude: eventDetails?.venue_longitude ? Number(eventDetails.venue_longitude) : null,
    enabled: !!eventDetails?.event_id,
  });

  if (isLoading || !eventDetails) return <ProductoSkeleton />;
  if (isError) return <div className="pt-32 text-center">Error al cargar el evento.</div>;

  return (
    <>
      <SEOHead
        title={`${eventDetails.event_name} - Entradas y Hotel`}
        description={`Pack entradas + hotel para ${eventDetails.event_name}`}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 lg:pt-20">
          {/* HERO OPTIMIZADO: Una sola imagen de alta prioridad */}
          <section className="relative w-full bg-black min-h-[450px] flex items-center overflow-hidden">
            <div className="absolute inset-0">
              <img
                src={eventImage}
                alt={eventDetails.event_name}
                fetchpriority="high"
                className="w-full h-full object-cover opacity-50 blur-[1px] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>

            <div className="container relative z-10 mx-auto px-4 py-12">
              <Breadcrumbs className="mb-6 text-white/70" />
              <div className="max-w-4xl space-y-6">
                <Badge className="bg-accent text-accent-foreground">
                  {eventDetails.primary_category_name || "Evento"}
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
                  {eventDetails.event_name}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md text-white border border-white/10">
                    <IconMapPin className="h-5 w-5 text-accent" />
                    <span className="font-bold">{eventDetails.venue_city}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md text-white border border-white/10">
                    <IconTicket className="h-5 w-5 text-accent" />
                    <span className="font-bold">Pack Disponible</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTENIDO PRINCIPAL */}
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-12">
                <section>
                  <h2 className="text-2xl font-black mb-6 uppercase italic">Selecciona tus Entradas</h2>
                  {/* Aquí iría el mapeo de tickets que tienes en tu código original */}
                  <p className="text-muted-foreground">Configura tu pack de entradas y hotel a continuación.</p>
                </section>

                <section id="hotels">
                  <Suspense fallback={<div>Cargando hoteles...</div>}>
                    <HotelMapTabs
                      hotels={hotels}
                      onAddHotel={addHotel}
                      eventId={eventDetails.event_id!}
                      eventData={eventDetails as any}
                    />
                  </Suspense>
                </section>
              </div>

              <div className="lg:col-span-4 sticky top-24">
                <Card className="border-accent/20 shadow-2xl">
                  <CardContent className="p-6">
                    <CardTitle className="mb-4">Tu Viaje Feelomove+</CardTitle>
                    <p className="text-sm text-muted-foreground mb-6">
                      Añade entradas y hotel para ver el precio final de tu pack personalizado.
                    </p>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 py-6 text-lg font-bold uppercase tracking-widest"
                      disabled
                    >
                      Reservar Ahora
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default Producto;
