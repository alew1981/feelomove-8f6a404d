/**
 * DestinationFAQSchema.tsx
 *
 * Inyecta un bloque FAQPage JSON-LD en el <head> para páginas de destino.
 * Habilita rich snippets de preguntas frecuentes en Google.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

import { useEffect, useMemo } from 'react';
import {
  generateDestinoFAQs,
  type GenerateDestinoFAQsParams,
} from '@/lib/destinoFaqGenerator';

interface DestinationFAQSchemaProps extends GenerateDestinoFAQsParams {
  /** Slug de la ciudad, usado como ID del script */
  citySlug: string;
}

export const DestinationFAQSchema = ({ citySlug, ...params }: DestinationFAQSchemaProps) => {
  const faqs = useMemo(() => generateDestinoFAQs(params), [
    params.cityName,
    params.eventCount,
    params.nextEventName,
    params.nextEventDate,
    params.locale,
  ]);

  useEffect(() => {
    if (faqs.length < 2) return;

    const scriptId = `faq-destino-${citySlug}`;

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
  }, [citySlug, faqs]);

  return null;
};

export default DestinationFAQSchema;
