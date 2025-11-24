import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Obtener nombre del artista si estamos en página de música con query param artist
  const artistId = searchParams.get('artist');
  const { data: artistDetails } = useQuery({
    queryKey: ["artist-breadcrumb", artistId],
    queryFn: async () => {
      if (!artistId) return null;
      
      const { data, error } = await supabase
        .from("tm_tbl_attractions")
        .select("name, subcategory_name")
        .eq("attraction_id", artistId)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!artistId,
  });

  // Obtener nombre del evento si estamos en página de producto
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb", params.id, searchParams.get('domain')],
    queryFn: async () => {
      if (!params.id) return null;
      const domainId = searchParams.get('domain');
      
      let query = supabase
        .from("tm_tbl_events")
        .select("name, main_attraction_name, main_attraction_id, subcategory_name")
        .eq("event_id", params.id);
      
      if (domainId) {
        query = query.eq("domain_id", domainId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!params.id && pathnames[0] === "producto",
  });

  const breadcrumbNames: Record<string, string> = {
    about: "Nosotros",
    destinos: "Destinos",
    musica: "Música",
    eventos: "Eventos",
    producto: eventDetails?.name || "Evento",
  };

  // Obtener el nombre del género desde la URL si existe
  const genreFromPath = params.genero ? decodeURIComponent(params.genero) : null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Inicio</span>
      </Link>
      {/* Para la página de producto, mostrar: Inicio > Eventos > Género > Artista > Evento */}
      {pathnames[0] === "producto" && eventDetails ? (
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
          {eventDetails.subcategory_name && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <Link
                to={`/musica/${encodeURIComponent(eventDetails.subcategory_name)}`}
                className="hover:text-foreground transition-colors"
              >
                {eventDetails.subcategory_name}
              </Link>
            </div>
          )}
          {eventDetails.main_attraction_name && eventDetails.main_attraction_id && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">
                {eventDetails.main_attraction_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.name}</span>
          </div>
        </>
      ) : pathnames[0] === "musica" && genreFromPath && artistId && artistDetails ? (
        /* Para artistas en géneros: Inicio > Música > Género > Artista */
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
              to={`/musica/${encodeURIComponent(genreFromPath)}`}
              className="hover:text-foreground transition-colors"
            >
              {genreFromPath}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{artistDetails.name}</span>
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
