import { NavLink } from "./NavLink";
import { useTranslation } from "@/hooks/useTranslation";

// === INLINE SVG ICONS (replaces lucide-react for bundle optimization) ===
const IconInstagram = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

// SEO: Top destinations and genres for crawler discovery (hub pages)
const TOP_CITIES = [
  { name: 'Madrid', slug: 'madrid' },
  { name: 'Barcelona', slug: 'barcelona' },
  { name: 'Valencia', slug: 'valencia' },
  { name: 'Sevilla', slug: 'sevilla' },
  { name: 'Bilbao', slug: 'bilbao' },
];

const TOP_GENRES = [
  { nameES: 'Rock', nameEN: 'Rock', slug: 'rock' },
  { nameES: 'Pop', nameEN: 'Pop', slug: 'pop' },
  { nameES: 'Electrónica', nameEN: 'Electronic', slug: 'electronica' },
  { nameES: 'Latino', nameEN: 'Latin', slug: 'latino' },
  { nameES: 'Hip-Hop', nameEN: 'Hip-Hop', slug: 'hip-hop' },
];

const Footer = () => {
  const { t, localePath, locale } = useTranslation();

  return (
    <footer className="bg-card border-t-2 border-border py-16 content-visibility-auto min-h-[400px]" style={{ containIntrinsicSize: '0 400px' }}>
      <div className="container mx-auto px-4">
        {/* SEO Directory: Hub links for crawler discovery */}
        <nav className="mb-12 pb-8 border-b border-border" aria-label={t('Directorio de eventos')}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Conciertos por Ciudad */}
            <div>
              <span className="font-semibold text-sm text-foreground mb-3 block">
                {t('Conciertos por Ciudad')}
              </span>
              <ul className="space-y-1.5 text-sm">
                {TOP_CITIES.map(city => (
                  <li key={city.slug}>
                    <NavLink 
                      to={localePath(`/destinos/${city.slug}`)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={locale === 'en' ? `Concerts in ${city.name}` : `Conciertos en ${city.name}`}
                    >
                      {locale === 'en' ? `Concerts in ${city.name}` : `Conciertos en ${city.name}`}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Festivales por Ciudad */}
            <div>
              <span className="font-semibold text-sm text-foreground mb-3 block">
                {t('Festivales por Ciudad')}
              </span>
              <ul className="space-y-1.5 text-sm">
                {TOP_CITIES.map(city => (
                  <li key={city.slug}>
                    <NavLink 
                      to={localePath(`/destinos/${city.slug}`) + '?tipo=festival'}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={locale === 'en' ? `Festivals in ${city.name}` : `Festivales en ${city.name}`}
                    >
                      {locale === 'en' ? `Festivals in ${city.name}` : `Festivales en ${city.name}`}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Géneros Musicales */}
            <div>
              <span className="font-semibold text-sm text-foreground mb-3 block">
                {t('Géneros Musicales')}
              </span>
              <ul className="space-y-1.5 text-sm">
                {TOP_GENRES.map(genre => (
                  <li key={genre.slug}>
                    <NavLink 
                      to={`/musica/${genre.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={locale === 'en' ? `${genre.nameEN} concerts` : `Conciertos de ${genre.nameES}`}
                    >
                      {locale === 'en' ? genre.nameEN : genre.nameES}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Categorías */}
            <div>
              <span className="font-semibold text-sm text-foreground mb-3 block">
                {t('Categorías')}
              </span>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <NavLink to={localePath('/conciertos')} className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('Todos los Conciertos')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={localePath('/festivales')} className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('Todos los Festivales')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={localePath('/artistas')} className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('Artistas')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to={localePath('/destinos')} className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('Destinos')}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/musica" className="text-muted-foreground hover:text-foreground transition-colors">
                    {t('Géneros Musicales')}
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              <span className="text-foreground">feelomove</span>
              <span className="text-accent">+</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('Tu destino para experiencias musicales inolvidables con el mejor alojamiento.')}
            </p>
          </div>

          {/* Explorar */}
          <nav aria-label={t('Explorar')}>
            <span className="font-semibold mb-4 block">{t('Explorar')}</span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <NavLink to={localePath('/conciertos')} className="hover:text-foreground transition-colors" title={t('Ver todos los conciertos en España')}>
                  {t('Conciertos')}
                </NavLink>
              </li>
              <li>
                <NavLink to={localePath('/festivales')} className="hover:text-foreground transition-colors" title={t('Descubre festivales de música en España')}>
                  {t('Festivales')}
                </NavLink>
              </li>
              <li>
                <NavLink to={localePath('/destinos')} className="hover:text-foreground transition-colors" title={t('Explora destinos con eventos musicales')}>
                  {t('Destinos')}
                </NavLink>
              </li>
              <li>
                <NavLink to={localePath('/artistas')} className="hover:text-foreground transition-colors" title={t('Ver artistas con conciertos en España')}>
                  {t('Artistas')}
                </NavLink>
              </li>
              <li>
                <NavLink to="/musica" className="hover:text-foreground transition-colors" title={t('Explorar géneros musicales')}>
                  {t('Géneros Musicales')}
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Compañía */}
          <nav aria-label={t('Compañía')}>
            <span className="font-semibold mb-4 block">{t('Compañía')}</span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <NavLink to={localePath('/about')} className="hover:text-foreground transition-colors" title={t('Conoce más sobre FEELOMOVE+')}>
                  {t('Sobre Nosotros')}
                </NavLink>
              </li>
              <li>
                <NavLink to={localePath('/favoritos')} className="hover:text-foreground transition-colors" title={t('Ver mis eventos favoritos guardados')}>
                  {t('Mis Favoritos')}
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <span className="font-semibold mb-4 block">Legal</span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/terminos" className="hover:text-foreground transition-colors" title={t('Leer términos y condiciones de uso')}>
                  {t('Términos y Condiciones')}
                </a>
              </li>
              <li>
                <a href="/privacidad" className="hover:text-foreground transition-colors" title={t('Consultar política de privacidad')}>
                  {t('Política de Privacidad')}
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-foreground transition-colors" title={t('Información sobre uso de cookies')}>
                  Cookies
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t-2 border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2024 <span className="font-semibold text-foreground">feelomove<span className="text-accent">+</span></span>. {t('Todos los derechos reservados.')}</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/feelomove/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              aria-label="Instagram"
              title={t('Síguenos en Instagram')}
            >
              <IconInstagram className="h-5 w-5" />
            </a>
            <a 
              href="https://x.com/feelomove" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              aria-label="X (Twitter)"
              title={t('Síguenos en X (Twitter)')}
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a 
              href="https://www.pinterest.com/feelomove/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
              aria-label="Pinterest"
              title={t('Síguenos en Pinterest')}
            >
              <PinterestIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
