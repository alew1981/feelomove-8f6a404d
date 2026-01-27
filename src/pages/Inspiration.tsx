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
import { Star } from "lucide-react";

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

const InspirationCard = ({ deal }: { deal: InspirationDeal }) => {
  const navigate = useNavigate();

  const formattedDate = deal.event_date
    ? format(new Date(deal.event_date), "d MMM yyyy", { locale: es })
    : null;

  const handleClick = () => {
    if (deal.event_id) {
      // Navigate to the concert page - we'll need to get the slug
      navigate(`/concierto/${deal.event_id}`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-card shadow-card group h-[400px] cursor-pointer" onClick={handleClick}>
      {/* Background Image with Overlay */}
      {deal.image_url && (
        <img
          src={deal.image_url}
          alt={deal.artist_name || "Evento"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative p-6 flex flex-col h-full justify-end text-white">
        {/* Location & Date Badge */}
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {deal.city} {formattedDate && `• ${formattedDate}`}
        </span>

        {/* Artist Name */}
        <h3 className="text-2xl font-bold mt-1 line-clamp-2">
          {deal.artist_name || deal.event_name}
        </h3>

        {/* Hotel Info */}
        {deal.hotel_name && (
          <div className="mt-3 flex items-center gap-2 text-sm opacity-90">
            {deal.hotel_stars && (
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {deal.hotel_stars}
              </span>
            )}
            <span className="line-clamp-1">{deal.hotel_name}</span>
          </div>
        )}

        {/* Pricing & CTA */}
        <div className="mt-4 flex items-end justify-between gap-4">
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

const InspirationCardSkeleton = () => (
  <div className="relative overflow-hidden rounded-xl bg-card shadow-card h-[400px]">
    <Skeleton className="absolute inset-0 h-full w-full" />
    <div className="relative p-6 flex flex-col h-full justify-end">
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-8 w-48 mb-3" />
      <Skeleton className="h-5 w-40 mb-4" />
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
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                <span className="text-primary">Inspírate</span> para tu próximo viaje
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ofertas exclusivas de conciertos y festivales con hotel incluido. 
                Experiencias completas al mejor precio.
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Error al cargar las ofertas. Inténtalo de nuevo.</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <InspirationCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Deals Grid */}
            {!isLoading && deals && deals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map((deal, index) => (
                  <InspirationCard key={deal.event_id || index} deal={deal} />
                ))}
              </div>
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
