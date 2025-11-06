import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Music, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold">
            <Music className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FestiStay
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Inicio
            </NavLink>
            <NavLink
              to="/destinos"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Destinos
            </NavLink>
            <NavLink
              to="/generos"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Géneros
            </NavLink>
            <NavLink
              to="/about"
              className="text-foreground/80 hover:text-foreground transition-colors"
              activeClassName="text-foreground font-semibold"
            >
              Sobre Nosotros
            </NavLink>
            <Button variant="default" size="sm">
              Buscar Eventos
            </Button>
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
              to="/"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </NavLink>
            <NavLink
              to="/destinos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Destinos
            </NavLink>
            <NavLink
              to="/generos"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Géneros
            </NavLink>
            <NavLink
              to="/about"
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              activeClassName="text-foreground font-semibold"
              onClick={() => setIsMenuOpen(false)}
            >
              Sobre Nosotros
            </NavLink>
            <Button variant="default" size="sm" className="w-full">
              Buscar Eventos
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
