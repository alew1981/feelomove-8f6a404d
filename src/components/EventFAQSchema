/**
 * EventFAQSchema.tsx
 *
 * Inyecta un bloque FAQPage JSON-LD en el <head> del documento.
 * Esto habilita los rich snippets de preguntas frecuentes en Google,
 * que expanden el resultado de búsqueda con 2-3 preguntas desplegables.
 *
 * Este componente no renderiza nada visible — solo el <script> en el <head>.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

import { useEffect, useMemo } from 'react';
import {
  generateEventFAQs,
  type GenerateEventFAQsParams,
} from '@/lib/eventFaqGenerator';

interface EventFAQSchemaProps extends GenerateEventFAQsParams {
  /** ID único del evento, usado para limpiar el script al desmontar */
  eventId: string;
}

export const EventFAQSchema = ({ eventId, ...params }: EventFAQSchemaProps) => {
  const faqs = useMemo(() => generateEventFAQs(params), [
    params.artistName,
    params.eventName,
    params.isFestival,
    params.eventDate,
    params.doorOpeningDate,
    params.venueName,
    params.venueCity,
    params.venueAddress,
    params.priceMin,
    params.priceMax,
    params.currency,
    params.soldOut,
    params.cancelled,
    params.hasVipTickets,
    params.hasHotels,
    params.hotelCount,
    params.locale,
  ]);

  useEffect(() => {
    // No inyectar si no hay preguntas suficientes
    // Google requiere al menos 2 para mostrar el rich snippet
    if (faqs.length < 2) return;

    const scriptId = `faq-seo-${eventId}`;

    // Limpiar script anterior si existe (navegación SPA)
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [eventId, faqs]);

  // Log en desarrollo para verificar qué preguntas se generan
  if (import.meta.env.DEV && faqs.length > 0) {
    console.log(`[EventFAQSchema] ${faqs.length} FAQs para evento ${eventId}:`, faqs.map(f => f.question));
  }

  return null;
};

export default EventFAQSchema;
