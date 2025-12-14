import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeSearch } from "@/lib/searchUtils";

// Helper to generate slug from name (accent-insensitive)
const generateSlug = (name: string): string => {
  return normalizeSearch(name).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Get event name and categories for product page using lovable_mv_event_product_page
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb", params.slug],
    queryFn: async () => {
      if (!params.slug) return null;
      
      const { data, error } = await supabase
        .from("lovable_mv_event_product_page")
        .select("event_name, primary_subcategory_name, attraction_names, venue_city")
        .eq("event_slug", params.slug)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!params.slug && pathnames[0] === "producto",
  });

  // Get artist name from database for artist detail page
  const artistSlug = pathnames[0] === "artista" && params.slug ? decodeURIComponent(params.slug) : null;
  
  const { data: artistData } = useQuery({
    queryKey: ["artist-breadcrumb", artistSlug],
    queryFn: async () => {
      if (!artistSlug) return null;
      
      // Query attractions view directly using the slug
      const { data, error } = await supabase
        .from("mv_attractions")
        .select("attraction_name")
        .eq("attraction_slug", artistSlug.toLowerCase())
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
    musica: "Música",
    eventos: "Eventos",
    conciertos: "Conciertos",
    festivales: "Festivales",
    artistas: "Artistas",
    artista: "Artistas",
    producto: eventDetails?.event_name || "Evento",
  };

  // Obtener el nombre del género desde la URL si existe
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;

  return (
    <nav className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-6">
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap min-w-max">
        <Link
          to="/"
          className="flex items-center gap-1 hover:text-foreground transition-colors flex-shrink-0"
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Link>
      {/* For product page: Inicio > Conciertos > Evento */}
      {pathnames[0] === "producto" && eventDetails ? (
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/conciertos"
              className="hover:text-foreground transition-colors"
            >
              Conciertos
            </Link>
          </div>
          {eventCity && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/destinos/${encodeURIComponent(eventCity.toLowerCase().replace(/\s+/g, '-'))}`}
                className="hover:text-foreground transition-colors"
              >
                {eventCity}
              </Link>
            </div>
          )}
          {eventGenre && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/musica/${generateSlug(eventGenre)}`}
                className="hover:text-foreground transition-colors"
              >
                {eventGenre.split(' - ')[0]}
              </Link>
            </div>
          )}
          {eventArtist && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/artista/${generateSlug(eventArtist)}`}
                className="hover:text-foreground transition-colors"
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
      ) : pathnames[0] === "musica" && genreFromPath ? (
        /* Para página de género: Inicio > Música > Género */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/musica"
              className="hover:text-foreground transition-colors"
            >
              Música
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
              className="hover:text-foreground transition-colors"
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
      ) : pathnames[0] === "artista" && artistSlug ? (
        /* Para página de artista: Inicio > Artistas > Nombre del artista */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/artistas"
              className="hover:text-foreground transition-colors"
            >
              Artistas
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
                  className="hover:text-foreground transition-colors"
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
