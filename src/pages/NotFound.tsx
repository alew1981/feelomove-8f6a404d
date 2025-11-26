import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-black text-[#00FF8F] mb-4">404</h1>
          <h2 className="text-3xl font-bold text-foreground mb-2">Página no encontrada</h2>
          <p className="text-muted-foreground text-lg">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="primary">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Ir al Inicio
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/eventos">
              <Search className="mr-2 h-5 w-5" />
              Ver Eventos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
