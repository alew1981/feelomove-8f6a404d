import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { useState, useCallback } from "react";
import SearchBar from "./SearchBar";
import { useFavorites } from "@/hooks/useFavorites";
import { Badge } from "./ui/badge";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "./LanguageSwitcher";

// === INLINE SVG ICONS (replaces lucide-react for TBT optimization) ===
const IconMenu = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);
const IconX = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
  </svg>
);
const IconSearch = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IconHeart = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { favorites } = useFavorites();
  const { prefetch } = usePrefetch();
  const { t, localePath } = useTranslation();

  // Prefetch on hover
  const handleMouseEnter = useCallback((route: string) => {
    prefetch(route);
  }, [prefetch]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to={localePath('/')} className="flex items-center text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity" title={t('Ir a la página de inicio de FEELOMOVE+')}>
            <span className="text-[#121212] dark:text-white">feelomove</span>
            <span className="text-[#00FF8F]">+</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to={localePath('/festivales')}
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/festivales')}
              title={t('Ver todos los festivales de música en España')}
            >
              {t('Festivales')}
            </NavLink>
            <NavLink
              to={localePath('/conciertos')}
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/conciertos')}
              title={t('Ver todos los conciertos en España')}
            >
              {t('Conciertos')}
            </NavLink>
            <NavLink
              to={localePath('/artistas')}
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              title={t('Explorar artistas con eventos en España')}
            >
              {t('Artistas')}
            </NavLink>
            <NavLink
              to={localePath('/inspiration')}
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              onMouseEnter={() => handleMouseEnter('/inspiration')}
              title={t('Ofertas de conciertos con hotel incluido')}
            >
              {t('Inspiración')}
            </NavLink>
            <NavLink
              to={localePath('/destinos')}
              className="text-foreground/80 hover:text-foreground transition-colors relative pb-1"
              activeClassName="text-foreground font-semibold nav-link-active"
              title={t('Explorar ciudades con eventos musicales')}
            >
              {t('Destinos')}
            </NavLink>
            {/* Hoteles Badge */}
            <a
              href="https://feelomove.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
              title={t('Buscar hoteles para tu evento')}
            >
              <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-3 py-1.5 text-sm">
                {t('Hoteles')}
              </Badge>
            </a>
            
            {/* Search, Favorites, Language */}
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="relative ripple-effect"
                title={t('Buscar eventos')}
              >
                <IconSearch className="h-5 w-5" />
              </Button>
              <NavLink
                to={localePath('/favoritos')}
                className="relative ripple-effect inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                aria-label={t('Ver favoritos')}
                title={t('Ver mis eventos favoritos guardados')}
              >
                <IconHeart className="h-5 w-5" />
                {favorites.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {favorites.length}
                  </Badge>
                )}
              </NavLink>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="transition-transform duration-200 active:scale-90"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <IconX className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 mobile-menu-enter">
            <NavLink
              to={localePath('/festivales')}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title={t('Ver todos los festivales de música en España')}
            >
              {t('Festivales')}
            </NavLink>
            <NavLink
              to={localePath('/conciertos')}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title={t('Ver todos los conciertos en España')}
            >
              {t('Conciertos')}
            </NavLink>
            <NavLink
              to={localePath('/artistas')}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title={t('Explorar artistas con eventos en España')}
            >
              {t('Artistas')}
            </NavLink>
            <NavLink
              to={localePath('/inspiration')}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title={t('Ofertas de conciertos con hotel incluido')}
            >
              {t('Inspiración')}
            </NavLink>
            <NavLink
              to={localePath('/destinos')}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2 border-l-2 border-transparent pl-3"
              activeClassName="text-foreground font-semibold border-l-2 !border-accent"
              onClick={() => setIsMenuOpen(false)}
              title={t('Explorar ciudades con eventos musicales')}
            >
              {t('Destinos')}
            </NavLink>
            {/* Hoteles Badge Mobile */}
            <a
              href="https://feelomove.nuitee.link/?language=es&currency=EUR"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 pl-3"
              onClick={() => setIsMenuOpen(false)}
              title={t('Buscar hoteles para tu evento')}
            >
              <Badge className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-3 py-1.5 text-sm">
                {t('Hoteles')}
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
                title={t('Buscar eventos')}
              >
                <IconSearch className="h-4 w-4 mr-2" />
                {t('Buscar')}
              </Button>
              <NavLink
                to={localePath('/favoritos')}
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 relative ripple-effect inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
                title={t('Ver mis eventos favoritos guardados')}
              >
                <IconHeart className="h-4 w-4" />
                {t('Favoritos')}
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
