import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Breadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // For now, disable artist breadcrumb since tm_tbl_attractions doesn't exist
  const artistId = searchParams.get('artist');
  const artistDetails = null;

  // Get event name for product page using correct column name
  const { data: eventDetails } = useQuery({
    queryKey: ["event-breadcrumb", params.id],
    queryFn: async () => {
      if (!params.id) return null;
      
      const { data, error } = await supabase
        .from("tm_tbl_events")
        .select("name")
        .eq("id", params.id)
        .maybeSingle();
      
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
      {/* For product page, show: Inicio > Eventos > Event */}
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
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{eventDetails.name}</span>
          </div>
        </>
      ) : pathnames[0] === "musica" && genreFromPath && artistId ? (
        /* For artists in genres: Inicio > Música > Género */
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
