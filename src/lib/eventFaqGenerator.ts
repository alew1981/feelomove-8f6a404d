/**
 * eventFaqGenerator.ts
 *
 * Genera preguntas frecuentes (FAQPage schema) para páginas de evento.
 * Las preguntas se generan automáticamente a partir de los datos del evento.
 *
 * Resultado: Rich snippets en Google que expanden el resultado de búsqueda
 * mostrando 2-3 preguntas desplegables directamente en la SERP.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GenerateEventFAQsParams {
  // Datos del evento
  eventName: string;
  artistName: string;        // Artista principal (para preguntas naturales)
  isFestival: boolean;

  // Fecha y hora
  eventDate: string | null;  // ISO 8601
  localEventDate?: string | null;
  doorOpeningDate?: string | null;

  // Lugar
  venueName: string | null;
  venueCity: string | null;
  venueAddress?: string | null;

  // Precios
  priceMin: number | null;   // Precio mínimo con fees
  priceMax: number | null;
  currency?: string;

  // Estado
  soldOut: boolean;
  cancelled: boolean;
  hasVipTickets: boolean;

  // Hoteles
  hasHotels: boolean;        // true si se cargaron hoteles para el evento
  hotelCount?: number;

  // Idioma
  locale?: 'es' | 'en';
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

const ES_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const ES_DAYS = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

function formatDateLong(isoDate: string, locale: 'es' | 'en'): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime()) || isoDate.startsWith('9999')) return '';

    if (locale === 'en') {
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const day = ES_DAYS[d.getDay()];
    const date = d.getDate();
    const month = ES_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${date} de ${month} de ${year}`;
  } catch {
    return '';
  }
}

function formatTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

function formatPrice(amount: number, currency = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${amount.toFixed(2).replace('.', ',')} ${symbol}`;
}

// ─── Generador principal ──────────────────────────────────────────────────────

/**
 * Genera entre 3 y 6 preguntas frecuentes para un evento.
 * Solo incluye preguntas cuando hay datos reales para responderlas.
 * El orden está pensado para captar las búsquedas más frecuentes primero.
 *
 * Google muestra un máximo de 3 FAQs en la SERP.
 * Recomendación: enviar hasta 6 para que Google elija las más relevantes.
 */
