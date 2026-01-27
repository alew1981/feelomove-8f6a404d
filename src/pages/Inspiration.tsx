import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Star, Calendar, Moon, ChevronRight } from "lucide-react";

interface InspirationDeal {
  event_id: string | null;
  event_name: string | null;
  artist_name: string | null;
  city: string | null;
  event_date: string | null;
  hotel_name: string | null;
  hotel_stars: number | null;
  hotel_price: number | null;
  ticket_price: number | null;
  price_per_person: number | null;
  total_pack_pair: number | null;
  image_url: string | null;
}

// Render stars as icons
const HotelStars = ({ stars }: { stars: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: stars }).map((_, i) => (
      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
    ))}
  </div>
);

// Desktop Card (Grid view)
const InspirationCardDesktop = ({ deal }: { deal: InspirationDeal }) => {
  const navigate = useNavigate();

  const formattedDate = deal.event_date
    ? format(new Date(deal.event_date), "EEE d MMM yyyy", { locale: es })
    : null;

  const handleClick = () => {
    if (deal.event_id) {
      navigate(`/concierto/${deal.event_id}`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-card shadow-card group h-[420px] cursor-pointer" onClick={handleClick}>
      {/* Background Image with Overlay */}
      {deal.image_url && (
        <img
          src={deal.image_url}
          alt={deal.artist_name || "Evento"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative p-5 flex flex-col h-full justify-end text-white">
        {/* Location Badge */}
        <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
          {deal.city}
        </span>

        {/* Artist Name */}
        <h3 className="text-2xl font-bold line-clamp-2">
          {deal.artist_name || deal.event_name}
        </h3>

        {/* Event Date */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 mt-2 text-sm opacity-90">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{formattedDate}</span>
          </div>
        )}

        {/* Hotel Info */}
        {deal.hotel_name && (
          <div className="mt-3 p-2.5 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {deal.hotel_stars && <HotelStars stars={deal.hotel_stars} />}
                  <span className="text-xs opacity-70 flex items-center gap-1">
                    <Moon className="w-3 h-3" /> 1 noche
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-1">{deal.hotel_name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing & CTA */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {deal.price_per_person && (
              <p className="text-3xl font-black">
                €{Math.round(deal.price_per_person)}
                <span className="text-sm font-normal opacity-80"> / pers.</span>
              </p>
            )}
            {deal.total_pack_pair && (
              <p className="text-xs opacity-70 mt-0.5">
                Pack pareja: €{Math.round(deal.total_pack_pair)}
              </p>
            )}
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="shrink-0"
            size="sm"
          >
            Ver Oferta
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mobile Card (List view - matching artist list design with CTA)
const InspirationCardMobile = ({ deal, priority = false }: { deal: InspirationDeal; priority?: boolean }) => {
  const navigate = useNavigate();

  const formattedDate = deal.event_date
    ? format(new Date(deal.event_date), "EEE d MMM", { locale: es })
    : null;

  const handleClick = () => {
    if (deal.event_id) {
      navigate(`/concierto/${deal.event_id}`);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border cursor-pointer active:bg-muted/50 transition-colors"
      onClick={handleClick}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 100px' }}
    >
      {/* Circular Image - like artist cards */}
      <div className="relative w-[56px] h-[56px] shrink-0 rounded-full overflow-hidden ring-2 ring-primary/20">
        {deal.image_url && (
          <img
            src={deal.image_url}
            alt={deal.artist_name || "Evento"}
            className="absolute inset-0 h-full w-full object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Artist Name */}
        <h3 className="font-bold text-sm line-clamp-1">
          {deal.artist_name || deal.event_name}
        </h3>
        
        {/* City & Date */}
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {deal.city} {formattedDate && <span className="capitalize">• {formattedDate}</span>}
        </p>

        {/* Hotel Info + Price - all in one block */}
        {deal.hotel_name && (
          <div className="mt-1.5 space-y-0.5">
            <div className="flex items-center gap-1.5">
              {deal.hotel_stars && <HotelStars stars={deal.hotel_stars} />}
              <span className="text-[10px] text-muted-foreground/70">• 1 noche</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{deal.hotel_name}</p>
              {deal.price_per_person && (
                <span className="text-xs font-bold text-primary shrink-0">
                  desde €{Math.round(deal.price_per_person)}/pers.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA Button - green circle with arrow like artist cards */}
      <button 
        className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 active:scale-95 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        aria-label="Ver oferta"
      >
        <ChevronRight className="w-5 h-5 text-primary-foreground" />
      </button>
    </div>
  );
};

// Desktop Skeleton
const InspirationCardSkeletonDesktop = () => (
  <div className="relative overflow-hidden rounded-xl bg-card shadow-card h-[420px]">
    <Skeleton className="absolute inset-0 h-full w-full" />
    <div className="relative p-5 flex flex-col h-full justify-end">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-16 w-full rounded-lg mb-4" />
      <div className="flex justify-between items-end">
        <div>
          <Skeleton className="h-10 w-24 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  </div>
);

// Mobile Skeleton
const InspirationCardSkeletonMobile = () => (
  <div className="flex items-stretch h-[100px] bg-card border-b border-border">
    <Skeleton className="w-[100px] h-full shrink-0" />
    <div className="flex-1 p-3 flex flex-col justify-between">
      <div>
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
    <div className="p-3 flex flex-col items-end justify-center">
      <Skeleton className="h-6 w-14 mb-1" />
      <Skeleton className="h-2 w-10" />
    </div>
  </div>
);

const Inspiration = () => {
  const { data: deals, isLoading, error } = useQuery({
    queryKey: ["inspiration-deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspiration_deals")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      return data as InspirationDeal[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <SEOHead
        title="Inspiración | Ofertas de Conciertos con Hotel | Feelomove"
        description="Descubre las mejores ofertas para conciertos y festivales con hotel incluido. Packs completos desde el mejor precio por persona."
        canonical="/inspiration"
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 pt-20 pb-12">
          <div className="container mx-auto px-4">
            {/* Hero Section */}
            <div className="text-center mb-8 md:mb-10">
              <h1 className="text-3xl md:text-5xl font-black mb-3 md:mb-4">
                <span className="text-primary">Inspírate</span> para tu próximo viaje
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                Ofertas exclusivas de conciertos y festivales con hotel incluido. 
                Experiencias completas al mejor precio.
              </p>
            </div>

            {/* SEO Content Section */}
            <div className="bg-muted/30 rounded-xl p-5 md:p-8 mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold mb-3">
                Packs de Concierto + Hotel: Tu Escapada Musical Perfecta
              </h2>
              <div className="text-sm md:text-base text-muted-foreground space-y-3">
                <p>
                  En <strong className="text-foreground">Feelomove</strong> seleccionamos las mejores combinaciones de 
                  <strong className="text-foreground"> entradas para conciertos y festivales con alojamiento</strong> en hoteles 
                  cercanos al venue. Cada pack incluye <strong className="text-foreground">1 noche de hotel</strong> y está 
                  calculado por persona, ideal para planificar tu escapada musical sin complicaciones.
                </p>
                <p className="hidden md:block">
                  Nuestras ofertas se actualizan diariamente para mostrarte los precios más competitivos en 
                  <strong className="text-foreground"> Madrid, Barcelona, Valencia, Sevilla</strong> y las principales ciudades 
                  españolas. Desde conciertos de artistas internacionales hasta festivales de música electrónica, 
                  rock o indie: encuentra el pack perfecto y reserva con total confianza.
                </p>
                <p className="text-xs md:text-sm opacity-80">
                  💡 <em>Consejo:</em> Los packs para parejas (precio total indicado) son la opción más económica 
                  para disfrutar de tu artista favorito con acompañante.
                </p>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Error al cargar las ofertas. Inténtalo de nuevo.</p>
              </div>
            )}

            {/* Loading State - Mobile */}
            {isLoading && (
              <>
                <div className="md:hidden -mx-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <InspirationCardSkeletonMobile key={i} />
                  ))}
                </div>
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <InspirationCardSkeletonDesktop key={i} />
                  ))}
                </div>
              </>
            )}

            {/* Deals - Mobile List */}
            {!isLoading && deals && deals.length > 0 && (
              <>
                <div className="md:hidden -mx-4">
                  {deals.map((deal, index) => (
                    <InspirationCardMobile key={deal.event_id || index} deal={deal} priority={index < 5} />
                  ))}
                </div>
                {/* Deals - Desktop Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {deals.map((deal, index) => (
                    <InspirationCardDesktop key={deal.event_id || index} deal={deal} />
                  ))}
                </div>
              </>
            )}

            {/* Empty State */}
            {!isLoading && (!deals || deals.length === 0) && !error && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No hay ofertas disponibles en este momento.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vuelve pronto para descubrir nuevas experiencias.
                </p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Inspiration;
