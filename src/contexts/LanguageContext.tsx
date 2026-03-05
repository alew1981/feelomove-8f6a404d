import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  type Locale,
  detectLocaleFromPath,
  localePath as localePathFn,
  getAlternateUrl as getAlternateUrlFn,
} from '@/lib/i18nRoutes';
import { normalizeToSlug } from '@/lib/slugUtils';

// Cache version – bump when translations change in DB
const TRANSLATIONS_VERSION = '1.0.0';

/** Shape stored in context */
interface LanguageContextValue {
  locale: Locale;
  /** Translate a Spanish text to the active locale */
  t: (spanishText: string) => string;
  /** Build a locale-aware path from an ES canonical path */
  localePath: (esPath: string) => string;
  /** Translate a Spanish city name into a slug for the active locale */
  translateCitySlug: (cityNameES: string) => string;
  /** Get the alternate URL for hreflang */
  getAlternateUrl: (currentPath: string, targetLocale: Locale) => string;
  /** Format a date according to locale */
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a price according to locale */
  formatPrice: (amount: number, currency?: string) => string;
  /** Whether translations have loaded */
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Synchronous fallback for critical UI strings – avoids FOUC on /en/ first render */
const CRITICAL_TRANSLATIONS = new Map<string, string>([
  ['Conciertos', 'Concerts'],
  ['Festivales', 'Festivals'],
  ['Destinos', 'Destinations'],
  ['Artistas', 'Artists'],
  ['Inspiración', 'Inspiration'],
  ['Hoteles', 'Hotels'],
  ['Buscar', 'Search'],
  ['Favoritos', 'Favorites'],
  ['Entradas', 'Tickets'],
  ['Comprar Entradas', 'Buy Tickets'],
  ['Encuentra Hoteles', 'Find Hotels'],
  ['Ver más', 'See more'],
  ['Eventos', 'Events'],
  ['Géneros Musicales', 'Music Genres'],
  ['Música', 'Music'],
  ['Inicio', 'Home'],
  ['Ver todos', 'View all'],
  ['Próximos eventos', 'Upcoming events'],
  ['Acerca de', 'About'],
  ['Política de Privacidad', 'Privacy Policy'],
  ['Términos de Uso', 'Terms of Use'],
  // Festivals page
  ['Festivales de Música en España', 'Music Festivals in Spain'],
  ['Entradas + Hotel para los mejores festivales de 2025', 'Tickets + Hotel for the best festivals of 2025'],
  ['Festivales en España', 'Festivals in Spain'],
  ['festivales disponibles', 'festivals available'],
  ['Buscar artista, festival...', 'Search artist, festival...'],
  ['Próximos festivales y eventos musicales destacados en España', 'Upcoming festivals and featured music events in Spain'],
  ['Descubre todos los festivales de música en España. Desde festivales de verano hasta eventos multi-día. Encuentra tu festival perfecto y reserva hotel cerca del recinto.', 'Discover all music festivals in Spain. From summer festivals to multi-day events. Find your perfect festival and book a hotel near the venue.'],
  ['Buscar festivales...', 'Search festivals...'],
  ['festival encontrado', 'festival found'],
  ['festivales encontrados', 'festivals found'],
  ['No se encontraron festivales', 'No festivals found'],
  ['Prueba ajustando los filtros o la búsqueda', 'Try adjusting the filters or search'],
  // Concerts page
  ['Conciertos en España', 'Concerts in Spain'],
  ['Entradas y hoteles para los mejores conciertos', 'Tickets and hotels for the best concerts'],
  ['conciertos disponibles', 'concerts available'],
  ['Buscar artista, ciudad...', 'Search artist, city...'],
  ['Próximos eventos y conciertos destacados en España', 'Upcoming events and featured concerts in Spain'],
  ['Descubre todos los conciertos en España. Desde rock y pop hasta indie y electrónica. Encuentra tu concierto perfecto y reserva hotel en la misma ciudad.', 'Discover all concerts in Spain. From rock and pop to indie and electronic. Find your perfect concert and book a hotel in the same city.'],
  ['Buscar conciertos...', 'Search concerts...'],
  ['No se encontraron conciertos', 'No concerts found'],
  ['Cargando más conciertos...', 'Loading more concerts...'],
  // Common filters
  ['Filtros', 'Filters'],
  ['Artista', 'Artist'],
  ['Ciudad', 'City'],
  ['Género', 'Genre'],
  ['Mes', 'Month'],
  ['Tipo', 'Type'],
  ['Todos', 'All'],
  ['Todos los artistas', 'All artists'],
  ['Todas las ciudades', 'All cities'],
  ['Todos los géneros', 'All genres'],
  ['Todos los meses', 'All months'],
  ['Solo VIP', 'VIP only'],
  ['Limpiar filtros', 'Clear filters'],
  ['Próximos', 'Upcoming'],
  ['Recientes', 'Recent'],
  ['Añadidos recientemente', 'Recently added'],
  // Cards
  ['VER ENTRADAS', 'VIEW TICKETS'],
  ['VER DETALLES', 'VIEW DETAILS'],
  ['Ver entradas', 'View tickets'],
  ['Ver detalles', 'View details'],
  ['FECHA', 'DATE'],
  ['Pendiente', 'TBC'],
  ['Por confirmar', 'To be confirmed'],
  ['A la venta', 'On sale'],
  ['PASADO', 'PAST'],
  ['Pronto', 'Soon'],
  ['artistas', 'artists'],
  ['Pasado', 'Past'],
  // Ticket status badges
  ['PRÓXIMAMENTE', 'COMING SOON'],
  ['AGOTADO', 'SOLD OUT'],
  ['CANCELADO', 'CANCELLED'],
  // Waitlist form
  ['Entradas agotadas', 'Tickets sold out'],
  ['Las entradas para este evento se han agotado. Déjanos tu email y te avisaremos si hay nuevas disponibilidades.', 'Tickets for this event are sold out. Leave your email and we will notify you if new availability opens up.'],
  ['Las entradas aún no están a la venta', 'Tickets are not yet on sale'],
  ['Venta desde el', 'On sale from'],
  ['Déjanos tu email y te avisaremos cuando las entradas estén disponibles.', 'Leave your email and we will notify you when tickets become available.'],
  ['Este evento ha sido cancelado', 'This event has been cancelled'],
  ['Avísame cuando haya entradas', 'Notify me when tickets are available'],
  ['Tu email', 'Your email'],
  ['¡Te avisaremos!', 'We will notify you!'],
  ['Te hemos registrado correctamente. Recibirás un aviso cuando haya novedades.', 'You have been registered successfully. You will receive a notification when there are updates.'],
  ['Error al registrarte. Inténtalo de nuevo.', 'Error registering. Please try again.'],
  // Unavailable event layout
  ['Entradas agotadas', 'Sold out'],
  ['Venta cerrada', 'Tickets unavailable'],
  ['Evento cancelado', 'Event cancelled'],
  ['Encuentra tu hotel', 'Find your hotel'],
  ['Próximamente dispondremos de hoteles para este evento.', 'Hotels for this event will be available soon.'],
  ['Las entradas para este evento se han agotado', 'Tickets for this event are sold out'],
  ['DISPONIBLE', 'AVAILABLE'],
  ['Ver otros conciertos de', 'See other concerts by'],
  // WaitlistForm v2
  ['Tu nombre', 'Your name'],
  ['Acepto recibir comunicaciones de Feelomove sobre este evento y otros similares. Puedes darte de baja cuando quieras.', 'I agree to receive communications from Feelomove about this event and similar ones. You can unsubscribe at any time.'],
  ['¡Apuntado! Te avisaremos cuando las entradas estén disponibles.', "Done! We'll let you know when tickets are available."],
  ['Algo ha fallado. Inténtalo de nuevo.', 'Something went wrong. Please try again.'],
  // Footer newsletter
  ['No te pierdas nada', "Don't miss a thing"],
  ['Conciertos, festivales y hoteles. Te avisamos de los mejores eventos cerca de ti.', "Concerts, festivals and hotels. We'll keep you posted on the best events near you."],
  ['Suscribirme', 'Subscribe'],
  ['Sin spam. Solo música. Puedes darte de baja cuando quieras.', 'No spam. Just music. Unsubscribe anytime.'],
  ['¡Estás dentro!', "You're in!"],
  ['Te avisaremos de los mejores eventos. ¡Nos vemos en el próximo concierto!', "We'll keep you posted on the best events. See you at the next concert!"],
]);

/** Map: spanish_text → english_text */
type TranslationMap = Map<string, string>;

function buildTranslationMap(rows: { spanish_text: string; english_text: string }[]): TranslationMap {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.spanish_text, row.english_text);
  }
  return map;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const locale = detectLocaleFromPath(pathname);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem('preferredLanguage', locale);
    } catch {
      // SSR / private browsing – ignore
    }
  }, [locale]);

  // Load translations (only needed for EN; ES texts are hardcoded in components)
  const { data: translationMap, isSuccess } = useQuery({
    queryKey: ['tm_translations', TRANSLATIONS_VERSION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tm_translations')
        .select('spanish_text, english_text');
      if (error) throw error;
      return buildTranslationMap(data ?? []);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 h
    gcTime: 48 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ---- Memoised helpers ----

  const t = useCallback(
    (spanishText: string): string => {
      if (locale === 'es') return spanishText;
      // Supabase translations take priority when loaded
      if (translationMap) {
        return translationMap.get(spanishText) ?? CRITICAL_TRANSLATIONS.get(spanishText) ?? spanishText;
      }
      // Before Supabase loads, use synchronous critical fallback
      return CRITICAL_TRANSLATIONS.get(spanishText) ?? spanishText;
    },
    [locale, translationMap],
  );

  const lp = useCallback(
    (esPath: string) => localePathFn(esPath, locale),
    [locale],
  );

  const translateCitySlug = useCallback(
    (cityNameES: string): string => {
      if (locale === 'es' || !translationMap) return normalizeToSlug(cityNameES);
      const translated = translationMap.get(cityNameES);
      return normalizeToSlug(translated ?? cityNameES);
    },
    [locale, translationMap],
  );

  const getAlt = useCallback(
    (currentPath: string, targetLocale: Locale) => getAlternateUrlFn(currentPath, targetLocale),
    [],
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const defaults: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat(
        locale === 'es' ? 'es-ES' : 'en-US',
        options ?? defaults,
      ).format(d);
    },
    [locale],
  );

  const formatPrice = useCallback(
    (amount: number, currency = 'EUR'): string =>
      new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount),
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t,
      localePath: lp,
      translateCitySlug,
      getAlternateUrl: getAlt,
      formatDate,
      formatPrice,
      isReady: locale === 'es' || isSuccess,
    }),
    [locale, t, lp, translateCitySlug, getAlt, formatDate, formatPrice, isSuccess],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook to consume the i18n context.
 * Must be used inside <LanguageProvider>.
 */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
