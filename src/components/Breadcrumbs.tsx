import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/searchUtils";
import { usePrefetch } from "@/hooks/usePrefetch";

// Helper to generate slug from name (accent-insensitive)
const generateSlug = (name: string): string => {
  return normalizeSearch(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const linkClass = "hover:text-foreground hover:underline transition-colors";

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const { prefetch } = usePrefetch();

  // Detect if we're on a product page (/concierto/:slug or /festival/:slug)
  const isProductPage = pathnames[0] === "concierto" || pathnames[0] === "festival";
  const productSlug = isProductPage ? params.slug : null;
  const isFestivalProduct = pathnames[0] === "festival";

  // Get event name and categories for product page using lovable_mv_event_product_page
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb", productSlug],
    queryFn: async () => {
      if (!productSlug) return null;
      
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("event_name, primary_subcategory_name, attraction_names, venue_city, event_type")
        .eq("event_slug", productSlug)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!productSlug,
  });

  // Get artist name from database for artist detail page (now under /conciertos/:artistSlug)
  // Only when it's /conciertos/:artistSlug (NOT /conciertos alone)
  const artistSlugRaw = pathnames[0] === "conciertos" && pathnames.length === 2 && params.artistSlug ? decodeURIComponent(params.artistSlug) : null;
  // Normalize artist slug: replace multiple dashes with single dash for DB lookup
  const artistSlug = artistSlugRaw ? artistSlugRaw.toLowerCase().replace(/-+/g, '-') : null;
  
  const { data: artistData } = useQuery({
    queryKey: ["artist-breadcrumb", artistSlug],
    queryFn: async () => {
      if (!artistSlug) return null;
      
      // Query attractions view directly using the normalized slug
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("attraction_name")
        .eq("attraction_slug", artistSlug)
        .maybeSingle();
      
      if (error || !data) return null;
      return data.attraction_name || null;
    },
    enabled: !!artistSlug,
  });

  // Get destination name from database for destination detail page
  const destinoSlug = pathnames[0] === "destinos" && params.destino ? decodeURIComponent(params.destino) : null;
  
  const { data: destinoData } = useQuery({
    queryKey: ["destino-breadcrumb", destinoSlug],
    queryFn: async () => {
      if (!destinoSlug) return null;
      
      const { data, error } = await supabase
        .from("mv_destinations_cards")
        .select("city_name")
        .eq("city_slug", destinoSlug)
        .maybeSingle();
      
      if (error) return null;
      return data?.city_name || null;
    },
    enabled: !!destinoSlug,
  });

  // Extract genre from event
  const eventGenre = eventDetails?.primary_subcategory_name || null;

  // Extract first artist from event
  const eventArtist = eventDetails?.attraction_names && Array.isArray(eventDetails.attraction_names)
    ? eventDetails.attraction_names[0]
    : null;
  
  // Extract city from event
  const eventCity = eventDetails?.venue_city || null;

  const breadcrumbNames: Record<string, string> = {
    about: "Nosotros",
    destinos: "Destinos",
    generos: "Géneros",
    eventos: "Eventos",
    conciertos: "Conciertos",
    concierto: "Concierto",
    festivales: "Festivales",
    festival: "Festival",
    artistas: "Artistas",
  };

  // Obtener el nombre del género desde la URL si existe
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;

  return (
    <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6 pb-2">
      <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-sm text-muted-foreground whitespace-nowrap">
        <Link
          to="/"
          className="flex items-center gap-0.5 sm:gap-1 hover:text-foreground transition-colors flex-shrink-0"
        >
          <Home className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Link>

      {/* For product page (/concierto/:slug or /festival/:slug): Inicio > Conciertos/Festivales > Ciudad > Género > Artista > Evento */}
      {isProductPage && eventDetails ? (
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to={isFestivalProduct ? "/festivales" : "/conciertos"}
              className={linkClass}
              onMouseEnter={() => prefetch(isFestivalProduct ? '/festivales' : '/conciertos')}
            >
              {isFestivalProduct ? "Festivales" : "Conciertos"}
            </Link>
          </div>
          {eventCity && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/destinos/${encodeURIComponent(eventCity.toLowerCase().replace(/\s+/g, '-'))}`}
                className={linkClass}
                onMouseEnter={() => prefetch('/destinos')}
              >
                {eventCity}
              </Link>
            </div>
          )}
          {eventGenre && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/generos/${generateSlug(eventGenre)}`}
                className={linkClass}
                onMouseEnter={() => prefetch('/generos')}
              >
                {eventGenre.split(' - ')[0]}
              </Link>
            </div>
          )}
          {eventArtist && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/conciertos/${generateSlug(eventArtist)}`}
                className={linkClass}
                onMouseEnter={() => prefetch(`/conciertos/${generateSlug(eventArtist)}`)}
              >
                {eventArtist}
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.event_name}</span>
          </div>
        </>
      ) : pathnames[0] === "generos" && genreFromPath ? (
        /* Para página de género: Inicio > Géneros > Género */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/generos"
              className={linkClass}
              onMouseEnter={() => prefetch('/generos')}
            >
              Géneros
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{genreFromPath}</span>
          </div>
        </>
      ) : pathnames[0] === "destinos" && destinoSlug ? (
        /* Para página de destino: Inicio > Destinos > Ciudad */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/destinos"
              className={linkClass}
              onMouseEnter={() => prefetch('/destinos')}
            >
              Destinos
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {destinoData || destinoSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </>
      ) : pathnames[0] === "conciertos" && artistSlug ? (
        /* Para página de artista: Inicio > Conciertos > Nombre del artista */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/conciertos"
              className={linkClass}
              onMouseEnter={() => prefetch('/conciertos')}
            >
              Conciertos
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {artistData || artistSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
        </>
      ) : (
        pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          
          let displayName = breadcrumbNames[name] || decodeURIComponent(name);

          return (
            <div key={`${name}-${index}`} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {isLast ? (
                <span className="text-foreground font-medium">{displayName}</span>
              ) : (
                <Link
                  to={routeTo}
                  className={linkClass}
                  onMouseEnter={() => prefetch(routeTo)}
                >
                  {displayName}
                </Link>
              )}
            </div>
          );
        })
      )}
      </div>
    </nav>
  );
};

export default Breadcrumbs;