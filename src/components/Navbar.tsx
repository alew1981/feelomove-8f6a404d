import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Menu, X, Search, Heart } from "lucide-react";
import { useState, useCallback } from "react";
import SearchBar from "./SearchBar";
import { useFavorites } from "@/hooks/useFavorites";
import { Badge } from "./ui/badge";
import { usePrefetch } from "@/hooks/usePrefetch";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { favorites } = useFavorites();
  const { prefetch } = usePrefetch();

  // Prefetch on hover
  const handleMouseEnter = useCallback((route: string) => {
    prefetch(route);
  }, [prefetch]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity" title="Ir a la página de inicio de FEELOMOVE+">
            <span className="text-[#121212] dark:text-white">feelomove</span>
            <span className="text-[#00FF8F]">+</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/festivales"
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/festivales')}
              title="Ver todos los festivales de música en España"
            >
              Festivales
            </NavLink>
            <NavLink
              to="/conciertos"
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/conciertos')}
              title="Ver todos los conciertos en España"
            >
              Conciertos
            </NavLink>
            <NavLink
              to="/artistas"
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              title="Explorar artistas con eventos en España"
            >
              Artistas
            </NavLink>
            <NavLink
              to="/inspiration"
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/inspiration')}
              title="Ofertas de conciertos con hotel incluido"
            >
              Inspiración
            </NavLink>
            <NavLink
              to="/destinos"
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              title="Explorar ciudades con eventos musicales"
            >
              Destinos
            </NavLink>
            {/* Hoteles Badge */}
            <a
              href="https://feelomove.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              title="Buscar hoteles para tu evento"
            >
              <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-3 py-1.5 text-sm">
                Hoteles
              </Badge>
            </a>
            
            {/* Search and Favorites Icons */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="relative ripple-effect"
                title="Buscar eventos"
              >
                <Search className="h-5 w-5" />
              </Button>
              <NavLink
                to="/favoritos"
                className="relative ripple-effect inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                aria-label="Ver favoritos"
                title="Ver mis eventos favoritos guardados"
              >
                <Heart className="h-5 w-5" />
                {favorites.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {favorites.length}
                  </Badge>
                )}
              </NavLink>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden transition-transform duration-200 active:scale-90"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 mobile-menu-enter">
            <NavLink
              to="/festivales"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title="Ver todos los festivales de música en España"
            >
              Festivales
            </NavLink>
            <NavLink
              to="/conciertos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title="Ver todos los conciertos en España"
            >
              Conciertos
            </NavLink>
            <NavLink
              to="/artistas"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title="Explorar artistas con eventos en España"
            >
              Artistas
            </NavLink>
            <NavLink
              to="/inspiration"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title="Ofertas de conciertos con hotel incluido"
            >
              Inspiración
            </NavLink>
            <NavLink
              to="/destinos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title="Explorar ciudades con eventos musicales"
            >
              Destinos
            </NavLink>
            {/* Hoteles Badge Mobile */}
            <a
              href="https://feelomove.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 pl-3"
              onClick={() => setIsMenuOpen(false)}
              title="Buscar hoteles para tu evento"
            >
              <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-3 py-1.5 text-sm">
                Hoteles
              </Badge>
            </a>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex-1 ripple-effect"
                title="Buscar eventos"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <NavLink
                to="/favoritos"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 relative ripple-effect inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                title="Ver mis eventos favoritos guardados"
              >
                <Heart className="h-4 w-4" />
                Favoritos
                {favorites.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {favorites.length}
                  </Badge>
                )}
              </NavLink>
            </div>
          </div>
        )}
      </div>
      
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
