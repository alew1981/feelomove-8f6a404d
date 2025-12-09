import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    producto: eventDetails?.event_name || "Evento",
  };

  // Obtener el nombre del género desde la URL si existe
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;
  
  // Obtener el nombre del destino desde la URL si existe
  const destinoFromPath = params.destino ? decodeURIComponent(params.destino) : null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Inicio</span>
      </Link>
      {/* For product page from city/destination: Inicio > Destinos > Ciudad > Evento */}
      {pathnames[0] === "producto" && eventDetails && !eventGenre && !eventArtist && eventCity ? (
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
            <Link
              to={`/destinos/${encodeURIComponent(eventCity)}`}
              className="hover:text-foreground transition-colors"
            >
              {eventCity}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.event_name}</span>
          </div>
        </>
      ) : pathnames[0] === "producto" && eventDetails && !eventGenre && eventArtist ? (
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
            <span className="hover:text-foreground transition-colors">
              {eventArtist}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.event_name}</span>
          </div>
        </>
      ) : pathnames[0] === "producto" && eventDetails && eventGenre ? (
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
            <Link
              to={`/musica/${encodeURIComponent(eventGenre)}`}
              className="hover:text-foreground transition-colors"
            >
              {eventGenre}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.event_name}</span>
          </div>
        </>
      ) : pathnames[0] === "producto" && eventDetails ? (
        /* For product page without genre: Inicio > Eventos > Event */
        <>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/eventos"
              className="hover:text-foreground transition-colors"
            >
              Eventos
            </Link>
          </div>
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
      ) : pathnames[0] === "destinos" && destinoFromPath ? (
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
            <span className="text-foreground font-medium">{destinoFromPath}</span>
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
    </nav>
  );
};

export default Breadcrumbs;