export function generateEventFAQs(params: GenerateEventFAQsParams): FAQItem[] {
  const {
    artistName,
    eventName,
    isFestival,
    eventDate,
    doorOpeningDate,
    venueName,
    venueCity,
    venueAddress,
    priceMin,
    priceMax,
    currency = 'EUR',
    soldOut,
    cancelled,
    hasVipTickets,
    hasHotels,
    hotelCount,
    locale = 'es',
  } = params;

  const faqs: FAQItem[] = [];

  const subject = artistName || eventName;
  const isES = locale === 'es';

  // ── 1. PRECIO ─────────────────────────────────────────────────────────────
  // La pregunta más buscada. Siempre la primera.
  if (!cancelled) {
    if (soldOut) {
      faqs.push(
        isES
          ? {
              question: `¿Cuánto cuestan las entradas para ${subject}?`,
              answer: `Las entradas para ${subject} ${venueCity ? `en ${venueCity}` : ''} están agotadas. Te recomendamos revisar la página oficial del evento por si se liberan nuevas localidades o para apuntarte a la lista de espera.`,
            }
          : {
              question: `How much are tickets for ${subject}?`,
              answer: `Tickets for ${subject} ${venueCity ? `in ${venueCity}` : ''} are sold out. We recommend checking the official event page in case new tickets become available or to join the waiting list.`,
            },
      );
    } else if (priceMin && priceMin > 0) {
      const hasRange = priceMax && priceMax > priceMin;
      const priceAnswer = hasRange
        ? isES
          ? `Las entradas para ${subject} tienen un precio que va desde ${formatPrice(priceMin, currency)} hasta ${formatPrice(priceMax!, currency)} (precio total con gastos incluidos). El precio varía según el tipo de entrada y la disponibilidad.`
          : `Tickets for ${subject} range from ${formatPrice(priceMin, currency)} to ${formatPrice(priceMax!, currency)} (total price including fees). Prices vary depending on ticket type and availability.`
        : isES
          ? `Las entradas para ${subject} tienen un precio de ${formatPrice(priceMin, currency)} (precio total con gastos incluidos).`
          : `Tickets for ${subject} are priced at ${formatPrice(priceMin, currency)} (total price including fees).`;

      faqs.push(
        isES
          ? {
              question: `¿Cuánto cuestan las entradas para ${subject}?`,
              answer: priceAnswer,
            }
          : {
              question: `How much are tickets for ${subject}?`,
              answer: priceAnswer,
            },
      );
    }
  }

  // ── 2. CUÁNDO ─────────────────────────────────────────────────────────────
  if (eventDate && !eventDate.startsWith('9999')) {
    const dateFormatted = formatDateLong(eventDate, locale);
    const time = formatTime(eventDate);

    if (dateFormatted) {
      const dateAnswer = time && time !== '00:00'
        ? isES
          ? `${isFestival ? 'El festival' : 'El concierto'} de ${subject} es el ${dateFormatted} a las ${time}h${venueCity ? ` en ${venueCity}` : ''}.`
          : `The ${isFestival ? 'festival' : 'concert'} of ${subject} takes place on ${dateFormatted} at ${time}${venueCity ? ` in ${venueCity}` : ''}.`
        : isES
          ? `${isFestival ? 'El festival' : 'El concierto'} de ${subject} es el ${dateFormatted}${venueCity ? ` en ${venueCity}` : ''}.`
          : `The ${isFestival ? 'festival' : 'concert'} of ${subject} takes place on ${dateFormatted}${venueCity ? ` in ${venueCity}` : ''}.`;

      faqs.push(
        isES
          ? {
              question: `¿Cuándo es ${isFestival ? 'el festival' : 'el concierto'} de ${subject}?`,
              answer: dateAnswer,
            }
          : {
              question: `When is the ${isFestival ? 'festival' : 'concert'} of ${subject}?`,
              answer: dateAnswer,
            },
      );
    }
  }

  // ── 3. DÓNDE ──────────────────────────────────────────────────────────────
  if (venueName || venueCity) {
    const locationParts: string[] = [];
    if (venueName) locationParts.push(venueName);
    if (venueAddress) locationParts.push(venueAddress);
    if (venueCity) locationParts.push(venueCity);

    const locationStr = locationParts.join(', ');

    faqs.push(
      isES
        ? {
            question: `¿Dónde es ${isFestival ? 'el festival' : 'el concierto'} de ${subject}?`,
            answer: `${isFestival ? 'El festival' : 'El concierto'} de ${subject} se celebra en ${locationStr}. Te recomendamos llegar con antelación para evitar aglomeraciones en la entrada.`,
          }
        : {
            question: `Where is the ${isFestival ? 'festival' : 'concert'} of ${subject}?`,
            answer: `The ${isFestival ? 'festival' : 'concert'} of ${subject} takes place at ${locationStr}. We recommend arriving early to avoid queues at the entrance.`,
          },
    );
  }

  // ── 4. APERTURA DE PUERTAS ────────────────────────────────────────────────
  if (doorOpeningDate && !doorOpeningDate.startsWith('9999')) {
    const doorTime = formatTime(doorOpeningDate);
    if (doorTime && doorTime !== '00:00') {
      faqs.push(
        isES
          ? {
              question: `¿A qué hora abren las puertas ${isFestival ? 'del festival' : 'del concierto'} de ${subject}?`,
              answer: `Las puertas de ${venueName || (venueCity ? `el recinto en ${venueCity}` : 'el recinto')} abren a las ${doorTime}h. Te recomendamos llegar antes del inicio para encontrar tu sitio con calma.`,
            }
          : {
              question: `What time do doors open for ${subject}?`,
              answer: `Doors at ${venueName || (venueCity ? `the venue in ${venueCity}` : 'the venue')} open at ${doorTime}. We recommend arriving before the start time to find your spot comfortably.`,
            },
      );
    }
  }

  // ── 5. ENTRADAS VIP ───────────────────────────────────────────────────────
  if (hasVipTickets && !cancelled) {
    faqs.push(
      isES
        ? {
            question: `¿Hay entradas VIP para ${subject}?`,
            answer: `Sí, hay entradas VIP disponibles para ${subject}. Las entradas VIP suelen incluir acceso a zonas exclusivas, mejores vistas y servicios premium. Consulta la disponibilidad y precios en la página del evento.`,
          }
        : {
            question: `Are there VIP tickets for ${subject}?`,
            answer: `Yes, VIP tickets are available for ${subject}. VIP tickets usually include access to exclusive areas, better views, and premium services. Check availability and prices on the event page.`,
          },
    );
  }

  // ── 6. HOTELES CERCA ──────────────────────────────────────────────────────
  if (hasHotels && venueCity) {
    const hotelMention = hotelCount && hotelCount > 1
      ? isES ? `más de ${hotelCount} hoteles` : `over ${hotelCount} hotels`
      : isES ? 'hoteles' : 'hotels';

    faqs.push(
      isES
        ? {
            question: `¿Hay hoteles cerca ${isFestival ? 'del festival' : 'del concierto'} de ${subject}?`,
            answer: `Sí, en Feelomove encontrarás ${hotelMention} disponibles cerca del evento en ${venueCity}. Puedes reservar tu entrada y hotel en el mismo proceso para conseguir el mejor precio y no preocuparte por el alojamiento.`,
          }
        : {
            question: `Are there hotels near the ${isFestival ? 'festival' : 'concert'} of ${subject}?`,
            answer: `Yes, on Feelomove you can find ${hotelMention} available near the event in ${venueCity}. You can book your ticket and hotel together to get the best price and not worry about accommodation.`,
          },
    );
  }

  // Google solo muestra 3 en la SERP, pero acepta hasta 10 en el JSON-LD.
  // Enviamos hasta 6 para que Google elija las más relevantes para cada búsqueda.
  return faqs.slice(0, 6);
}
