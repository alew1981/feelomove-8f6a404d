import { NavLink } from "./NavLink";

const Footer = () => {
  return (
    <footer className="bg-card border-t-2 border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              <span className="text-foreground">feelomove</span>
              <span className="text-accent">+</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu destino para experiencias musicales inolvidables con el mejor alojamiento.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h3 className="font-semibold mb-4">Explorar</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <NavLink to="/destinos" className="hover:text-foreground transition-colors">
                  Destinos
                </NavLink>
              </li>
              <li>
                <NavLink to="/generos" className="hover:text-foreground transition-colors">
                  Géneros Musicales
                </NavLink>
              </li>
              <li>
                <NavLink to="/eventos" className="hover:text-foreground transition-colors">
                  Próximos Eventos
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Compañía */}
          <div>
            <h3 className="font-semibold mb-4">Compañía</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <NavLink to="/about" className="hover:text-foreground transition-colors">
                  Sobre Nosotros
                </NavLink>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Trabaja con Nosotros
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Partners
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 <span className="font-semibold text-foreground">feelomove<span className="text-accent">+</span></span>. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
