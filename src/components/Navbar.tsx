import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Menu, X, Search, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useFavorites } from "@/hooks/useFavorites";
import { Badge } from "./ui/badge";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-[#121212] dark:text-white">feelomove</span>
            <span className="text-[#00FF8F]">+</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/conciertos"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Conciertos
            </NavLink>
            <NavLink
              to="/festivales"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Festivales
            </NavLink>
            <NavLink
              to="/artistas"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Artistas
            </NavLink>
            <NavLink
              to="/musica"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Género
            </NavLink>
            <NavLink
              to="/destinos"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Destinos
            </NavLink>
            <a
              href="https://feelomove-.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Hoteles
            </a>
            <a
              href="https://feelomove-.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Apartamentos
            </a>
            
            {/* Search and Favorites Icons */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="relative"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/favoritos")}
                className="relative"
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
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <NavLink
              to="/conciertos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Conciertos
            </NavLink>
            <NavLink
              to="/festivales"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Festivales
            </NavLink>
            <NavLink
              to="/artistas"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Artistas
            </NavLink>
            <NavLink
              to="/musica"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Género
            </NavLink>
            <NavLink
              to="/destinos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Destinos
            </NavLink>
            <a
              href="https://feelomove-.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Hoteles
            </a>
            <a
              href="https://feelomove-.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Apartamentos
            </a>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMenuOpen(false);
                }}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/favoritos");
                  setIsMenuOpen(false);
                }}
                className="flex-1 relative"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favoritos
                {favorites.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {favorites.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
};

export default Navbar;
