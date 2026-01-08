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
    <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-4 pb-1" aria-label="Breadcrumb">
      <ol className="flex items-center text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
        {/* Home */}
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center hover:text-foreground transition-colors p-1 -m-1 rounded"
            aria-label="Inicio"
          >
            <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </li>

      {/* For product page (/concierto/:slug or /festival/:slug): Inicio > Conciertos/Festivales > Ciudad > Género > Artista > Evento */}
      {isProductPage && eventDetails ? (
        <>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <Link
              to={isFestivalProduct ? "/festivales" : "/conciertos"}
              className={`${linkClass} hidden sm:inline`}
              onMouseEnter={() => prefetch(isFestivalProduct ? '/festivales' : '/conciertos')}
            >
              {isFestivalProduct ? "Festivales" : "Conciertos"}
            </Link>
            <Link
              to={isFestivalProduct ? "/festivales" : "/conciertos"}
              className={`${linkClass} sm:hidden`}
              onMouseEnter={() => prefetch(isFestivalProduct ? '/festivales' : '/conciertos')}
            >
              {isFestivalProduct ? "Fest." : "Conc."}
            </Link>
          </li>
          {eventCity && (
            <li className="flex items-center">
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
              <Link
                to={`/destinos/${encodeURIComponent(eventCity.toLowerCase().replace(/\s+/g, '-'))}`}
                className={linkClass}
                onMouseEnter={() => prefetch('/destinos')}
              >
                {eventCity}
              </Link>
            </li>
          )}
          {eventGenre && (
            <li className="flex items-center">
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
              <Link
                to={`/generos/${generateSlug(eventGenre)}`}
                className={`${linkClass} max-w-[70px] sm:max-w-none truncate`}
                onMouseEnter={() => prefetch('/generos')}
              >
                {eventGenre.split(' - ')[0]}
              </Link>
            </li>
          )}
          {eventArtist && (
            <li className="flex items-center">
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
              <Link
                to={`/conciertos/${generateSlug(eventArtist)}`}
                className={`${linkClass} max-w-[70px] sm:max-w-[120px] md:max-w-none truncate`}
                onMouseEnter={() => prefetch(`/conciertos/${generateSlug(eventArtist)}`)}
              >
                {eventArtist}
              </Link>
            </li>
          )}
          <li className="flex items-center min-w-0">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60 flex-shrink-0" />
            <span className="text-foreground font-semibold truncate max-w-[100px] sm:max-w-[180px] md:max-w-none" title={eventDetails.event_name || ''}>
              {eventDetails.event_name}
            </span>
          </li>
        </>
      ) : pathnames[0] === "generos" && genreFromPath ? (
        /* Para página de género: Inicio > Géneros > Género */
        <>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <Link
              to="/generos"
              className={linkClass}
              onMouseEnter={() => prefetch('/generos')}
            >
              Géneros
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">{genreFromPath}</span>
          </li>
        </>
      ) : pathnames[0] === "destinos" && destinoSlug ? (
        /* Para página de destino: Inicio > Destinos > Ciudad */
        <>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <Link
              to="/destinos"
              className={linkClass}
              onMouseEnter={() => prefetch('/destinos')}
            >
              Destinos
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">
              {destinoData || destinoSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </li>
        </>
      ) : pathnames[0] === "conciertos" && artistSlug ? (
        /* Para página de artista: Inicio > Conciertos > Nombre del artista */
        <>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <Link
              to="/conciertos"
              className={linkClass}
              onMouseEnter={() => prefetch('/conciertos')}
            >
              Conciertos
            </Link>
          </li>
          <li className="flex items-center">
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
            <span className="text-foreground font-semibold">
              {artistData || artistSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </li>
        </>
      ) : (
        pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          
          let displayName = breadcrumbNames[name] || decodeURIComponent(name);

          return (
            <li key={`${name}-${index}`} className="flex items-center">
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 mx-1 text-muted-foreground/60" />
              {isLast ? (
                <span className="text-foreground font-semibold">{displayName}</span>
              ) : (
                <Link
                  to={routeTo}
                  className={linkClass}
                  onMouseEnter={() => prefetch(routeTo)}
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })
      )}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;